import { House, PlaySquare, UserRound } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function PrimaryBottomNav({ active }: { active: 'explore' | 'reels' | 'profile' }) {
  return <nav className="bottom-nav" aria-label="Primary navigation">
    <Link to="/" className={`nav-link${active === 'explore' ? ' nav-active' : ''}`}><House /><span>Explore</span></Link>
    <Link to="/reels" search={{ tab: 'trending' }} className={`nav-link${active === 'reels' ? ' nav-active' : ''}`}><PlaySquare /><span>Reels</span></Link>
    <Link to="/profile" className={`nav-link${active === 'profile' ? ' nav-active' : ''}`}><UserRound /><span>Profile</span></Link>
  </nav>
}
