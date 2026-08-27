import { createFileRoute, Link } from '@tanstack/react-router'
import { House, PlaySquare, Search, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { exploreCreators, rankExploreCreators, type ExploreCategory, type ExploreCreator } from '@/data/explore'
import { listPublishedCreatorExploreStats, listPublishedCreators } from '@/lib/telefans-data'
import { clearExploreRestoreState, readExploreRestoreState, saveExploreRestoreState, saveProfileReturnState } from '@/lib/navigation-state'
import '../telescope.css'

function BottomNav() {
  return <nav className="bottom-nav" aria-label="Primary navigation">
    <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'nav-link nav-active' }} className="nav-link"><House /><span>Explore</span></Link>
    <Link to="/reels" search={{ tab: 'trending' }} activeProps={{ className: 'nav-link nav-active' }} className="nav-link"><PlaySquare /><span>Reels</span></Link>
    <Link to="/profile" className="nav-link"><UserRound /><span>Profile</span></Link>
  </nav>
}

function FilterBar({ query, setQuery, filter, setFilter }: { query: string; setQuery: (value: string) => void; filter: ExploreCategory; setFilter: (value: ExploreCategory) => void }) {
  return <div className="filter-row">
    <label className={`search-pill ${query ? 'search-open' : ''}`}>
      <Search />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="name or username" aria-label="Search creators" />
    </label>
    {(['Trending', 'Most Popular', 'New'] as ExploreCategory[]).map((category) => <button key={category} type="button" onClick={() => setFilter(category)} className={`filter-pill ${filter === category ? 'filter-selected' : ''}`}>{category === 'Trending' ? '🔥 ' : category === 'Most Popular' ? '💎 ' : '💫 '}{category}</button>)}
  </div>
}

export function ExplorePage() {
  const initialRestore = useRef(readExploreRestoreState()).current
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState(initialRestore?.query ?? '')
  const [filter, setFilter] = useState<ExploreCategory>(initialRestore?.filter ?? 'Trending')
  const [publishedCreators, setPublishedCreators] = useState<ExploreCreator[]>(exploreCreators)
  const [remoteCatalogLoaded, setRemoteCatalogLoaded] = useState(false)

  useEffect(() => {
    let active = true
    const toExploreCreator = (creator: { name: string; avatar_image?: string | null; cover_image?: string | null; slug: string; created_at?: string; updated_at?: string; trendingScore?: number; popularScore?: number }): ExploreCreator => ({
      name: creator.name,
      image: creator.avatar_image || creator.cover_image || '/placeholder-avatar.svg',
      slug: creator.slug,
      trendingScore: creator.trendingScore ?? 0,
      popularScore: creator.popularScore ?? 0,
      createdAt: creator.created_at || creator.updated_at || new Date(0).toISOString(),
    })

    // Load every published creator directly first. Ranking metrics are optional
    // and must never block or replace the complete catalog with an empty state.
    void listPublishedCreators().then((rows) => {
      if (!active) return
      setPublishedCreators(rows.map(toExploreCreator))
      setRemoteCatalogLoaded(true)
      void listPublishedCreatorExploreStats().then((stats) => {
        if (active && stats.length) setPublishedCreators(stats.map(toExploreCreator))
      }).catch(() => undefined)
    }).catch(() => {
      if (active) setRemoteCatalogLoaded(true)
    })
    return () => { active = false }
  }, [])

  const allCreators = publishedCreators

  useEffect(() => {
    const restore = readExploreRestoreState()
    if (!restore || restore.filter !== filter || restore.query !== query || !remoteCatalogLoaded) return
    const frame = window.requestAnimationFrame(() => {
      scrollContentRef.current?.scrollTo({ top: restore.scrollTop, behavior: 'auto' })
      clearExploreRestoreState()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [filter, query, remoteCatalogLoaded])

  const rememberCreatorOrigin = (slug: string) => {
    const scrollTop = scrollContentRef.current?.scrollTop ?? 0
    const state = { filter, query, scrollTop }
    saveExploreRestoreState(state)
    saveProfileReturnState({ source: 'explore', slug, ...state })
    return slug
  }

  const visibleCreators = useMemo(() => rankExploreCreators(filter, allCreators).filter(({ name }) => name.toLowerCase().includes(query.toLowerCase())), [allCreators, filter, query])
  return <main className="telescope-shell">
    <div className="content-column explore-content-column">
      <header className="brand-header"><img src="/assets/telefans-logo.png" alt="TeleFans" /></header>
      <div ref={scrollContentRef} className="scroll-content">
        <section className="explore-heading" aria-hidden="true" />
        <FilterBar query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} />
        <div className="creator-grid">
          {visibleCreators.map(({ name, image, slug }, index) => <Link to="/creator/$slug" params={{ slug }} onClick={() => { rememberCreatorOrigin(slug) }} className="creator-card" key={`${slug}-${index}`} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }} aria-label={`Open ${name}`}>
            <img src={image} alt={name} loading={index < 4 ? 'eager' : 'lazy'} />
            <span className="card-shade" />
            <span className="creator-name">{name}</span>
          </Link>)}
        </div>
        {visibleCreators.length === 0 && remoteCatalogLoaded && <p className="empty-copy">No creators found. Try another name.</p>}
        <footer className="site-footer"><Link to="/terms">TeleFans Terms &amp; Conditions</Link><Link to="/privacy">TeleFans Privacy Policy</Link></footer>
      </div>
    </div>
    <BottomNav />
  </main>
}

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Explore · TeleFans' }, { name: 'description', content: 'Explore creators on TeleFans.' }] }),
  component: ExplorePage,
})
