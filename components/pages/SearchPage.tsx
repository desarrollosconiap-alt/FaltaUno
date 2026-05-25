'use client'

import React, { useEffect, useState } from 'react'
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
  costo: number
  cerrado: boolean
  organizador_nombre: string
  organizador_whatsapp: string
}

interface Jugador {
  id: string
  deporte: string
  posiciones: string[]
  zona: string
  hora_desde: string
  hora_hasta: string
  nivel: string
  activo: boolean
  profiles: {
    id: string
    nombre: string
    apellido: string
    avatar: string
    ciudad: string
    nivel: string
  }
}

type Mode = 'partidos' | 'jugadores'

const SPORTS = [
  '⚽ Fútbol','🏀 Básquetbol','🏐 Vóleibol','🎾 Tenis','🎱 Pádel',
  '🏈 Fútbol Americano','🏉 Rugby','⚾ Béisbol','🚴 Ciclismo',
  '🥾 Trekking','🏊 Natación','🏃 Running','🏋️ Fitness',
]

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const WNAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const AVCOLS = ['#2ecc71','#3498db','#e74c3c','#f39c12','#9b59b6','#1abc9c','#e67e22']

export default function SearchPage({ goTo, user }: Props) {
  const [mode, setMode] = useState<Mode>('partidos')

  // Filtros partidos
  const [fDeporte, setFDeporte] = useState('')
  const [fCiudad,  setFCiudad]  = useState('')
  const [fNivel,   setFNivel]   = useState('')
  const [fCupos,   setFCupos]   = useState(true)

  // Filtros jugadores
  const [fjDeporte, setFjDeporte] = useState('')
  const [fjCiudad,  setFjCiudad]  = useState('')
  const [fjNivel,   setFjNivel]   = useState('')

  // Resultados
  const [partidos,  setPartidos]  = useState<Partido[]>([])
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [loading,   setLoading]   = useState(false)
  const [toast,     setToast]     = useState('')

  // Postulaciones del usuario actual
  const [misPost, setMisPost] = useState<Record<string, string>>({}) // partidoId -> estado

  // Modal detalle
  const [detailPartido, setDetailPartido] = useState<Partido | null>(null)
  const [postModal,     setPostModal]     = useState<Partido | null>(null)
  const [postPos,       setPostPos]       = useState('')
  const [postMsg,       setPostMsg]       = useState('')
  const [postSaving,    setPostSaving]    = useState(false)

  // Modal solicitar jugador
  const [solModal,   setSolModal]   = useState<Jugador | null>(null)
  const [solPartido, setSolPartido] = useState('')
  const [misPartidos,setMisPartidos]= useState<{id:string,titulo:string}[]>([])

  useEffect(() => {
    if (!user) { goTo('login'); return }
    buscarPartidos()
    loadMisPostulaciones()
  }, [user])

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(''), 3200)
  }

  // ── Cargar mis postulaciones ──────────────────────────────
  async function loadMisPostulaciones() {
    if (!user) return
    const { data } = await supabase
      .from('postulaciones')
      .select('partido_id, estado')
      .eq('player_id', user.id)
    if (data) {
      const map: Record<string, string> = {}
      data.forEach((p: any) => { map[p.partido_id] = p.estado })
      setMisPost(map)
    }
  }

  // ── Buscar partidos ───────────────────────────────────────
  async function buscarPartidos() {
    setLoading(true)
    try {
      let q = supabase
        .from('partidos_con_cupos')
        .select('*')
        .eq('cerrado', false)
        .gte('fecha', new Date().toISOString().split('T')[0])
        .order('fecha', { ascending: true })

      if (fDeporte) q = q.eq('deporte', fDeporte)
      if (fCiudad)  q = q.ilike('ciudad', `%${fCiudad}%`)
      if (fNivel)   q = q.eq('nivel', fNivel)
      if (fCupos)   q = q.gt('cupos_disponibles', 0)

      const { data } = await q
      setPartidos(data || [])
    } finally {
      setLoading(false)
    }
  }

  // ── Buscar jugadores ──────────────────────────────────────
  async function buscarJugadores() {
    setLoading(true)
    try {
      let q = supabase
        .from('disponibilidades')
        .select('*, profiles(id, nombre, apellido, avatar, ciudad, nivel)')
        .eq('activo', true)

      if (fjDeporte) q = q.eq('deporte', fjDeporte)
      if (fjCiudad)  q = q.ilike('zona', `%${fjCiudad}%`)
      if (fjNivel)   q = q.eq('nivel', fjNivel)

      // Excluir disponibilidades propias
      if (user) q = q.neq('user_id', user.id)

      const { data } = await q
      setJugadores(data || [])
    } finally {
      setLoading(false)
    }
  }

  // ── Postular a partido ────────────────────────────────────
  async function confirmarPostulacion() {
    if (!user || !postModal) return
    setPostSaving(true)
    try {
      const { error } = await supabase.from('postulaciones').insert({
        partido_id: postModal.id,
        player_id:  user.id,
        posicion:   postPos || 'Cualquiera',
        mensaje:    postMsg.trim(),
      })
      if (error) throw error
      setMisPost(prev => ({ ...prev, [postModal.id]: 'pendiente' }))
      setPostModal(null)
      setPostPos(''); setPostMsg('')
      showToast('📩 ¡Postulación enviada! El organizador recibirá tu solicitud')
    } catch (e: any) {
      if (e.message?.includes('unique')) showToast('⚠️ Ya postulaste a este partido')
      else showToast('❌ Error: ' + e.message)
    } finally {
      setPostSaving(false)
    }
  }

  // ── Solicitar jugador ─────────────────────────────────────
  async function abrirSolModal(jugador: Jugador) {
    setSolModal(jugador)
    // Cargar mis partidos activos
    if (user) {
      const { data } = await supabase
        .from('partidos')
        .select('id, titulo')
        .eq('organizador_id', user.id)
        .eq('cerrado', false)
      setMisPartidos(data || [])
      if (data && data.length > 0) setSolPartido(data[0].id)
    }
  }

  async function confirmarSolicitud() {
    if (!user || !solModal) return
    try {
      const { error } = await supabase.from('solicitudes').insert({
        organizador_id: user.id,
        player_id:      solModal.profiles.id,
        partido_id:     solPartido || null,
      })
      if (error) throw error
      setSolModal(null)
      showToast('📩 Solicitud enviada. El jugador recibirá una notificación')
    } catch (e: any) {
      showToast('❌ Error: ' + e.message)
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  function fmtDate(str: string) {
    const d = new Date(str + 'T12:00:00')
    return `${WNAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  }
  function fmtCosto(n: number) { return n===0 ? 'Gratis' : `$${n.toLocaleString('es-CL')}` }

  return (
    <div style={S.page}>
      {toast && <div style={S.toast}>{toast}</div>}

      <div style={S.header}>
        <div style={S.back} onClick={() => goTo('mode')}>← Volver</div>
        <h1 style={S.h1}>🔍 Buscador de matches</h1>
        <p style={S.hsub}>Encuentra tu próximo partido o el jugador que te falta</p>
      </div>

      <div style={S.conw}>
        {/* Mode tabs */}
        <div style={S.modeTabs}>
          <button style={{ ...S.modeTab, ...(mode==='partidos'?S.modeTabA:{}) }}
            onClick={() => { setMode('partidos'); buscarPartidos() }}>
            🏃 Quiero jugar
          </button>
          <button style={{ ...S.modeTab, ...(mode==='jugadores'?S.modeTabA:{}) }}
            onClick={() => { setMode('jugadores'); buscarJugadores() }}>
            📋 Buscar jugadores
          </button>
        </div>

        {/* ── MODO PARTIDOS ── */}
        {mode === 'partidos' && (
          <>
            <div style={S.filters}>
              <div style={S.filterGrid}>
                <div style={S.fg}>
                  <label style={S.fl}>Deporte</label>
                  <select style={S.fs} value={fDeporte} onChange={e => setFDeporte(e.target.value)}>
                    <option value="">Todos</option>
                    {SPORTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={S.fg}>
                  <label style={S.fl}>Ciudad</label>
                  <input style={S.fi} type="text" placeholder="Ej: Santiago" value={fCiudad} onChange={e => setFCiudad(e.target.value)} />
                </div>
                <div style={S.fg}>
                  <label style={S.fl}>Nivel</label>
                  <select style={S.fs} value={fNivel} onChange={e => setFNivel(e.target.value)}>
                    <option value="">Cualquiera</option>
                    <option>Casual</option><option>Intermedio</option><option>Competitivo</option>
                  </select>
                </div>
                <div style={S.fg}>
                  <label style={S.fl}>Solo con cupos</label>
                  <select style={S.fs} value={fCupos?'1':''} onChange={e => setFCupos(e.target.value==='1')}>
                    <option value="1">Sí</option><option value="">No</option>
                  </select>
                </div>
                <div style={{ display:'flex', alignItems:'flex-end' }}>
                  <button style={S.btnBuscar} onClick={buscarPartidos}>Buscar</button>
                </div>
              </div>
            </div>

            {loading ? <div style={S.empty}>Buscando partidos...</div> : (
              <>
                <p style={S.resultCount}>Mostrando <strong>{partidos.length}</strong> partidos disponibles</p>
                {partidos.length === 0
                  ? <div style={S.empty}><div style={{fontSize:'2rem',marginBottom:8}}>🔍</div><p>No encontramos partidos con esos filtros.<br/>Intenta ampliar la búsqueda.</p></div>
                  : partidos.map((p, i) => {
                    const left = p.total_jugadores - p.inscritos
                    const pct  = Math.round((p.inscritos / p.total_jugadores) * 100)
                    const barC = left<=2?'#e74c3c':left<=4?'#f39c12':'#2ecc71'
                    const estado = misPost[p.id]

                    return (
                      <div key={p.id} style={{ ...S.pcard, borderLeftColor: barC }}>
                        <div style={S.phead}>
                          <div>
                            <div style={S.ptitle}>{p.titulo}</div>
                            <span style={S.psport}>{p.deporte}</span>
                          </div>
                          <div style={{ fontSize:'.9rem', fontWeight:700, color: p.costo===0?'#1e8449':'#1a1a2e' }}>
                            {fmtCosto(p.costo)}
                          </div>
                        </div>
                        <div style={S.pmeta}>
                          <span>📅 {fmtDate(p.fecha)} · {p.hora_inicio}–{p.hora_termino}</span>
                          <span>📍 {p.ubicacion}</span>
                          <span>🎯 Busca: {p.posiciones?.join(', ')}</span>
                          <span>👤 Org: {p.organizador_nombre}</span>
                        </div>
                        <div style={S.barWrap}><div style={{ ...S.bar, width:`${pct}%`, background:barC }} /></div>
                        <div style={S.barTxt}>{p.inscritos}/{p.total_jugadores} jugadores · <strong style={{color:barC}}>{left} cupos</strong> · <span style={S.nivelChip}>{p.nivel}</span></div>
                        <div style={S.pacts}>
                          <button style={S.btnDetalle} onClick={() => setDetailPartido(p)}>Ver detalle</button>
                          {!estado && left > 0 && (
                            <button style={S.btnPost} onClick={() => { setPostModal(p); setPostPos(p.posiciones?.[0]||'') }}>
                              Postular / Unirme
                            </button>
                          )}
                          {estado === 'pendiente'  && <span style={S.estadoPending}>⏳ Pendiente</span>}
                          {estado === 'aceptado'   && <span style={S.estadoAcc}>🎉 Aceptado</span>}
                          {estado === 'rechazado'  && <span style={S.estadoRej}>❌ No aceptado</span>}
                          {!estado && left === 0   && <span style={S.estadoFull}>Sin cupos</span>}
                        </div>
                      </div>
                    )
                  })
                }
              </>
            )}
          </>
        )}

        {/* ── MODO JUGADORES ── */}
        {mode === 'jugadores' && (
          <>
            <div style={S.filters}>
              <div style={S.filterGrid}>
                <div style={S.fg}>
                  <label style={S.fl}>Deporte</label>
                  <select style={S.fs} value={fjDeporte} onChange={e => setFjDeporte(e.target.value)}>
                    <option value="">Todos</option>
                    {SPORTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={S.fg}>
                  <label style={S.fl}>Ciudad / Zona</label>
                  <input style={S.fi} type="text" placeholder="Ej: Providencia" value={fjCiudad} onChange={e => setFjCiudad(e.target.value)} />
                </div>
                <div style={S.fg}>
                  <label style={S.fl}>Nivel</label>
                  <select style={S.fs} value={fjNivel} onChange={e => setFjNivel(e.target.value)}>
                    <option value="">Cualquiera</option>
                    <option>Casual</option><option>Amistoso</option><option>Competitivo</option>
                  </select>
                </div>
                <div style={{ display:'flex', alignItems:'flex-end' }}>
                  <button style={S.btnBuscar} onClick={buscarJugadores}>Buscar</button>
                </div>
              </div>
            </div>

            {loading ? <div style={S.empty}>Buscando jugadores...</div> : (
              <>
                <p style={S.resultCount}>Mostrando <strong>{jugadores.length}</strong> jugadores disponibles</p>
                {jugadores.length === 0
                  ? <div style={S.empty}><div style={{fontSize:'2rem',marginBottom:8}}>👥</div><p>No encontramos jugadores con esos filtros.<br/>Intenta ampliar la búsqueda.</p></div>
                  : jugadores.map((j, i) => (
                    <div key={j.id} style={S.jcard}>
                      <div style={{ ...S.jav, background: AVCOLS[i % AVCOLS.length] }}>
                        {j.profiles?.avatar || j.profiles?.nombre?.[0] || '👤'}
                      </div>
                      <div style={S.jinfo}>
                        <div style={S.jname}>{j.profiles?.nombre} {j.profiles?.apellido}</div>
                        <div style={S.jmeta}>📍 {j.zona} · {j.deporte}</div>
                        <div style={S.jtags}>
                          {j.posiciones?.map(p => <span key={p} style={S.jtag}>{p}</span>)}
                          <span style={S.jtag}>🏆 {j.profiles?.nivel || j.nivel}</span>
                          <span style={S.jtag}>🕐 {j.hora_desde}–{j.hora_hasta}</span>
                          <span style={S.jtag}>{j.nivel}</span>
                        </div>
                      </div>
                      <div style={S.jacts}>
                        <button style={S.btnSolicitar} onClick={() => abrirSolModal(j)}>Solicitar</button>
                      </div>
                    </div>
                  ))
                }
              </>
            )}
          </>
        )}
      </div>

      {/* ── MODAL DETALLE PARTIDO ── */}
      {detailPartido && (
        <div style={S.overlay} onClick={() => setDetailPartido(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <button style={S.mclose} onClick={() => setDetailPartido(null)}>×</button>
            <div style={S.mtitle}>{detailPartido.titulo}</div>
            <div style={S.msub}>Publicado por {detailPartido.organizador_nombre}</div>
            <div style={S.mrows}>
              <div style={S.mrow}><span>🏅</span><span>{detailPartido.deporte} · Nivel {detailPartido.nivel}</span></div>
              <div style={S.mrow}><span>📅</span><span>{fmtDate(detailPartido.fecha)} · {detailPartido.hora_inicio}–{detailPartido.hora_termino}</span></div>
              <div style={S.mrow}><span>📍</span><span>{detailPartido.ubicacion}</span></div>
              <div style={S.mrow}><span>👥</span><span>{detailPartido.inscritos}/{detailPartido.total_jugadores} jugadores · <strong>{detailPartido.total_jugadores - detailPartido.inscritos} cupos</strong></span></div>
              <div style={S.mrow}><span>🎯</span><span>Busca: {detailPartido.posiciones?.join(', ')}</span></div>
              <div style={S.mrow}><span>💰</span><span>{fmtCosto(detailPartido.costo)}</span></div>
            </div>
            <div style={S.minfo}>📞 El WhatsApp del organizador se habilita al ser aceptado/a.</div>
            <button style={S.btnPost} onClick={() => { setPostModal(detailPartido); setDetailPartido(null) }}>
              Postular a este partido
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL POSTULAR ── */}
      {postModal && (
        <div style={S.overlay} onClick={() => setPostModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <button style={S.mclose} onClick={() => setPostModal(null)}>×</button>
            <div style={S.mtitle}>Postular al partido</div>
            <div style={S.msub}>{postModal.titulo} · {postModal.organizador_nombre}</div>
            <div style={S.fg2}>
              <label style={S.fl}>Posición en que quieres jugar</label>
              <select style={S.fs} value={postPos} onChange={e => setPostPos(e.target.value)}>
                <option value="">Cualquiera</option>
                {postModal.posiciones?.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={S.fg2}>
              <label style={S.fl}>Mensaje para el organizador (opcional)</label>
              <textarea style={S.ftarea} rows={3} placeholder="Cuéntale algo al organizador..."
                value={postMsg} onChange={e => setPostMsg(e.target.value)} />
            </div>
            <div style={S.minfo}>✅ Si te aceptan, se habilitará el WhatsApp del organizador.</div>
            <button style={{ ...S.btnPost, opacity: postSaving?.7:1 }}
              onClick={confirmarPostulacion} disabled={postSaving}>
              {postSaving ? 'Enviando...' : '📩 Enviar postulación'}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL SOLICITAR JUGADOR ── */}
      {solModal && (
        <div style={S.overlay} onClick={() => setSolModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <button style={S.mclose} onClick={() => setSolModal(null)}>×</button>
            <div style={S.mtitle}>Solicitar jugador</div>
            <div style={S.msub}>{solModal.profiles?.nombre} {solModal.profiles?.apellido} · {solModal.posiciones?.join(', ')}</div>
            {misPartidos.length === 0 ? (
              <div style={S.minfo}>⚠️ No tienes partidos activos. Publica un partido primero.</div>
            ) : (
              <div style={S.fg2}>
                <label style={S.fl}>Partido al que lo invitas</label>
                <select style={S.fs} value={solPartido} onChange={e => setSolPartido(e.target.value)}>
                  {misPartidos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                </select>
              </div>
            )}
            <div style={S.minfo}>✅ Si acepta, podrás contactarlo por WhatsApp.</div>
            <button style={S.btnPost} onClick={confirmarSolicitud} disabled={misPartidos.length===0}>
              📩 Enviar solicitud
            </button>
          </div>
        </div>
      )}
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
  conw:        { maxWidth:1000, margin:'0 auto', padding:'20px 16px' },
  modeTabs:    { display:'flex', gap:3, background:'#e0e6ed', borderRadius:10, padding:3, marginBottom:20, maxWidth:380 },
  modeTab:     { flex:1, padding:'9px', textAlign:'center', borderRadius:8, fontSize:'.85rem', fontWeight:600, cursor:'pointer', border:'none', background:'transparent', color:'#6c757d', transition:'.2s' },
  modeTabA:    { background:'#fff', color:'#1a1a2e', boxShadow:'0 2px 8px rgba(0,0,0,.08)' },
  filters:     { background:'#fff', borderRadius:12, padding:18, boxShadow:'0 4px 20px rgba(0,0,0,.08)', marginBottom:20 },
  filterGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 },
  fg:          { display:'flex', flexDirection:'column', gap:4 },
  fg2:         { marginBottom:12 },
  fl:          { fontSize:'.78rem', fontWeight:600, color:'#1a1a2e' },
  fi:          { padding:'8px 10px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.85rem', outline:'none' },
  fs:          { padding:'8px 10px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.85rem', outline:'none', background:'#fff' },
  ftarea:      { width:'100%', padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.85rem', outline:'none', boxSizing:'border-box', resize:'vertical' },
  btnBuscar:   { width:'100%', padding:'9px', background:'#2ecc71', color:'#1a1a2e', border:'none', borderRadius:8, fontSize:'.85rem', fontWeight:700, cursor:'pointer' },
  resultCount: { fontSize:'.82rem', color:'#6c757d', marginBottom:14 },
  empty:       { textAlign:'center', padding:'40px 16px', color:'#6c757d', fontSize:'.88rem' },
  // Partido card
  pcard:       { background:'#fff', borderRadius:12, padding:16, boxShadow:'0 4px 20px rgba(0,0,0,.08)', marginBottom:12, borderLeftStyle:'solid', borderLeftWidth:4, borderLeftColor:'#2ecc71' },
  phead:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 },
  ptitle:      { fontSize:'.92rem', fontWeight:800 },
  psport:      { fontSize:'.7rem', background:'#d5f5e3', color:'#1e8449', padding:'2px 9px', borderRadius:20, fontWeight:700, display:'inline-block', marginTop:3 },
  pmeta:       { display:'flex', flexDirection:'column', gap:3, fontSize:'.78rem', color:'#6c757d', marginBottom:8 },
  barWrap:     { background:'#e0e6ed', borderRadius:20, height:6, marginBottom:4, overflow:'hidden' },
  bar:         { height:'100%', borderRadius:20, transition:'.3s' },
  barTxt:      { fontSize:'.74rem', color:'#6c757d', marginBottom:10 },
  nivelChip:   { background:'#f4f6f8', padding:'1px 7px', borderRadius:10, fontSize:'.7rem' },
  pacts:       { display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' },
  btnDetalle:  { padding:'7px 14px', background:'#e0e6ed', color:'#1a1a2e', border:'none', borderRadius:8, fontSize:'.8rem', fontWeight:700, cursor:'pointer' },
  btnPost:     { padding:'7px 14px', background:'#2ecc71', color:'#1a1a2e', border:'none', borderRadius:8, fontSize:'.8rem', fontWeight:700, cursor:'pointer', width:'100%', marginTop:4 },
  estadoPending:{ fontSize:'.8rem', color:'#856404', background:'#fff8e1', padding:'4px 12px', borderRadius:8, fontWeight:700 },
  estadoAcc:   { fontSize:'.8rem', color:'#1e8449', background:'#d5f5e3', padding:'4px 12px', borderRadius:8, fontWeight:700 },
  estadoRej:   { fontSize:'.8rem', color:'#e74c3c', background:'#fde8e8', padding:'4px 12px', borderRadius:8, fontWeight:700 },
  estadoFull:  { fontSize:'.8rem', color:'#6c757d', background:'#f4f6f8', padding:'4px 12px', borderRadius:8, fontWeight:700 },
  // Jugador card
  jcard:       { background:'#fff', borderRadius:12, padding:14, boxShadow:'0 4px 20px rgba(0,0,0,.08)', marginBottom:10, display:'flex', alignItems:'center', gap:12 },
  jav:         { width:48, height:48, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0, color:'#fff', fontWeight:700 },
  jinfo:       { flex:1 },
  jname:       { fontSize:'.9rem', fontWeight:700 },
  jmeta:       { fontSize:'.78rem', color:'#6c757d', marginTop:2 },
  jtags:       { display:'flex', gap:5, flexWrap:'wrap', marginTop:5 },
  jtag:        { fontSize:'.68rem', padding:'2px 8px', borderRadius:20, background:'#f4f6f8', color:'#6c757d', fontWeight:600 },
  jacts:       { display:'flex', flexDirection:'column', gap:6, flexShrink:0 },
  btnSolicitar:{ padding:'7px 14px', background:'#2ecc71', color:'#1a1a2e', border:'none', borderRadius:8, fontSize:'.8rem', fontWeight:700, cursor:'pointer' },
  // Modal
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal:       { background:'#fff', borderRadius:14, padding:24, maxWidth:460, width:'100%', maxHeight:'90vh', overflowY:'auto' },
  mtitle:      { fontSize:'1.1rem', fontWeight:800, marginBottom:4 },
  msub:        { fontSize:'.83rem', color:'#6c757d', marginBottom:16 },
  mclose:      { float:'right', background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:'#6c757d', marginTop:-4 },
  mrows:       { display:'flex', flexDirection:'column', gap:7, marginBottom:14 },
  mrow:        { display:'flex', alignItems:'center', gap:6, fontSize:'.82rem', color:'#6c757d' },
  minfo:       { background:'#e8f4fd', color:'#1a6fa8', borderRadius:8, padding:'10px 14px', fontSize:'.82rem', marginBottom:12 },
}
