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

export async function togglePostLike(postId: string, liked: boolean) {
  const visitorKey = getVisitorKey()
  if (!visitorKey) return
  if (!liked) {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('visitor_key', visitorKey)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('post_likes').insert({ post_id: postId, visitor_key: visitorKey, user_id: visitorKey })
  if (error && error.code !== '23505') throw error
}

export async function hasPostLike(postId: string) {
  const visitorKey = getVisitorKey()
  if (!visitorKey) return false
  const { data, error } = await supabase.from('post_likes').select('post_id').eq('post_id', postId).eq('visitor_key', visitorKey).maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function listPostComments(postId: string) {
  const { data, error } = await supabase.from('post_comments').select('id, body, created_at').eq('post_id', postId).order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addPostComment(postId: string, body: string) {
  const visitorKey = getVisitorKey()
  if (!visitorKey || !body.trim()) return null
  const { data, error } = await supabase.from('post_comments').insert({ post_id: postId, body: body.trim(), visitor_key: visitorKey }).select('*').single()
  if (error) throw error
  return data
}

export async function recordPostView(postId: string) {
  const visitorKey = getVisitorKey()
  if (!visitorKey) return
  const { error } = await supabase.from('post_views').insert({ post_id: postId, visitor_key: visitorKey })
  if (error) throw error
}
