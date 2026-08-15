import { supabase } from './supabase'
import type { Tables, TablesInsert, TablesUpdate } from './supabase-types'

export type Creator = Tables<'creators'>
export type CreatorInsert = TablesInsert<'creators'>
export type CreatorUpdate = TablesUpdate<'creators'>
export type CreatorPost = Tables<'creator_posts'>
export type CreatorPostInsert = TablesInsert<'creator_posts'>
export type CreatorPostUpdate = TablesUpdate<'creator_posts'>
export type MediaAsset = Tables<'media_assets'>
export type MediaAssetInsert = TablesInsert<'media_assets'>

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function listAdminCreators() {
  const { data, error } = await supabase.from('creators').select('*').order('updated_at', { ascending: false })
  assertNoError(error)
  return data ?? []
}

export async function getAdminCreator(id: string) {
  const { data, error } = await supabase.from('creators').select('*').eq('id', id).maybeSingle()
  assertNoError(error)
  return data
}

export async function createAdminCreator(input: CreatorInsert) {
  const { data, error } = await supabase.from('creators').insert(input).select('*').single()
  assertNoError(error)
  if (!data) throw new Error('Creator não foi criado')
  await writeAudit('creator.created', 'creator', data.id, { slug: data.slug })
  return data
}

export async function updateAdminCreator(id: string, input: CreatorUpdate) {
  const { data, error } = await supabase.from('creators').update(input).eq('id', id).select('*').single()
  assertNoError(error)
  await writeAudit('creator.updated', 'creator', id, { fields: Object.keys(input) })
  return data
}

export async function setCreatorPublished(id: string, published: boolean) {
  return updateAdminCreator(id, { published, status: published ? 'published' : 'draft' })
}

export async function listAdminPosts(filters?: { creatorId?: string; type?: string; status?: string }) {
  let query = supabase.from('creator_posts').select('*, creators(name, slug, avatar_image)').order('created_at', { ascending: false })
  if (filters?.creatorId) query = query.eq('creator_id', filters.creatorId)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  assertNoError(error)
  return data ?? []
}

export async function createAdminPost(input: CreatorPostInsert) {
  const { data, error } = await supabase.from('creator_posts').insert(input).select('*').single()
  assertNoError(error)
  if (!data) throw new Error('Post não foi criado')
  await writeAudit('post.created', 'creator_post', data.id, { creator_id: data.creator_id })
  return data
}

export async function updateAdminPost(id: string, input: CreatorPostUpdate) {
  const { data, error } = await supabase.from('creator_posts').update(input).eq('id', id).select('*').single()
  assertNoError(error)
  await writeAudit('post.updated', 'creator_post', id, { fields: Object.keys(input) })
  return data
}

export async function listMediaAssets(creatorId?: string) {
  let query = supabase.from('media_assets').select('*').order('created_at', { ascending: false })
  if (creatorId) query = query.eq('creator_id', creatorId)
  const { data, error } = await query
  assertNoError(error)
  return data ?? []
}

export async function uploadMediaAsset(file: File, creatorId?: string) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  const path = `${crypto.randomUUID()}-${safeName}`
  const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { upsert: false, contentType: file.type })
  assertNoError(uploadError)
  const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
  const kind = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image'
  const insert: MediaAssetInsert = { creator_id: creatorId ?? null, kind, storage_path: path, public_url: urlData.publicUrl, original_name: file.name, mime_type: file.type, byte_size: file.size, status: 'ready' }
  const { data, error } = await supabase.from('media_assets').insert(insert).select('*').single()
  assertNoError(error)
  if (!data) throw new Error('Mídia não foi registada')
  await writeAudit('media.uploaded', 'media_asset', data.id, { path, kind })
  return data
}

export async function followCreator(telegramUserId: string, creatorId: string) {
  const { error } = await supabase.from('creator_following').upsert({ telegram_user_id: telegramUserId, creator_id: creatorId }, { onConflict: 'telegram_user_id,creator_id' })
  assertNoError(error)
}

export async function unfollowCreator(telegramUserId: string, creatorId: string) {
  const { error } = await supabase.from('creator_following').delete().eq('telegram_user_id', telegramUserId).eq('creator_id', creatorId)
  assertNoError(error)
}

export async function listFollowedCreators(telegramUserId: string) {
  const { data, error } = await supabase.from('creator_following').select('creator_id, creators(*)').eq('telegram_user_id', telegramUserId).order('created_at', { ascending: false })
  assertNoError(error)
  return data ?? []
}

export async function getAdminMetrics() {
  const [{ count: creators }, { count: publishedCreators }, { count: posts }, { count: reels }, { count: users }] = await Promise.all([
    supabase.from('creators').select('id', { count: 'exact', head: true }),
    supabase.from('creators').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('creator_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('creator_posts').select('id', { count: 'exact', head: true }).eq('status', 'published').eq('reels_enabled', true),
    supabase.from('telegram_users').select('telegram_id', { count: 'exact', head: true }),
  ])
  return { creators: creators ?? 0, publishedCreators: publishedCreators ?? 0, posts: posts ?? 0, reels: reels ?? 0, users: users ?? 0 }
}

async function writeAudit(action: string, entityType: string, entityId: string, metadata: Record<string, unknown>) {
  const { data: session } = await supabase.auth.getSession()
  const { error } = await supabase.from('admin_audit_log').insert({ admin_user_id: session.session?.user.id ?? null, action, entity_type: entityType, entity_id: entityId, metadata: metadata as any })
  assertNoError(error)
}

export async function uploadCreatorMediaBatch(files: File[], creatorId: string) {
  const results: Array<{ asset: MediaAsset; post: CreatorPost }> = []
  for (const file of files) {
    const asset = await uploadMediaAsset(file, creatorId)
    const isVideo = asset.kind === 'video'
    const post = await createAdminPost({
      creator_id: creatorId,
      title: file.name.replace(/\.[^.]+$/, '') || (isVideo ? 'Novo Reel' : 'Novo post'),
      caption: '',
      media_url: asset.public_url ?? '',
      thumbnail_url: asset.thumbnail_url,
      type: isVideo ? 'video' : 'image',
      status: 'published',
      published: true,
      reels_enabled: isVideo,
      comments_enabled: true,
      sort_order: 0,
    })
    results.push({ asset, post })
  }
  return results
}

export type AdminClient = Tables<'telegram_users'> & { following_count: number }

export async function listAdminClients(limit = 100) {
  const { data, error } = await supabase.from('telegram_users').select('*').order('created_at', { ascending: false }).limit(limit)
  assertNoError(error)
  const users = data ?? []
  const clients = await Promise.all(users.map(async user => {
    const { count, error: followingError } = await supabase.from('creator_following').select('creator_id', { count: 'exact', head: true }).eq('telegram_user_id', String(user.telegram_id))
    assertNoError(followingError)
    return { ...user, following_count: count ?? 0 }
  }))
  return clients as AdminClient[]
}

export async function getAdminClientMetrics() {
  const { data, error } = await supabase.from('telegram_users').select('telegram_id, first_name, last_name, username, photo_url, profile_photo_url, created_at, updated_at').order('created_at', { ascending: false }).limit(100)
  assertNoError(error)
  const users = data ?? []
  const clients = await Promise.all(users.map(async user => {
    const { count, error: followingError } = await supabase.from('creator_following').select('creator_id', { count: 'exact', head: true }).eq('telegram_user_id', String(user.telegram_id))
    assertNoError(followingError)
    return { ...user, following_count: count ?? 0 }
  }))
  return {
    total: clients.length,
    recent: clients.slice(0, 8),
    active: [...clients].sort((a, b) => b.following_count - a.following_count || b.updated_at.localeCompare(a.updated_at)).slice(0, 8),
    all: clients,
  }
}
