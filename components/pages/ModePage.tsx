'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Page } from '@/app/page'

interface Props {
  goTo: (p: Page) => void
  user: User | null
}

interface Profile {
  nombre: string
  apellido: string
  avatar: string
  tipo_usuario: string
  ciudad: string
  region: string
  deportes: string[]
}

export default function ModePage({ goTo, user }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { goTo('login'); return }
    loadProfile()
  }, [user])

  async function loadProfile() {
    if (!user) return
    setLoading(true)
    try {
      // Cargar perfil + deportes en paralelo
      const [{ data: prof }, { data: deps }] = await Promise.all([
        supabase.from('profiles').select('nombre,apellido,avatar,tipo_usuario,ciudad,region').eq('id', user.id).single(),
        supabase.from('deportes_usuario').select('deporte').eq('user_id', user.id),
      ])
      if (prof) {
        setProfile({
          ...prof,
          deportes: deps?.map((d: any) => d.deporte) || [],
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={S.loading}>Cargando tu perfil...</div>
  if (!profile) return <div style={S.loading}>No se encontró el perfil.</div>

  const isPlayer = profile.tipo_usuario === 'Player' || profile.tipo_usuario === 'Ambos'
  const isOrg    = profile.tipo_usuario === 'Organizador' || profile.tipo_usuario === 'Ambos'
  const initials = `${profile.nombre[0] || ''}${profile.apellido[0] || ''}`.toUpperCase()
  const deportePrincipal = profile.deportes[0] || '⚽ Fútbol'

  return (
    <div style={S.page}>
      {/* Header con perfil */}
      <div style={S.header}>
        <div style={S.profileWrap}>
          {/* Avatar */}
          <div style={S.avLg} onClick={() => goTo('profile')} title="Ver mi perfil">
            {profile.avatar || initials}
          </div>
          <div style={S.profileInfo}>
            <div style={S.profileName}>
              {profile.nombre} {profile.apellido}
              <span style={S.badge}>{profile.tipo_usuario}</span>
            </div>
            <div style={S.profileSub}>
              {deportePrincipal} · 📍 {profile.ciudad || profile.region || 'Sin ubicación'}
            </div>
            {profile.deportes.length > 1 && (
              <div style={S.deportesTags}>
                {profile.deportes.slice(0,4).map(d => (
                  <span key={d} style={S.deporteTag}>{d.split(' ')[0]} {d.split(' ').slice(1).join(' ')}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div style={S.body}>
        <h3 style={S.question}>¿Qué quieres hacer hoy?</h3>

        <div style={S.cards}>
          {/* Quiero jugar */}
          <div
            style={{ ...S.modeCard, ...(isPlayer ? {} : S.disabled) }}
            onClick={() => isPlayer && goTo('player')}
            title={!isPlayer ? 'Solo disponible para Players' : ''}
          >
            <div style={S.modeIcon}>🏃</div>
            <h3 style={S.modeTitle}>Quiero jugar</h3>
            <p style={S.modeSub}>Publica tu disponibilidad y encuentra partidos cerca de ti.</p>
            <button
              style={{ ...S.modeBtn, ...(isPlayer ? S.modeBtnGreen : S.modeBtnGray) }}
              disabled={!isPlayer}
            >
              {isPlayer ? 'Entrar como Player' : 'No disponible para tu perfil'}
            </button>
          </div>

          {/* Buscar jugadores */}
          <div
            style={{ ...S.modeCard, ...(isOrg ? {} : S.disabled) }}
            onClick={() => isOrg && goTo('organizer')}
            title={!isOrg ? 'Solo disponible para Organizadores' : ''}
          >
            <div style={S.modeIcon}>📋</div>
            <h3 style={S.modeTitle}>Buscar jugadores</h3>
            <p style={S.modeSub}>Publica tu partido y encuentra los jugadores que te faltan.</p>
            <button
              style={{ ...S.modeBtn, ...(isOrg ? S.modeBtnGray : S.modeBtnGray) }}
              disabled={!isOrg}
            >
              {isOrg ? 'Entrar como Organizador' : 'No disponible para tu perfil'}
            </button>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div style={S.quickLinks}>
          <button style={S.ql} onClick={() => goTo('profile')}>👤 Mi perfil</button>
          {isPlayer && <button style={S.ql} onClick={() => goTo('player')}>🏃 Mi disponibilidad</button>}
          {isOrg    && <button style={S.ql} onClick={() => goTo('organizer')}>📅 Mis partidos</button>}
          <button style={S.ql} onClick={() => goTo('search')}>🔍 Buscador</button>
        </div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:        { background:'#f4f6f8', minHeight:'calc(100vh - 56px)' },
  loading:     { textAlign:'center', padding:60, color:'#6c757d', fontFamily:'system-ui' },
  header:      { background:'linear-gradient(135deg,#1a1a2e,#2d2d44)', padding:'28px 20px' },
  profileWrap: { display:'flex', alignItems:'center', gap:16, maxWidth:700, margin:'0 auto' },
  avLg:        { width:60, height:60, borderRadius:'50%', background:'#2ecc71', border:'3px solid #27ae60', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', cursor:'pointer', flexShrink:0 },
  profileInfo: { flex:1 },
  profileName: { color:'#fff', fontSize:'1.15rem', fontWeight:800, fontFamily:'system-ui', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  badge:       { background:'#2ecc71', color:'#1a1a2e', padding:'2px 10px', borderRadius:20, fontSize:'.72rem', fontWeight:700 },
  profileSub:  { color:'#aaa', fontSize:'.85rem', marginTop:4, fontFamily:'system-ui' },
  deportesTags:{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 },
  deporteTag:  { background:'rgba(255,255,255,.1)', color:'#fff', padding:'3px 10px', borderRadius:20, fontSize:'.72rem', fontWeight:600 },
  body:        { padding:'36px 20px', maxWidth:700, margin:'0 auto' },
  question:    { textAlign:'center', fontSize:'1rem', color:'#6c757d', marginBottom:24, fontFamily:'system-ui' },
  cards:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  modeCard:    { background:'#fff', borderRadius:14, padding:'30px 20px', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,.08)', cursor:'pointer', border:'2.5px solid transparent', transition:'.2s' },
  disabled:    { opacity:.5, cursor:'not-allowed' },
  modeIcon:    { fontSize:'3rem', marginBottom:12 },
  modeTitle:   { fontSize:'1.1rem', fontWeight:800, marginBottom:8, fontFamily:'system-ui' },
  modeSub:     { fontSize:'.82rem', color:'#6c757d', marginBottom:16, fontFamily:'system-ui' },
  modeBtn:     { width:'100%', padding:'10px 0', borderRadius:8, border:'none', fontSize:'.85rem', fontWeight:700, cursor:'pointer' },
  modeBtnGreen:{ background:'#2ecc71', color:'#1a1a2e' },
  modeBtnGray: { background:'#e0e6ed', color:'#6c757d' },
  quickLinks:  { display:'flex', gap:10, marginTop:24, justifyContent:'center', flexWrap:'wrap' },
  ql:          { background:'#fff', borderRadius:10, padding:'10px 18px', fontSize:'.82rem', fontWeight:600, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,.08)', border:'none', color:'#1a1a2e', transition:'.2s' },
}
