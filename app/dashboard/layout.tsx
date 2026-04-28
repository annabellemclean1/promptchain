import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ThemeToggle from './ThemeToggle'
import SignOutButton from './SignOutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin, email')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect('/unauthorized')

  const isAdmin =
    profile.is_superadmin === true || profile.is_matrix_admin === true

  if (!isAdmin) redirect('/unauthorized')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 28px',
        height: '52px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: '13px',
          fontWeight: '700',
          color: 'var(--accent)',
          letterSpacing: '0.05em',
        }}>
          prompt-chain-tool
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: 'var(--text-dimmer)',
          }}>
            {profile.email}
          </span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </nav>

      <main>{children}</main>
    </div>
  )
}