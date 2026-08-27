import { Clock3, Coins, DollarSign, HeartPulse, Loader2, RefreshCw, UsersRound, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { listAdminClients, type AdminClient } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/fans')({ component: FanMetricsPage })

type FanSegment = {
  name: string
  description: string
  count: number
  tone: 'blue' | 'green' | 'gold' | 'pink'
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof UsersRound }) {
  return <div className="admin-metric-card blue"><div className="flex items-center justify-between"><span className="admin-metric-icon"><Icon /></span></div><strong>{typeof value === 'number' ? value.toLocaleString('en-US') : value}</strong><span>{label}</span><small>{detail}</small></div>
}

function segmentFans(fans: AdminClient[]): FanSegment[] {
  const now = Date.now()
  const newPromising = fans.filter(fan => now - new Date(fan.created_at).getTime() <= 7 * 86400000 && fan.following_count > 0)
  const loyal = fans.filter(fan => fan.following_count >= 2)
  const dormant = fans.filter(fan => now - new Date(fan.updated_at).getTime() > 14 * 86400000)
  const active = fans.filter(fan => now - new Date(fan.updated_at).getTime() <= 7 * 86400000)
  return [
    { name: 'New promising', description: 'New users who already follow a creator.', count: newPromising.length, tone: 'blue' },
    { name: 'Loyal fans', description: 'Users following two or more creators.', count: loyal.length, tone: 'green' },
    { name: 'Active recently', description: 'Users updated within the last 7 days.', count: active.length, tone: 'gold' },
    { name: 'Dormant', description: 'No profile activity recorded for more than 14 days.', count: dormant.length, tone: 'pink' },
  ]
}

function FanMetricsPage() {
  const [fans, setFans] = useState<AdminClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try { setFans(await listAdminClients(500)) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load fan metrics.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const segments = useMemo(() => segmentFans(fans), [fans])
  const coinsHeld = useMemo(() => fans.reduce((sum, fan) => sum + (fan.coins_balance ?? 0), 0), [fans])
  const recentFans = useMemo(() => [...fans].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10), [fans])

  return <main className="admin-dashboard"><div className="admin-dashboard-inner">
    <header className="admin-dashboard-header admin-finance-header"><div><div className="admin-title-line"><h1>Fan metrics</h1><span className="admin-brand-pill">Internal CRM</span></div><p>Behavioral segmentation and first-party fan activity.</p></div><button type="button" onClick={() => void load()} className="admin-refresh"><RefreshCw className="h-4 w-4" />Refresh data</button></header>
    {error && <div className="admin-alert error">{error}</div>}
    {loading ? <div className="admin-loading"><Loader2 className="h-5 w-5 animate-spin" />Loading fan metrics…</div> : <>
      <section className="admin-reference-kpis"><Metric label="Fans" value={fans.length} detail="Telegram accounts registered" icon={UsersRound} /><Metric label="Following actions" value={fans.reduce((sum, fan) => sum + fan.following_count, 0)} detail="Current creator follows" icon={HeartPulse} /><Metric label="Coins held" value={coinsHeld} detail="Referral/reward balance, not spending" icon={Coins} /><Metric label="Purchase events" value="—" detail="No internal purchase events yet" icon={WalletCards} /></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>RFM-style behavioral segments</h2><p>Recency and frequency are based on first-party app activity. Monetary value stays empty until purchases are recorded.</p></div><UsersRound /></div><div className="admin-two-column">{segments.map(segment => <div className={`admin-action-card ${segment.tone}`} key={segment.name}><span>{segment.name}</span><strong>{segment.count}</strong><small>{segment.description}</small></div>)}</div></section>
      <section className="admin-reference-finance-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><h2>LTV and revenue</h2><p>Financial metrics will populate from internal purchase events.</p></div><DollarSign /></div><div className="admin-finance-empty"><DollarSign /><strong>No purchase ledger yet</strong><span>Subscriptions, Paid Media unlocks, tips and custom orders will appear here after the application starts recording them.</span></div></section><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Renewal and churn</h2><p>Retention signals require subscription lifecycle events.</p></div><Clock3 /></div><div className="admin-finance-empty"><Clock3 /><strong>No subscription events yet</strong><span>Renewals, cancellations and churn windows will be calculated from first-party events.</span></div></section></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Recent fans</h2><p>Latest Telegram accounts available for CRM follow-up.</p></div><UsersRound /></div>{recentFans.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Fan</th><th>Telegram ID</th><th>Location</th><th>Following</th><th>Coins</th><th>Joined</th></tr></thead><tbody>{recentFans.map(fan => <tr key={fan.telegram_id}><td><strong>{[fan.first_name, fan.last_name].filter(Boolean).join(' ') || 'Telegram user'}</strong><small className="block text-muted-foreground">{fan.username ? `@${fan.username}` : 'No username'}</small></td><td>{fan.telegram_id}</td><td>{[fan.location_city, fan.location_state, fan.location_country].filter(Boolean).join(', ') || 'Not detected'}</td><td>{fan.following_count}</td><td>{fan.coins_balance ?? 0}</td><td>{new Date(fan.created_at).toLocaleDateString('en-US')}</td></tr>)}</tbody></table></div> : <div className="admin-empty-state">No fans registered yet.</div>}</section>
    </>}
  </div></main>
}
