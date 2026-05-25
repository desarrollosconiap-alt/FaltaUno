'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Page } from '@/app/page'
import { supabase } from '@/lib/supabase'
import NotifPanel from './NotifPanel'

interface Props {
  page: Page
  user: User | null
  goTo: (p: Page) => void
  onLogout: () => void
}

export default function Navbar({ page, user, goTo, onLogout }: Props) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [unread, setUnread]       = useState(0)
  const [initials, setInitials]   = useState('U')
  const [displayName, setDisplayName] = useState('')

  // Cargar datos del perfil y notificaciones no leídas
  useEffect(() => {
    if (!user) return
    loadProfile()
    loadUnread()

    // Suscripción en tiempo real a nuevas notificaciones
    const channel = supabase
      .channel('navbar-notifs-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `user_id=eq.${user.id}`
      }, () => {
        setUnread(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function loadProfile() {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('nombre, apellido')
      .eq('id', user.id)
      .single()
    if (data) {
      const name = `${data.nombre} ${data.apellido}`
      setDisplayName(`${data.nombre} ${data.apellido[0]}.`)
      setInitials(
        name
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      )
    }
  }

  async function loadUnread() {
    if (!user) return
    const { count } = await supabase
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('leida', false)
    setUnread(count || 0)
  }

  return (
    <>
      <nav style={styles.nav}>
        {/* Logo */}
        <div style={styles.logo} onClick={() => goTo('home')}>
          Falta<span style={styles.logoSpan}>Uno</span>
        </div>

        {/* Guest */}
        {!user && (
          <div style={styles.navR}>
            <button style={styles.nbOutline} onClick={() => goTo('login')}>
              Iniciar sesión
            </button>
            <button style={styles.nbSolid} onClick={() => goTo('register')}>
              Registrarse
            </button>
          </div>
        )}

        {/* Logged in */}
        {user && (
          <div style={styles.navR}>
            {/* Campana */}
            <button
              style={styles.bell}
              onClick={() => setNotifOpen(o => !o)}
              id="bell-btn"
            >
              🔔
              {unread > 0 && (
                <span style={styles.badge}>{unread > 9 ? '9+' : unread}</span>
              )}
            </button>

            {/* Avatar + nombre */}
            <div style={styles.userWrap} onClick={() => goTo('profile')}>
              <div style={styles.avatarSm}>{initials}</div>
              <span style={styles.userName}>{displayName}</span>
            </div>

            <button style={styles.nbOutline} onClick={onLogout}>
              Salir
            </button>
          </div>
        )}
      </nav>

      {/* Panel notificaciones */}
      {user && (
        <NotifPanel
          open={notifOpen}
          userId={user.id}
          onClose={() => setNotifOpen(false)}
          onRead={() => setUnread(prev => Math.max(0, prev - 1))}
          onReadAll={() => setUnread(0)}
        />
      )}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  nav:       {
    background: '#1a1a2e',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo:      {
    color: '#2ecc71',
    fontSize: '1.4rem',
    fontWeight: 800,
    cursor: 'pointer',
  },
  logoSpan:  { color: '#fff' },
  navR:      { display: 'flex', gap: 8, alignItems: 'center' },
  nbOutline: {
    background: 'transparent',
    border: '1.5px solid #2ecc71',
    color: '#2ecc71',
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '.83rem',
    fontWeight: 600,
  },
  nbSolid:   {
    background: '#2ecc71',
    border: '1.5px solid #2ecc71',
    color: '#1a1a2e',
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '.83rem',
    fontWeight: 600,
  },
  bell:      {
    position: 'relative',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '4px 8px',
    borderRadius: 8,
    background: 'none',
    border: 'none',
    color: '#fff',
  },
  badge:     {
    position: 'absolute',
    top: 0,
    right: 2,
    background: '#e74c3c',
    color: '#fff',
    borderRadius: '50%',
    width: 16,
    height: 16,
    fontSize: '.6rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userWrap:  {
    color: '#fff',
    fontSize: '.83rem',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  avatarSm:  {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: '#2ecc71',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#1a1a2e',
    fontSize: '.75rem',
  },
  userName:  {
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
}