import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Telescope' },
      { name: 'description', content: 'Telescope' },
      { name: 'theme-color', content: '#1c1d1f' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, interactive-widget=overlays-content' },
    ],
  }),
  component: Home,
})

/* ─── Seed data — matches the 20 influencers from telescope.me ─── */
const INFLUENCERS = [
  { name: 'Brandi Andrews', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/1ee6e615-cd85-4c86-2a35-cb9943d60900/public' },
  { name: 'Chimocurves', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/9884e5c0-b48f-497f-99e4-8b035fd99300/public' },
  { name: 'Ava Louise', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/4783fcc1-86b6-45b9-7da9-79bf793edc00/public' },
  { name: 'Alex Mucci', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/437fa29e-489c-4a08-3439-38ea8137d700/public' },
  { name: 'Helena Priebe', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/32c9232c-8185-4030-cdb5-1aec628a2300/public' },
  { name: 'Savannah Bond', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/aec21118-9d2e-41dc-0922-d0c4a1d7c700/public' },
  { name: 'Morgan Lane', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/3f1ad90e-4945-4508-6fa8-a1a4cbc19600/public' },
  { name: 'Francety', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/3a8b6205-b1ae-415f-cf15-56206c824600/public' },
  { name: 'Frances Bentley', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/404e7eec-1ce5-4d73-6c21-fddbf856c900/public' },
  { name: 'Sophie Dee', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/4b39f77a-da47-4978-3326-7c358dcd7000/public' },
  { name: 'Bonnie Locket', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/5e266abb-d436-4e80-a69d-0485af2ba100/public' },
  { name: 'Bunni Emmie', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/03249cd9-4dc0-4310-b431-40c43cf85a00/public' },
  { name: 'Yvonne Bar', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/fa7baef1-fd87-4232-9e32-9d576e892700/public' },
  { name: 'Pamela Alexandra', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/ce5ee9ad-f84c-48b5-51a5-de57281fc000/public' },
  { name: 'Chloe May', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/3a8ba509-009d-41d7-9759-00e120d5ce00/public' },
  { name: 'Nikki Benz', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/6bb5620f-442d-4f1e-8525-0163cd80c500/public' },
  { name: 'Alva Jay', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/0ad8b436-e032-4e5f-6f8d-f079e4e3ee00/public' },
  { name: 'Forrest Smith', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/2d3f6a4f-06c5-4c82-0f4e-dfde0c558a00/public' },
  { name: 'Claudia Tihan', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/d322dc17-8f9a-4204-a786-25685314e000/public' },
  { name: 'Rachel Mary', img: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/29d6f384-6c23-4ecc-2ce8-5b5d27b5a300/public' },
]

const TABS = ['🔥 Trending', '💎 Most Popular', '💫 New']
const NAV_ITEMS = [
  { id: 'explore', label: 'Explore', active: true },
  { id: 'reels', label: 'Reels', active: false },
  { id: 'profile', label: 'Profile', active: false },
]

function Home() {
  const [activeTab, setActiveTab] = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <div className="relative overflow-x-clip bg-[#1c1d1f]" style={{ minHeight: '100dvh' }}>
      {/* ─── Main content ─── */}
      <main className="relative mx-auto max-w-7xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col overflow-x-clip" style={{ height: '100dvh', paddingTop: 0, paddingBottom: 0 }}>
          {/* Header — Telescope logo */}
          <header className="relative z-10 flex h-[46px] shrink-0 items-center justify-center">
            <TelescopeLogo />
          </header>

          {/* Scrollable content */}
          <div className="hide-scrollbar min-h-0 w-full flex-1 overflow-x-hidden overflow-y-scroll pb-32">
            {/* Explore heading + grid toggle */}
            <div className="pl-[18px] pr-[8px] min-[761px]:px-6">
              <div className="flex h-[44px] items-center justify-between">
                <h2 className="text-[22px] font-semibold leading-[normal] text-white">Explore</h2>
                <button
                  type="button"
                  aria-label="Switch to list view"
                  className="flex h-[44px] w-[44px] items-center justify-center rounded-full transition hover:bg-white/[0.06]"
                >
                  <GridIcon />
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="px-[18px] min-[761px]:px-6">
              <div className="hide-scrollbar -mx-[18px] flex items-center gap-1 overflow-auto px-[18px] min-[761px]:-mx-6 min-[761px]:px-6">
                {/* Search */}
                <div
                  className={`relative flex h-9 items-center overflow-hidden rounded-full bg-[#313134] px-2 shrink-0 cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    searchFocused ? 'w-[160px] min-w-[160px]' : 'w-9 min-w-9'
                  }`}
                >
                  <SearchIcon />
                  <input
                    placeholder="name or username"
                    className="native-font-size relative z-[2] w-full border-none bg-transparent pl-[30px] text-[14px] font-normal leading-[18px] tracking-[-0.07px] text-white outline-none placeholder:text-white"
                    type="text"
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                  />
                </div>

                {/* Tab pills */}
                {TABS.map((tab, i) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={`flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-[14px] font-semibold leading-5 outline-none transition-colors ${
                      activeTab === i
                        ? 'border-white bg-white text-[#313134]'
                        : 'border-[#313134] bg-[#313134] text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Influencer grid */}
              <div className="grid gap-1 py-3 min-[761px]:gap-2 min-[761px]:py-4 grid-cols-2 min-[761px]:grid-cols-4">
                {INFLUENCERS.map((inf, i) => (
                  <button
                    key={inf.name}
                    type="button"
                    className="relative h-[276px] cursor-pointer overflow-hidden rounded-[12px] text-left animate-fade-in min-[761px]:h-[240px] transition-transform duration-200 active:scale-[0.98] hover:scale-[1.02]"
                    style={{ animationDelay: `${Math.min(i * 40, 280)}ms` }}
                  >
                    <img
                      alt={inf.name}
                      loading="eager"
                      className="h-full w-full object-cover"
                      src={inf.img}
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      aria-hidden="true"
                      style={{ background: 'linear-gradient(181deg, rgba(0, 0, 0, 0) 57.84%, rgba(0, 0, 0, 0.4) 99.4%)' }}
                    />
                    <div className="absolute bottom-[6px] left-[6px] flex h-[38px] items-center justify-center rounded-[32px] bg-black/20 px-3 backdrop-blur-[3px]">
                      <span className="whitespace-nowrap text-[14px] font-medium text-white">
                        {inf.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Bottom Navigation — glass-morphism pill ─── */}
      <BottomNav />
    </div>
  )
}

/* ─── Telescope SVG Logo ─── */
function TelescopeLogo() {
  return (
    <svg
      viewBox="0 0 541.33 141.73"
      className="mt-[2px] h-auto w-[120px]"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#a)">
        <path d="M46.74 46.15s-1.01 24.04-1.8 38.73c-.63 11.74-1.08 17.11-1.91 20.85a11.36 11.36 0 0 1-7.54 7.9c-2.68.95-8.58 1.68-18.02 1.68-10.18 0-14.18-.62-17.21-1.72-4.97-1.8-8.68-6.88-8.68-12.68v-1.8c0-6.33 3.17-11.15 7.67-12.11 3.07-.66 9.65-.93 24.56-.93h15.48M46.74 46.15c-1.26-9.78-3.6-17.04-7.1-21.07-4.85-5.58-14.32-9.44-24.74-7.43-5.71 1.1-10.33 3.85-14.06 7.08C-3 28.68-3.38 34.06-.89 40.72c2.57 6.88 8.72 11.61 17.24 11.61h14.96" stroke="#fff" strokeWidth="2.88" strokeMiterlimit="10"/>
        <path d="M46.52 41.84c-2.16-4.28-5.83-6.48-10.04-6.48-6.3 0-9.53 4.64-9.53 7.19 0 6.7 18.25.66 20.59 12.6.91 4.66-.84 9.1-5.11 10.9" stroke="#fff" strokeWidth="2.88" strokeMiterlimit="10"/>
        <path d="M62.3 95.92V45.28h.36l28.46 50.64V45.28h4.86v56.88H95.6L67.16 51.52v50.64h-4.86Z" fill="#fff"/>
        <path d="M104.34 95.56h46.85v4.68h-46.85v-4.68Zm51.73-23.4H109.2l46.87-23.4v4.68l-41.87 20.88h41.87v-2.16Z" fill="#fff"/>
        <path d="M164.82 95.56h4.68V68.68h.36l29.49 31.56h5.58V45.28h-4.68v26.64h-.36l-29.49-31.56h-5.58v55.2Z" fill="#fff"/>
        <path d="M223.78 95.56h4.68V45.28h-4.68v50.28ZM252.22 95.56h4.86l-12.96-41.4h-.36l-15.12 47.16h-4.86l-13.86-41.4h-.36l-14.04 41.4h-4.86l18-55.2h4.86l14.22 42.12h.36l14.58-42.12h4.86l9 27.72Z" fill="#fff"/>
        <path d="M260.34 56.44c3.6-.36 7.2-.72 10.8-.72 9.72 0 16.2 5.76 16.2 14.4v25.56h-4.68V70.48c0-6.48-4.32-10.08-11.16-10.08-3.6 0-7.56.36-11.16.72v34.56h-4.68V56.44h4.68Z" fill="#fff"/>
        <path d="M304.68 42.04h4.68v53.64h-4.68V42.04ZM333.12 87.52c-2.52 3.6-6.48 5.4-11.52 5.4-8.64 0-13.68-5.76-13.68-14.04s5.04-14.04 13.68-14.04c5.04 0 9 1.8 11.52 5.4v-6.12c-2.88-3.96-7.2-6.12-12.24-6.12-10.44 0-17.64 7.56-17.64 20.88s7.2 20.88 17.64 20.88c5.04 0 9.36-2.16 12.24-6.12v-5.4Z" fill="#fff"/>
        <path d="M343.68 82.48c0-9.72 7.2-17.28 17.28-17.28s17.28 7.56 17.28 17.28-7.2 17.64-17.28 17.64-17.28-7.56-17.28-17.64Zm30.24 0c0-7.56-5.04-12.96-12.96-12.96s-12.96 5.4-12.96 12.96 5.04 13.32 12.96 13.32 12.96-5.76 12.96-13.32Z" fill="#fff"/>
        <path d="M392.7 68.44c3.6-.36 7.2-.72 10.8-.72 9.72 0 16.2 5.76 16.2 14.4v25.56h-4.68V82.48c0-6.48-4.32-10.08-11.16-10.08-3.6 0-7.56.36-11.16.72v34.56h-4.68V68.44h4.68Z" fill="#fff"/>
        <path d="M436.86 47.68h4.68v47.88h-4.68V47.68Z" fill="#fff"/>
        <path d="M505 64.12c-3.24-2.52-7.56-4.32-12.24-4.32-3.96 0-7.56 1.08-10.44 3.24-2.88 2.16-4.32 4.68-4.32 8.28 0 5.4 4.32 8.64 13.32 12.24 10.08 3.96 14.76 9 14.76 16.2s-5.76 13.68-16.2 13.68c-5.04 0-9.72-1.44-13.68-4.32v-6.12c3.6 2.88 8.28 4.68 13.32 4.68 4.68 0 8.64-1.44 11.52-4.32 2.88-2.88 3.96-5.76 3.96-9 0-6.12-4.32-9.72-13.68-13.32-9.72-3.6-14.4-8.64-14.4-15.84s5.4-13.32 15.12-13.32c4.68 0 9 1.44 12.6 3.96l-2.88 5.04Z" fill="#fff"/>
        <path d="M525.49 82.48c0-9.72 7.2-17.28 17.64-17.28 4.68 0 8.64 1.8 11.88 5.04l-3.24 3.6c-2.52-2.52-5.4-3.96-8.64-3.96-7.2 0-12.96 5.4-12.96 12.96s5.76 13.32 12.96 13.32c3.24 0 6.12-1.44 8.64-3.96l3.24 3.6c-3.24 3.24-7.2 5.04-11.88 5.04-10.44 0-17.64-7.56-17.64-17.64Z" fill="#fff"/>
      </g>
      <defs>
        <clipPath id="a"><path fill="#fff" d="M0 0h541.33v141.73H0z"/></clipPath>
      </defs>
    </svg>
  )
}

/* ─── Grid icon ─── */
function GridIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3V21M7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3Z" stroke="#6B6B79" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ─── Search icon ─── */
function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="pointer-events-none absolute left-2 h-[18px] w-[18px] text-white"
      aria-hidden="true"
    >
      <path d="M16.5 16.5L12.875 12.875M8.16667 4C10.4679 4 12.3333 5.86548 12.3333 8.16667M14.8333 8.16667C14.8333 11.8486 11.8486 14.8333 8.16667 14.8333C4.48477 14.8333 1.5 11.8486 1.5 8.16667C1.5 4.48477 4.48477 1.5 8.16667 1.5C11.8486 1.5 14.8333 4.48477 14.8333 8.16667Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ─── Bottom Navigation — glass-morphism pill with sliding indicator ─── */
function BottomNav() {
  const [activeNav, setActiveNav] = useState(0)

  return (
    <div
      className="isolate fixed left-1/2 z-30 flex h-[62px] w-[min(260px,calc(100%-24px))] overflow-hidden rounded-full p-1"
      style={{
        top: 'calc(100dvh - 62px - max(20px, env(safe-area-inset-bottom, 0px)))',
        transform: 'translate3d(-50%, 0, 0)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 0.5px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Background glass layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] border-[0.5px] border-white/[0.08]"
        style={{
          background: 'linear-gradient(rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.03) 22%, rgba(0, 0, 0, 0.22) 100%), rgba(7, 7, 9, 0.23)',
          backdropFilter: 'blur(36px) saturate(150%) brightness(0.66)',
          transform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(255,255,255,0.04)',
        }}
      />

      {/* Sliding active indicator */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc((100%-8px)/3)] rounded-full border-[0.5px] border-white/[0.12] will-change-transform"
        style={{
          background: 'linear-gradient(rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.035) 100%), rgba(14, 14, 16, 0.14)',
          backdropFilter: 'blur(19px) saturate(145%) brightness(0.8)',
          boxShadow: 'rgba(0, 0, 0, 0.25) 0px 2px 12px, rgba(255, 255, 255, 0.15) 0px 0.5px 0px inset',
          transform: `translate3d(${activeNav * 100}%, 0, 0)`,
          transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />

      {/* Tab: Explore */}
      <div className="relative z-[1] flex min-w-0 flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => setActiveNav(0)}
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full transition-transform duration-150 active:scale-90"
        >
          <div
            className="relative z-[1] flex flex-col items-center justify-center gap-1 leading-none will-change-transform"
            style={{
              transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out',
              transform: activeNav === 0 ? 'scale(1.06) translateY(-1px)' : 'scale(0.92) translateY(0px)',
              opacity: activeNav === 0 ? 1 : 0.56,
            }}
          >
            <HomeIcon />
            <span className="text-[10px] font-semibold leading-none text-white">Explore</span>
          </div>
        </button>
      </div>

      {/* Tab: Reels */}
      <div className="relative z-[1] flex min-w-0 flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => setActiveNav(1)}
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full transition-transform duration-150 active:scale-90"
        >
          <div
            className="relative z-[1] flex flex-col items-center justify-center gap-1 leading-none will-change-transform"
            style={{
              transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out',
              transform: activeNav === 1 ? 'scale(1.06) translateY(-1px)' : 'scale(0.92) translateY(0px)',
              opacity: activeNav === 1 ? 1 : 0.56,
            }}
          >
            <ReelsIcon />
            <span className="text-[10px] font-semibold leading-none text-white">Reels</span>
          </div>
        </button>
      </div>

      {/* Tab: Profile */}
      <div className="relative z-[1] flex min-w-0 flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => setActiveNav(2)}
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full transition-transform duration-150 active:scale-90"
        >
          <div
            className="relative z-[1] flex flex-col items-center justify-center gap-1 leading-none will-change-transform"
            style={{
              transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out',
              transform: activeNav === 2 ? 'scale(1.06) translateY(-1px)' : 'scale(0.92) translateY(0px)',
              opacity: activeNav === 2 ? 1 : 0.56,
            }}
          >
            <ProfileIcon />
            <span className="text-[10px] font-semibold leading-none text-white">Profile</span>
          </div>
        </button>
      </div>
    </div>
  )
}

/* ─── Nav icons ─── */
function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white" aria-hidden="true">
      <path d="M8 17.0002H16M11.0177 2.76424L4.23539 8.03937C3.78202 8.39199 3.55534 8.5683 3.39203 8.7891C3.24737 8.98469 3.1396 9.20503 3.07403 9.4393C3 9.70376 3 9.99094 3 10.5653V17.8002C3 18.9203 3 19.4804 3.21799 19.9082C3.40973 20.2845 3.71569 20.5905 4.09202 20.7822C4.51984 21.0002 5.07989 21.0002 6.2 21.0002H17.8C18.9201 21.0002 19.4802 21.0002 19.908 20.7822C20.2843 20.5905 20.5903 20.2845 20.782 19.9082C21 19.4804 21 18.9203 21 17.8002V10.5653C21 9.99094 21 9.70376 20.926 9.4393C20.8604 9.20503 20.7526 8.98469 20.608 8.7891C20.4447 8.5683 20.218 8.39199 19.7646 8.03937L12.9823 2.76424C12.631 2.49099 12.4553 2.35436 12.2613 2.30184C12.0902 2.2555 11.9098 2.2555 11.7387 2.30184C11.5447 2.35436 11.369 2.49099 11.0177 2.76424Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ReelsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white" aria-hidden="true">
      <path d="M20.5814 7.58168C20.4734 7.15026 20.2534 6.75497 19.9438 6.43575C19.6341 6.11652 19.2457 5.88467 18.8178 5.7636C17.2543 5.3818 13 5.3818 13 5.3818C13 5.3818 6.7458 5.3818 5.18225 5.79996C4.75432 5.92103 4.36591 6.15289 4.05626 6.47211C3.74661 6.79134 3.52669 7.18662 3.41871 7.61805C3.13255 9.20483 2.99258 10.8145 3.00055 12.4269C2.99035 14.0514 3.13033 15.6734 3.41871 17.2721C3.53775 17.6901 3.76261 18.0704 4.07153 18.3761C4.38046 18.6818 4.76302 18.9027 5.18225 19.0175C6.7458 19.4356 13 19.4356 13 19.4356C13 19.4356 17.2543 19.4356 18.8178 19.0175C19.2457 18.8964 19.6341 18.6645 19.9438 18.3453C20.2534 18.0261 20.4734 17.6308 20.5814 17.1994C20.8653 15.6245 21.0053 14.0271 20.9995 12.4269C21.0097 10.8024 20.8697 9.18042 20.5814 7.58168Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.75007 9.88345C9.75007 9.40616 9.75008 9.16752 9.84982 9.03429C9.93674 8.91819 10.0698 8.84555 10.2145 8.83521C10.3805 8.82336 10.5812 8.95241 10.9827 9.2105L14.9255 11.7452C15.2739 11.9691 15.448 12.0811 15.5082 12.2235C15.5608 12.3479 15.5608 12.4883 15.5082 12.6127C15.448 12.7551 15.2739 12.8671 14.9255 13.0911L10.9827 15.6257C10.5812 15.8838 10.3805 16.0129 10.2145 16.001C10.0698 15.9907 9.93674 15.918 9.84982 15.8019C9.75008 15.6687 9.75007 15.4301 9.75007 14.9528V9.88345Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white" aria-hidden="true">
      <path d="M11.9999 15C8.82977 15 6.01065 16.5306 4.21585 18.906C3.82956 19.4172 3.63641 19.6728 3.64273 20.0183C3.64761 20.2852 3.81521 20.6219 4.02522 20.7867C4.29704 21 4.67372 21 5.42708 21H18.5726C19.326 21 19.7027 21 19.9745 20.7867C20.1845 20.6219 20.3521 20.2852 20.357 20.0183C20.3633 19.6728 20.1701 19.4172 19.7839 18.906C17.9891 16.5306 15.1699 15 11.9999 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.9999 12C14.4851 12 16.4999 9.98528 16.4999 7.5C16.4999 5.01472 14.4851 3 11.9999 3C9.51457 3 7.49985 5.01472 7.49985 7.5C7.49985 9.98528 9.51457 12 11.9999 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
