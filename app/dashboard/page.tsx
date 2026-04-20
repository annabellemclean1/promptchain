'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Flavor = { id: number; slug: string; description: string; created_datetime_utc: string }
type Step = {
  id: number; order_by: number; description: string; llm_system_prompt: string;
  llm_user_prompt: string; llm_temperature: number; llm_model_id: number;
  humor_flavor_id: number; humor_flavor_step_type_id: number;
  llm_input_type_id: number; llm_output_type_id: number;
}
type Image = { id: string; url: string }
type Caption = { id: string; content: string }

// ── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#0d1117',
  bgPanel:   '#161b22',
  bgHover:   '#1f2937',
  border:    '#30363d',
  accent:    '#f97316',   // warm orange
  accentDim: 'rgba(249,115,22,0.15)',
  teal:      '#22d3ee',
  blue:      '#60a5fa',
  red:       '#f87171',
  redDim:    'rgba(248,113,113,0.12)',
  text:      '#e6edf3',
  textDim:   '#8b949e',
  textDimmer:'#484f58',
}

const panel: React.CSSProperties = {
  background: C.bgPanel,
  border: `1px solid ${C.border}`,
  borderRadius: '10px',
  overflow: 'hidden',
}

const btn: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: '6px',
  border: `1px solid ${C.border}`,
  background: C.bgHover,
  color: C.textDim,
  fontSize: '11px',
  fontWeight: '600',
  cursor: 'pointer',
  letterSpacing: '0.03em',
  transition: 'all 0.15s',
}

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: C.accent,
  border: `1px solid ${C.accent}`,
  color: '#fff',
}

const btnDanger: React.CSSProperties = {
  ...btn,
  background: C.redDim,
  border: `1px solid ${C.red}`,
  color: C.red,
}

const btnDuplicate: React.CSSProperties = {
  ...btn,
  background: 'rgba(34,211,238,0.1)',
  border: `1px solid ${C.teal}`,
  color: C.teal,
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: '6px',
  color: C.text,
  fontSize: '12px',
  fontFamily: 'monospace',
  boxSizing: 'border-box',
  outline: 'none',
}

export default function DashboardPage() {
  const supabase = createClient()

  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor | null>(null)
  const [flavorModal, setFlavorModal] = useState<'create' | 'edit' | 'delete' | 'duplicate' | null>(null)
  const [flavorForm, setFlavorForm] = useState({ slug: '', description: '' })
  const [duplicateSlug, setDuplicateSlug] = useState('')

  const [steps, setSteps] = useState<Step[]>([])
  const [stepModal, setStepModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const [stepForm, setStepForm] = useState({
    description: '', llm_system_prompt: '', llm_user_prompt: '',
    llm_temperature: '0.7', llm_model_id: '', humor_flavor_step_type_id: '',
    llm_input_type_id: '1', llm_output_type_id: '1'
  })

  const [flavorCaptions, setFlavorCaptions] = useState<Caption[]>([])
  const [captionsLoading, setCaptionsLoading] = useState(false)

  const [images, setImages] = useState<Image[]>([])
  const [selectedImageId, setSelectedImageId] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [testError, setTestError] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadFlavors(); loadImages() }, [])

  useEffect(() => {
    if (selectedFlavor) { loadSteps(selectedFlavor.id); loadFlavorCaptions(selectedFlavor.id) }
  }, [selectedFlavor])

  const loadFlavors = async () => {
    setLoading(true)
    const { data } = await supabase.from('humor_flavors').select('*').order('id')
    setFlavors(data || [])
    setLoading(false)
  }

  const loadSteps = async (flavorId: number) => {
    const { data } = await supabase.from('humor_flavor_steps').select('*')
      .eq('humor_flavor_id', flavorId).order('order_by')
    setSteps(data || [])
  }

  const loadFlavorCaptions = async (flavorId: number) => {
    setCaptionsLoading(true)
    const { data } = await supabase.from('captions').select('id, content')
      .eq('humor_flavor_id', flavorId).order('created_datetime_utc', { ascending: false }).limit(20)
    setFlavorCaptions(data || [])
    setCaptionsLoading(false)
  }

  const loadImages = async () => {
    const { data } = await supabase.from('images').select('id, url').limit(50)
    setImages(data || [])
    if (data && data.length > 0) setSelectedImageId(data[0].id)
  }

  const openCreateFlavor = () => { setFlavorForm({ slug: '', description: '' }); setError(''); setFlavorModal('create') }
  const openEditFlavor = (f: Flavor) => { setFlavorForm({ slug: f.slug, description: f.description }); setError(''); setFlavorModal('edit') }
  const openDeleteFlavor = () => { setError(''); setFlavorModal('delete') }
  const openDuplicateFlavor = () => {
    setDuplicateSlug(`${selectedFlavor?.slug}-copy`)
    setError('')
    setFlavorModal('duplicate')
  }

  const saveFlavor = async () => {
    setSaving(true); setError('')
    const payload = { slug: flavorForm.slug, description: flavorForm.description }
    const { error: e } = flavorModal === 'create'
      ? await supabase.from('humor_flavors').insert(payload)
      : await supabase.from('humor_flavors').update(payload).eq('id', selectedFlavor!.id)
    if (e) { setError(e.message); setSaving(false); return }
    setSaving(false); setFlavorModal(null); loadFlavors()
    if (flavorModal === 'edit' && selectedFlavor) setSelectedFlavor({ ...selectedFlavor, ...payload })
  }

  const deleteFlavor = async () => {
    if (!selectedFlavor) return
    setSaving(true)
    const { error: e } = await supabase.from('humor_flavors').delete().eq('id', selectedFlavor.id)
    if (e) { setError(e.message); setSaving(false); return }
    setSaving(false); setFlavorModal(null); setSelectedFlavor(null); setSteps([]); loadFlavors()
  }

  const duplicateFlavor = async () => {
    if (!selectedFlavor || !duplicateSlug.trim()) return
    setSaving(true); setError('')

    // 1. Insert new flavor
    const { data: newFlavor, error: flavorErr } = await supabase
      .from('humor_flavors')
      .insert({ slug: duplicateSlug.trim(), description: selectedFlavor.description })
      .select()
      .single()

    if (flavorErr || !newFlavor) { setError(flavorErr?.message || 'Failed to create flavor'); setSaving(false); return }

    // 2. Load steps from source flavor
    const { data: sourceSteps } = await supabase
      .from('humor_flavor_steps')
      .select('*')
      .eq('humor_flavor_id', selectedFlavor.id)
      .order('order_by')

    // 3. Insert cloned steps under new flavor
    if (sourceSteps && sourceSteps.length > 0) {
      const clonedSteps = sourceSteps.map(({ id, humor_flavor_id, ...rest }: any) => ({
        ...rest,
        humor_flavor_id: newFlavor.id,
      }))
      const { error: stepsErr } = await supabase.from('humor_flavor_steps').insert(clonedSteps)
      if (stepsErr) { setError(stepsErr.message); setSaving(false); return }
    }

    setSaving(false)
    setFlavorModal(null)
    await loadFlavors()
    setSelectedFlavor(newFlavor)
  }

  const openCreateStep = () => {
    setStepForm({
      description: '', llm_system_prompt: '', llm_user_prompt: '',
      llm_temperature: '0.7', llm_model_id: '6', humor_flavor_step_type_id: '1',
      llm_input_type_id: '1', llm_output_type_id: '1'
    })
    setError(''); setStepModal('create')
  }

  const openEditStep = (s: Step) => {
    setSelectedStep(s)
    setStepForm({
      description: s.description ?? '',
      llm_system_prompt: s.llm_system_prompt ?? '',
      llm_user_prompt: s.llm_user_prompt ?? '',
      llm_temperature: String(s.llm_temperature ?? 0.7),
      llm_model_id: String(s.llm_model_id ?? '6'),
      humor_flavor_step_type_id: String(s.humor_flavor_step_type_id ?? '1'),
      llm_input_type_id: String(s.llm_input_type_id ?? '1'),
      llm_output_type_id: String(s.llm_output_type_id ?? '1'),
    })
    setError(''); setStepModal('edit')
  }

  const openDeleteStep = (s: Step) => { setSelectedStep(s); setError(''); setStepModal('delete') }

  const saveStep = async () => {
    if (!selectedFlavor) return
    setSaving(true); setError('')
    const maxOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order_by)) : 0
    const payload: any = {
      humor_flavor_id: selectedFlavor.id,
      description: stepForm.description || null,
      llm_system_prompt: stepForm.llm_system_prompt || null,
      llm_user_prompt: stepForm.llm_user_prompt || null,
      llm_temperature: stepForm.llm_temperature ? Number(stepForm.llm_temperature) : null,
      llm_model_id: stepForm.llm_model_id ? Number(stepForm.llm_model_id) : null,
      humor_flavor_step_type_id: stepForm.humor_flavor_step_type_id ? Number(stepForm.humor_flavor_step_type_id) : 1,
      llm_input_type_id: stepForm.llm_input_type_id ? Number(stepForm.llm_input_type_id) : 1,
      llm_output_type_id: stepForm.llm_output_type_id ? Number(stepForm.llm_output_type_id) : 1,
    }
    if (stepModal === 'create') payload.order_by = maxOrder + 1
    const { error: e } = stepModal === 'create'
      ? await supabase.from('humor_flavor_steps').insert(payload)
      : await supabase.from('humor_flavor_steps').update(payload).eq('id', selectedStep!.id)
    if (e) { setError(e.message); setSaving(false); return }
    setSaving(false); setStepModal(null); loadSteps(selectedFlavor.id)
  }

  const deleteStep = async () => {
    if (!selectedStep || !selectedFlavor) return
    setSaving(true)
    const { error: e } = await supabase.from('humor_flavor_steps').delete().eq('id', selectedStep.id)
    if (e) { setError(e.message); setSaving(false); return }
    setSaving(false); setStepModal(null); loadSteps(selectedFlavor.id)
  }

  const moveStep = async (step: Step, dir: 'up' | 'down') => {
    const idx = steps.findIndex(s => s.id === step.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= steps.length) return
    const swap = steps[swapIdx]
    await supabase.from('humor_flavor_steps').update({ order_by: swap.order_by }).eq('id', step.id)
    await supabase.from('humor_flavor_steps').update({ order_by: step.order_by }).eq('id', swap.id)
    loadSteps(selectedFlavor!.id)
  }

  const testFlavor = async () => {
    if (!selectedFlavor || !selectedImageId) return
    setTestLoading(true); setTestError(''); setTestResults([])
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('Session expired — please sign in again')

      const res = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: selectedImageId, humorFlavorId: selectedFlavor.id })
      })
      if (!res.ok) { const t = await res.text(); throw new Error(`Server Error: ${t}`) }
      const rawText = await res.text()
      const data = JSON.parse(rawText)
      setTestResults(Array.isArray(data) ? data : [data])
    } catch (e: any) {
      setTestError(e.message)
    } finally {
      setTestLoading(false)
    }
  }

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    backdropFilter: 'blur(4px)',
  }

  const modalBox = (width = '460px'): React.CSSProperties => ({
    background: C.bgPanel, border: `1px solid ${C.border}`,
    borderRadius: '12px', width, padding: '28px',
    maxHeight: '85vh', overflowY: 'auto',
  })

  const label: React.CSSProperties = {
    fontSize: '10px', color: C.textDimmer, marginBottom: '4px',
    letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block',
  }

  const errBox: React.CSSProperties = {
    background: C.redDim, color: C.red,
    padding: '8px 12px', marginBottom: '16px',
    fontSize: '12px', borderRadius: '6px',
  }

  return (
    <div style={{ padding: '28px 32px', background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '9px', color: C.textDimmer, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '6px' }}>
          Humor Flavor Manager
        </div>
        <h1 style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: '800', color: C.text, margin: 0 }}>
          Prompt Chain Tool
        </h1>
      </div>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* LEFT — sticky flavor list */}
        <div style={{ ...panel, position: 'sticky', top: '72px', maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textDim }}>
              Humor Flavors
            </span>
            <button style={btnPrimary} onClick={openCreateFlavor}>+</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: C.textDimmer, fontSize: '11px' }}>Loading…</div>
            ) : flavors.map(f => (
              <div key={f.id} onClick={() => setSelectedFlavor(f)} style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
                background: selectedFlavor?.id === f.id ? C.accentDim : 'transparent',
                borderLeft: selectedFlavor?.id === f.id ? `3px solid ${C.accent}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: selectedFlavor?.id === f.id ? C.accent : C.text, marginBottom: '2px' }}>{f.slug}</div>
                <div style={{ fontSize: '10px', color: C.textDimmer, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description || 'No description'}</div>
              </div>
            ))}
            {flavors.length === 0 && !loading && (
              <div style={{ padding: '24px', textAlign: 'center', color: C.textDimmer, fontSize: '11px' }}>No flavors yet.</div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        {selectedFlavor ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Flavor Header */}
            <div style={{ ...panel, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '9px', color: C.textDimmer, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Flavor #{selectedFlavor.id}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '800', color: C.accent, marginBottom: '4px' }}>{selectedFlavor.slug}</div>
                  <div style={{ fontSize: '12px', color: C.textDim }}>{selectedFlavor.description || 'No description'}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button style={btnDuplicate} onClick={openDuplicateFlavor}>Duplicate</button>
                  <button style={btn} onClick={() => openEditFlavor(selectedFlavor)}>Edit</button>
                  <button style={btnDanger} onClick={openDeleteFlavor}>Delete</button>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div style={panel}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textDim }}>Steps ({steps.length})</span>
                <button style={btnPrimary} onClick={openCreateStep}>+ Add Step</button>
              </div>
              {steps.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: C.textDimmer, fontSize: '11px' }}>No steps yet.</div>
              )}
              {steps.map((s, idx) => (
                <div key={s.id} style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: C.accent, color: '#fff', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>Step {s.order_by}</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>{s.description || 'Untitled step'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={btn} onClick={() => moveStep(s, 'up')} disabled={idx === 0}>↑</button>
                      <button style={btn} onClick={() => moveStep(s, 'down')} disabled={idx === steps.length - 1}>↓</button>
                      <button style={btn} onClick={() => openEditStep(s)}>Edit</button>
                      <button style={btnDanger} onClick={() => openDeleteStep(s)}>Del</button>
                    </div>
                  </div>
                  {s.llm_system_prompt && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={label}>System Prompt</span>
                      <div style={{ fontSize: '11px', color: C.textDim, background: C.bg, padding: '8px', borderRadius: '5px', whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'auto', fontFamily: 'monospace' }}>{s.llm_system_prompt}</div>
                    </div>
                  )}
                  {s.llm_user_prompt && (
                    <div>
                      <span style={label}>User Prompt</span>
                      <div style={{ fontSize: '11px', color: C.textDim, background: C.bg, padding: '8px', borderRadius: '5px', whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'auto', fontFamily: 'monospace' }}>{s.llm_user_prompt}</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    {s.llm_temperature != null && <span style={{ fontSize: '10px', color: C.textDimmer }}>temp: <span style={{ color: C.teal }}>{s.llm_temperature}</span></span>}
                    {s.llm_model_id != null && <span style={{ fontSize: '10px', color: C.textDimmer }}>model: <span style={{ color: C.blue }}>{s.llm_model_id}</span></span>}
                    {s.llm_input_type_id != null && <span style={{ fontSize: '10px', color: C.textDimmer }}>in: <span style={{ color: C.textDim }}>{s.llm_input_type_id}</span></span>}
                    {s.llm_output_type_id != null && <span style={{ fontSize: '10px', color: C.textDimmer }}>out: <span style={{ color: C.textDim }}>{s.llm_output_type_id}</span></span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Test Flavor */}
            <div style={panel}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textDim }}>Test Flavor</span>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={label}>Select Test Image</span>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {images.slice(0, 10).map(img => (
                      <div key={img.id} onClick={() => setSelectedImageId(img.id)} style={{
                        flexShrink: 0, width: '80px', height: '80px', borderRadius: '7px', overflow: 'hidden',
                        border: selectedImageId === img.id ? `2px solid ${C.accent}` : `2px solid ${C.border}`,
                        cursor: 'pointer', transition: 'border-color 0.15s',
                      }}>
                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <button style={{ ...btnPrimary, padding: '9px 18px', marginBottom: '12px' }} onClick={testFlavor} disabled={testLoading || !selectedImageId}>
                  {testLoading ? 'Generating…' : `Test "${selectedFlavor.slug}" →`}
                </button>
                {testError && <div style={{ background: C.redDim, color: C.red, padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>{testError}</div>}
                {testResults.length > 0 && (
                  <div>
                    <span style={label}>Generated Captions</span>
                    {testResults.map((r, i) => (
                      <div key={i} style={{ padding: '10px 14px', background: C.bg, borderRadius: '6px', marginBottom: '8px', fontSize: '13px', color: C.text, fontFamily: 'monospace', lineHeight: 1.5, borderLeft: `3px solid ${C.accent}` }}>
                        {r.content ?? r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Captions */}
            <div style={panel}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textDim }}>Captions Produced by This Flavor</span>
              </div>
              {captionsLoading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: C.textDimmer, fontSize: '11px' }}>Loading…</div>
              ) : flavorCaptions.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: C.textDimmer, fontSize: '11px' }}>No captions yet for this flavor.</div>
              ) : flavorCaptions.map(c => (
                <div key={c.id} style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontSize: '12px', color: C.textDim, fontFamily: 'monospace' }}>
                  {c.content}
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div style={{ ...panel, padding: '64px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>←</div>
            <div style={{ fontSize: '13px', color: C.textDimmer }}>Select a humor flavor to view and edit its steps</div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* Create / Edit Flavor */}
      {(flavorModal === 'create' || flavorModal === 'edit') && (
        <div style={modalOverlay}>
          <div style={modalBox()}>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', marginBottom: '20px', color: C.text }}>
              {flavorModal === 'create' ? 'New Humor Flavor' : 'Edit Humor Flavor'}
            </div>
            {error && <div style={errBox}>{error}</div>}
            {(['slug', 'description'] as const).map(k => (
              <div key={k} style={{ marginBottom: '14px' }}>
                <span style={label}>{k}</span>
                <input style={input} value={flavorForm[k]} onChange={e => setFlavorForm(v => ({ ...v, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button style={btn} onClick={() => setFlavorModal(null)}>Cancel</button>
              <button style={btnPrimary} onClick={saveFlavor} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Flavor */}
      {flavorModal === 'duplicate' && selectedFlavor && (
        <div style={modalOverlay}>
          <div style={modalBox('420px')}>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: C.text }}>Duplicate Flavor</div>
            <div style={{ fontSize: '12px', color: C.textDim, marginBottom: '20px' }}>
              Cloning <span style={{ color: C.accent }}>{selectedFlavor.slug}</span> and all its steps into a new flavor.
            </div>
            {error && <div style={errBox}>{error}</div>}
            <div style={{ marginBottom: '14px' }}>
              <span style={label}>New Slug (must be unique)</span>
              <input style={input} value={duplicateSlug} onChange={e => setDuplicateSlug(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button style={btn} onClick={() => setFlavorModal(null)}>Cancel</button>
              <button style={btnDuplicate} onClick={duplicateFlavor} disabled={saving || !duplicateSlug.trim()}>
                {saving ? 'Duplicating…' : 'Duplicate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Flavor */}
      {flavorModal === 'delete' && selectedFlavor && (
        <div style={modalOverlay}>
          <div style={modalBox('380px')}>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: C.text }}>Delete Flavor?</div>
            <div style={{ fontSize: '12px', color: C.textDim, marginBottom: '20px' }}>
              Delete <span style={{ color: C.accent }}>{selectedFlavor.slug}</span> and all its steps? This cannot be undone.
            </div>
            {error && <div style={errBox}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button style={btn} onClick={() => setFlavorModal(null)}>Cancel</button>
              <button style={btnDanger} onClick={deleteFlavor} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Step */}
      {(stepModal === 'create' || stepModal === 'edit') && (
        <div style={modalOverlay}>
          <div style={modalBox('560px')}>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', marginBottom: '20px', color: C.text }}>
              {stepModal === 'create' ? 'New Step' : 'Edit Step'}
            </div>
            {error && <div style={errBox}>{error}</div>}
            {([
              ['description', 'Description', false],
              ['llm_system_prompt', 'System Prompt', true],
              ['llm_user_prompt', 'User Prompt', true],
              ['llm_temperature', 'Temperature', false],
              ['llm_model_id', 'LLM Model ID', false],
              ['humor_flavor_step_type_id', 'Step Type ID', false],
              ['llm_input_type_id', 'Input Type ID', false],
              ['llm_output_type_id', 'Output Type ID', false],
            ] as [string, string, boolean][]).map(([k, l, isTextarea]) => (
              <div key={k} style={{ marginBottom: '14px' }}>
                <span style={label}>{l}</span>
                {isTextarea
                  ? <textarea style={{ ...input, minHeight: '110px', resize: 'vertical' }} value={(stepForm as any)[k]} onChange={e => setStepForm(v => ({ ...v, [k]: e.target.value }))} />
                  : <input style={input} value={(stepForm as any)[k]} onChange={e => setStepForm(v => ({ ...v, [k]: e.target.value }))} />
                }
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button style={btn} onClick={() => setStepModal(null)}>Cancel</button>
              <button style={btnPrimary} onClick={saveStep} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Step */}
      {stepModal === 'delete' && selectedStep && (
        <div style={modalOverlay}>
          <div style={modalBox('360px')}>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: C.text }}>Delete Step?</div>
            <div style={{ fontSize: '12px', color: C.textDim, marginBottom: '20px' }}>
              Delete <span style={{ color: C.accent }}>Step {selectedStep.order_by}</span>? This cannot be undone.
            </div>
            {error && <div style={errBox}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button style={btn} onClick={() => setStepModal(null)}>Cancel</button>
              <button style={btnDanger} onClick={deleteStep} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}