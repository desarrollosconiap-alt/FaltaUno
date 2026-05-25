'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Page } from '@/app/page'

interface Props {
  goTo: (p: Page) => void
  user: User | null
}

interface Disponibilidad {
  id: string
  deporte: string
  posiciones: string[]
  dias: string[]
  hora_desde: string
  hora_hasta: string
  zona: string
  nivel: string
  activo: boolean
  created_at: string
}

const SPORTS = [
  { n: '⚽ Fútbol',           p: ['Arquero','Defensa','Lateral','Mediocampista','Extremo','Delantero','Cualquiera'] },
  { n: '🏀 Básquetbol',       p: ['Base','Escolta','Alero','Ala-Pívot','Pívot','Cualquiera'] },
  { n: '🏐 Vóleibol',         p: ['Armador/a','Líbero','Opuesto/a','Central','Receptor/a','Cualquiera'] },
  { n: '🎾 Tenis',            p: ['Individual','Dobles','Mixto','Cualquiera'] },
  { n: '🎱 Pádel',            p: ['Drive','Revés','Cualquiera'] },
  { n: '🏈 Fútbol Americano', p: ['Quarterback','Wide Receiver','Running Back','Linebacker','Lineman','Cualquiera'] },
  { n: '🏉 Rugby',            p: ['Pilar','Hooker','Segunda Línea','Ala','Octavo','Apertura','Centro','Fullback','Cualquiera'] },
  { n: '⚾ Béisbol',          p: ['Pitcher','Catcher','Primera Base','Shortstop','Jardinero','Cualquiera'] },
  { n: '🚴 Ciclismo',         p: ['Gregario','Escalador','Sprinter','Rodador','Cualquiera'] },
  { n: '🥾 Trekking',         p: ['Líder de Ruta','Participante','Cualquiera'] },
  { n: '🏊 Natación',         p: ['Libre','Pecho','Espalda','Mariposa','Cualquiera'] },
  { n: '🏃 Running',          p: ['Velocidad','Media Distancia','Fondo','Trail','Cualquiera'] },
  { n: '🏋️ Fitness',         p: ['Crossfit','Calistenia','Levantamiento','Cardio','Cualquiera'] },
]

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const WDAYS  = ['L','M','X','J','V','S','D']
const WNAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function PlayerPage({ goTo, user }: Props) {
  // Form state
  const [deporte,      setDeporte]      = useState('⚽ Fútbol')
  const [posiciones,   setPosiciones]   = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
  const [horaDesde,    setHoraDesde]    = useState('19:00')
  const [horaHasta,    setHoraHasta]    = useState('21:00')
  const [zona,         setZona]         = useState('')
  const [nivel,        setNivel]        = useState('🤝 Amistoso')
  const [calYear,      setCalYear]      = useState(new Date().getFullYear())
  const [calMonth,     setCalMonth]     = useState(new Date().getMonth())

  // UI state
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [toast,   setToast]   = useState('')
  const [avails,  setAvails]  = useState<Disponibilidad[]>([])

  useEffect(() => {
    if (!user) { 
      goTo('login') 
      return 
    }
    loadAvails()
  }, [user])

  // Reset posiciones al cambiar deporte
  useEffect(() => { setPosiciones([]) }, [deporte])

  async function loadAvails() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('disponibilidades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setAvails(data)
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3200)
  }

  // ── Calendario ────────────────────────────────────────────
  function buildCalendar() {
    const firstDow = new Date(calYear, calMonth, 1).getDay()
    const offset   = firstDow === 0 ? 6 : firstDow - 1
    const total    = new Date(calYear, calMonth + 1, 0).getDate()
    const today    = new Date()
    const cells: React.ReactNode[] = []

    WDAYS.forEach(d => cells.push(<div key={'h'+d} style={S.calHdr}>{d}</div>))
    for (let i = 0; i < offset; i++) cells.push(<div key={'e'+i} style={S.calEmpty} />)

    for (let d = 1; d <= total; d++) {
      const key     = `${calYear}-${calMonth}-${d}`
      const dateObj = new Date(calYear, calMonth, d)
      const past    = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const isToday = dateObj.toDateString() === today.toDateString()
      const sel     = selectedDays.has(key)
      cells.push(
        <div
          key={key}
          style={{
            ...S.calDay,
            ...(past ? S.calPast : {}),
            ...(isToday ? S.calToday : {}),
            ...(sel ? S.calSel : {}),
          }}
          onClick={() => !past && toggleDay(key)}
        >
          {d}
        </div>
      )
    }
    return cells
  }

  function toggleDay(key: string) {
    setSelectedDays(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function togglePos(pos: string) {
    setPosiciones(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    )
  }

  // ── Publicar disponibilidad ───────────────────────────────
  async function publishAvail() {
    setError('')
    if (!user)                   return setError('Debes iniciar sesión.')
    if (selectedDays.size === 0) return setError('Selecciona al menos un día disponible.')
    if (!zona.trim())            return setError('Ingresa tu zona de juego preferida.')

    setSaving(true)
    try {
      const diasArray = [...selectedDays].sort().map(k => {
        const [y, m, d] = k.split('-')
        return `${calYear}-${String(parseInt(m) + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      })

      // Limpiar el nivel (quitar emoji) antes de guardar
      const nivelClean = nivel.replace(/[^\w\sáéíóúÁÉÍÓÚ]/g,'').trim()

      const { error } = await supabase.from('disponibilidades').insert({
        user_id:    user.id,
        deporte,
        posiciones: posiciones.length ? posiciones : ['Cualquiera'],
        dias:       diasArray,
        hora_desde: horaDesde,
        hora_hasta: horaHasta,
        zona:       zona.trim(),
        nivel:      nivelClean,
        activo:     true,
      })
      if (error) throw error

      // Reset form
      setSelectedDays(new Set())
      setZona('')
      setPosiciones([])
      await loadAvails()
      showToast('👁️ ¡Ya eres visible! Los organizadores pueden encontrarte')
    } catch (e: any) {
      setError(e.message || 'Error al publicar disponibilidad.')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle activo/pausado ─────────────────────────────────
  async function toggleActivo(id: string, activo: boolean) {
    await supabase.from('disponibilidades').update({ activo: !activo }).eq('id', id)
    setAvails(prev => prev.map(a => a.id === id ? { ...a, activo: !activo } : a))
    showToast(activo ? '⏸️ Disponibilidad pausada' : '▶️ Disponibilidad activada')
  }

  // ── Eliminar ──────────────────────────────────────────────
  async function deleteAvail(id: string) {
    if (!confirm('¿Eliminar esta disponibilidad?')) return
    await supabase.from('disponibilidades').delete().eq('id', id)
    setAvails(prev => prev.filter(a => a.id !== id))
    showToast('🗑️ Disponibilidad eliminada')
  }

  // ── Helpers display ───────────────────────────────────────
  function fmtDias(dias: string[]) {
    return dias.map(d => {
      const date = new Date(d + 'T12:00:00')
      return `${WNAMES[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()].slice(0,3)}`
    }).join(', ')
  }

  const sportPositions = SPORTS.find(s => s.n === deporte)?.p || []

  return (
    <div style={S.page}>
      {toast && <div style={S.toast}>{toast}</div>}

      <div style={S.header}>
        <div style={S.back} onClick={() => goTo('mode')}>← Volver</div>
        <h1 style={S.h1}>🏃 Mi disponibilidad</h1>
        <p style={S.hsub}>Publica cuándo puedes jugar para que los organizadores te encuentren</p>
      </div>

      <div style={S.conw}>
        <div style={S.two}>

          {/* ── FORMULARIO ── */}
          <div style={S.card}>
            <h3 style={S.cardTitle}>Nueva disponibilidad</h3>

            {error && <div style={S.error}>⚠️ {error}</div>}

            {/* Deporte */}
            <div style={S.fgroup}>
              <label style={S.label}>Deporte *</label>
              <select style={S.select} value={deporte} onChange={e => setDeporte(e.target.value)}>
                {SPORTS.map(s => <option key={s.n}>{s.n}</option>)}
              </select>
            </div>

            {/* Posiciones */}
            <div style={S.fgroup}>
              <label style={S.label}>Posiciones (selección múltiple)</label>
              <div style={S.tags}>
                {sportPositions.map(pos => (
                  <span
                    key={pos}
                    style={{ ...S.tag, ...(posiciones.includes(pos) ? S.tagA : {}) }}
                    onClick={() => togglePos(pos)}
                  >
                    {pos}
                  </span>
                ))}
              </div>
            </div>

            {/* Calendario */}
            <div style={S.fgroup}>
              <label style={S.label}>Días disponibles *</label>
              <div style={S.calWrap}>
                <div style={S.calNav}>
                  <button
                    style={S.calBtn}
                    onClick={() => {
                      let m = calMonth - 1
                      let y = calYear
                      if (m < 0) { m = 11; y-- }
                      setCalMonth(m); setCalYear(y)
                    }}
                  >
                    ‹
                  </button>
                  <span style={S.calTitle}>{MONTHS[calMonth]} {calYear}</span>
                  <button
                    style={S.calBtn}
                    onClick={() => {
                      let m = calMonth + 1
                      let y = calYear
                      if (m > 11) { m = 0; y++ }
                      setCalMonth(m); setCalYear(y)
                    }}
                  >
                    ›
                  </button>
                </div>
                <div style={S.calGrid}>{buildCalendar()}</div>
              </div>
              {selectedDays.size > 0 && (
                <div style={S.selectedDays}>
                  📅 {selectedDays.size} día{selectedDays.size>1?'s':''} seleccionado{selectedDays.size>1?'s':''}
                </div>
              )}
            </div>

            {/* Horario */}
            <div style={S.fgroup}>
              <label style={S.label}>Horario disponible *</label>
              <div style={S.timeRow}>
                <div style={S.timeGroup}>
                  <label style={S.timeLabel}>Desde</label>
                  <input
                    style={S.timeInput}
                    type="time"
                    value={horaDesde}
                    onChange={e => setHoraDesde(e.target.value)}
                  />
                </div>
                <span style={S.timeSep}>hasta</span>
                <div style={S.timeGroup}>
                  <label style={S.timeLabel}>Hasta</label>
                  <input
                    style={S.timeInput}
                    type="time"
                    value={horaHasta}
                    onChange={e => setHoraHasta(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Zona */}
            <div style={S.fgroup}>
              <label style={S.label}>Zona de juego preferida *</label>
              <input
                style={S.input}
                type="text"
                placeholder="Ej: Providencia, Santiago Centro..."
                value={zona}
                onChange={e => setZona(e.target.value)}
              />
            </div>

            {/* Nivel */}
            <div style={S.fgroup}>
              <label style={S.label}>Nivel de competitividad</label>
              <div style={S.tags}>
                {['😎 Casual','🤝 Amistoso','🔥 Competitivo'].map(n => (
                  <span
                    key={n}
                    style={{ ...S.tag, ...(nivel===n ? S.tagA : {}) }}
                    onClick={() => setNivel(n)}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <button
              style={{ ...S.btnPub, opacity: saving ? .7 : 1 }}
              onClick={publishAvail}
              disabled={saving}
            >
              {saving ? 'Publicando...' : '👁️ Hacerme visible'}
            </button>
          </div>

          {/* ── LISTA DE DISPONIBILIDADES ── */}
          <div style={S.card}>
            <h3 style={S.cardTitle}>Mis disponibilidades activas</h3>
            <p style={S.cardSub}>Los organizadores pueden encontrarte con estas preferencias</p>

            {loading ? (
              <div style={S.emptyState}>Cargando...</div>
            ) : avails.length === 0 ? (
              <div style={S.emptyState}>
                <div style={{ fontSize:'2.2rem', marginBottom:8 }}>📭</div>
                <p>
                  Aún no has publicado disponibilidad.<br />
                  ¡Hazte visible para que te encuentren!
                </p>
              </div>
            ) : (
              avails.map(a => (
                <div
                  key={a.id}
                  style={{ ...S.availCard, ...(a.activo ? {} : S.availPaused) }}
                >
                  <div style={S.availInfo}>
                    <div style={S.availTitle}>
                      {a.deporte} · {a.posiciones.join(', ')}
                    </div>
                    <div style={S.availMeta}>📅 {fmtDias(a.dias)}</div>
                    <div style={S.availMeta}>🕐 {a.hora_desde} – {a.hora_hasta}</div>
                    <div style={S.availMeta}>📍 {a.zona}</div>
                    <div style={{ marginTop:6, display:'flex', gap:6 }}>
                      <span style={{ ...S.statusBadge, ...(a.activo ? S.badgeActive : S.badgePaused) }}>
                        {a.activo ? 'Activo' : 'Pausado'}
                      </span>
                      <span style={S.nivelChip}>{a.nivel}</span>
                    </div>
                  </div>
                  <div style={S.availActions}>
                    <button
                      style={S.iconBtn}
                      title={a.activo ? 'Pausar' : 'Activar'}
                      onClick={() => toggleActivo(a.id, a.activo)}
                    >
                      {a.activo ? '⏸️' : '▶️'}
                    </button>
                    <button
                      style={S.iconBtn}
                      title="Eliminar"
                      onClick={() => deleteAvail(a.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}

            <div style={{ marginTop:16 }}>
              <button style={S.btnSearch} onClick={() => goTo('search')}>
                🔍 Ver partidos disponibles
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:        { background:'#f4f6f8', minHeight:'calc(100vh - 56px)', fontFamily:'system-ui' },
  toast:       { position:'fixed', bottom:20, right:20, background:'#1a1a2e', color:'#fff', padding:'12px 18px', borderRadius:10, fontSize:'.85rem', fontWeight:600, zIndex:300, borderLeft:'4px solid #2ecc71' },
  header:      { background:'linear-gradient(135deg,#1a1a2e,#2d2d44)', color:'#fff', padding:'18px 20px' },
  back:        { color:'#2ecc71', cursor:'pointer', fontSize:'.82rem', fontWeight:600, marginBottom:7, display:'inline-block' },
  h1:          { fontSize:'1.3rem', fontWeight:800, margin:0 },
  hsub:        { color:'#aaa', fontSize:'.82rem', marginTop:4 },
  conw:        { maxWidth:1060, margin:'0 auto', padding:'20px 16px' },
  two:         { display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 },
  card:        { background:'#fff', borderRadius:12, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,.08)' },
  cardTitle:   { fontSize:'1rem', fontWeight:800, marginBottom:6 },
  cardSub:     { fontSize:'.78rem', color:'#6c757d', marginBottom:16 },
  error:       { background:'#fde8e8', color:'#c0392b', borderRadius:8, padding:'10px 14px', fontSize:'.85rem', marginBottom:14 },
  fgroup:      { marginBottom:14 },
  label:       { fontSize:'.8rem', fontWeight:600, display:'block', marginBottom:5, color:'#1a1a2e' },
  select:      { width:'100%', padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.88rem', outline:'none', background:'#fff' },
  input:       { width:'100%', padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.88rem', outline:'none', boxSizing:'border-box' },
  tags:        { display:'flex', flexWrap:'wrap', gap:7, marginTop:4 },
  tag:         { padding:'5px 13px', borderRadius:20, fontSize:'.8rem', fontWeight:600, cursor:'pointer', borderStyle:'solid', borderWidth:1.5, borderColor:'#e0e6ed', background:'#fff', userSelect:'none' },
  tagA:        { background:'#2ecc71', borderColor:'#27ae60', color:'#1a1a2e' },
  // Calendar
  calWrap:     { border:'1.5px solid #e0e6ed', borderRadius:10, padding:12, background:'#fff' },
  calNav:      { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  calBtn:      { background:'none', border:'1.5px solid #e0e6ed', borderRadius:7, width:28, height:28, cursor:'pointer', fontSize:'.95rem', display:'flex', alignItems:'center', justifyContent:'center' },
  calTitle:    { fontSize:'.88rem', fontWeight:700 },
  calGrid:     { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 },
  calHdr:      { fontSize:'.63rem', fontWeight:700, textAlign:'center', color:'#6c757d', padding:'3px 0', textTransform:'uppercase' },
  calEmpty:    { aspectRatio:'1' },
  calDay:      { aspectRatio:'1', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.78rem', cursor:'pointer', border:'1.5px solid #e0e6ed', background:'#fff', fontWeight:500, transition:'.15s' },
  calPast:     { opacity:.3, cursor:'not-allowed', background:'#f4f6f8' },
  calToday:    { borderColor:'#f39c12', color:'#f39c12', fontWeight:700 },
  calSel:      { background:'#2ecc71', borderColor:'#27ae60', color:'#1a1a2e', fontWeight:700 },
  selectedDays:{ marginTop:8, fontSize:'.8rem', color:'#27ae60', fontWeight:600 },
  // Horario
  timeRow:     { display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' },
  timeGroup:   { display:'flex', flexDirection:'column', gap:4 },
  timeLabel:   { fontSize:'.75rem', color:'#6c757d' },
  timeInput:   { padding:'8px 10px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.88rem', outline:'none' },
  timeSep:     { color:'#6c757d', fontSize:'.82rem', marginTop:18 },
  // Botones
  btnPub:      { width:'100%', padding:13, background:'#2ecc71', color:'#1a1a2e', border:'none', borderRadius:10, fontSize:'.95rem', fontWeight:700, cursor:'pointer', marginTop:4 },
  btnSearch:   { width:'100%', padding:10, background:'#2ecc71', color:'#1a1a2e', border:'none', borderRadius:8, fontSize:'.85rem', fontWeight:700, cursor:'pointer' },
  // Avail cards
  emptyState:  { textAlign:'center', padding:'28px 14px', color:'#6c757d', fontSize:'.86rem' },
  availCard:   { background:'#fff', border:'1.5px solid #e0e6ed', borderRadius:10, padding:'13px 14px', marginBottom:10, display:'flex', alignItems:'flex-start', justifyContent:'space-between', borderLeftStyle:'solid', borderLeftWidth:4, borderLeftColor:'#2ecc71' },
  availPaused: { borderLeftColor:'#f39c12', opacity:.7 },
  availInfo:   { flex:1 },
  availTitle:  { fontSize:'.9rem', fontWeight:700, marginBottom:4 },
  availMeta:   { fontSize:'.76rem', color:'#6c757d', marginTop:2 },
  availActions:{ display:'flex', gap:5, flexShrink:0, marginLeft:8 },
  iconBtn:     { background:'none', border:'none', cursor:'pointer', fontSize:'.95rem', padding:'4px 7px', borderRadius:6 },
  statusBadge: { fontSize:'.7rem', fontWeight:700, padding:'2px 9px', borderRadius:20 },
  badgeActive: { background:'#d5f5e3', color:'#1e8449' },
  badgePaused: { background:'#fef3cd', color:'#856404' },
  nivelChip:   { fontSize:'.7rem', fontWeight:600, padding:'2px 8px', borderRadius:20, background:'#f4f6f8', color:'#6c757d' },
}