import { getTelegramInitData } from './telegram-auth'
import { supabase } from './supabase'
import type { Database, Json } from './supabase-types'

type CreatorRow = Database['public']['Tables']['creators']['Row']
type PostRow = Database['public']['Tables']['creator_posts']['Row']

const VISITOR_KEY = 'telefans_visitor_key'
const PUBLIC_CACHE_TTL = 20_000

type TimedCache<T> = { data: T; expiresAt: number }
let publishedCreatorsCache: TimedCache<CreatorRow[]> | null = null
let publishedCreatorsRequest: Promise<CreatorRow[]> | null = null
let exploreStatsCache: TimedCache<PublishedCreatorExploreStats[]> | null = null
let reelsCache = new Map<number, TimedCache<PublishedReel[]>>()
const creatorPostsCache = new Map<string, TimedCache<PublicCreatorPostRow[]>>()
const creatorPostsRequests = new Map<string, Promise<PublicCreatorPostRow[]>>()

function getVisitorKey() {
  if (typeof window === 'undefined') return null
  const existing = window.localStorage.getItem(VISITOR_KEY)
  if (existing) return existing
  const value = crypto.randomUUID()
  window.localStorage.setItem(VISITOR_KEY, value)
  return value
}

export function jsonObject(value: Json) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, Json> : {}
}

export async function listPublishedCreators(): Promise<CreatorRow[]> {
  const now = Date.now()
  if (publishedCreatorsCache && publishedCreatorsCache.expiresAt > now) return publishedCreatorsCache.data
  if (publishedCreatorsRequest) return publishedCreatorsRequest

  publishedCreatorsRequest = (async () => {
    const { data, error } = await supabase.from('creators').select('*').eq('published', true).order('name')
    if (error) throw error
    const rows = data ?? []
    publishedCreatorsCache = { data: rows, expiresAt: Date.now() + PUBLIC_CACHE_TTL }
    return rows
  })()
  try {
    return await publishedCreatorsRequest
  } finally {
    publishedCreatorsRequest = null
  }
}

export type PublishedCreatorExploreStats = CreatorRow & {
  trendingScore: number
  popularScore: number
  latestActivityAt: string
  contentCount: number
}

const ACTIVITY_DAY = 86400000
const TRENDING_HALF_LIFE_DAYS = 14
const TRENDING_LOOKBACK_DAYS = 90

function activityFreshness(value: string, now: number) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 0
  const ageDays = Math.max(0, (now - timestamp) / ACTIVITY_DAY)
  if (ageDays > TRENDING_LOOKBACK_DAYS) return 0
  return Math.pow(0.5, ageDays / TRENDING_HALF_LIFE_DAYS)
}

function keepLatestActivity(current: string, candidate: string) {
  return new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current
}

export async function listPublishedCreatorExploreStats(): Promise<PublishedCreatorExploreStats[]> {
  if (exploreStatsCache && exploreStatsCache.expiresAt > Date.now()) return exploreStatsCache.data
  const creators = await listPublishedCreators()
  if (!creators.length) return []
  const creatorIds = creators.map((creator) => creator.id)
  const creatorIdSet = new Set(creatorIds)
  const [{ data: posts, error: postsError }, { data: follows, error: followsError }] = await Promise.all([
    // Avoid a very long PostgREST `in` URL when the catalog has many creators.
    supabase.from('creator_posts').select('id, creator_id, created_at, published').eq('published', true).limit(10000),
    supabase.from('creator_following').select('creator_id, created_at').limit(10000),
  ])
  if (postsError) throw postsError
  if (followsError) throw followsError
  const postRows = (posts ?? []).filter((post) => creatorIdSet.has(post.creator_id))
  const [{ data: likes, error: likesError }, { data: comments, error: commentsError }, { data: views, error: viewsError }] = await Promise.all([
    // Filter against postById below; querying by hundreds of post IDs can exceed URL limits.
    supabase.from('post_likes').select('post_id, created_at').limit(10000),
    supabase.from('post_comments').select('post_id, created_at').limit(10000),
    supabase.from('post_views').select('post_id, created_at').limit(10000),
  ])
  if (likesError) throw likesError
  if (commentsError) throw commentsError
  if (viewsError) throw viewsError

  const now = Date.now()
  const postById = new Map(postRows.map((post) => [post.id, post]))
  const followerCounts = new Map<string, number>()
  const stats = new Map<string, { recentEngagement: number; totalEngagement: number; recentPosts: number; contentCount: number; recentFollowerSignals: number; latestActivityAt: string }>()
  for (const creator of creators) {
    const fallbackActivity = creator.updated_at || creator.created_at || new Date(0).toISOString()
    stats.set(creator.id, { recentEngagement: 0, totalEngagement: 0, recentPosts: 0, contentCount: 0, recentFollowerSignals: 0, latestActivityAt: fallbackActivity })
  }

  const addMetric = (rows: Array<{ post_id: string; created_at: string }>, weight: number) => {
    for (const row of rows) {
      const post = postById.get(row.post_id)
      if (!post) continue
      const creatorStats = stats.get(post.creator_id)
      if (!creatorStats) continue
      const freshness = activityFreshness(row.created_at, now)
      creatorStats.totalEngagement += weight
      creatorStats.recentEngagement += weight * freshness
      creatorStats.latestActivityAt = keepLatestActivity(creatorStats.latestActivityAt, row.created_at)
    }
  }

  addMetric(likes ?? [], 3)
  addMetric(comments ?? [], 5)
  addMetric(views ?? [], 0.2)
  for (const post of postRows) {
    const creatorStats = stats.get(post.creator_id)
    if (!creatorStats) continue
    const freshness = activityFreshness(post.created_at, now)
    creatorStats.contentCount += 1
    creatorStats.totalEngagement += 1
    creatorStats.recentPosts += freshness
    creatorStats.latestActivityAt = keepLatestActivity(creatorStats.latestActivityAt, post.created_at)
  }
  for (const follow of follows ?? []) {
    const creatorStats = stats.get(follow.creator_id)
    if (!creatorStats) continue
    followerCounts.set(follow.creator_id, (followerCounts.get(follow.creator_id) ?? 0) + 1)
    creatorStats.recentFollowerSignals += activityFreshness(follow.created_at, now)
    creatorStats.latestActivityAt = keepLatestActivity(creatorStats.latestActivityAt, follow.created_at)
  }

  const result = creators.map((creator) => {
    const creatorStats = stats.get(creator.id) ?? { recentEngagement: 0, totalEngagement: 0, recentPosts: 0, contentCount: 0, recentFollowerSignals: 0, latestActivityAt: creator.updated_at || creator.created_at || new Date(0).toISOString() }
    const followers = followerCounts.get(creator.id) ?? 0
    const latestFreshness = activityFreshness(creatorStats.latestActivityAt, now)
    const trendingScore = creatorStats.recentEngagement * 4 + Math.min(creatorStats.recentPosts, 7) * 3 + latestFreshness * 25 + creatorStats.recentFollowerSignals * 2
    const popularScore = creatorStats.totalEngagement * 2 + Math.log1p(creatorStats.contentCount) * 30 + followers * 8
    return {
      ...creator,
      trendingScore: Math.round(trendingScore * 10) / 10,
      popularScore: Math.round(popularScore * 10) / 10,
      latestActivityAt: creatorStats.latestActivityAt,
      contentCount: creatorStats.contentCount,
    }
  })
  exploreStatsCache = { data: result, expiresAt: Date.now() + PUBLIC_CACHE_TTL }
  return result
}

function slugToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function getPublishedCreator(slug: string): Promise<CreatorRow | null> {
  const { data: exact, error: exactError } = await supabase.from('creators').select('*').eq('slug', slug).eq('published', true).maybeSingle()
  if (exactError) throw exactError
  if (exact) return exact

  // Preserve compatibility with legacy links such as /creator/pleasantmorenaa
  // while the CRM stores canonical slugs with or without separators.
  const published = await listPublishedCreators()
  const requested = slugToken(slug)
  return published.find((creator) => slugToken(creator.slug) === requested) ?? null
}

export type PublicCreatorPostRow = Pick<PostRow, 'id' | 'creator_id' | 'type' | 'media_url' | 'thumbnail_url' | 'title' | 'caption' | 'is_paid' | 'unlock_price' | 'carousel_id' | 'carousel_position'>

function buildPaidPreviewUrl(mediaUrl: string, thumbnailUrl: string | null) {
  if (thumbnailUrl) return thumbnailUrl
  try {
    const url = new URL(mediaUrl)
    if (url.pathname.includes('/storage/v1/object/public/')) {
      url.pathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
      url.search = ''
      url.searchParams.set('width', '420')
      url.searchParams.set('height', '520')
      url.searchParams.set('resize', 'cover')
      url.searchParams.set('quality', '72')
      return url.toString()
    }
  } catch {
    // Keep the original value as a last-resort preview for legacy external assets.
  }
  return mediaUrl
}

export async function listCreatorPosts(creatorId: string): Promise<PublicCreatorPostRow[]> {
  const cached = creatorPostsCache.get(creatorId)
  if (cached && cached.expiresAt > Date.now()) return cached.data
  const pending = creatorPostsRequests.get(creatorId)
  if (pending) return pending

  const request = (async () => {
    const { data, error } = await supabase
      .from('creator_posts')
      .select('id, creator_id, type, media_url, thumbnail_url, title, caption, is_paid, unlock_price, carousel_id, carousel_position')
      .eq('creator_id', creatorId)
      .eq('published', true)
      .order('created_at', { ascending: false })
    if (error) throw error

    // Paid originals must never be sent to the public profile before an unlock.
    // When the ingest did not create a thumbnail, use Supabase Image Transformations
    // so every card still gets its own sharp, low-resolution preview.
    const rows = (data ?? []).map((post) => post.is_paid
      ? { ...post, media_url: buildPaidPreviewUrl(post.media_url, post.thumbnail_url), thumbnail_url: null }
      : post) as PublicCreatorPostRow[]
    creatorPostsCache.set(creatorId, { data: rows, expiresAt: Date.now() + PUBLIC_CACHE_TTL })
    return rows
  })()
  creatorPostsRequests.set(creatorId, request)
  try {
    return await request
  } finally {
    creatorPostsRequests.delete(creatorId)
  }
}

export type CreatorSubscriptionResponse = {
  ok: boolean
  subscribed: boolean
  invoiceUrl?: string
  offer?: {
    mode: 'free' | 'paid' | 'promo'
    stars: number
    days: number | null
    autoRenew: boolean
    title: string
    message: string
    promoExpiresAt: string | null
    priceUsd: number
    normalPriceUsd: number
    pricingTier: 'limited' | 'standard'
  }
  subscription?: {
    status: string
    type: string
    currentPeriodEnd: string | null
    autoRenew: boolean
  } | null
  telegramUsername?: string | null
  vipChannelUrl?: string | null
  error?: string
}

async function invokeCreatorSubscription(action: 'start' | 'status', creatorId: string) {
  const initData = getTelegramInitData()
  if (!initData) throw new Error('Open TeleFans in Telegram to manage this subscription.')
  const { data, error } = await supabase.functions.invoke<CreatorSubscriptionResponse>('telegram-subscription', { body: { action, creatorId, initData } })
  if (error) {
    let message = data?.error ?? error.message
    const context = (error as { context?: unknown }).context
    if (context && typeof context === 'object' && 'json' in context && typeof context.json === 'function') {
      try {
        const body = await (context as { json: () => Promise<{ error?: string }> }).json()
        message = body?.error ?? message
      } catch {
        // Keep the SDK message when the response body is not readable.
      }
    }
    throw new Error(message)
  }
  if (!data?.ok) throw new Error(data?.error ?? 'Subscription request failed.')
  return data
}

export function startCreatorSubscription(creatorId: string) {
  return invokeCreatorSubscription('start', creatorId)
}

export function getCreatorSubscriptionStatus(creatorId: string) {
  return invokeCreatorSubscription('status', creatorId)
}

export type PaidMediaUnlock = {
  mediaUrl: string
  coinsBalance: number
  alreadyUnlocked: boolean
}

export async function unlockPaidMedia(postId: string): Promise<PaidMediaUnlock> {
  const initData = getTelegramInitData()
  if (!initData) throw new Error('Open TeleFans in Telegram to unlock Paid Media.')

  const { data, error } = await supabase.functions.invoke<{ ok: boolean; mediaUrl?: string; coinsBalance?: number; alreadyUnlocked?: boolean; error?: string }>('paid-media-unlock', {
    body: { initData, postId },
  })
  if (error) throw new Error(data?.error ?? error.message)
  if (!data?.ok || !data.mediaUrl) throw new Error(data?.error ?? 'Paid Media could not be unlocked.')

  return {
    mediaUrl: data.mediaUrl,
    coinsBalance: data.coinsBalance ?? 0,
    alreadyUnlocked: data.alreadyUnlocked ?? false,
  }
}

export type ReelMetrics = {
  likes: number
  comments: number
  views: number
}

export type PublishedReel = PostRow & { metrics: ReelMetrics }

async function loadReelMetrics(postIds: string[]) {
  const metrics = new Map<string, ReelMetrics>(postIds.map((id) => [id, { likes: 0, comments: 0, views: 0 }]))
  if (!postIds.length) return metrics
  const [{ data: likes, error: likesError }, { data: comments, error: commentsError }, { data: views, error: viewsError }] = await Promise.all([
    supabase.from('post_likes').select('post_id').in('post_id', postIds),
    supabase.from('post_comments').select('post_id').in('post_id', postIds),
    supabase.from('post_views').select('post_id').in('post_id', postIds),
  ])
  if (likesError) throw likesError
  if (commentsError) throw commentsError
  if (viewsError) throw viewsError
  for (const row of likes ?? []) metrics.get(row.post_id)!.likes += 1
  for (const row of comments ?? []) metrics.get(row.post_id)!.comments += 1
  for (const row of views ?? []) metrics.get(row.post_id)!.views += 1
  return metrics
}

export async function listPublishedReels(limit = 40): Promise<PublishedReel[]> {
  const cached = reelsCache.get(limit)
  if (cached && cached.expiresAt > Date.now()) return cached.data
  const { data, error } = await supabase.from('creator_posts').select('*').eq('published', true).eq('reels_enabled', true).eq('type', 'video').order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  const posts = data ?? []
  const metrics = await loadReelMetrics(posts.map((post) => post.id))
  const result = posts.map((post) => ({ ...post, metrics: metrics.get(post.id)! }))
  reelsCache.set(limit, { data: result, expiresAt: Date.now() + PUBLIC_CACHE_TTL })
  return result
}

export type PostLikeResult = { applied: boolean; delta: -1 | 0 | 1 }

export async function togglePostLike(postId: string, liked: boolean, telegramId?: number | null): Promise<PostLikeResult> {
  const visitorKey = getVisitorKey()
  if (!visitorKey) return { applied: false, delta: 0 }

  const identityFilter = telegramId == null ? `visitor_key.eq.${visitorKey}` : `visitor_key.eq.${visitorKey},telegram_id.eq.${telegramId}`
  if (!liked) {
    const { data, error } = await supabase.from('post_likes').delete().eq('post_id', postId).or(identityFilter).select('id')
    if (error) throw error
    return { applied: true, delta: data?.length ? -1 : 0 }
  }

  const { data: existing, error: existingError } = await supabase.from('post_likes').select('id').eq('post_id', postId).or(identityFilter).limit(1).maybeSingle()
  if (existingError) throw existingError
  if (existing) return { applied: true, delta: 0 }

  const { error } = await supabase.from('post_likes').insert({ post_id: postId, visitor_key: visitorKey, telegram_id: telegramId ?? null, user_id: null })
  if (error && error.code !== '23505') throw error
  return { applied: true, delta: error ? 0 : 1 }
}

export async function getLikedPostIds(postIds: string[], telegramId?: number | null): Promise<string[]> {
  const visitorKey = getVisitorKey()
  if (!visitorKey || !postIds.length) return []
  const visitorQuery = supabase.from('post_likes').select('post_id').in('post_id', postIds).eq('visitor_key', visitorKey)
  const telegramQuery = telegramId == null
    ? Promise.resolve({ data: [], error: null })
    : supabase.from('post_likes').select('post_id').in('post_id', postIds).eq('telegram_id', telegramId)
  const [{ data: visitorRows, error: visitorError }, { data: telegramRows, error: telegramError }] = await Promise.all([visitorQuery, telegramQuery])
  if (visitorError) throw visitorError
  if (telegramError) throw telegramError
  return [...new Set([...(visitorRows ?? []).map(row => row.post_id), ...(telegramRows ?? []).map(row => row.post_id)])]
}

export async function hasPostLike(postId: string, telegramId?: number | null) {
  const liked = await getLikedPostIds([postId], telegramId)
  return liked.includes(postId)
}

export type PostCommentWithAuthor = {
  id: string
  body: string
  created_at: string
  visitor_key?: string | null
  user_id?: string | null
  telegram_id?: number | null
  author_name?: string | null
  author_username?: string | null
  author_photo_url?: string | null
}

export async function listPostComments(postId: string): Promise<PostCommentWithAuthor[]> {
  const { data, error } = await supabase.from('post_comments').select('id, body, created_at, visitor_key, user_id, telegram_id').eq('post_id', postId).order('created_at', { ascending: true })
  if (error) throw error
  const rows = data ?? []
  const telegramIds = [...new Set(rows.map((row) => row.telegram_id).filter((id): id is number => typeof id === 'number'))]
  if (!telegramIds.length) return rows
  const { data: profiles, error: profilesError } = await supabase.from('telegram_users').select('telegram_id, first_name, last_name, username, photo_url, profile_photo_url').in('telegram_id', telegramIds)
  if (profilesError) throw profilesError
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.telegram_id, profile]))
  return rows.map((row) => {
    const profile = row.telegram_id == null ? undefined : profileMap.get(row.telegram_id)
    return { ...row, author_name: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : null, author_username: profile?.username ?? null, author_photo_url: profile?.profile_photo_url ?? profile?.photo_url ?? null }
  })
}

export async function addPostComment(postId: string, body: string, telegramId?: number | null) {
  const visitorKey = getVisitorKey()
  if (!visitorKey || !body.trim()) return null
  const { data, error } = await supabase.from('post_comments').insert({ post_id: postId, body: body.trim(), visitor_key: visitorKey, telegram_id: telegramId ?? null }).select('*').single()
  if (error) throw error
  return data
}

export async function recordPostView(postId: string, telegramId?: number | null) {
  const visitorKey = getVisitorKey()
  if (!visitorKey) return
  const { error } = await supabase.from('post_views').insert({ post_id: postId, visitor_key: visitorKey, telegram_id: telegramId ?? null })
  if (error) throw error
}
