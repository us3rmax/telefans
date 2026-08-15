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

export async function listPublishedReels(): Promise<PostRow[]> {
  const { data, error } = await supabase.from('creator_posts').select('*').eq('published', true).eq('reels_enabled', true).eq('type', 'video').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function togglePostLike(postId: string, liked: boolean) {
  const visitorKey = getVisitorKey()
  if (!visitorKey) return
  if (liked) {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('visitor_key', visitorKey)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('post_likes').insert({ post_id: postId, visitor_key: visitorKey, user_id: visitorKey } as any)
  if (error && error.code !== '23505') throw error
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
