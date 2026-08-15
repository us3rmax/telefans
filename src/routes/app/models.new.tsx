import { createFileRoute } from '@tanstack/react-router'
import { CreatorForm } from '@/components/admin/CreatorForm'

export const Route = createFileRoute('/app/models/new')({ component: NewModelPage })

function NewModelPage() {
  return <main className="min-h-full bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm text-muted-foreground">Administração / Modelos</p><h1 className="text-2xl font-semibold tracking-tight">Nova modelo</h1><p className="mt-1 text-sm text-muted-foreground">Crie um perfil em rascunho e publique-o após validar os dados.</p></div><CreatorForm /></div></main>
}
