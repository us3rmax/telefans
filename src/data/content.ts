export type AdminPost = {
  id: string
  creatorSlug: string
  creatorName: string
  type: 'image' | 'video'
  title: string
  mediaUrl: string
  published: boolean
  createdAt: string
}

const POSTS_KEY = 'telefans_admin_posts'

export const seedPosts: AdminPost[] = [
  { id: 'alex-001', creatorSlug: 'alex-mucci', creatorName: 'Alex Mucci', type: 'video', title: 'New weekly drop', mediaUrl: 'https://media.telescope.me/posts/sariixo_/3954409237119153417_1010720925.mp4', published: true, createdAt: 'Seed data' },
  { id: 'emma-001', creatorSlug: 'emma-hix', creatorName: 'Emma Hix', type: 'image', title: 'Latest update', mediaUrl: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/a6184bf9-e8f4-4e3f-2907-02eb2aeff000/public', published: true, createdAt: 'Seed data' },
]

export function readAdminPosts(): AdminPost[] {
  if (typeof window === 'undefined') return seedPosts
  try {
    const stored = window.localStorage.getItem(POSTS_KEY)
    if (!stored) return seedPosts
    const parsed = JSON.parse(stored) as AdminPost[]
    return Array.isArray(parsed) ? parsed : seedPosts
  } catch {
    return seedPosts
  }
}

export function writeAdminPosts(posts: AdminPost[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
}
