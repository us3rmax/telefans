import { supabase } from './supabase'
import type { Database, Json } from './supabase-types'

type CreatorRow = Database['public']['Tables']['creators']['Row']
type PostRow = Database['public']['Tables']['creator_posts']['Row']

const VISITOR_KEY = 'telefans_visitor_key'

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
  const { data, error } = await supabase.from('creators').select('*').eq('published', true).order('name')
  if (error) throw error
  return data ?? []
}

export async function getPublishedCreator(slug: string): Promise<CreatorRow | null> {
  const { data, error } = await supabase.from('creators').select('*').eq('slug', slug).eq('published', true).maybeSingle()
  if (error) throw error
  return data
}

export async function listCreatorPosts(creatorId: string): Promise<PostRow[]> {
  const { data, error } = await supabase.from('creator_posts').select('*').eq('creator_id', creatorId).eq('published', true).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
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
  const { data, error } = await supabase.from('creator_posts').select('*').eq('published', true).eq('reels_enabled', true).eq('type', 'video').order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  const posts = data ?? []
  const metrics = await loadReelMetrics(posts.map((post) => post.id))
  return posts.map((post) => ({ ...post, metrics: metrics.get(post.id)! }))
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

export async function hasPostLike(postId: string, telegramId?: number | null) {
  const visitorKey = getVisitorKey()
  if (!visitorKey) return false
  const { data: byVisitor, error: visitorError } = await supabase.from('post_likes').select('post_id').eq('post_id', postId).eq('visitor_key', visitorKey).maybeSingle()
  if (visitorError) throw visitorError
  if (byVisitor) return true
  if (telegramId == null) return false
  const { data: byTelegram, error: telegramError } = await supabase.from('post_likes').select('post_id').eq('post_id', postId).eq('telegram_id', telegramId).maybeSingle()
  if (telegramError) throw telegramError
  return Boolean(byTelegram)
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
