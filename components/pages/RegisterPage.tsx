'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Page } from '@/app/page'

interface Props {
  goTo: (p: Page) => void
  onSuccess: () => void
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
  { n: '🏋️ Fitness',          p: ['Crossfit','Calistenia','Levantamiento','Cardio','Cualquiera'] },
]

const REGIONES: Record<string, string[]> = {
  'Metropolitana':     ['Santiago','Providencia','Ñuñoa','Maipú','La Florida','Las Condes','San Bernardo','Puente Alto'],
  'Valparaíso':        ['Valparaíso','Viña del Mar','Quilpué','Villa Alemana','San Antonio'],
  'Biobío':            ['Concepción','Talcahuano','San Pedro de la Paz','Coronel'],
  'Maule':             ['Talca','Curicó','Linares'],
  'La Araucanía':      ['Temuco','Villarrica'],
  'Los Lagos':         ['Puerto Montt','Osorno','Puerto Varas'],
  'Antofagasta':       ['Antofagasta','Calama'],
  "O'Higgins":         ['Rancagua','San Fernando'],
  'Coquimbo':          ['La Serena','Coquimbo'],
  'Tarapacá':          ['Iquique','Alto Hospicio'],
  'Atacama':           ['Copiapó','Vallenar'],
  'Ñuble':             ['Chillán'],
  'Los Ríos':          ['Valdivia'],
  'Aysén':             ['Coyhaique'],
  'Magallanes':        ['Punta Arenas'],
  'Arica y Parinacota':['Arica'],
}

const AVATARS = [
  { e:'⚽', bg:'#2ecc71' }, { e:'🏀', bg:'#3498db' }, { e:'🏉', bg:'#e74c3c' },
  { e:'🚴', bg:'#f39c12' }, { e:'🎽', bg:'#9b59b6' }, { e:'⚾', bg:'#1abc9c' },
  { e:'🥾', bg:'#27ae60' }, { e:'🏋️', bg:'#e67e22' },
]

export default function RegisterPage({ goTo, onSuccess }: Props) {
  // Datos personales
  const [nombre,   setNombre]   = useState('')
  const [apellido, setApellido] = useState('')
  const [email,    setEmail]    = useState('')
  const [wsp,      setWsp]      = useState('')
  const [username, setUsername] = useState('')
  const [pass,     setPass]     = useState('')
  const [pass2,    setPass2]    = useState('')
  const [region,   setRegion]   = useState('')
  const [ciudad,   setCiudad]   = useState('')
  const [genero,   setGenero]   = useState('')
  const [edad,     setEdad]     = useState('')
  const [nivel,    setNivel]    = useState('Intermedio')
  const [tipo,     setTipo]     = useState('Ambos')
  const [avatar,   setAvatar]   = useState('⚽')
  const [terms,    setTerms]    = useState(false)

  // Deportes y posiciones
  const [deportesActivos, setDeportesActivos]     = useState<string[]>([])
  const [posiciones,      setPosiciones]           = useState<Record<string, string[]>>({})

  // Estado UI
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [step,    setStep]    = useState(1) // 1=datos personales, 2=deportes

  // ── Helpers ──────────────────────────────────────────────
  function toggleDeporte(dep: string) {
    setDeportesActivos(prev =>
      prev.includes(dep) ? prev.filter(d => d !== dep) : [...prev, dep]
    )
    if (!posiciones[dep]) {
      setPosiciones(prev => ({ ...prev, [dep]: [] }))
    }
  }

  function togglePosicion(dep: string, pos: string) {
    setPosiciones(prev => {
      const cur = prev[dep] || []
      return { ...prev, [dep]: cur.includes(pos) ? cur.filter(p => p !== pos) : [...cur, pos] }
    })
  }

  // ── Registro ─────────────────────────────────────────────
  async function handleRegister() {
    setError('')

    // Validaciones
    if (!terms)               return setError('Debes aceptar los Términos y Condiciones.')
    if (!nombre.trim())       return setError('El nombre es obligatorio.')
    if (!email.trim())        return setError('El correo es obligatorio.')
    if (!username.trim())     return setError('El nombre de usuario es obligatorio.')
    if (pass.length < 6)      return setError('La contraseña debe tener al menos 6 caracteres.')
    if (pass !== pass2)       return setError('Las contraseñas no coinciden.')
    if (!deportesActivos.length) return setError('Selecciona al menos un deporte.')

    setLoading(true)
    try {
      // 1. Crear usuario en Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: { data: { nombre, apellido, username } }
      })

      if (authError) throw authError
      if (!data.user) throw new Error('No se pudo crear el usuario.')

      const uid = data.user.id

      // 2. Esperar brevemente a que el trigger cree el perfil base
      await new Promise(r => setTimeout(r, 800))

      // 3. Actualizar perfil con todos los datos del formulario
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nombre:       nombre.trim(),
          apellido:     apellido.trim(),
          username:     username.trim().replace('@', ''),
          whatsapp:     wsp.trim(),
          avatar,
          region,
          ciudad,
          genero,
          rango_edad:   edad,
          nivel,
          tipo_usuario: tipo.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim(),
        })
        .eq('id', uid)
      if (profileError) throw profileError

      // 3. Guardar deportes y posiciones
      const rows = deportesActivos.map(dep => ({
        user_id:    uid,
        deporte:    dep,
        posiciones: posiciones[dep] || [],
      }))
      if (rows.length > 0) {
        const { error: depError } = await supabase
          .from('deportes_usuario')
          .upsert(rows, { onConflict: 'user_id,deporte' })
        if (depError) throw depError
      }

      // 4. Éxito → ir a modo
      onSuccess()

    } catch (e: any) {
      console.error('Error registro:', e)
      if (e.message?.includes('already registered') || e.message?.includes('already been registered'))
        setError('Este correo ya está registrado. Intenta iniciar sesión.')
      else if (e.message?.includes('duplicate') && e.message?.includes('username'))
        setError('Ese nombre de usuario ya está en uso. Elige otro.')
      else if (e.message?.includes('invalid') && e.message?.includes('email'))
        setError('El correo ingresado no es válido.')
      else
        setError(`Error: ${e.message || 'Intenta de nuevo.'}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Google ────────────────────────────────────────────────
  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/modo' }
    })
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={S.bg}>
      <div style={S.card}>
        <h1 style={S.title}>Crear cuenta en FaltaUno</h1>
        <p style={S.sub}>¿Ya tienes cuenta? <span style={S.link} onClick={() => goTo('login')}>Inicia sesión aquí</span></p>

        {/* Google */}
        <button style={S.google} onClick={handleGoogle}>
          <GoogleIcon /> Continuar con Google
        </button>
        <div style={S.divider}><span style={S.divTxt}>o regístrate con correo</span></div>

        {/* Error */}
        {error && <div style={S.error}>⚠️ {error}</div>}

        {/* PASO 1: Datos personales */}
        {step === 1 && (
          <>
            <div style={S.grid2}>
              <Field label="Nombre *"   value={nombre}   onChange={setNombre}   placeholder="Carlos" />
              <Field label="Apellido *" value={apellido} onChange={setApellido} placeholder="Rodríguez" />
            </div>
            <Field label="Correo electrónico *" type="email" value={email} onChange={setEmail} placeholder="carlos@ejemplo.com" />
            <div style={S.wspWrap}>
              <span style={S.wspPre}>🇨🇱 +56</span>
              <input style={S.wspInput} type="tel" placeholder="9 XXXX XXXX" value={wsp} onChange={e => setWsp(e.target.value)} />
            </div>
            <Field label="Nombre de usuario *" value={username} onChange={setUsername} placeholder="@carlos_futbol" />
            <div style={S.grid2}>
              <Field label="Contraseña *"         type="password" value={pass}  onChange={setPass}  placeholder="••••••••" />
              <Field label="Confirmar contraseña *" type="password" value={pass2} onChange={setPass2} placeholder="••••••••" />
            </div>

            {/* Región / Ciudad */}
            <div style={S.grid2}>
              <div style={S.fgroup}>
                <label style={S.label}>Región *</label>
                <select style={S.select} value={region} onChange={e => { setRegion(e.target.value); setCiudad('') }}>
                  <option value="">Selecciona región</option>
                  {Object.keys(REGIONES).map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={S.fgroup}>
                <label style={S.label}>Ciudad *</label>
                <select style={S.select} value={ciudad} onChange={e => setCiudad(e.target.value)} disabled={!region}>
                  <option value="">Selecciona ciudad</option>
                  {(REGIONES[region] || []).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={S.fgroup}>
                <label style={S.label}>Género</label>
                <select style={S.select} value={genero} onChange={e => setGenero(e.target.value)}>
                  <option value="">Selecciona</option>
                  <option>Masculino</option><option>Femenino</option>
                  <option>No binario</option><option>Prefiero no decir</option>
                </select>
              </div>
              <div style={S.fgroup}>
                <label style={S.label}>Rango de edad</label>
                <select style={S.select} value={edad} onChange={e => setEdad(e.target.value)}>
                  <option value="">Opcional</option>
                  <option>18–25</option><option>26–35</option><option>36–45</option><option>46+</option>
                </select>
              </div>
            </div>

            {/* Avatar */}
            <div style={S.fgroup}>
              <label style={S.label}>Avatar</label>
              <div style={S.avGrid}>
                {AVATARS.map(a => (
                  <div key={a.e} style={{ ...S.av, background: a.bg, borderColor: avatar === a.e ? '#2ecc71' : 'transparent' }}
                    onClick={() => setAvatar(a.e)}>{a.e}</div>
                ))}
              </div>
            </div>

            {/* Tipo y nivel */}
            <TagGroup label="Tipo de usuario *" options={['🏃 Player','📋 Organizador','⚡ Ambos']} value={tipo}
              onChange={v => setTipo(v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g,'').trim())} single />
            <TagGroup label="Nivel de juego"    options={['Básico','Intermedio','Avanzado']} value={nivel} onChange={setNivel} single />

            <button style={S.btnNext} onClick={() => setStep(2)}>
              Siguiente: Deportes →
            </button>
          </>
        )}

        {/* PASO 2: Deportes */}
        {step === 2 && (
          <>
            <button style={S.btnBack} onClick={() => setStep(1)}>← Volver</button>

            <div style={S.fgroup}>
              <label style={S.label}>Deportes de interés * (selección múltiple)</label>
              <div style={S.tags}>
                {SPORTS.map(sp => (
                  <span key={sp.n} style={{ ...S.tag, ...(deportesActivos.includes(sp.n) ? S.tagActive : {}) }}
                    onClick={() => toggleDeporte(sp.n)}>{sp.n}</span>
                ))}
              </div>
            </div>

            {/* Posiciones por deporte */}
            {deportesActivos.map(dep => {
              const sport = SPORTS.find(s => s.n === dep)
              if (!sport) return null
              return (
                <div key={dep} style={S.posBlock}>
                  <div style={S.posTitle}>{dep}</div>
                  <div style={S.tags}>
                    {sport.p.map(pos => {
                      const active = (posiciones[dep] || []).includes(pos)
                      return (
                        <span key={pos} style={{ ...S.tag, ...(active ? S.tagActive : {}) }}
                          onClick={() => togglePosicion(dep, pos)}>{pos}</span>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Términos */}
            <label style={S.chk}>
              <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} style={{ accentColor:'#2ecc71' }} />
              <span>Acepto los <span style={S.link}>Términos y Condiciones</span> y la <span style={S.link}>Política de Privacidad</span> *</span>
            </label>

            <button style={{ ...S.btnNext, opacity: loading ? .7 : 1 }} onClick={handleRegister} disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear mi cuenta en FaltaUno 🚀'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div style={S.fgroup}>
      <label style={S.label}>{label}</label>
      <input style={S.input} type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function TagGroup({ label, options, value, onChange, single }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; single?: boolean
}) {
  return (
    <div style={S.fgroup}>
      <label style={S.label}>{label}</label>
      <div style={S.tags}>
        {options.map(o => (
          <span key={o} style={{ ...S.tag, ...(value === o.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g,'').trim() || value === o ? S.tagActive : {}) }}
            onClick={() => onChange(o)}>{o}</span>
        ))}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

// ── Estilos ───────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  bg:       { background:'#f4f6f8', minHeight:'100vh', padding:'24px 16px' },
  card:     { background:'#fff', borderRadius:12, padding:28, maxWidth:580, margin:'0 auto', boxShadow:'0 4px 20px rgba(0,0,0,.08)' },
  title:    { fontSize:'1.3rem', fontWeight:800, marginBottom:4, fontFamily:'system-ui' },
  sub:      { color:'#6c757d', fontSize:'.88rem', marginBottom:20 },
  link:     { color:'#27ae60', cursor:'pointer', fontWeight:600 },
  google:   { width:'100%', padding:10, border:'1.5px solid #e0e6ed', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:'.88rem', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:9 },
  divider:  { textAlign:'center', margin:'16px 0', position:'relative', borderTop:'1px solid #e0e6ed' },
  divTxt:   { background:'#fff', padding:'0 12px', position:'relative', top:-10, color:'#6c757d', fontSize:'.83rem' },
  error:    { background:'#fde8e8', color:'#c0392b', borderRadius:8, padding:'10px 14px', fontSize:'.85rem', marginBottom:14 },
  grid2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  fgroup:   { marginBottom:12 },
  label:    { fontSize:'.8rem', fontWeight:600, display:'block', marginBottom:4, color:'#1a1a2e' },
  input:    { width:'100%', padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.88rem', outline:'none', boxSizing:'border-box' },
  select:   { width:'100%', padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.88rem', outline:'none', background:'#fff' },
  wspWrap:  { display:'flex', marginBottom:12 },
  wspPre:   { background:'#f4f6f8', border:'1.5px solid #e0e6ed', borderRight:'none', padding:'9px 10px', borderRadius:'8px 0 0 8px', fontSize:'.83rem', color:'#6c757d', whiteSpace:'nowrap' },
  wspInput: { flex:1, padding:'9px 12px', border:'1.5px solid #e0e6ed', borderRadius:'0 8px 8px 0', fontSize:'.88rem', outline:'none' },
  avGrid:   { display:'flex', gap:8, flexWrap:'wrap', marginTop:4 },
  av:       { width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', cursor:'pointer', transition:'.2s', borderStyle:'solid', borderWidth:3 },
  tags:     { display:'flex', flexWrap:'wrap', gap:7, marginTop:4 },
  tag:      { padding:'5px 13px', borderRadius:20, fontSize:'.8rem', fontWeight:600, cursor:'pointer', border:'1.5px solid #e0e6ed', background:'#fff', userSelect:'none' },
  tagActive:{ background:'#2ecc71', borderColor:'#27ae60', color:'#1a1a2e' },
  posBlock: { border:'1.5px solid #e0e6ed', borderRadius:10, padding:'12px 14px', marginBottom:10, background:'#f4f6f8' },
  posTitle: { fontSize:'.82rem', fontWeight:700, marginBottom:8, color:'#1a1a2e' },
  chk:      { display:'flex', alignItems:'flex-start', gap:9, fontSize:'.83rem', color:'#6c757d', marginBottom:16, cursor:'pointer' },
  btnNext:  { width:'100%', padding:13, background:'#2ecc71', color:'#1a1a2e', border:'none', borderRadius:10, fontSize:'.95rem', fontWeight:700, cursor:'pointer', marginTop:8 },
  btnBack:  { background:'none', border:'none', color:'#27ae60', fontWeight:600, cursor:'pointer', fontSize:'.85rem', marginBottom:16, padding:0 },
}