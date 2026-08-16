import { createFileRoute } from '@tanstack/react-router'
import { Activity, BarChart3, Clock3, Coins, Eye, FileImage, Heart, ImagePlus, Loader2, MessageCircle, RefreshCw, Send, TrendingUp, Upload, Users, Video } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getAdminAnalytics, listAdminClients, listAdminCreators, type AdminAnalytics, type AdminClient, uploadCreatorMediaBatch, type Creator } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/')({ component: DashboardHome })

function MetricCard({ label, value, detail, icon: Icon, tone = 'default' }: { label: string; value: number | string; detail?: string; icon: typeof Users; tone?: 'default' | 'green' | 'gold' | 'blue' }) {
  return <div className={`admin-metric-card ${tone}`}><div className="flex items-center justify-between"><span className="admin-metric-icon"><Icon /></span><TrendingUp className="h-4 w-4 opacity-40" /></div><strong>{typeof value === 'number' ? value.toLocaleString('en-US') : value}</strong><span>{label}</span>{detail && <small>{detail}</small>}</div>
}

function ClientRow({ client }: { client: AdminClient }) {
  const name = [client.first_name, client.last_name].filter(Boolean).join(' ') || 'Telegram user'
  const avatar = client.profile_photo_url || client.photo_url
  return <div className="admin-list-row"><div className="admin-avatar">{avatar ? <img src={avatar} alt="" /> : name.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="truncate text-xs text-muted-foreground">{client.username ? `@${client.username}` : `Telegram ID ${client.telegram_id}`}</p></div><div className="text-right text-xs text-muted-foreground"><strong className="block text-foreground">{client.following_count}</strong>Following</div></div>
}

function ActivityChart({ daily }: { daily: AdminAnalytics['daily'] }) {
  const max = Math.max(1, ...daily.map(day => Math.max(day.views, day.users, day.likes)))
  return <div className="admin-chart"><div className="admin-chart-legend"><span><i className="views" />Views</span><span><i className="users" />Users</span><span><i className="likes" />Likes</span></div><div className="admin-chart-bars">{daily.map(day => <div className="admin-chart-day" key={day.label}><div className="admin-bar-stack"><span className="views" style={{ height: `${Math.max(3, day.views / max * 100)}%` }} /><span className="users" style={{ height: `${Math.max(3, day.users / max * 100)}%` }} /><span className="likes" style={{ height: `${Math.max(3, day.likes / max * 100)}%` }} /></div><small>{day.label}</small></div>)}</div></div>
}

function RankedList({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...items.map(item => item.value))
  return <section className="admin-panel"><div className="admin-panel-heading"><h2>{title}</h2><BarChart3 /></div><div className="space-y-3">{items.length ? items.map(item => <div key={item.label}><div className="mb-1 flex justify-between text-xs"><span>{item.label}</span><strong>{item.value.toLocaleString('en-US')}</strong></div><div className="admin-progress"><span style={{ width: `${item.value / max * 100}%` }} /></div></div>) : <p className="text-sm text-muted-foreground">No data available yet.</p>}</div></section>
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
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load the dashboard.') }
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
  return <main className="admin-dashboard"><div className="admin-dashboard-inner">
    <header className="admin-dashboard-header"><div><p className="admin-eyebrow">TeleFans Admin</p><h1>Control panel</h1><p>Monitor creators, users, content and platform growth from one place.</p></div><button type="button" onClick={() => void loadDashboard()} className="admin-refresh"><RefreshCw className="h-4 w-4" />Refresh data</button></header>
    {message && <div className="admin-alert success">{message}</div>}{error && <div className="admin-alert error">{error}</div>}
    {loading || !analytics ? <div className="admin-loading"><Loader2 className="h-5 w-5 animate-spin" />Loading control panel…</div> : <>
      <section className="admin-metrics-grid"><MetricCard label="Telegram users" value={overview?.users ?? 0} detail="Registered accounts" icon={Users} tone="blue" /><MetricCard label="Creator profiles" value={overview?.publishedCreators ?? 0} detail={`${overview?.creators ?? 0} total profiles`} icon={Users} tone="default" /><MetricCard label="Content views" value={overview?.views ?? 0} detail={`${overview?.posts ?? 0} published posts`} icon={Eye} tone="green" /><MetricCard label="Engagement" value={(overview?.likes ?? 0) + (overview?.comments ?? 0)} detail={`${overview?.likes ?? 0} likes · ${overview?.comments ?? 0} comments`} icon={Heart} tone="gold" /><MetricCard label="Reels" value={overview?.reels ?? 0} detail={`${overview?.follows ?? 0} creator follows`} icon={Video} tone="default" /><MetricCard label="Coins issued" value={overview?.coinsIssued ?? 0} detail={`${overview?.referrals ?? 0} successful referrals`} icon={Coins} tone="gold" /></section>
      <section className="admin-panel admin-activity-panel"><div className="admin-panel-heading"><div><h2>Activity overview</h2><p>Real events recorded during the last 14 days.</p></div><Activity /></div><ActivityChart daily={analytics.daily} /></section>
      <div className="admin-two-column"><RankedList title="Top creator profiles" items={analytics.creators.slice(0, 6).map(creator => ({ label: creator.name, value: creator.views }))} /><RankedList title="Traffic sources" items={[{ label: 'Telegram Mini App', value: overview?.users ?? 0 }, { label: 'Profile views', value: overview?.views ?? 0 }, { label: 'Reels views', value: analytics.topContent.filter(item => item.type === 'video').reduce((sum, item) => sum + item.views, 0) }]} /></div>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Creator performance</h2><p>Compare content output, followers and engagement.</p></div><Users /></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Creator</th><th>Posts</th><th>Views</th><th>Likes</th><th>Comments</th><th>Followers</th></tr></thead><tbody>{analytics.creators.map(creator => <tr key={creator.id}><td><div className="flex items-center gap-2"><div className="admin-table-avatar">{creator.avatar_image ? <img src={creator.avatar_image} alt="" /> : creator.name.slice(0, 1)}</div><span>{creator.name}</span></div></td><td>{creator.posts}</td><td>{creator.views}</td><td>{creator.likes}</td><td>{creator.comments}</td><td>{creator.followers}</td></tr>)}</tbody></table></div></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Top content</h2><p>Posts and Reels ranked by recorded engagement.</p></div><FileImage /></div><div className="admin-content-grid">{analytics.topContent.map(item => <div className="admin-content-card" key={item.id}><div><strong>{item.title}</strong><small>{item.creator} · {item.type === 'video' ? 'Reel' : 'Paid Media'}</small></div><div className="admin-content-stats"><span><Eye />{item.views}</span><span><Heart />{item.likes}</span><span><MessageCircle />{item.comments}</span></div></div>)}</div></section>
      <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Most recent users</h2><p>Latest Telegram accounts.</p></div><Clock3 /></div><div className="space-y-2">{recentClients.map(client => <ClientRow key={client.telegram_id} client={client} />)}</div></section><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Most active users</h2><p>Users with the most follows.</p></div><Activity /></div><div className="space-y-2">{activeClients.map(client => <ClientRow key={client.telegram_id} client={client} />)}</div></section></div>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Manage creator media</h2><p>Images become Paid Media; videos are added to Reels.</p></div><Upload /></div><div className="admin-upload-toolbar"><label>Paid Media price<input type="number" min="0" step="1" value={unlockPrice} onChange={event => setUnlockPrice(event.target.value)} /><small>Coins per image</small></label></div><div className="admin-creator-grid">{models.map(model => { const busy = uploadingId === model.id; return <button key={model.id} type="button" disabled={busy} onClick={() => inputs.current[model.id]?.click()} className="admin-creator-card"><div className="admin-creator-image"><img src={model.avatar_image || model.cover_image} alt={model.name} /><div><span>{model.name}</span>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}</div></div><span className="admin-upload-label"><Upload />Add media<input ref={element => { inputs.current[model.id] = element }} type="file" accept="image/*,video/*" multiple className="sr-only" onClick={event => event.stopPropagation()} onChange={event => { void handleFiles(model, Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} /></span></button> })}</div></section>
    </>}
  </div></main>
}
