import { createFileRoute } from '@tanstack/react-router'
import { CreatorForm } from '@/components/admin/CreatorForm'

export const Route = createFileRoute('/app/models/new')({ component: NewModelPage })

function NewModelPage() {
  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm text-muted-foreground">Administration / Creators</p><h1 className="text-2xl font-semibold tracking-tight">New creator</h1><p className="mt-1 text-sm text-muted-foreground">Create a draft profile and publish it after validating the details.</p></div><CreatorForm /></div></main>
}
