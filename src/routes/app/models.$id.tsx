import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CreatorForm } from '@/components/admin/CreatorForm'
import { getAdminCreator, type Creator } from '@/lib/admin-repository'

export const Route = createFileRoute('/app/models/$id')({ component: EditModelPage })

function EditModelPage() {
  const { id } = Route.useParams()
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { void getAdminCreator(id).then(setCreator).catch((err) => setError(err instanceof Error ? err.message : 'Could not load the creator.')).finally(() => setLoading(false)) }, [id])
  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm text-muted-foreground">Administration / Creators</p><h1 className="text-2xl font-semibold tracking-tight">Edit creator</h1></div>{loading && <p className="text-sm text-muted-foreground">Loading…</p>}{error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}{!loading && creator && <CreatorForm creator={creator} />}{!loading && !creator && !error && <p className="text-sm text-muted-foreground">Creator not found.</p>}</div></main>
}
