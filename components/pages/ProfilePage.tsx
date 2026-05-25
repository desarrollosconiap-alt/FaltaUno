'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Page } from '@/app/page'

interface Props {
  goTo: (p: Page) => void
  user: User | null
  onLogout: () => void
}

const REGIONES: Record<string, string[]> = {
  'Metropolitana':      ['Santiago','Providencia','Ñuñoa','Maipú','La Florida','Las Condes','San Bernardo','Puente Alto'],
  'Valparaíso':         ['Valparaíso','Viña del Mar','Quilpué','Villa Alemana','San Antonio'],
  'Biobío':             ['Concepción','Talcahuano','San Pedro de la Paz','Coronel'],
  'Maule':              ['Talca','Curicó','Linares'],
  'La Araucanía':       ['Temuco','Villarrica'],
  'Los Lagos':          ['Puerto Montt','Osorno','Puerto Varas'],
  'Antofagasta':        ['Antofagasta','Calama'],
  "O'Higgins":          ['Rancagua','San Fernando'],
  'Coquimbo':           ['La Serena','Coquimbo'],
  'Tarapacá':           ['Iquique','Alto Hospicio'],
  'Atacama':            ['Copiapó','Vallenar'],
  'Ñuble':              ['Chillán'],
  'Los Ríos':           ['Valdivia'],
  'Aysén':              ['Coyhaique'],
  'Magallanes':         ['Punta Arenas'],
  'Arica y Parinacota': ['Arica'],
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
  { n:'🏋️ Fitness',          p:['Crossfit','Calistenia','Levantamiento','Cardio','Cualquiera'] },
]

const AVATARS = [
  {e:'⚽',bg:'#2ecc71'},{e:'🏀',bg:'#3498db'},{e:'🏉',bg:'#e74c3c'},
  {e:'🚴',bg:'#f39c12'},{e:'🎽',bg:'#9b59b6'},{e:'⚾',bg:'#1abc9c'},
  {e:'🥾',bg:'#27ae60'},{e:'🏋️',bg:'#e67e22'},{e:'🏊',bg:'#2980b9'},
]

type Tab = 'info' | 'deportes' | 'seguridad' | 'notifs'

export default function ProfilePage({ goTo, user, onLogout }: Props) {
  const [tab,      setTab]      = useState<Tab>('info')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState('')
  const [error,    setError]    = useState('')

  // Datos perfil
  const [nombre,   setNombre]   = useState('')
  const [apellido, setApellido] = useState('')
  const [username, setUsername] = useState('')
  const [wsp,      setWsp]      = useState('')
  const [bio,      setBio]      = useState('')
  const [region,   setRegion]   = useState('')
  const [ciudad,   setCiudad]   = useState('')
  const [genero,   setGenero]   = useState('')
  const [edad,     setEdad]     = useState('')
  const [nivel,    setNivel]    = useState('Intermedio')
  const [tipo,     setTipo]     = useState('Ambos')
  const [avatar,   setAvatar]   = useState('⚽')

  // Deportes
  const [deportesActivos, setDeportesActivos] = useState<string[]>([])
  const [posiciones,      setPosiciones]      = useState<Record<string,string[]>>({})

  // Seguridad
  const [passActual,  setPassActual]  = useState('')
  const [passNueva,   setPassNueva]   = useState('')
  const [passConfirm, setPassConfirm] = useState('')

  // Stats
  const [stats, setStats] = useState({ avails: 0, partidos: 0, postulaciones: 0 })

  useEffect(() => {
    if (!user) { goTo('login'); return }
    loadAll()
  }, [user])

  async function loadAll() {
    if (!user) return
    setLoading(true)
    try {
      const [{ data: prof }, { data: deps }, { data: avails }, { data: parts }, { data: posts }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('deportes_usuario').select('*').eq('user_id', user.id),
        supabase.from('disponibilidades').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('partidos').select('id', { count: 'exact' }).eq('organizador_id', user.id),
        supabase.from('postulaciones').select('id', { count: 'exact' }).eq('player_id', user.id),
      ])
      if (prof) {
        setNombre(prof.nombre || '')
        setApellido(prof.apellido || '')
        setUsername(prof.username || '')
        setWsp(prof.whatsapp || '')
        setBio(prof.bio || '')
        setRegion(prof.region || '')
        setCiudad(prof.ciudad || '')
        setGenero(prof.genero || '')
        setEdad(prof.rango_edad || '')
        setNivel(prof.nivel || 'Intermedio')
        setTipo(prof.tipo_usuario || 'Ambos')
        setAvatar(prof.avatar || '⚽')
      }
      if (deps) {
        setDeportesActivos(deps.map((d: any) => d.deporte))
        const pos: Record<string,string[]> = {}
        deps.forEach((d: any) => { pos[d.deporte] = d.posiciones || [] })
        setPosiciones(pos)
      }
      setStats({
        avails:       avails?.length || 0,
        partidos:     parts?.length  || 0,
        postulaciones: posts?.length || 0,
      })
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Guardar perfil ────────────────────────────────────────
  async function saveProfile() {
    if (!user) return
    setError(''); setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({
        nombre: nombre.trim(), apellido: apellido.trim(),
        username: username.trim().replace('@',''),
        whatsapp: wsp.trim(), bio: bio.trim(),
        region, ciudad, genero, rango_edad: edad,
        nivel, tipo_usuario: tipo, avatar,
      }).eq('id', user.id)
      if (error) throw error
      showToast('✅ Perfil actualizado correctamente')
    } catch (e: any) {
      setError(e.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  // ── Guardar deportes ──────────────────────────────────────
  async function saveDeportes() {
    if (!user) return
    setSaving(true)
    try {
      // Eliminar los anteriores y reinsertar
      await supabase.from('deportes_usuario').delete().eq('user_id', user.id)
      if (deportesActivos.length > 0) {
        const rows = deportesActivos.map(dep => ({
          user_id: user.id, deporte: dep, posiciones: posiciones[dep] || [],
        }))
        const { error } = await supabase.from('deportes_usuario').insert(rows)
        if (error) throw error
      }
      showToast('✅ Deportes actualizados correctamente')
    } catch (e: any) {
      setError(e.message || 'Error al guardar deportes.')
    } finally {
      setSaving(false)
    }
  }

  // ── Cambiar contraseña ────────────────────────────────────
  async function changePassword() {
    setError('')
    if (!passNueva || !passConfirm) return setError('Completa todos los campos.')
    if (passNueva.length < 6)       return setError('Mínimo 6 caracteres.')
    if (passNueva !== passConfirm)  return setError('Las contraseñas no coinciden.')
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passNueva })
      if (error) throw error
      setPassActual(''); setPassNueva(''); setPassConfirm('')
      showToast('🔒 Contraseña actualizada correctamente')
    } catch (e: any) {
      setError(e.message || 'Error al cambiar contraseña.')
    } finally {
      setSaving(false)
    }
  }

  // ── Deportes helpers ──────────────────────────────────────
  function toggleDep(dep: string) {
    setDeportesActivos(prev =>
      prev.includes(dep) ? prev.filter(d => d !== dep) : [...prev, dep]
    )
  }
  function togglePos(dep: string, pos: string) {
    setPosiciones(prev => {
      const cur = prev[dep] || []
      return { ...prev, [dep]: cur.includes(pos) ? cur.filter(p => p !== pos) : [...cur, pos] }
    })
  }

  if (loading) return <div style={S.loading}>Cargando tu perfil...</div>

  const initials = `${nombre[0]||''}${apellido[0]||''}`.toUpperCase()

  return (
    <div style={{ fontFamily:'system-ui', background:'#f4f6f8', minHeight:'calc(100vh - 56px)' }}>

      {/* Toast */}
      {toast && <div style={S.toast}>{toast}</div>}

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.back} onClick={() => goTo('mode')}>← Volver</div>
        <div style={S.avBig}>{avatar || initials}</div>
        <div style={S.heroName}>{nombre} {apellido}</div>
        <div style={S.heroUser}>@{username}</div>
        <div style={S.heroBadges}>
          <span style={{...S.heroBadge, background:'#2ecc71', color:'#1a1a2e'}}>⚡ {tipo}</span>
          {deportesActivos.slice(0,2).map(d => <span key={d} style={S.heroBadge}>{d}</span>)}
          {ciudad && <span style={S.heroBadge}>📍 {ciudad}</span>}
        </div>
        <div style={S.statsRow}>
          <div style={S.stat}><div style={S.statVal}>{stats.avails}</div><div style={S.statLbl}>Disponibilidades</div></div>
          <div style={S.stat}><div style={S.statVal}>{stats.partidos}</div><div style={S.statLbl}>Partidos</div></div>
          <div style={S.stat}><div style={S.statVal}>{stats.postulaciones}</div><div style={S.statLbl}>Postulaciones</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {([['info','👤 Información'],['deportes','🏅 Deportes'],['seguridad','🔒 Seguridad'],['notifs','🔔 Notificaciones']] as [Tab,string][]).map(([t,lbl]) => (
          <div key={t} style={{...S.tabItem, ...(tab===t ? S.tabActive : {})}} onClick={() => { setTab(t); setError('') }}>{lbl}</div>
        ))}
      </div>

      <div style={S.body}>
        {error && <div style={S.error}>⚠️ {error}</div>}

        {/* ── TAB INFO ── */}
        {tab === 'info' && (
          <div style={S.card}>
            <div style={S.cardHdr}><h3 style={S.cardTitle}>Información personal</h3><button style={S.btnSave} onClick={saveProfile} disabled={saving}>{saving?'Guardando...':'💾 Guardar'}</button></div>

            {/* Avatar */}
            <div style={S.fgroup}>
              <label style={S.label}>Avatar</label>
              <div style={S.avGrid}>
                {AVATARS.map(a => (
                  <div key={a.e} style={{...S.av, background:a.bg, borderStyle:'solid', borderWidth:3, borderColor: avatar===a.e ? '#2ecc71' : 'transparent'}}
                    onClick={() => setAvatar(a.e)}>{a.e}</div>
                ))}
              </div>
            </div>

            <div style={S.grid2}>
              <Field label="Nombre *"   value={nombre}   onChange={setNombre}   placeholder="Carlos" />
              <Field label="Apellido *" value={apellido} onChange={setApellido} placeholder="Rodríguez" />
            </div>
            <Field label="Nombre de usuario" value={username} onChange={setUsername} placeholder="carlos_futbol" />
            <div style={S.wspWrap}>
              <span style={S.wspPre}>🇨🇱 +56</span>
              <input style={S.wspIn} type="tel" placeholder="9 XXXX XXXX" value={wsp} onChange={e => setWsp(e.target.value)} />
            </div>
            <div style={S.fgroup}>
              <label style={S.label}>Bio</label>
              <textarea style={S.textarea} rows={3} placeholder="Cuéntanos algo sobre ti como jugador..." value={bio} onChange={e => setBio(e.target.value)} />
            </div>
            <div style={S.grid2}>
              <div style={S.fgroup}>
                <label style={S.label}>Región</label>
                <select style={S.select} value={region} onChange={e => { setRegion(e.target.value); setCiudad('') }}>
                  <option value="">Selecciona región</option>
                  {Object.keys(REGIONES).map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={S.fgroup}>
                <label style={S.label}>Ciudad</label>
                <select style={S.select} value={ciudad} onChange={e => setCiudad(e.target.value)} disabled={!region}>
                  <option value="">Selecciona ciudad</option>
                  {(REGIONES[region]||[]).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={S.fgroup}>
                <label style={S.label}>Género</label>
                <select style={S.select} value={genero} onChange={e => setGenero(e.target.value)}>
                  <option value="">Selecciona</option>
                  <option>Masculino</option><option>Femenino</option><option>No binario</option><option>Prefiero no decir</option>
                </select>
              </div>
              <div style={S.fgroup}>
                <label style={S.label}>Rango de edad</label>
                <select style={S.select} value={edad} onChange={e => setEdad(e.target.value)}>
                  <option value="">Selecciona</option>
                  <option>18–25</option><option>26–35</option><option>36–45</option><option>46+</option>
                </select>
              </div>
            </div>
            <div style={S.fgroup}>
              <label style={S.label}>Tipo de usuario</label>
              <div style={S.tags}>
                {['🏃 Player','📋 Organizador','⚡ Ambos'].map(t => (
                  <span key={t} style={{...S.tag, ...(tipo===t||tipo===t.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g,'').trim() ? S.tagA:{})}} onClick={() => setTipo(t.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g,'').trim())}>{t}</span>
                ))}
              </div>
            </div>
            <div style={S.fgroup}>
              <label style={S.label}>Nivel de juego</label>
              <div style={S.tags}>
                {['Básico','Intermedio','Avanzado'].map(n => (
                  <span key={n} style={{...S.tag,...(nivel===n?S.tagA:{})}} onClick={() => setNivel(n)}>{n}</span>
                ))}
              </div>
            </div>
            <button style={{...S.btnSave, width:'100%', marginTop:8, padding:13}} onClick={saveProfile} disabled={saving}>
              {saving ? 'Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        )}

        {/* ── TAB DEPORTES ── */}
        {tab === 'deportes' && (
          <div style={S.card}>
            <div style={S.cardHdr}><h3 style={S.cardTitle}>Mis deportes y posiciones</h3></div>
            <p style={{fontSize:'.85rem', color:'#6c757d', marginBottom:16}}>Selecciona los deportes que practicas y tus posiciones preferidas</p>
            <div style={S.fgroup}>
              <label style={S.label}>Deportes de interés</label>
              <div style={S.tags}>
                {SPORTS.map(sp => (
                  <span key={sp.n} style={{...S.tag,...(deportesActivos.includes(sp.n)?S.tagA:{})}} onClick={() => toggleDep(sp.n)}>{sp.n}</span>
                ))}
              </div>
            </div>
            {deportesActivos.map(dep => {
              const sp = SPORTS.find(s => s.n === dep)
              if (!sp) return null
              return (
                <div key={dep} style={S.posBlock}>
                  <div style={S.posTitle}>{dep}</div>
                  <div style={S.tags}>
                    {sp.p.map(pos => {
                      const act = (posiciones[dep]||[]).includes(pos)
                      return <span key={pos} style={{...S.tag,...(act?S.tagA:{})}} onClick={() => togglePos(dep,pos)}>{pos}</span>
                    })}
                  </div>
                </div>
              )
            })}
            <button style={{...S.btnSave, width:'100%', marginTop:16, padding:13}} onClick={saveDeportes} disabled={saving}>
              {saving ? 'Guardando...' : '💾 Guardar deportes'}
            </button>
          </div>
        )}

        {/* ── TAB SEGURIDAD ── */}
        {tab === 'seguridad' && (
          <div style={S.card}>
            <h3 style={{...S.cardTitle, marginBottom:16}}>Cambiar contraseña</h3>
            <Field label="Contraseña actual *"    type="password" value={passActual}  onChange={setPassActual}  placeholder="••••••••" />
            <Field label="Nueva contraseña *"     type="password" value={passNueva}   onChange={setPassNueva}   placeholder="••••••••" />
            <Field label="Confirmar contraseña *" type="password" value={passConfirm} onChange={setPassConfirm} placeholder="••••••••" />
            <button style={{...S.btnSave, padding:'11px 20px'}} onClick={changePassword} disabled={saving}>
              {saving ? 'Cambiando...' : '🔒 Cambiar contraseña'}
            </button>
            <div style={S.sep} />
            <h3 style={{...S.cardTitle, marginBottom:12, color:'#e74c3c'}}>Zona de peligro</h3>
            <div style={{background:'#fde8e8', borderRadius:8, padding:'11px 14px', fontSize:'.83rem', color:'#c0392b', marginBottom:14}}>
              ⚠️ Eliminar tu cuenta es una acción irreversible. Todos tus datos serán borrados permanentemente.
            </div>
            <button style={{...S.btnSave, background:'#e74c3c', color:'#fff'}} onClick={() => { if(confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) { supabase.auth.admin?.deleteUser(user!.id); onLogout() } }}>
              🗑️ Eliminar mi cuenta
            </button>
          </div>
        )}

        {/* ── TAB NOTIFICACIONES ── */}
        {tab === 'notifs' && (
          <div style={S.card}>
            <h3 style={{...S.cardTitle, marginBottom:16}}>Preferencias de notificación</h3>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              {[
                'Notificaciones por correo electrónico',
                'Notificaciones por WhatsApp',
                'Nuevas solicitudes de partido',
                'Respuestas a mis postulaciones',
                'Recordatorios de partidos próximos',
                'Jugadores que vieron mi perfil',
              ].map(pref => (
                <label key={pref} style={{display:'flex', alignItems:'center', gap:10, fontSize:'.88rem', cursor:'pointer'}}>
                  <input type="checkbox" defaultChecked style={{accentColor:'#2ecc71', width:16, height:16}} />
                  {pref}
                </label>
              ))}
            </div>
            <button style={{...S.btnSave, padding:'11px 20px', marginTop:20}} onClick={() => showToast('✅ Preferencias guardadas')}>
              💾 Guardar preferencias
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type='text' }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string }) {
  return (
    <div style={S.fgroup}>
      <label style={S.label}>{label}</label>
      <input style={S.input} type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  loading:  { textAlign:'center', padding:60, color:'#6c757d', fontFamily:'system-ui' },
  toast:    { position:'fixed', bottom:20, right:20, background:'#1a1a2e', color:'#fff', padding:'12px 18px', borderRadius:10, fontSize:'.85rem', fontWeight:600, zIndex:300, borderLeft:'4px solid #2ecc71' },
  hero:     { background:'linear-gradient(135deg,#1a1a2e,#2d2d44)', padding:'28px 20px', textAlign:'center' },
  back:     { color:'#2ecc71', cursor:'pointer', fontSize:'.82rem', fontWeight:600, textAlign:'left', display:'block', maxWidth:800, margin:'0 auto 16px', width:'100%' },
  avBig:    { width:80, height:80, borderRadius:'50%', background:'#2ecc71', border:'4px solid #27ae60', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.4rem', margin:'0 auto 12px', cursor:'pointer' },
  heroName: { color:'#fff', fontSize:'1.3rem', fontWeight:800 },
  heroUser: { color:'#aaa', fontSize:'.85rem', marginTop:4 },
  heroBadges:{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginTop:12 },
  heroBadge: { background:'rgba(255,255,255,.1)', color:'#fff', padding:'4px 12px', borderRadius:20, fontSize:'.75rem', fontWeight:600 },
  statsRow: { display:'flex', maxWidth:380, margin:'20px auto 0', background:'rgba(255,255,255,.05)', borderRadius:12, overflow:'hidden' },
  stat:     { flex:1, padding:'14px 8px', textAlign:'center', borderRight:'1px solid rgba(255,255,255,.1)' },
  statVal:  { fontSize:'1.4rem', fontWeight:800, color:'#2ecc71' },
  statLbl:  { fontSize:'.68rem', color:'#aaa', marginTop:2 },
  tabs:     { display:'flex', background:'#fff', borderBottom:'2px solid #e0e6ed', overflowX:'auto' },
  tabItem:  { padding:'14px 18px', fontSize:'.85rem', fontWeight:600, cursor:'pointer', color:'#6c757d', whiteSpace:'nowrap', borderBottomStyle:'solid', borderBottomWidth:2, borderBottomColor:'transparent', marginBottom:-2, transition:'.2s' },
  tabActive:{ color:'#27ae60', borderBottomColor:'#2ecc71' },
  body:     { maxWidth:760, margin:'0 auto', padding:'24px 16px' },
  error:    { background:'#fde8e8', color:'#c0392b', borderRadius:8, padding:'10px 14px', fontSize:'.85rem', marginBottom:14 },
  card:     { background:'#fff', borderRadius:12, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,.08)' },
  cardHdr:  { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  cardTitle:{ fontSize:'1rem', fontWeight:800 },
  btnSave:  { background:'#2ecc71', color:'#1a1a2e', border:'none', borderRadius:8, padding:'8px 18px', fontSize:'.85rem', fontWeight:700, cursor:'pointer' },
  grid2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  fgroup:   { marginBottom:12 },
  label:    { fontSize:'.8rem', fontWeight:600, display:'block', marginBottom:4, color:'#1a1a2e' },
  input:    { width:'100%', padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.88rem', outline:'none', boxSizing:'border-box' },
  select:   { width:'100%', padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.88rem', outline:'none', background:'#fff' },
  textarea: { width:'100%', padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.88rem', outline:'none', boxSizing:'border-box', resize:'vertical' },
  wspWrap:  { display:'flex', marginBottom:12 },
  wspPre:   { background:'#f4f6f8', border:'1.5px solid #e0e6ed', borderRight:'none', padding:'9px 10px', borderRadius:'8px 0 0 8px', fontSize:'.83rem', color:'#6c757d', whiteSpace:'nowrap' },
  wspIn:    { flex:1, padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:'0 8px 8px 0', fontSize:'.88rem', outline:'none' },
  avGrid:   { display:'flex', gap:8, flexWrap:'wrap', marginTop:4, marginBottom:8 },
  av:       { width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', cursor:'pointer' },
  tags:     { display:'flex', flexWrap:'wrap', gap:7, marginTop:4 },
  tag:      { padding:'5px 13px', borderRadius:20, fontSize:'.8rem', fontWeight:600, cursor:'pointer', border:'1.5px solid #e0e6ed', background:'#fff', userSelect:'none' },
  tagA:     { background:'#2ecc71', borderColor:'#27ae60', color:'#1a1a2e' },
  posBlock: { border:'1.5px solid #e0e6ed', borderRadius:10, padding:'12px 14px', marginBottom:10, background:'#f4f6f8' },
  posTitle: { fontSize:'.82rem', fontWeight:700, marginBottom:8 },
  sep:      { height:1, background:'#e0e6ed', margin:'20px 0' },
}