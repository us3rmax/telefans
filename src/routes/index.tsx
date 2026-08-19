import { createFileRoute, Link } from '@tanstack/react-router'
import { House, PlaySquare, Search, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { exploreCreators, rankExploreCreators, type ExploreCategory, type ExploreCreator } from '@/data/explore'
import { listPublishedCreatorExploreStats } from '@/lib/telefans-data'
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
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ExploreCategory>('Trending')
  const [publishedCreators, setPublishedCreators] = useState<ExploreCreator[]>([])

  useEffect(() => {
    let active = true
    void listPublishedCreatorExploreStats().then((rows) => {
      if (!active) return
      setPublishedCreators(rows.map((creator) => ({
        name: creator.name,
        image: creator.avatar_image || creator.cover_image || '/placeholder-avatar.svg',
        slug: creator.slug,
        trendingScore: creator.trendingScore,
        popularScore: creator.popularScore,
        createdAt: creator.created_at || creator.updated_at || new Date(0).toISOString(),
      })))
    }).catch(() => {
      // Keep the seeded Explore catalogue available if the public query is unavailable.
    })
    return () => { active = false }
  }, [])

  const allCreators = useMemo(() => {
    // Seeded catalogue entries use legacy hyphenated slugs while Supabase
    // stores canonical slugs without separators. Use the same identity token
    // for both sources so a creator is rendered only once in Explore.
    const slugToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
    const byCreator = new Map<string, ExploreCreator>()
    for (const creator of exploreCreators) byCreator.set(slugToken(creator.slug), creator)
    for (const creator of publishedCreators) byCreator.set(slugToken(creator.slug), creator)
    return [...byCreator.values()]
  }, [publishedCreators])

  const visibleCreators = useMemo(() => rankExploreCreators(filter, allCreators).filter(({ name }) => name.toLowerCase().includes(query.toLowerCase())), [allCreators, filter, query])
  return <main className="telescope-shell">
    <div className="content-column explore-content-column">
      <header className="brand-header"><img src="/assets/telefans-logo.png" alt="TeleFans" /></header>
      <div className="scroll-content">
        <section className="explore-heading" aria-hidden="true" />
        <FilterBar query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} />
        <div className="creator-grid">
          {visibleCreators.map(({ name, image, slug }, index) => <Link to="/creator/$slug" params={{ slug }} className="creator-card" key={name} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }} aria-label={`Open ${name}`}>
            <img src={image} alt={name} loading={index < 4 ? 'eager' : 'lazy'} />
            <span className="card-shade" />
            <span className="creator-name">{name}</span>
          </Link>)}
        </div>
        {visibleCreators.length === 0 && <p className="empty-copy">No creators found. Try another name.</p>}
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
