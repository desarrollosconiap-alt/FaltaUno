'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// ── páginas ──────────────────────────────────────────────────
import HomePage    from '@/components/pages/HomePage'
import RegisterPage from '@/components/pages/RegisterPage'
import LoginPage   from '@/components/pages/LoginPage'
import ModePage    from '@/components/pages/ModePage'
import PlayerPage  from '@/components/pages/PlayerPage'
import OrganizerPage from '@/components/pages/OrganizerPage'
import SearchPage  from '@/components/pages/SearchPage'
import ProfilePage from '@/components/pages/ProfilePage'

// ── nav ──────────────────────────────────────────────────────
import Navbar      from '@/components/Navbar'

export type Page =
  | 'home' | 'register' | 'login' | 'mode'
  | 'player' | 'organizer' | 'search' | 'profile'

export default function App() {
  const [page, setPage]   = useState<Page>('home')
  const [user, setUser]   = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Detectar sesión activa al cargar
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Escuchar cambios de sesión en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  function goTo(p: Page) {
    setPage(p)
    window.scrollTo(0, 0)
  }

  function handleLogout() {
    supabase.auth.signOut()
    setUser(null)
    goTo('home')
  }

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#1a1a2e', color:'#2ecc71', fontSize:'1.2rem', fontFamily:'system-ui' }}>
        Cargando FaltaUno...
      </div>
    )
  }

  const pageProps = { goTo, user, onLogout: handleLogout }

  return (
    <>
      <Navbar page={page} user={user} goTo={goTo} onLogout={handleLogout} />

      {page === 'home'      && <HomePage      {...pageProps} />}
      {page === 'register'  && <RegisterPage  {...pageProps} onSuccess={() => goTo('mode')} />}
      {page === 'login'     && <LoginPage     {...pageProps} onSuccess={() => goTo('mode')} />}
      {page === 'mode'      && <ModePage      {...pageProps} />}
      {page === 'player'    && <PlayerPage    {...pageProps} />}
      {page === 'organizer' && <OrganizerPage {...pageProps} />}
      {page === 'search'    && <SearchPage    {...pageProps} />}
      {page === 'profile'   && <ProfilePage   {...pageProps} />}
    </>
  )
}
