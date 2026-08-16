import { Activity, AlertTriangle, BarChart3, CheckCircle2, Clock3, Coins, Eye, FileImage, Filter, Heart, ImagePlus, Link2, Loader2, MessageCircle, RefreshCw, Send, TrendingUp, Upload, Users, UsersRound, Video, WalletCards, Star, LineChart } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getAdminAnalytics, listAdminClients, listAdminCreators, type AdminAnalytics, type AdminClient, uploadCreatorMediaBatch, type Creator } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/')({ component: DashboardHome })
type Icon = typeof Users
type Period = '14d' | '7d' | '30d' | 'all'

function MetricCard({ label, value, detail, icon: IconComponent, tone = 'default', muted = false }: { label: string; value: number | string; detail?: string; icon: Icon; tone?: 'default' | 'green' | 'gold' | 'blue'; muted?: boolean }) {
  return <div className={`admin-metric-card ${tone} ${muted ? 'is-muted' : ''}`}><div className="flex items-center justify-between"><span className="admin-metric-icon"><IconComponent /></span><TrendingUp className="h-4 w-4 opacity-40" /></div><strong>{typeof value === 'number' ? value.toLocaleString('en-US') : value}</strong><span>{label}</span>{detail && <small>{detail}</small>}</div>
}

function FinanceKpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="admin-finance-kpi"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
}

function RevenueBreakdown() {
  return <section className="admin-finance-panel admin-revenue-breakdown"><div className="admin-panel-heading"><div><h2>Revenue Breakdown</h2><p>Net earnings by revenue source.</p></div><WalletCards /></div><div className="admin-breakdown-body"><div className="admin-donut"><div><strong>$0</strong><span>Total</span></div></div><div className="admin-breakdown-table"><div className="admin-breakdown-head"><span>Type</span><span>% of Earnings</span><span>Earnings</span></div>{[['Media','blue'],['Tips','pink'],['Subscriptions','gold'],['Other','green']].map(([label, color]) => <div className="admin-breakdown-row" key={label}><span><i className={color} />{label}</span><span>0%</span><span>$0.00</span></div>)}</div></div></section>
}

function RevenueOverview() {
  return <section className="admin-finance-panel admin-revenue-overview"><div className="admin-panel-heading"><div><h2>Revenue Overview</h2><p>Net earnings over the selected date range.</p></div><div className="admin-chart-toggle"><BarChart3 /><LineChart /></div></div><div className="admin-finance-empty"><LineChart /><strong>No data for this date range</strong><span>Revenue charts will appear after purchase events are connected.</span></div></section>
}

function ClientRow({ client }: { client: AdminClient }) {
  const name = [client.first_name, client.last_name].filter(Boolean).join(' ') || 'Telegram user'
  const avatar = client.profile_photo_url || client.photo_url
  return <div className="admin-list-row"><div className="admin-avatar">{avatar ? <img src={avatar} alt="" /> : name.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="truncate text-xs text-muted-foreground">{client.username ? `@${client.username}` : `Telegram ID ${client.telegram_id}`}</p></div><div className="text-right text-xs text-muted-foreground"><strong className="block text-foreground">{client.following_count}</strong>Following</div></div>
}

function ActivityChart({ daily }: { daily: AdminAnalytics['daily'] }) {
  const max = Math.max(1, ...daily.map(day => Math.max(day.views, day.users, day.likes)))
  return <div className="admin-chart"><div className="admin-chart-legend"><span><i className="views" />Views</span><span><i className="users" />New users</span><span><i className="likes" />Likes</span></div>{daily.length ? <div className="admin-chart-bars">{daily.map(day => <div className="admin-chart-day" key={day.label}><div className="admin-bar-stack"><span className="views" style={{ height: `${Math.max(3, day.views / max * 100)}%` }} /><span className="users" style={{ height: `${Math.max(3, day.users / max * 100)}%` }} /><span className="likes" style={{ height: `${Math.max(3, day.likes / max * 100)}%` }} /></div><small>{day.label}</small></div>)}</div> : <div className="admin-empty-state">No activity recorded for this period.</div>}</div>
}

function ActionQueue({ actions }: { actions: AdminAnalytics['actions'] }) {
  const items = [
    { label: 'Creators without published content', value: actions.creatorsWithoutContent, href: '/app/models', icon: Users, tone: 'warning' },
    { label: 'Published content with no views', value: actions.contentWithoutViews, href: '/app/content', icon: Eye, tone: 'neutral' },
    { label: 'Drafts waiting for review', value: actions.drafts, href: '/app/content', icon: FileImage, tone: 'neutral' },
    { label: 'Scheduled posts', value: actions.scheduled, href: '/app/content', icon: Clock3, tone: 'blue' },
  ] as const
  return <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Today’s action queue</h2><p>Operational items that need attention.</p></div><AlertTriangle /></div><div className="admin-action-grid">{items.map(item => <a href={item.href} className={`admin-action-card ${item.tone}`} key={item.label}><item.icon /><span>{item.label}</span><strong>{item.value}</strong><small>Open queue →</small></a>)}</div></section>
}

function NoDataPanel({ icon: IconComponent, title, description }: { icon: Icon; title: string; description: string }) {
  return <div className="admin-empty-state admin-empty-panel"><IconComponent /><strong>{title}</strong><p>{description}</p></div>
}

function DashboardHome() {
  const [models, setModels] = useState<Creator[]>([])
  const [clients, setClients] = useState<AdminClient[]>([])
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [unlockPrice, setUnlockPrice] = useState('10')
  const [paidImages, setPaidImages] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [account, setAccount] = useState('all')
  const [period, setPeriod] = useState<Period>('14d')
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  const loadDashboard = async () => {
    setLoading(true); setError('')
    try {
      const [creatorRows, clientRows, metrics] = await Promise.all([listAdminCreators(), listAdminClients(100), getAdminAnalytics()])
      setModels(creatorRows); setClients(clientRows); setAnalytics(metrics)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load the CRM dashboard.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void loadDashboard() }, [])

  const filteredAnalytics = useMemo(() => {
    if (!analytics) return null
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === 'all' ? analytics.daily.length : 14
    const daily = analytics.daily.slice(-days)
    const selectedCreator = account === 'all' ? null : analytics.creators.find(creator => creator.id === account)
    const scopedCreators = selectedCreator ? analytics.creators.filter(creator => creator.id === selectedCreator.id) : analytics.creators
    const scopedOverview = selectedCreator ? { ...analytics.overview, posts: selectedCreator.posts, views: selectedCreator.views, likes: selectedCreator.likes, comments: selectedCreator.comments, follows: selectedCreator.followers } : analytics.overview
    return { ...analytics, daily, creators: scopedCreators, overview: scopedOverview }
  }, [analytics, account, period])

  const recentClients = useMemo(() => [...clients].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6), [clients])
  const activeClients = useMemo(() => [...clients].sort((a, b) => b.following_count - a.following_count || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6), [clients])

  const handleFiles = async (creator: Creator, files: File[]) => {
    if (!files.length) return
    setUploadingId(creator.id); setMessage(''); setError('')
    try {
      const price = Number.parseInt(unlockPrice, 10)
      if (!Number.isFinite(price) || price < 0) throw new Error('Enter a valid Paid Media price.')
      const result = await uploadCreatorMediaBatch(files, creator.id, price, paidImages)
      const images = result.filter(({ asset }) => asset.kind === 'image').length
      const videos = result.filter(({ asset }) => asset.kind === 'video').length
      setMessage(`${creator.name}: ${images} image(s) added to the profile and ${videos} video(s) sent to Reels.`)
      await loadDashboard()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not upload the media.') }
    finally { setUploadingId(null) }
  }

  const view = filteredAnalytics
  const overview = view?.overview
  const engagementRate = overview?.views ? ((overview.likes + overview.comments) / overview.views * 100).toFixed(1) : '0.0'
  const selectedAccountName = account === 'all' ? 'All accounts' : models.find(model => model.id === account)?.name ?? 'Selected account'
  return <main className="admin-dashboard"><div className="admin-dashboard-inner">
    <header className="admin-dashboard-header admin-finance-header"><div><div className="admin-title-line"><h1>Dashboard</h1><span className="admin-brand-pill">TeleFans CRM</span></div><p>Financial and operational overview for your creator business.</p></div><button type="button" onClick={() => void loadDashboard()} className="admin-refresh"><RefreshCw className="h-4 w-4" />Refresh data</button></header>
    <section className="admin-filter-bar admin-reference-filters"><div className="admin-filter-title"><Filter /><span>Filters</span><small>{selectedAccountName}</small></div><label>Accounts<select value={account} onChange={event => setAccount(event.target.value)}><option value="all">All creators</option>{models.map(model => <option value={model.id} key={model.id}>{model.name}</option>)}</select></label><label>Time range<select value={period} onChange={event => setPeriod(event.target.value as Period)}><option value="7d">Last 7 days</option><option value="14d">Last 14 days</option><option value="30d">Last 30 days</option><option value="all">Available history</option></select></label><label>Earning type<select defaultValue="net"><option value="net">Net</option><option value="gross">Gross (future)</option></select></label></section>
    {message && <div className="admin-alert success">{message}</div>}{error && <div className="admin-alert error">{error}</div>}
    {loading || !view ? <div className="admin-loading"><Loader2 className="h-5 w-5 animate-spin" />Loading CRM data…</div> : <>
      <section className="admin-reference-kpis"><MetricCard label="Fans" value={overview?.users ?? 0} detail={`+${view.actions.newUsers7d} in the last 7 days`} icon={Users} tone="blue" /><MetricCard label="Spenders" value="—" detail="Purchase ledger not connected" icon={UsersRound} muted /><MetricCard label="Transactions" value="—" detail="Purchase ledger not connected" icon={WalletCards} muted /><div className="admin-rank-card"><Star /><div><strong>Global Rank</strong><span>Connect revenue data to calculate creator rank.</span></div></div></section>
      <section className="admin-reference-finance-grid"><RevenueBreakdown /><RevenueOverview /></section>
      <section className="admin-finance-strip"><FinanceKpi label="New Fans Revenue" value="$0.00" detail="Not tracked" /><FinanceKpi label="Existing Fans Revenue" value="$0.00" detail="Not tracked" /><FinanceKpi label="ARPPU" value="$0.00" detail="Not tracked" /><FinanceKpi label="ARPNU" value="$0.00" detail="Not tracked" /><FinanceKpi label="APV" value="$0.00" detail="Not tracked" /><FinanceKpi label="APC" value="0.00" detail="Not tracked" /></section>
      <section className="admin-metrics-grid admin-secondary-overview"><MetricCard label="Published creators" value={overview?.publishedCreators ?? 0} detail={`${overview?.creators ?? 0} total profiles`} icon={UsersRound} /><MetricCard label="Engagement rate" value={`${engagementRate}%`} detail={`${overview?.likes ?? 0} likes · ${overview?.comments ?? 0} comments`} icon={Heart} tone="green" /><MetricCard label="Published content" value={overview?.posts ?? 0} detail={`${overview?.reels ?? 0} active Reels`} icon={Video} /><MetricCard label="Referral growth" value={`+${view.actions.referrals7d}`} detail={`${overview?.referrals ?? 0} total referrals`} icon={Send} tone="blue" /><MetricCard label="Coins issued" value={overview?.coinsIssued ?? 0} detail="Referral rewards only" icon={Coins} tone="gold" /></section>
      <ActionQueue actions={view.actions} />
      <section className="admin-panel admin-activity-panel"><div className="admin-panel-heading"><div><h2>Growth and engagement</h2><p>{selectedAccountName} · {period === 'all' ? 'available history' : `last ${period.replace('d', ' days')}`}</p></div><Activity /></div><ActivityChart daily={view.daily} /></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Creator health</h2><p>Use engagement rate and follower growth to decide who needs attention.</p></div><BarChart3 /></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Creator</th><th>Content</th><th>Views</th><th>Engagement</th><th>Followers</th><th>Next action</th></tr></thead><tbody>{view.creators.map(creator => <tr key={creator.id}><td><div className="flex items-center gap-2"><div className="admin-table-avatar">{creator.avatar_image ? <img src={creator.avatar_image} alt="" /> : creator.name.slice(0, 1)}</div><span>{creator.name}</span></div></td><td>{creator.posts}</td><td>{creator.views.toLocaleString('en-US')}</td><td><strong>{creator.engagementRate}%</strong></td><td>{creator.followers}</td><td><a href={`/app/models/${creator.id}`} className="admin-inline-link">Open profile</a></td></tr>)}</tbody></table></div></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Revenue data readiness</h2><p>Operational prerequisites for the finance panels above.</p></div><WalletCards /></div><NoDataPanel icon={Coins} title="No purchase ledger connected" description="The current Supabase schema records referral Coins, views and engagement, but not paid unlocks or payouts. Revenue cards will populate when purchase events are added." /></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Spender tracking</h2><p>Identify paying users, repeat buyers and high-value accounts.</p></div><UsersRound /></div><NoDataPanel icon={UsersRound} title="No spender data yet" description="This panel is intentionally empty until a purchase table links Telegram users to paid media or subscription transactions." /></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Link analytics</h2><p>Track creator links, source traffic and conversion into follows or purchases.</p></div><Link2 /></div><NoDataPanel icon={Link2} title="No tracked links yet" description="Create link events with source, campaign, creator and destination fields to activate this report without changing the public app layout." /></section>
      <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><h2>New users</h2><p>Latest Telegram accounts to onboard and retain.</p></div><Clock3 /></div><div className="space-y-2">{recentClients.map(client => <ClientRow key={client.telegram_id} client={client} />)}</div></section><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Most engaged users</h2><p>Users with the strongest creator-following activity.</p></div><CheckCircle2 /></div><div className="space-y-2">{activeClients.map(client => <ClientRow key={client.telegram_id} client={client} />)}</div></section></div>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Creator operations</h2><p>Upload profile media and route videos to Reels.</p></div><Upload /></div><div className="admin-upload-toolbar"><label>Paid Media price<input type="number" min="0" step="1" value={unlockPrice} onChange={event => setUnlockPrice(event.target.value)} /><small>Coins per image</small></label><label className="admin-upload-paid-toggle"><input type="checkbox" checked={paidImages} onChange={event => setPaidImages(event.target.checked)} />Mark image uploads as Paid<small>Off: images go to Posts only. On: images also appear in Paid Media.</small></label></div><div className="admin-creator-grid">{models.map(model => { const busy = uploadingId === model.id; return <button key={model.id} type="button" disabled={busy} onClick={() => inputs.current[model.id]?.click()} className="admin-creator-card"><div className="admin-creator-image"><img src={model.avatar_image || model.cover_image} alt={model.name} /><div><span>{model.name}</span>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}</div></div><span className="admin-upload-label"><Upload />Add media<input ref={element => { inputs.current[model.id] = element }} type="file" accept="image/*,video/*" multiple className="sr-only" onClick={event => event.stopPropagation()} onChange={event => { void handleFiles(model, Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} /></span></button> })}</div></section>
    </>}
  </div></main>
}
