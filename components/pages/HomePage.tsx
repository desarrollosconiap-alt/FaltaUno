'use client'

import type { Page } from '@/app/page'

interface Props {
  goTo: (p: Page) => void
}

export default function HomePage({ goTo }: Props) {
  return (
    <div>
      {/* HERO */}
      <div style={styles.hero}>
        <h1 style={styles.h1}>
          Falta <span style={styles.green}>uno</span>.<br />Ya no más.
        </h1>
        <p style={styles.sub}>
          Conectamos jugadores con organizadores de partidos en todo Chile.
          Encuentra tu próximo partido o completa tu equipo en minutos.
        </p>
        <div style={styles.btns}>
          <button style={styles.btnGreen} onClick={() => goTo('register')}>
            Quiero jugar ⚽
          </button>
          <button style={styles.btnOutline} onClick={() => goTo('register')}>
            Tengo cancha, busco jugadores 🏟️
          </button>
        </div>
      </div>

      {/* FEATURES */}
      <div style={styles.features}>
        <h2 style={styles.h2}>¿Cómo funciona?</h2>
        <div style={styles.grid}>
          {[
            {
              icon: '📋',
              title: 'Regístrate',
              desc: 'Crea tu perfil, elige tu deporte y dinos cuándo puedes jugar.',
            },
            {
              icon: '🔍',
              title: 'Busca o publica',
              desc: 'Encuentra partidos cerca tuyo o publica el tuyo.',
            },
            {
              icon: '📩',
              title: 'Postula o solicita',
              desc: 'Conecta con el organizador o jugador con un clic.',
            },
            {
              icon: '🟢',
              title: '¡A jugar!',
              desc: 'Coordina por WhatsApp. ¡Así de simple!',
            },
          ].map(f => (
            <div key={f.title} style={styles.card}>
              <div style={styles.cardIcon}>{f.icon}</div>
              <h3 style={styles.cardTitle}>{f.title}</h3>
              <p style={styles.cardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  hero:       {
    background: 'linear-gradient(135deg,#1a1a2e,#2d2d44)',
    color: '#fff',
    padding: '70px 24px',
    textAlign: 'center',
  },
  h1:         {
    fontSize: '2.6rem',
    fontWeight: 900,
    lineHeight: 1.1,
    fontFamily: 'system-ui',
  },
  green:      { color: '#2ecc71' },
  sub:        {
    margin: '14px auto',
    maxWidth: 500,
    color: '#aaa',
    fontSize: '1rem',
    fontFamily: 'system-ui',
  },
  btns:       {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 28,
  },
  btnGreen:   {
    background: '#2ecc71',
    color: '#1a1a2e',
    border: 'none',
    padding: '11px 24px',
    borderRadius: 10,
    fontSize: '.9rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnOutline: {
    background: 'transparent',
    border: '2px solid #fff',
    color: '#fff',
    padding: '11px 24px',
    borderRadius: 10,
    fontSize: '.9rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  features:   {
    padding: '50px 24px',
    maxWidth: 960,
    margin: '0 auto',
  },
  h2:         {
    textAlign: 'center',
    fontSize: '1.6rem',
    marginBottom: 32,
    fontFamily: 'system-ui',
  },
  grid:       {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
    gap: 16,
  },
  card:       {
    background: '#fff',
    borderRadius: 12,
    padding: '24px 16px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,.08)',
  },
  cardIcon:   { fontSize: '2.2rem', marginBottom: 10 },
  cardTitle:  {
    fontSize: '.95rem',
    marginBottom: 6,
    fontWeight: 700,
    fontFamily: 'system-ui',
  },
  cardDesc:   {
    fontSize: '.82rem',
    color: '#6c757d',
    fontFamily: 'system-ui',
  },
}