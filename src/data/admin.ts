import { creatorProfiles, type CreatorProfile } from './creators'

export type AdminCreator = CreatorProfile & {
  published: boolean
  updatedAt: string
}

const STORAGE_KEY = 'telefans_admin_creators'

export function getSeedAdminCreators(): AdminCreator[] {
  return Object.values(creatorProfiles).map((creator) => ({
    ...creator,
    published: true,
    updatedAt: 'Seed data',
  }))
}

export function readAdminCreators(): AdminCreator[] {
  if (typeof window === 'undefined') return getSeedAdminCreators()
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return getSeedAdminCreators()
    const parsed = JSON.parse(stored) as AdminCreator[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getSeedAdminCreators()
  } catch {
    return getSeedAdminCreators()
  }
}

export function writeAdminCreators(creators: AdminCreator[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(creators))
  }
}

export function toAdminCreator(creator: CreatorProfile): AdminCreator {
  return { ...creator, published: true, updatedAt: new Date().toLocaleDateString('en-US') }
}
