import { Activity, BarChart3, CheckCircle2, Clock3, Coins, Eye, FileImage, Heart, ImagePlus, Loader2, MessageCircle, RefreshCw, Send, TrendingUp, Upload, Users, Video, AlertTriangle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getAdminAnalytics, listAdminClients, listAdminCreators, type AdminAnalytics, type AdminClient, uploadCreatorMediaBatch, type Creator } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/')({ component: DashboardHome })

type Icon = typeof Users

function MetricCard({ label, value, detail, icon: IconComponent, tone = 'default' }: { label: string; value: number | string; detail?: string; icon: Icon; tone?: 'default' | 'green' | 'gold' | 'blue' }) {
  return <div className={`admin-metric-card ${tone}`}><div className="flex items-center justify-between"><span className="admin-metric-icon"><IconComponent /></span><TrendingUp className="h-4 w-4 opacity-40" /></div><strong>{typeof value === 'number' ? value.toLocaleString('en-US') : value}</strong><span>{label}</span>{detail && <small>{detail}</small>}</div>
}

function ClientRow({ client }: { client: AdminClient }) {
  const name = [client.first_name, client.last_name].filter(Boolean).join(' ') || 'Telegram user'
  const avatar = client.profile_photo_url || client.photo_url
  return <div className="admin-list-row"><div className="admin-avatar">{avatar ? <img src={avatar} alt="" /> : name.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="truncate text-xs text-muted-foreground">{client.username ? `@${client.username}` : `Telegram ID ${client.telegram_id}`}</p></div><div className="text-right text-xs text-muted-foreground"><strong className="block text-foreground">{client.following_count}</strong>Following</div></div>
}

function ActivityChart({ daily }: { daily: AdminAnalytics['daily'] }) {
  const max = Math.max(1, ...daily.map(day => Math.max(day.views, day.users, day.likes)))
  return <div className="admin-chart"><div className="admin-chart-legend"><span><i className="views" />Views</span><span><i className="users" />New users</span><span><i className="likes" />Likes</span></div><div className="admin-chart-bars">{daily.map(day => <div className="admin-chart-day" key={day.label}><div className="admin-bar-stack"><span className="views" style={{ height: `${Math.max(3, day.views / max * 100)}%` }} /><span className="users" style={{ height: `${Math.max(3, day.users / max * 100)}%` }} /><span className="likes" style={{ height: `${Math.max(3, day.likes / max * 100)}%` }} /></div><small>{day.label}</small></div>)}</div></div>
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

function DashboardHome() {
  const [models, setModels] = useState<Creator[]>([])
  const [clients, setClients] = useState<AdminClient[]>([])
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [unlockPrice, setUnlockPrice] = useState('10')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
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

  const recentClients = useMemo(() => [...clients].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6), [clients])
  const activeClients = useMemo(() => [...clients].sort((a, b) => b.following_count - a.following_count || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6), [clients])

  const handleFiles = async (creator: Creator, files: File[]) => {
    if (!files.length) return
    setUploadingId(creator.id); setMessage(''); setError('')
    try {
      const price = Number.parseInt(unlockPrice, 10)
      if (!Number.isFinite(price) || price < 0) throw new Error('Enter a valid Paid Media price.')
      const result = await uploadCreatorMediaBatch(files, creator.id, price)
      const images = result.filter(({ asset }) => asset.kind === 'image').length
      const videos = result.filter(({ asset }) => asset.kind === 'video').length
      setMessage(`${creator.name}: ${images} image(s) added to the profile and ${videos} video(s) sent to Reels.`)
      await loadDashboard()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not upload the media.') }
    finally { setUploadingId(null) }
  }

  const overview = analytics?.overview
  const engagementRate = overview?.views ? ((overview.likes + overview.comments) / overview.views * 100).toFixed(1) : '0.0'
  return <main className="admin-dashboard"><div className="admin-dashboard-inner">
    <header className="admin-dashboard-header"><div><p className="admin-eyebrow">TeleFans CRM</p><h1>Creator control center</h1><p>Run the creator business from one operational dashboard.</p></div><button type="button" onClick={() => void loadDashboard()} className="admin-refresh"><RefreshCw className="h-4 w-4" />Refresh data</button></header>
    {message && <div className="admin-alert success">{message}</div>}{error && <div className="admin-alert error">{error}</div>}
    {loading || !analytics ? <div className="admin-loading"><Loader2 className="h-5 w-5 animate-spin" />Loading CRM data…</div> : <>
      <section className="admin-metrics-grid"><MetricCard label="Telegram users" value={overview?.users ?? 0} detail={`+${analytics.actions.newUsers7d} in the last 7 days`} icon={Users} tone="blue" /><MetricCard label="Published creators" value={overview?.publishedCreators ?? 0} detail={`${overview?.creators ?? 0} total profiles`} icon={Users} tone="default" /><MetricCard label="Engagement rate" value={`${engagementRate}%`} detail={`${overview?.likes ?? 0} likes · ${overview?.comments ?? 0} comments`} icon={Heart} tone="green" /><MetricCard label="Published content" value={overview?.posts ?? 0} detail={`${overview?.reels ?? 0} active Reels`} icon={Video} tone="default" /><MetricCard label="Referral growth" value={`+${analytics.actions.referrals7d}`} detail={`${overview?.referrals ?? 0} total referrals`} icon={Send} tone="blue" /><MetricCard label="Coins issued" value={overview?.coinsIssued ?? 0} detail="Referral rewards only" icon={Coins} tone="gold" /></section>
      <ActionQueue actions={analytics.actions} />
      <section className="admin-panel admin-activity-panel"><div className="admin-panel-heading"><div><h2>Growth and engagement</h2><p>Recorded user and content activity over the last 14 days.</p></div><Activity /></div><ActivityChart daily={analytics.daily} /></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Creator health</h2><p>Use engagement rate and follower growth to decide who needs attention.</p></div><BarChart3 /></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Creator</th><th>Content</th><th>Views</th><th>Engagement</th><th>Followers</th><th>Next action</th></tr></thead><tbody>{analytics.creators.map(creator => <tr key={creator.id}><td><div className="flex items-center gap-2"><div className="admin-table-avatar">{creator.avatar_image ? <img src={creator.avatar_image} alt="" /> : creator.name.slice(0, 1)}</div><span>{creator.name}</span></div></td><td>{creator.posts}</td><td>{creator.views.toLocaleString('en-US')}</td><td><strong>{creator.engagementRate}%</strong></td><td>{creator.followers}</td><td><a href={`/app/models/${creator.id}`} className="admin-inline-link">Open profile</a></td></tr>)}</tbody></table></div></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Content intelligence</h2><p>Top content by engagement rate, with raw counts for context.</p></div><FileImage /></div><div className="admin-content-grid">{analytics.topContent.map(item => <div className="admin-content-card" key={item.id}><div><strong>{item.title}</strong><small>{item.creator} · {item.type === 'video' ? 'Reel' : 'Paid Media'} · {item.engagementRate}% engagement</small></div><div className="admin-content-stats"><span><Eye />{item.views}</span><span><Heart />{item.likes}</span><span><MessageCircle />{item.comments}</span></div></div>)}</div></section>
      <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><h2>New users</h2><p>Latest Telegram accounts to onboard and retain.</p></div><Clock3 /></div><div className="space-y-2">{recentClients.map(client => <ClientRow key={client.telegram_id} client={client} />)}</div></section><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Most engaged users</h2><p>Users with the strongest creator-following activity.</p></div><CheckCircle2 /></div><div className="space-y-2">{activeClients.map(client => <ClientRow key={client.telegram_id} client={client} />)}</div></section></div>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Creator operations</h2><p>Upload profile media and route videos to Reels.</p></div><Upload /></div><div className="admin-upload-toolbar"><label>Paid Media price<input type="number" min="0" step="1" value={unlockPrice} onChange={event => setUnlockPrice(event.target.value)} /><small>Coins per image</small></label></div><div className="admin-creator-grid">{models.map(model => { const busy = uploadingId === model.id; return <button key={model.id} type="button" disabled={busy} onClick={() => inputs.current[model.id]?.click()} className="admin-creator-card"><div className="admin-creator-image"><img src={model.avatar_image || model.cover_image} alt={model.name} /><div><span>{model.name}</span>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}</div></div><span className="admin-upload-label"><Upload />Add media<input ref={element => { inputs.current[model.id] = element }} type="file" accept="image/*,video/*" multiple className="sr-only" onClick={event => event.stopPropagation()} onChange={event => { void handleFiles(model, Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} /></span></button> })}</div></section>
    </>}
  </div></main>
}
