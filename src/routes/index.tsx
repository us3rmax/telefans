import { createFileRoute, Link } from '@tanstack/react-router'
import { Grid2X2, House, PlaySquare, Search, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import '../telescope.css'

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }

const creators = [
  ['Abigaiil Morris', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/8e1e169a-09c9-4e66-f7be-b42f59cff800/public'],
  ['Alex Mucci', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/437fa29e-489c-4a08-3439-38ea8137d700/public'],
  ['Emma Hix', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/a6184bf9-e8f4-4e3f-2907-02eb2aeff000/public'],
  ['Lily Phillips', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/d14de298-7e05-4b79-ec24-4b35ccbd4e00/public'],
  ['Pleasant Morenaa', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/924fed1a-5cc0-41fa-3a25-a2ecb3569200/public'],
  ['Savannah Bond', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/aec21118-9d2e-41dc-0922-d0c4a1d7c700/public'],
  ['Jasmine Jae', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/9fb69de6-7225-428b-e1d6-4c19e2d71e00/public'],
  ['Morgan Lane', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/3f1ad90e-4945-4508-6fa8-a1a4cbc19600/public'],
  ['Donna', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/0a5d05e7-5fa6-4646-b7f1-7e500c915400/public'],
  ['Lauren Blake', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/d7462826-b7fa-4829-be01-e814715cd200/public'],
  ['Claudia Tihan', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/d322dc17-8f9a-4204-a786-25685314e000/public'],
  ['Francety', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/3a8b6205-b1ae-415f-cf15-56206c824600/public'],
  ['Amanda Nicole', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/512bc0a0-66d3-4e38-b3e7-117726d7a300/public'],
  ['Ava Louise', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/4783fcc1-86b6-45b9-7da9-79bf793edc00/public'],
  ['Rebekah Leah', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/c064eaf6-8cb5-48ad-ddec-a719228e2d00/public'],
  ['Elsa Jean', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/8529c55d-263e-4e3a-8364-d971aa0cf900/public'],
  ['Yvonne Bar', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/fa7baef1-fd87-4232-9e32-9d576e892700/public'],
  ['Gigi Torres', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/9d4d0e65-961b-4c42-9629-4cc766582500/public'],
  ['Sommer Ray', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/fb0a8d2b-30dd-487a-a7bb-1e738cc7e600/public'],
  ['Frances Bentley', 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/404e7eec-1ce5-4d73-6c21-fddbf856c900/public'],
] as const

function BottomNav() {
  return <nav className="bottom-nav" aria-label="Primary navigation">
    <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'nav-link nav-active' }} className="nav-link"><House /><span>Explore</span></Link>
    <Link to="/reels" search={{ tab: 'trending' }} activeProps={{ className: 'nav-link nav-active' }} className="nav-link"><PlaySquare /><span>Reels</span></Link>
    <Link to="/profile" className="nav-link"><UserRound /><span>Profile</span></Link>
  </nav>
}

function FilterBar({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  const [filter, setFilter] = useState('Trending')
  return <div className="filter-row">
    <label className={`search-pill ${query ? 'search-open' : ''}`}>
      <Search />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="name or username" aria-label="Search creators" />
    </label>
    {['🔥 Trending', '💎 Most Popular', '💫 New'].map((item) => <button key={item} type="button" onClick={() => setFilter(item.slice(2))} className={`filter-pill ${filter === item.slice(2) ? 'filter-selected' : ''}`}>{item}</button>)}
  </div>
}

export function ExplorePage() {
  const [query, setQuery] = useState('')
  const visibleCreators = useMemo(() => creators.filter(([name]) => name.toLowerCase().includes(query.toLowerCase())), [query])
  return <main className="telescope-shell">
    <div className="content-column">
      <header className="brand-header"><img src="https://www.telescope.me/assets/logo-DKQfmv-4.svg" alt="Telescope" /></header>
      <div className="scroll-content">
        <section className="explore-heading"><h1>Explore</h1><button type="button" aria-label="Switch to list view" className="view-toggle"><Grid2X2 /></button></section>
        <FilterBar query={query} setQuery={setQuery} />
        <div className="creator-grid">
          {visibleCreators.map(([name, image], index) => <Link to="/creator/$slug" params={{ slug: slugify(name) }} className="creator-card" key={name} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }} aria-label={`Open ${name}`}>
            <img src={image} alt={name} loading={index < 4 ? 'eager' : 'lazy'} />
            <span className="card-shade" />
            <span className="creator-name">{name}</span>
          </Link>)}
        </div>
        {visibleCreators.length === 0 && <p className="empty-copy">No creators found. Try another name.</p>}
        <footer className="site-footer"><a href="https://www.telescope.me/terms">Terms &amp; Conditions</a><a href="https://www.telescope.me/privacy">Privacy Policy</a></footer>
      </div>
    </div>
    <BottomNav />
  </main>
}

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Telescope' }, { name: 'description', content: 'Explore creators on Telescope.' }] }),
  component: ExplorePage,
})
