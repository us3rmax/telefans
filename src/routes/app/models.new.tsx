import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save } from 'lucide-react'
import { useState } from 'react'
import { readAdminCreators, writeAdminCreators, type AdminCreator } from '@/data/admin'

export const Route = createFileRoute('/app/models/new')({
  component: NewModelPage,
})

function NewModelPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [slug, setSlug] = useState('')
  const [avatarImage, setAvatarImage] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')

  const save = () => {
    const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (!name.trim() || !handle.trim() || !normalizedSlug || !avatarImage.trim() || !coverImage.trim() || !bio.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    const existing = readAdminCreators()
    if (existing.some((creator) => creator.slug === normalizedSlug)) {
      setError('Já existe um modelo com este slug.')
      return
    }
    const newCreator: AdminCreator = {
      slug: normalizedSlug,
      name: name.trim(),
      handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      avatarImage: avatarImage.trim(),
      coverImage: coverImage.trim(),
      badges: [],
      status: 'Available now',
      bio: bio.trim(),
      stats: { posts: '0', media: '0', live: '0', likes: '0' },
      subscription: { title: 'Limited offer', message: 'New exclusive content every week.' },
      tabs: { postsLabel: 'Posts', mediaLabel: 'Media' },
      published: false,
      updatedAt: new Date().toLocaleDateString('pt-PT'),
    }
    writeAdminCreators([...existing, newCreator])
    void navigate({ to: '/app/models' })
  }

  return <main className="min-h-full bg-muted/20 p-4 md:p-8">
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3"><Link to="/app/models" className="rounded-md p-2 hover:bg-background"><ArrowLeft className="h-5 w-5" /></Link><div><p className="text-sm text-muted-foreground">Administração / Modelos</p><h1 className="text-2xl font-semibold tracking-tight">Nova modelo</h1></div></div>
      <section className="space-y-5 rounded-xl border bg-background p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome *" value={name} onChange={setName} placeholder="Nome público" />
          <Field label="Handle *" value={handle} onChange={setHandle} placeholder="@handle" />
          <Field label="Slug *" value={slug} onChange={setSlug} placeholder="nome-da-modelo" />
          <Field label="Avatar URL *" value={avatarImage} onChange={setAvatarImage} placeholder="https://..." />
        </div>
        <Field label="Capa URL *" value={coverImage} onChange={setCoverImage} placeholder="https://..." />
        <label className="grid gap-2 text-sm font-medium">Bio *<textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} placeholder="Apresentação da modelo" className="rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30" /></label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex justify-end gap-2"><Link to="/app/models" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Cancelar</Link><button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Save className="h-4 w-4" />Guardar rascunho</button></div>
      </section>
    </div>
  </main>
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="grid gap-2 text-sm font-medium">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-md border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/30" /></label>
}
