'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Page } from '@/app/page'

interface Props {
  goTo: (p: Page) => void
  onSuccess: () => void
}

type LoginMethod = 'email' | 'username' | 'whatsapp'

export default function LoginPage({ goTo, onSuccess }: Props) {
  const [method,   setMethod]   = useState<LoginMethod>('email')
  const [identity, setIdentity] = useState('')
  const [pass,     setPass]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent,  setForgotSent]  = useState(false)

  // ── Login principal ───────────────────────────────────────
  async function handleLogin() {
    setError('')
    if (!identity.trim()) return setError('Ingresa tu correo, usuario o WhatsApp.')
    if (!pass)            return setError('Ingresa tu contraseña.')

    setLoading(true)
    try {
      let emailToUse = identity.trim()

      // Si no es email, buscar el correo por username o whatsapp
      if (method === 'username') {
        const { data, error: err } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', identity.trim().replace('@', ''))
          .single()
        if (err || !data) throw new Error('No encontramos ese nombre de usuario.')

        // Buscar email en auth.users no es posible desde el cliente
        // Usamos una función alternativa: pedir al usuario que use su email
        throw new Error('Por ahora inicia sesión con tu correo electrónico.')
      }

      if (method === 'whatsapp') {
        const { data, error: err } = await supabase
          .from('profiles')
          .select('id')
          .eq('whatsapp', identity.trim())
          .single()
        if (err || !data) throw new Error('No encontramos ese número de WhatsApp.')
        throw new Error('Por ahora inicia sesión con tu correo electrónico.')
      }

      // Login con email
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email:    emailToUse,
        password: pass,
      })
      if (authError) throw authError
      if (!data.user) throw new Error('No se pudo iniciar sesión.')

      onSuccess()

    } catch (e: any) {
      if (e.message?.includes('Invalid login credentials'))
        setError('Correo o contraseña incorrectos. Verifica tus datos.')
      else if (e.message?.includes('Email not confirmed'))
        setError('Debes confirmar tu correo antes de ingresar.')
      else if (e.message?.includes('Too many requests'))
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.')
      else
        setError(e.message || 'Error al iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Google ────────────────────────────────────────────────
  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  // ── Recuperar contraseña ──────────────────────────────────
  async function handleForgot() {
    if (!forgotEmail.trim()) return setError('Ingresa tu correo electrónico.')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: window.location.origin + '?reset=true',
      })
      if (error) throw error
      setForgotSent(true)
    } catch (e: any) {
      setError(e.message || 'Error al enviar el correo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render: Forgot password ───────────────────────────────
  if (showForgot) {
    return (
      <div style={S.bg}>
        <div style={S.card}>
          <button style={S.back} onClick={() => { setShowForgot(false); setForgotSent(false); setError('') }}>
            ← Volver al login
          </button>
          <h1 style={S.title}>Recuperar contraseña</h1>
          <p style={S.sub}>Te enviaremos un enlace a tu correo para restablecer tu contraseña.</p>

          {error && <div style={S.error}>⚠️ {error}</div>}

          {forgotSent ? (
            <div style={S.success}>
              ✅ ¡Correo enviado! Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.
            </div>
          ) : (
            <>
              <div style={S.fgroup}>
                <label style={S.label}>Correo electrónico</label>
                <input style={S.input} type="email" placeholder="carlos@ejemplo.com"
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleForgot()} />
              </div>
              <button style={{ ...S.btnMain, opacity: loading ? .7 : 1 }}
                onClick={handleForgot} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Render: Login principal ───────────────────────────────
  return (
    <div style={S.bg}>
      <div style={S.card}>
        <h1 style={S.title}>¡Bienvenido de vuelta!</h1>
        <p style={S.sub}>
          ¿No tienes cuenta?{' '}
          <span style={S.link} onClick={() => goTo('register')}>Regístrate gratis</span>
        </p>

        {/* Google */}
        <button style={S.google} onClick={handleGoogle}>
          <GoogleIcon /> Continuar con Google
        </button>

        <div style={S.divider}><span style={S.divTxt}>o ingresa con</span></div>

        {/* Tabs método */}
        <div style={S.tabs}>
          {(['email','username','whatsapp'] as LoginMethod[]).map(m => (
            <button key={m} style={{ ...S.tab, ...(method === m ? S.tabActive : {}) }}
              onClick={() => { setMethod(m); setIdentity(''); setError('') }}>
              {m === 'email' ? 'Correo' : m === 'username' ? 'Usuario' : 'WhatsApp'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div style={S.error}>⚠️ {error}</div>}

        {/* Campo identidad */}
        <div style={S.fgroup}>
          <label style={S.label}>
            {method === 'email'     ? 'Correo electrónico' :
             method === 'username'  ? 'Nombre de usuario'  : 'WhatsApp'}
          </label>
          {method === 'whatsapp' ? (
            <div style={S.wspWrap}>
              <span style={S.wspPre}>🇨🇱 +56</span>
              <input style={S.wspInput} type="tel" placeholder="9 XXXX XXXX"
                value={identity} onChange={e => setIdentity(e.target.value)} />
            </div>
          ) : (
            <input style={S.input}
              type={method === 'email' ? 'email' : 'text'}
              placeholder={method === 'email' ? 'carlos@ejemplo.com' : '@carlos_futbol'}
              value={identity} onChange={e => setIdentity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          )}
        </div>

        {/* Contraseña */}
        <div style={S.fgroup}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <label style={S.label}>Contraseña</label>
            <span style={S.forgotLink} onClick={() => { setShowForgot(true); setError('') }}>
              Olvidé mi contraseña
            </span>
          </div>
          <input style={S.input} type="password" placeholder="••••••••"
            value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        {/* Botón login */}
        <button style={{ ...S.btnMain, opacity: loading ? .7 : 1 }}
          onClick={handleLogin} disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar a FaltaUno'}
        </button>

        {/* Info demo */}
        <div style={S.info}>
          💡 <strong>Tip:</strong> Inicia sesión con el correo y contraseña que usaste al registrarte.
        </div>
      </div>
    </div>
  )
}

// ── Íconos y sub-componentes ──────────────────────────────────

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
  bg:         { background:'#f4f6f8', minHeight:'100vh', padding:'40px 16px', display:'flex', alignItems:'center', justifyContent:'center' },
  card:       { background:'#fff', borderRadius:12, padding:32, maxWidth:460, width:'100%', boxShadow:'0 4px 20px rgba(0,0,0,.08)' },
  title:      { fontSize:'1.4rem', fontWeight:800, marginBottom:4, fontFamily:'system-ui' },
  sub:        { color:'#6c757d', fontSize:'.88rem', marginBottom:20 },
  link:       { color:'#27ae60', cursor:'pointer', fontWeight:600 },
  google:     { width:'100%', padding:10, border:'1.5px solid #e0e6ed', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:'.88rem', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:9, marginBottom:4 },
  divider:    { textAlign:'center', margin:'16px 0', position:'relative', borderTop:'1px solid #e0e6ed' },
  divTxt:     { background:'#fff', padding:'0 12px', position:'relative', top:-10, color:'#6c757d', fontSize:'.83rem' },
  tabs:       { display:'flex', gap:3, background:'#f4f6f8', borderRadius:9, padding:3, marginBottom:18 },
  tab:        { flex:1, padding:'8px', textAlign:'center', borderRadius:7, fontSize:'.82rem', fontWeight:600, cursor:'pointer', border:'none', background:'transparent', color:'#6c757d', transition:'.2s' },
  tabActive:  { background:'#fff', color:'#1a1a2e', boxShadow:'0 2px 6px rgba(0,0,0,.07)' },
  error:      { background:'#fde8e8', color:'#c0392b', borderRadius:8, padding:'10px 14px', fontSize:'.85rem', marginBottom:14 },
  success:    { background:'#d5f5e3', color:'#1e8449', borderRadius:8, padding:'12px 14px', fontSize:'.88rem', marginBottom:14 },
  fgroup:     { marginBottom:14 },
  label:      { fontSize:'.8rem', fontWeight:600, display:'block', color:'#1a1a2e' },
  input:      { width:'100%', padding:'10px 12px', border:'1.5px solid #e0e6ed', borderRadius:8, fontSize:'.9rem', outline:'none', boxSizing:'border-box' },
  wspWrap:    { display:'flex' },
  wspPre:     { background:'#f4f6f8', border:'1.5px solid #e0e6ed', borderRight:'none', padding:'10px 10px', borderRadius:'8px 0 0 8px', fontSize:'.83rem', color:'#6c757d', whiteSpace:'nowrap' },
  wspInput:   { flex:1, padding:'10px 12px', border:'1.5px solid #e0e6ed', borderRadius:'0 8px 8px 0', fontSize:'.9rem', outline:'none' },
  forgotLink: { fontSize:'.8rem', color:'#27ae60', cursor:'pointer', fontWeight:600 },
  btnMain:    { width:'100%', padding:13, background:'#2ecc71', color:'#1a1a2e', border:'none', borderRadius:10, fontSize:'.95rem', fontWeight:700, cursor:'pointer', marginTop:4 },
  info:       { background:'#e8f4fd', color:'#1a6fa8', borderRadius:8, padding:'10px 14px', fontSize:'.82rem', marginTop:14 },
  back:       { background:'none', border:'none', color:'#27ae60', fontWeight:600, cursor:'pointer', fontSize:'.85rem', marginBottom:16, padding:0 },
}
