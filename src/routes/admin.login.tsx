import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FormEvent, useEffect, useState } from 'react'
import { getCurrentAdmin, signInAdmin } from '@/lib/admin-auth'

export const Route = createFileRoute('/admin/login')({
  head: () => ({
    meta: [
      { title: 'Admin Login · TeleFans' },
      { name: 'robots', content: 'noindex, nofollow, noarchive' },
    ],
  }),
  component: AdminLoginPage,
})

function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void getCurrentAdmin().then((admin) => {
      if (admin) void navigate({ to: '/app' })
    })
  }, [navigate])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signInAdmin(email, password)
      await navigate({ to: '/app' })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível iniciar a sessão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">TeleFans Control</p>
        <h1 className="mt-3 text-2xl font-semibold">Acesso administrativo</h1>
        <p className="mt-2 text-sm text-white/60">Área privada. O acesso é apenas por conta administrativa autorizada.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm"><span className="mb-1 block text-white/70">E-mail</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-lg border border-white/15 bg-black/20 px-3 outline-none focus:border-cyan-300" autoComplete="username" /></label>
          <label className="block text-sm"><span className="mb-1 block text-white/70">Palavra-passe</span><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-lg border border-white/15 bg-black/20 px-3 outline-none focus:border-cyan-300" autoComplete="current-password" /></label>
          {error && <p role="alert" className="rounded-lg border border-red-300/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
          <button type="submit" disabled={busy} className="h-11 w-full rounded-lg bg-cyan-300 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">{busy ? 'A validar…' : 'Entrar no painel'}</button>
        </form>
      </section>
    </main>
  )
}
