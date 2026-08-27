export type ExploreFilter = 'Trending' | 'Most Popular' | 'New'
export type ReelsTab = 'trending' | 'new'

export type ProfileReturnState =
  | { source: 'explore'; slug: string; filter: ExploreFilter; query: string; scrollTop: number }
  | { source: 'reels'; slug: string; tab: ReelsTab; id: string; scrollTop: number }

export type ExploreRestoreState = {
  filter: ExploreFilter
  query: string
  scrollTop: number
}

export type ReelsPositionState = {
  id: string
  tab: ReelsTab
  scrollTop: number
}

const PROFILE_RETURN_KEY = 'telefans.profile.return'
const EXPLORE_RESTORE_KEY = 'telefans.explore.restore'
const REELS_POSITION_KEY = 'telefans.reels.position'

function storage() {
  if (typeof window === 'undefined') return null
  try { return window.sessionStorage } catch { return null }
}

function isExploreFilter(value: unknown): value is ExploreFilter {
  return value === 'Trending' || value === 'Most Popular' || value === 'New'
}

function isReelsTab(value: unknown): value is ReelsTab {
  return value === 'trending' || value === 'new'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function saveProfileReturnState(state: ProfileReturnState) {
  try { storage()?.setItem(PROFILE_RETURN_KEY, JSON.stringify(state)) } catch { /* optional session storage */ }
}

export function readProfileReturnState(): ProfileReturnState | null {
  try {
    const raw = storage()?.getItem(PROFILE_RETURN_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const candidate = value as Record<string, unknown>
    if (candidate.source === 'explore' && typeof candidate.slug === 'string' && candidate.slug.length > 0 && isExploreFilter(candidate.filter) && typeof candidate.query === 'string' && isFiniteNumber(candidate.scrollTop)) {
      return { source: 'explore', slug: candidate.slug, filter: candidate.filter, query: candidate.query, scrollTop: candidate.scrollTop }
    }
    if (candidate.source === 'reels' && typeof candidate.slug === 'string' && candidate.slug.length > 0 && isReelsTab(candidate.tab) && typeof candidate.id === 'string' && candidate.id.length > 0 && isFiniteNumber(candidate.scrollTop)) {
      return { source: 'reels', slug: candidate.slug, tab: candidate.tab, id: candidate.id, scrollTop: candidate.scrollTop }
    }
    return null
  } catch { return null }
}

export function clearProfileReturnState() {
  try { storage()?.removeItem(PROFILE_RETURN_KEY) } catch { /* optional session storage */ }
}

export function saveExploreRestoreState(state: ExploreRestoreState) {
  try { storage()?.setItem(EXPLORE_RESTORE_KEY, JSON.stringify(state)) } catch { /* optional session storage */ }
}

export function readExploreRestoreState(): ExploreRestoreState | null {
  try {
    const raw = storage()?.getItem(EXPLORE_RESTORE_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const candidate = value as Record<string, unknown>
    if (!isExploreFilter(candidate.filter) || typeof candidate.query !== 'string' || !isFiniteNumber(candidate.scrollTop)) return null
    return { filter: candidate.filter, query: candidate.query, scrollTop: candidate.scrollTop }
  } catch { return null }
}

export function clearExploreRestoreState() {
  try { storage()?.removeItem(EXPLORE_RESTORE_KEY) } catch { /* optional session storage */ }
}

export function saveReelsPosition(state: ReelsPositionState) {
  try { storage()?.setItem(REELS_POSITION_KEY, JSON.stringify(state)) } catch { /* optional session storage */ }
}

export function readReelsPosition(): ReelsPositionState | null {
  try {
    const raw = storage()?.getItem(REELS_POSITION_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const candidate = value as Record<string, unknown>
    if (!isReelsTab(candidate.tab) || typeof candidate.id !== 'string' || candidate.id.length === 0 || !isFiniteNumber(candidate.scrollTop)) return null
    return { id: candidate.id, tab: candidate.tab, scrollTop: candidate.scrollTop }
  } catch { return null }
}
