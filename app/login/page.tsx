'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
      transition: 'background 0.2s ease'
    }}>
      <div style={{
        textAlign: 'center', padding: '48px',
        border: '1px solid var(--border)', borderRadius: '12px',
        background: 'var(--bg-panel)', maxWidth: '380px', width: '100%',
        animation: 'fadeIn 0.3s ease',
        transition: 'background 0.2s ease, border-color 0.2s ease'
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.25em',
          color: 'var(--text-dimmer)', textTransform: 'uppercase', marginBottom: '12px'
        }}>
          Prompt Chain Tool
        </div>
        <h1 style={{
          fontFamily: 'var(--sans)', fontSize: '28px', fontWeight: '800',
          marginBottom: '8px', color: 'var(--text)'
        }}>
          crackd.
        </h1>
        <p style={{
          color: 'var(--text-dim)', fontSize: '13px',
          marginBottom: '32px', fontFamily: 'var(--mono)'
        }}>
          Superadmin access only
        </p>
        <button onClick={signIn} style={{
          width: '100%', padding: '14px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '6px', fontFamily: 'var(--mono)', fontSize: '12px',
          fontWeight: '700', letterSpacing: '0.1em', cursor: 'pointer',
          transition: 'opacity 0.15s'
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Sign in with Google →
        </button>
      </div>
    </div>
  )
}