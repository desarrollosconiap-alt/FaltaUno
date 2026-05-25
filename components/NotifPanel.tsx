'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  open: boolean
  userId: string
  onClose: () => void
  onRead: () => void
  onReadAll: () => void
}

interface Notif {
  id: string
  tipo: string
  titulo: string
  cuerpo: string
  icono: string
  leida: boolean
  created_at: string
}

export default function NotifPanel({ open, userId, onClose, onRead, onReadAll }: Props) {
  const [notifs, setNotifs] = useState<Notif[]>([])

  useEffect(() => {
    if (!open) return
    loadNotifs()
  }, [open])

  // Tiempo real: nuevas notifs
  useEffect(() => {
    const channel = supabase
      .channel('notif-panel-' + userId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifs(prev => [payload.new as Notif, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function loadNotifs() {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setNotifs(data)
  }

  async function marcarLeida(id: string) {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    onRead()
  }

  async function marcarTodas() {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('user_id', userId)
      .eq('leida', false)
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
    onReadAll()
  }

  function fmtTime(ts: string) {
    const d = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diff < 1)  return 'Ahora mismo'
    if (diff < 60) return `Hace ${diff} min`
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`
    return d.toLocaleDateString('es-CL')
  }

  if (!open) return null

  return (
    <>
      {/* Overlay para cerrar al hacer clic fuera */}
      <div style={styles.overlay} onClick={onClose} />

      <div style={styles.panel}>
        <div style={styles.header}>
          <span>🔔 Notificaciones</span>
          <button style={styles.markBtn} onClick={marcarTodas}>
            Marcar leídas
          </button>
        </div>

        <div style={styles.list}>
          {notifs.length === 0 && (
            <div style={styles.empty}>No tienes notificaciones aún 🔔</div>
          )}

          {notifs.map(n => (
            <div
              key={n.id}
              style={{ ...styles.item, ...(n.leida ? {} : styles.unread) }}
              onClick={() => !n.leida && marcarLeida(n.id)}
            >
              <div style={styles.icon}>{n.icono}</div>
              <div style={styles.body}>
                <strong style={styles.title}>{n.titulo}</strong>
                <div style={styles.cuerpo}>{n.cuerpo}</div>
                <div style={styles.time}>{fmtTime(n.created_at)}</div>
              </div>
              {!n.leida && <div style={styles.dot} />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, zIndex: 149 },
  panel:   {
    position: 'fixed',
    top: 56,
    right: 16,
    width: 320,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,.2)',
    zIndex: 150,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '80vh',
    overflow: 'hidden',
  },
  header:  {
    background: '#1a1a2e',
    color: '#fff',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontWeight: 700,
    fontSize: '.88rem',
    flexShrink: 0,
  },
  markBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '.73rem',
    textDecoration: 'underline',
  },
  list:    { overflowY: 'auto', flex: 1 },
  empty:   {
    padding: 28,
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '.85rem',
  },
  item:    {
    padding: '12px 14px',
    borderBottom: '1px solid #e0e6ed',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    cursor: 'pointer',
    transition: '.15s',
  },
  unread:  { background: '#f0fdf4' },
  icon:    { fontSize: '1.2rem', flexShrink: 0, marginTop: 1 },
  body:    { fontSize: '.79rem', lineHeight: 1.4, flex: 1 },
  title:   { fontWeight: 700, display: 'block', marginBottom: 1 },
  cuerpo:  { color: '#6c757d' },
  time:    { fontSize: '.68rem', color: '#6c757d', marginTop: 2 },
  dot:     {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#2ecc71',
    flexShrink: 0,
    marginTop: 4,
  },
}