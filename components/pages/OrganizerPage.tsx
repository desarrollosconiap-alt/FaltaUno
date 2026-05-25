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

interface Partido {
  id: string
  titulo: string
  deporte: string
  fecha: string
  hora_inicio: string
  hora_termino: string
  ubicacion: string
  ciudad: string
  total_jugadores: number
  inscritos: number
  posiciones: string[]
  nivel: string
  tipo: string
  costo: number
  cerrado: boolean
  created_at: string
  postulaciones?: Postulacion[]
}

interface Postulacion {
  id: string
  player_id: string
  posicion: string
  mensaje: string
  estado: string
  profiles: { nombre: string; apellido: string; whatsapp: string; avatar: string }
}

const SPORTS = [
  { n:'⚽ Fútbol',           p:['Arquero','Defensa','Lateral','Mediocampista','Extremo','Delantero','Cualquiera'] },
  { n:'🏀 Básquetbol',       p:['Base','Escolta','Alero','Ala-Pívot','Pívot','Cualquiera'] },
  { n:'🏐 Vóleibol',         p:['Armador/a','Líbero','Opuesto/a','Central','Receptor/a','Cualquiera'] },
  { n:'🎾 Tenis',            p:['Individual','Dobles','Mixto','Cualquiera'] },
  { n:'🎱 Pádel',            p:['Drive','Revés','Cualquiera'] },
  { n:'🏈 Fútbol Americano', p:['Quarterback','Wide Receiver','Running Back','Linebacker','Lineman','Cualquiera'] },
  { n:'🏉 Rugby',            p:['Pilar','Hooker','Segunda Línea','Ala','Octavo','Apertura','Centro','Fullback','Cualquiera'] },
  { n:'⚾ Béisbol',          p:['Pitcher','Catcher','Primera Base','Shortstop','Jardinero','Cualquiera'] },
  { n:'🚴 Ciclismo',         p:['Gregario','Escalador','Sprinter','Rodador','Cualquiera'] },
  { n:'🥾 Trekking',         p:['Líder de Ruta','Participante','Cualquiera'] },
  { n:'🏊 Natación',         p:['Libre','Pecho','Espalda','Mariposa','Cualquiera'] },
  { n:'🏃 Running',          p:['Velocidad','Media Distancia','Fondo','Trail','Cualquiera'] },
  { n:'🏋️ Fitness',         p:['Crossfit','Calistenia','Levantamiento','Cardio','Cualquiera'] },
]

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const WDAYS  = ['L','M','X','J','V','S','D']
const WNAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function OrganizerPage({ goTo, user }: Props) {
  // Form
  const [titulo,     setTitulo]     = useState('')
  const [deporte,    setDeporte]    = useState('⚽ Fútbol')
  const [fecha,      setFecha]      = useState<string | null>(null)
  const [horaIn,     setHoraIn]     = useState('20:00')
  const [horaFin,    setHoraFin]    = useState('22:00')
  const [ubicacion,  setUbicacion]  = useState('')
  const [ciudad,     setCiudad]     = useState('')
  const [total,      setTotal]      = useState('')
  const [cupos,      setCupos]      = useState('')
  const [posiciones, setPosiciones] = useState<string[]>([])
  const [nivel,      setNivel]      = useState('Intermedio')
  const [tipo,       setTipo]       = useState('Público')
  const [costo,      setCosto]      = useState('')
  const [calYear,    setCalYear]    = useState(new Date().getFullYear())
  const [calMonth,   setCalMonth]   = useState(new Date().getMonth())

  // UI
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [toast,    setToast]    = useState('')
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [tab,      setTab]      = useState<'proximos'|'historial'>('proximos')

  useEffect(() => {
    if (!user) { 
      goTo('login') 
      return 
    }
    loadPartidos()
  }, [user])

  // Reset posiciones al cambiar deporte
  useEffect(() => { setPosiciones([]) }, [deporte])

  async function loadPartidos() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('partidos')
      .select(`*, postulaciones(id, player_id, posicion, mensaje, estado, profiles(nombre, apellido, whatsapp, avatar))`)
      .eq('organizador_id', user.id)
      .order('fecha', { ascending: true })
    if (data) setPartidos(data)
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
      const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const dateObj = new Date(calYear, calMonth, d)
      const past    = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const isToday = dateObj.toDateString() === today.toDateString()
      const sel     = fecha === dateStr
      cells.push(
        <div
          key={dateStr}
          style={{
            ...S.calDay,
            ...(past ? S.calPast : {}),
            ...(isToday ? S.calToday : {}),
            ...(sel ? S.calSel : {}),
          }}
          onClick={() => !past && setFecha(dateStr)}
        >
          {d}
        </div>
      )
    }
    return cells
  }

  function togglePos(pos: string) {
    setPosiciones(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    )
  }

  // ── Publicar partido ──────────────────────────────────────
  async function publishPartido() {
    setError('')
    if (!titulo.trim())        return setError('El título del partido es obligatorio.')
    if (!fecha)                return setError('Selecciona una fecha en el calendario.')
    if (!ubicacion.trim())     return setError('La ubicación es obligatoria.')
    if (!total)                return setError('Ingresa el total de jugadores.')
    if (!cupos)                return setError('Ingresa los cupos disponibles.')
    if (parseInt(cupos) > parseInt(total)) {
      return setError('Los cupos no pueden superar el total de jugadores.')
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('partidos').insert({
        organizador_id:  user!.id,
        titulo:          titulo.trim(),
        deporte,
        fecha,
        hora_inicio:     horaIn,
        hora_termino:    horaFin,
        ubicacion:       ubicacion.trim(),
        ciudad:          ciudad.trim(),
        total_jugadores: parseInt(total),
        inscritos:       parseInt(total) - parseInt(cupos),
        posiciones:      posiciones.length ? posiciones : ['Cualquiera'],
        nivel,
        tipo,
        costo:           costo ? parseInt(costo) : 0,
        cerrado:         false,
      })
      if (error) throw error

      // Reset form
      setTitulo('')
      setUbicacion('')
      setCiudad('')
      setTotal('')
      setCupos('')
      setCosto('')
      setFecha(null)
      setPosiciones([])
      await loadPartidos()
      showToast('📢 ¡Partido publicado! Ya aparece en el buscador')
    } catch (e: any) {
      setError(e.message || 'Error al publicar partido.')
    } finally {
      setSaving(false)
    }
  }

  // ── Cerrar búsqueda ───────────────────────────────────────
  async function cerrarBusqueda(id: string) {
    if (!confirm('¿Cerrar la búsqueda de jugadores para este partido?')) return
    await supabase.from('partidos').update({ cerrado: true }).eq('id', id)
    setPartidos(prev => prev.map(p => p.id === id ? { ...p, cerrado: true } : p))
    showToast('✓ Búsqueda de jugadores cerrada')
  }

  // ── Responder postulación ─────────────────────────────────
  async function responderPost(postId: string, partidoId: string, estado: 'aceptado' | 'rechazado') {
    const { error } = await supabase
      .from('postulaciones')
      .update({ estado })
      .eq('id', postId)
    if (error) {
      showToast('❌ Error al responder')
      return
    }
    // El trigger de Supabase actualiza inscritos y notifica al player automáticamente
    await loadPartidos()
    showToast(estado === 'aceptado' ? '✅ Jugador aceptado' : '❌ Postulación rechazada')
  }

  // ── Helpers ───────────────────────────────────────────────
  function fmtDate(str: string) {
    const d = new Date(str + 'T12:00:00')
    return `${WNAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`
  }

  function fmtCosto(n: number) {
    return n === 0 ? 'Gratis' : `$${n.toLocaleString('es-CL')}`
  }

  const today     = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const proximos  = partidos.filter(p => new Date(p.fecha+'T12:00:00') >= todayDate)
  const historial = partidos.filter(p => new Date(p.fecha+'T12:00:00') <  todayDate)
  const sportPos  = SPORTS.find(s => s.n === deporte)?.p || []

  return (
    <div style={S.page}>
      {toast && <div style={S.toast}>{toast}</div>}

      <div style={S.header}>
        <div style={S.back} onClick={() => goTo('mode')}>← Volver</div>
        <h1 style={S.h1}>📋 Organizar partido</h1>
        <p style={S.hsub}>Publica tu partido y encuentra los jugadores que faltan</p>
      </div>

      <div style={S.conw}>
        <div style={S.two}>

          {/* ── FORMULARIO ── */}
          <div style={S.card}>
            <h3 style={S.cardTitle}>Publicar nuevo partido</h3>
            {error && <div style={S.error}>⚠️ {error}</div>}

            <div style={S.fgroup}>
              <label style={S.label}>Título del partido *</label>
              <input
                style={S.input}
                type="text"
                placeholder="Ej: Fútbol 7 – jueves noche"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
              />
            </div>

            <div style={S.fgroup}>
              <label style={S.label}>Deporte *</label>
              <select
                style={S.select}
                value={deporte}
                onChange={e => setDeporte(e.target.value)}
              >
                {SPORTS.map(s => <option key={s.n}>{s.n}</option>)}
              </select>
            </div>

            {/* Calendario */}
            <div style={S.fgroup}>
              <label style={S.label}>Fecha del partido *</label>
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
              {fecha && <div style={S.fechaSel}>📅 {fmtDate(fecha)}</div>}
            </div>

            <div style={S.grid2}>
              <div style={S.fgroup}>
                <label style={S.label}>Hora inicio *</label>
                <input
                  style={S.input}
                  type="time"
                  value={horaIn}
                  onChange={e => setHoraIn(e.target.value)}
                />
              </div>
              <div style={S.fgroup}>
                <label style={S.label}>Hora término</label>
                <input
                  style={S.input}
                  type="time"
                  value={horaFin}
                  onChange={e => setHoraFin(e.target.value)}
                />
              </div>
              <div style={S.fgroup}>
                <label style={S.label}>Total jugadores *</label>
                <input
                  style={S.input}
                  type="number"
                  placeholder="14"
                  min="2"
                  value={total}
                  onChange={e => setTotal(e.target.value)}
                />
              </div>
              <div style={S.fgroup}>
                <label style={S.label}>Cupos disponibles *</label>
                <input
                  style={S.input}
                  type="number"
                  placeholder="3"
                  min="1"
                  value={cupos}
                  onChange={e => setCupos(e.target.value)}
                />
              </div>
            </div>

            <div style={S.fgroup}>
              <label style={S.label}>Ubicación / cancha *</label>
              <input
                style={S.input}
                type="text"
                placeholder="Ej: Cancha Parque O'Higgins, Santiago"
                value={ubicacion}
                onChange={e => setUbicacion(e.target.value)}
              />
            </div>

            <div style={S.fgroup}>
              <label style={S.label}>Ciudad</label>
              <input
                style={S.input}
                type="text"
                placeholder="Ej: Santiago"
                value={ciudad}
                onChange={e => setCiudad(e.target.value)}
              />
            </div>

            <div style={S.fgroup}>
              <label style={S.label}>Costo por jugador (0 = Gratis)</label>
              <div style={S.prefWrap}>
                <span style={S.pref}>$</span>
                <input
                  style={S.prefInput}
                  type="number"
                  placeholder="0"
                  min="0"
                  value={costo}
                  onChange={e => setCosto(e.target.value)}
                />
              </div>
            </div>

            <div style={S.fgroup}>
              <label style={S.label}>Posiciones que busca</label>
              <div style={S.tags}>
                {sportPos.map(pos => (
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

            <div style={S.fgroup}>
              <label style={S.label}>Nivel esperado</label>
              <div style={S.tags}>
                {['Casual','Intermedio','Competitivo'].map(n => (
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

            <div style={S.fgroup}>
              <label style={S.label}>Tipo de partido</label>
              <div style={S.tags}>
                {['Público','Privado'].map(t => (
                  <span
                    key={t}
                    style={{ ...S.tag, ...(tipo===t ? S.tagA : {}) }}
                    onClick={() => setTipo(t)}
                  >
                    {t === 'Público' ? '🌐 Público' : '🔒 Privado'}
                  </span>
                ))}
              </div>
            </div>

            <button
              style={{ ...S.btnPub, opacity: saving ? .7 : 1 }}
              onClick={publishPartido}
              disabled={saving}
            >
              {saving ? 'Publicando...' : '📢 Publicar partido'}
            </button>
          </div>

          {/* ── MIS PARTIDOS ── */}
          <div style={S.card}>
            <h3 style={S.cardTitle}>Mis partidos</h3>

            <div style={S.tabs}>
              <button
                style={{ ...S.tab, ...(tab==='proximos' ? S.tabA : {}) }}
                onClick={() => setTab('proximos')}
              >
                Próximos ({proximos.length})
              </button>
              <button
                style={{ ...S.tab, ...(tab==='historial' ? S.tabA : {}) }}
                onClick={() => setTab('historial')}
              >
                Historial ({historial.length})
              </button>
            </div>

            {loading ? (
              <div style={S.empty}>Cargando...</div>
            ) : (
              <>
                {(tab==='proximos' ? proximos : historial).length === 0 ? (
                  <div style={S.empty}>
                    <div style={{ fontSize:'2rem', marginBottom:8 }}>
                      {tab==='proximos' ? '📋' : '📜'}
                    </div>
                    <p>
                      {tab==='proximos'
                        ? 'No tienes partidos próximos.'
                        : 'Tu historial aparecerá aquí.'}
                    </p>
                  </div>
                ) : (
                  (tab==='proximos' ? proximos : historial).map(p => {
                    const left       = p.total_jugadores - p.inscritos
                    const pct        = Math.round((p.inscritos / p.total_jugadores) * 100)
                    const barC       = left<=2 ? '#e74c3c' : left<=4 ? '#f39c12' : '#2ecc71'
                    const pendientes = (p.postulaciones || []).filter(x => x.estado==='pendiente')

                    return (
                      <div key={p.id} style={{ ...S.pcard, borderLeftColor: barC }}>
                        <div style={S.phead}>
                          <div>
                            <div style={S.ptitle}>{p.titulo}</div>
                            <span style={S.psport}>{p.deporte}</span>
                          </div>
                          {!p.cerrado && tab==='proximos' && (
                            <button style={S.btnCerrar} onClick={() => cerrarBusqueda(p.id)}>
                              ✓ Cerrar
                            </button>
                          )}
                          {p.cerrado && <span style={S.cerradoTag}>Cerrado</span>}
                        </div>

                        <div style={S.pmeta}>
                          <span>📅 {fmtDate(p.fecha)} · {p.hora_inicio}–{p.hora_termino}</span>
                          <span>📍 {p.ubicacion}</span>
                          <span>💰 {fmtCosto(p.costo)}</span>
                        </div>

                        <div style={S.barWrap}>
                          <div style={{ ...S.bar, width:`${pct}%`, background: barC }} />
                        </div>
                        <div style={S.barTxt}>
                          {p.inscritos}/{p.total_jugadores} jugadores ·{' '}
                          <strong style={{ color: barC }}>{left} cupos</strong>
                        </div>

                        {/* Postulantes pendientes */}
                        {pendientes.length > 0 && (
                          <div style={S.postList}>
                            <div style={S.postHdr}>
                              📩 Postulantes pendientes ({pendientes.length})
                            </div>
                            {pendientes.map(post => (
                              <div key={post.id} style={S.postItem}>
                                <div style={S.postInfo}>
                                  <span style={S.postName}>
                                    {post.profiles?.nombre} {post.profiles?.apellido}
                                  </span>
                                  <span style={S.postPos}> · {post.posicion}</span>
                                  {post.mensaje && (
                                    <div style={S.postMsg}>"{post.mensaje}"</div>
                                  )}
                                </div>
                                <div style={S.postActs}>
                                  <button
                                    style={S.btnAcc}
                                    onClick={() => responderPost(post.id, p.id, 'aceptado')}
                                  >
                                    ✅ Aceptar
                                  </button>
                                  <button
                                    style={S.btnRej}
                                    onClick={() => responderPost(post.id, p.id, 'rechazado')}
                                  >
                                    ❌ Rechazar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Jugadores aceptados */}
                        {(p.postulaciones || []).filter(x => x.estado==='aceptado').length > 0 && (
                          <div style={S.postList}>
                            <div style={{ ...S.postHdr, color:'#1e8449' }}>
                              ✅ Jugadores aceptados
                            </div>
                            {(p.postulaciones || [])
                              .filter(x => x.estado==='aceptado')
                              .map(post => (
                                <div key={post.id} style={S.postItem}>
                                  <span style={S.postName}>
                                    {post.profiles?.nombre} {post.profiles?.apellido}
                                  </span>
                                  <span style={S.postPos}> · {post.posicion}</span>
                                  {post.profiles?.whatsapp && (
                                    <a
                                      href={`https://wa.me/56${post.profiles.whatsapp}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={S.wspLink}
                                    >
                                      📱 WhatsApp
                                    </a>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </>
            )}

            <div style={{ marginTop:16 }}>
              <button style={S.btnSearch} onClick={() => goTo('search')}>
                🔍 Buscar jugadores disponibles
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:      { background:'#f4f6f8', minHeight:'calc(100vh - 56px)', fontFamily:'system-ui' },
  toast:     { position:'fixed', bottom:20, right:20, background:'#1a1a2e', color:'#fff', padding:'12px 18px', borderRadius:10, fontSize:'.85rem', fontWeight:600, zIndex:300, borderLeft:'4px solid #2ecc71' },
  header:    { background:'linear-gradient(135deg,#1a1a2e,#2d2d44)', color:'#fff', padding:'18px 20px' },
  back:      { color:'#2ecc71', cursor:'pointer', fontSize:'.82rem', fontWeight:600, marginBottom:7, display:'inline-block' },
  h1:        { fontSize:'1.3rem', fontWeight:800, margin:0 },
  hsub:      { color:'#aaa', fontSize:'.82rem', marginTop:4 },
  conw:      { maxWidth:1060, margin:'0 auto', padding:'20px 16px' },
  two:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 },
  card:      { background:'#fff', borderRadius:12, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,.08)' },
  cardTitle: { fontSize:'1rem', fontWeight:800, marginBottom:14 },
  error:     { background:'#fde8e8', color:'#c0392b', borderRadius:8, padding:'10px 14px', fontSize:'.85rem', marginBottom:14 },
  fgroup:    { marginBottom:12 },
  label:     { fontSize:'.8rem', fontWeight:600, display:'block', marginBottom:4, color:'#1a1a2e' },
  input:     { width:'100%', padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.88rem', outline:'none', boxSizing:'border-box' },
  select:    { width:'100%', padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.88rem', outline:'none', background:'#fff' },
  grid2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  prefWrap:  { display:'flex' },
  pref:      { background:'#f4f6f8', border:'1.5px solid #e0e6ed', borderRight:'none', padding:'9px 10px', borderRadius:'8px 0 0 8px', fontSize:'.83rem', color:'#6c757d' },
  prefInput: { flex:1, padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:'0 8px 8px 0', fontSize:'.88rem', outline:'none' },
  tags:      { display:'flex', flexWrap:'wrap', gap:7, marginTop:4 },
  tag:       { padding:'5px 13px', borderRadius:20, fontSize:'.8rem', fontWeight:600, cursor:'pointer', borderStyle:'solid', borderWidth:1.5, borderColor:'#e0e6ed', background:'#fff', userSelect:'none' },
  tagA:      { background:'#2ecc71', borderColor:'#27ae60', color:'#1a1a2e' },
  // Calendar (sin shorthand border para evitar warning)
  calWrap:   { border:'1.5px solid #e0e6ed', borderRadius:10, padding:12, background:'#fff' },
  calNav:    { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  calBtn:    { background:'none', border:'1.5px solid #e0e6ed', borderRadius:7, width:28, height:28, cursor:'pointer', fontSize:'.95rem', display:'flex', alignItems:'center', justifyContent:'center' },
  calTitle:  { fontSize:'.88rem', fontWeight:700 },
  calGrid:   { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 },
  calHdr:    { fontSize:'.63rem', fontWeight:700, textAlign:'center', color:'#6c757d', padding:'3px 0', textTransform:'uppercase' },
  calEmpty:  { aspectRatio:'1' },
  calDay:    {
    aspectRatio:'1',
    borderRadius:6,
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    fontSize:'.78rem',
    cursor:'pointer',
    borderWidth:1.5,
    borderStyle:'solid',
    borderColor:'#e0e6ed',
    background:'#fff',
    fontWeight:500,
    transition:'.15s',
  },
  calPast:   { opacity:.3, cursor:'not-allowed', background:'#f4f6f8' },
  calToday:  { borderColor:'#f39c12', color:'#f39c12', fontWeight:700 },
  calSel:    { background:'#2ecc71', borderColor:'#27ae60', color:'#1a1a2e', fontWeight:700 },
  fechaSel:  { marginTop:8, fontSize:'.8rem', color:'#27ae60', fontWeight:600 },
  // Botones
  btnPub:    { width:'100%', padding:13, background:'#2ecc71', color:'#1a1a2e', border:'none', borderRadius:10, fontSize:'.95rem', fontWeight:700, cursor:'pointer', marginTop:4 },
  btnSearch: { width:'100%', padding:10, background:'#2ecc71', color:'#1a1a2e', border:'none', borderRadius:8, fontSize:'.85rem', fontWeight:700, cursor:'pointer' },
  // Tabs
  tabs:      { display:'flex', gap:3, background:'#f4f6f8', borderRadius:9, padding:3, marginBottom:16 },
  tab:       { flex:1, padding:8, textAlign:'center', borderRadius:7, fontSize:'.82rem', fontWeight:600, cursor:'pointer', border:'none', background:'transparent', color:'#6c757d' },
  tabA:      { background:'#fff', color:'#1a1a2e', boxShadow:'0 2px 6px rgba(0,0,0,.07)' },
  empty:     { textAlign:'center', padding:'28px 14px', color:'#6c757d', fontSize:'.86rem' },
  // Partido card
  pcard:     { background:'#f9fafb', borderRadius:10, padding:14, marginBottom:12, borderLeftStyle:'solid', borderLeftWidth:4, borderLeftColor:'#2ecc71' },
  phead:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 },
  ptitle:    { fontSize:'.92rem', fontWeight:800 },
  psport:    { fontSize:'.7rem', background:'#d5f5e3', color:'#1e8449', padding:'2px 9px', borderRadius:20, fontWeight:700, display:'inline-block', marginTop:3 },
  pmeta:     { display:'flex', flexDirection:'column', gap:3, fontSize:'.78rem', color:'#6c757d', marginBottom:8 },
  barWrap:   { background:'#e0e6ed', borderRadius:20, height:6, marginBottom:4, overflow:'hidden' },
  bar:       { height:'100%', borderRadius:20, transition:'.3s' },
  barTxt:    { fontSize:'.74rem', color:'#6c757d' },
  btnCerrar: { fontSize:'.72rem', padding:'4px 9px', border:'1px solid #e0e6ed', borderRadius:6, background:'#fff', cursor:'pointer', whiteSpace:'nowrap' },
  cerradoTag:{ fontSize:'.72rem', color:'#6c757d', padding:'4px 9px', border:'1px solid #e0e6ed', borderRadius:6 },
  // Postulantes
  postList:  { marginTop:10, borderTop:'1px solid #e0e6ed', paddingTop:10 },
  postHdr:   { fontSize:'.78rem', fontWeight:700, color:'#6c757d', marginBottom:8 },
  postItem:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f0f0f0', flexWrap:'wrap', gap:6 },
  postInfo:  { flex:1 },
  postName:  { fontSize:'.82rem', fontWeight:700 },
  postPos:   { fontSize:'.78rem', color:'#6c757d' },
  postMsg:   { fontSize:'.75rem', color:'#6c757d', fontStyle:'italic', marginTop:2 },
  postActs:  { display:'flex', gap:6 },
  btnAcc:    { background:'#d5f5e3', color:'#1e8449', border:'none', borderRadius:6, padding:'4px 10px', fontSize:'.75rem', fontWeight:700, cursor:'pointer' },
  btnRej:    { background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:6, padding:'4px 10px', fontSize:'.75rem', fontWeight:700, cursor:'pointer' },
  wspLink:   { display:'inline-block', marginLeft:8, fontSize:'.75rem', color:'#25D366', fontWeight:600, textDecoration:'none' },
}