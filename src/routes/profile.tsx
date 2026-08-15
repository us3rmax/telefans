import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Ellipsis, Heart, Share2 } from 'lucide-react'
import { useState } from 'react'
import '../telescope.css'

const kaylaHero = 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/8e1e169a-09c9-4e66-f7be-b42f59cff800/public'
const kaylaAvatar = 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/437fa29e-489c-4a08-3439-38ea8137d700/public'

function Verified() {
  return <span className="verified-mark" aria-label="Verificada"><Check /></span>
}

function ProfileNav() {
  return <nav className="profile-bottom-nav" aria-label="Navegação do perfil">
    <Link to="/" className="profile-nav-icon" aria-label="Voltar para explorar"><span className="home-glyph" /></Link>
    <button type="button" className="profile-nav-icon" aria-label="Mais opções"><Ellipsis /></button>
  </nav>
}

export function ProfilePage() {
  const [expanded, setExpanded] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [shared, setShared] = useState(false)

  const shareProfile = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href)
      setShared(true)
      window.setTimeout(() => setShared(false), 1800)
    } catch {
      setShared(true)
      window.setTimeout(() => setShared(false), 1800)
    }
  }

  return <main className="profile-page">
    <div className="profile-frame">
      <header className="profile-topbar">
        <Link to="/" className="profile-back" aria-label="Voltar"><ArrowLeft /></Link>
        <div className="profile-top-title"><strong>Kayla <Verified /></strong><span><i />Disponível agora</span></div>
        <button type="button" className="profile-share-top" onClick={shareProfile} aria-label="Compartilhar perfil"><Share2 /></button>
      </header>

      <div className="profile-scroll">
        <section className="profile-cover-wrap">
          <img className="profile-cover" src={kaylaHero} alt="Kayla" />
          <div className="profile-avatar-wrap"><img src={kaylaAvatar} alt="Foto de Kayla" className="profile-avatar" /><span className="online-dot" /></div>
          <button type="button" onClick={shareProfile} className="profile-share-fab" aria-label="Compartilhar perfil"><Share2 /></button>
        </section>

        <section className="profile-intro">
          <h1>Kayla <Verified /></h1>
          <p className="profile-handle">@kaylabumsss <b>•</b> <span><i />Disponível agora</span></p>
          <p className={`profile-bio ${expanded ? 'is-expanded' : ''}`}>Hello! My name is kayla. I just turned 18 so im finally old enough for this site! I'm excited to explore myself with you :)</p>
          {!expanded && <span className="bio-more">...</span>}
          <button className="more-info" type="button" onClick={() => setExpanded(!expanded)}>{expanded ? 'Mostrar menos' : 'Mais informações'}</button>
        </section>

        <section className="subscription-card">
          <span className="section-kicker">ASSINATURA</span>
          <h2>Oferta limitada: 75% de desconto nos primeiros 31 dias!</h2>
          <div className="subscriber-note"><img src={kaylaAvatar} alt="" /> <span>75% for the first 10 people that sub! ♡ Come see all my new content!</span></div>
          <button type="button" className={`subscribe-button ${subscribed ? 'is-subscribed' : ''}`} onClick={() => setSubscribed(!subscribed)}><strong>{subscribed ? 'ASSINADO' : 'ASSINAR'}</strong><span>{subscribed ? 'Acesso liberado' : '$3 por 31 dias'}</span></button>
          <p className="normal-price">Preço Normal <strong>$12</strong> /mês</p>
        </section>

        <section className="profile-stats" aria-label="Estatísticas do perfil"><div><strong>216</strong><span>Postagens</span></div><div><strong>217</strong><span>Mídia</span></div></section>
        <section className="profile-preview-grid" aria-label="Prévia de conteúdo"><img src={kaylaHero} alt="Prévia de conteúdo de Kayla" /><img src={kaylaAvatar} alt="Prévia de conteúdo de Kayla" /><img src={kaylaHero} alt="Prévia de conteúdo de Kayla" /></section>
        <div className="profile-bottom-space" />
      </div>
      <ProfileNav />
      {shared && <div className="share-toast"><Heart /> Link copiado</div>}
    </div>
  </main>
}

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [{ title: 'Kayla · Telescope' }, { name: 'description', content: 'Veja o perfil de Kayla no Telescope.' }] }),
  component: ProfilePage,
})
