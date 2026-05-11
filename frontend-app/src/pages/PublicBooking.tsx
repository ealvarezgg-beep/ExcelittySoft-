import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { publicApi } from '../lib/api'

export default function PublicBooking() {
  const { slug } = useParams()
  const [tenant, setTenant] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Booking state
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [clientData, setClientData] = useState({ name: '', whatsapp: '' })
  const [submitting, setSubmitting] = useState(false)

  // Availability
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  
  useEffect(() => {
    async function loadData() {
      if (!slug) return
      try {
        const [t, srvs, stf] = await Promise.all([
          publicApi.tenant(slug),
          publicApi.services(slug),
          publicApi.staff(slug)
        ])
        setTenant(t)
        setServices(srvs as any[])
        setStaff(stf as any[])
      } catch (err: any) {
        setError(err.detail || 'Barbería no encontrada')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [slug])

  // Fetch booked times when date or staff changes
  useEffect(() => {
    if (date && slug) {
      publicApi.bookedTimes(slug, date).then((res: any) => {
        setBookedTimes(res.booked_times || [])
      }).catch(console.error)
    }
  }, [date, selectedStaff, slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug || !selectedService || !date || !time) return

    setSubmitting(true)
    const selectedSrvObj = services.find(s => s.id === selectedService)
    const start_time = new Date(`${date}T${time}:00Z`) // This should use proper local time handling
    // Simplification for the demo:
    const end_time = new Date(start_time.getTime() + (selectedSrvObj?.duration_minutes || 30) * 60000)

    try {
      await publicApi.createAppointment(slug, {
        service_id: selectedService,
        staff_id: selectedStaff,
        client_name: clientData.name,
        client_whatsapp: clientData.whatsapp,
        start_time: start_time.toISOString(),
        end_time: end_time.toISOString()
      })
      setStep(5) // Success
      
      // WhatsApp redirect if manual payment needed
      if (tenant?.whatsapp_number) {
        const waUrl = `https://wa.me/${tenant.whatsapp_number.replace(/\D/g, '')}?text=Hola,%20acabo%20de%20reservar%20el%20servicio%20${selectedSrvObj?.name}%20para%20el%20${date}%20a%20las%20${time}.%20Quisiera%20confirmar.`
        setTimeout(() => window.location.href = waUrl, 3000)
      }
    } catch (err: any) {
      alert(err.detail || 'Error al reservar')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-void flex items-center justify-center"><div className="dot-pulse" /></div>
  if (error) return <div className="min-h-screen bg-void flex items-center justify-center text-danger font-mono">{error}</div>

  const generateTimeSlots = () => {
    const slots = []
    for (let h = 9; h <= 20; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`)
      slots.push(`${h.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  return (
    <div className="min-h-screen bg-void text-titanium flex flex-col noise-bg">
      <header className="h-20 border-b border-border bg-carbon flex items-center justify-center">
        <h1 className="font-display text-2xl font-bold text-white">{tenant?.name}</h1>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="font-mono text-sm text-fog mb-6">01 // SELECT_SERVICE</h2>
              {services.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => { setSelectedService(s.id); setStep(2); }}
                  className="card-bento cursor-pointer hover:border-accent transition-colors flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-white text-lg">{s.name}</h3>
                    <p className="text-fog text-sm">{s.duration_minutes} min</p>
                  </div>
                  <div className="font-mono text-accent">{s.price.toLocaleString()} Gs</div>
                </div>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(1)} className="text-fog hover:text-white font-mono text-xs">&lt; BACK</button>
                <h2 className="font-mono text-sm text-fog">02 // SELECT_BARBER</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div 
                  onClick={() => { setSelectedStaff(null); setStep(3); }}
                  className="card-bento text-center cursor-pointer hover:border-accent transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-steel mx-auto mb-2" />
                  <p className="font-bold text-white">Cualquiera</p>
                </div>
                {staff.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => { setSelectedStaff(s.id); setStep(3); }}
                    className="card-bento text-center cursor-pointer hover:border-accent transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-carbon border border-border mx-auto mb-2" />
                    <p className="font-bold text-white">{s.name}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(2)} className="text-fog hover:text-white font-mono text-xs">&lt; BACK</button>
                <h2 className="font-mono text-sm text-fog">03 // SELECT_TIME</h2>
              </div>
              
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-carbon border border-border rounded px-4 py-3 text-white focus:outline-none focus:border-accent mb-6"
              />

              {date && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {generateTimeSlots().map(t => {
                    const isBooked = bookedTimes.includes(t)
                    return (
                      <button
                        key={t}
                        disabled={isBooked}
                        onClick={() => { setTime(t); setStep(4); }}
                        className={`py-3 rounded font-mono text-sm border transition-colors ${
                          isBooked 
                            ? 'bg-void border-void text-steel cursor-not-allowed' 
                            : 'bg-steel border-border hover:border-accent text-white hover:text-accent'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(3)} className="text-fog hover:text-white font-mono text-xs">&lt; BACK</button>
                <h2 className="font-mono text-sm text-fog">04 // CONFIRM_DETAILS</h2>
              </div>
              
              <div className="card-bento mb-6 space-y-2 text-sm">
                <p><span className="text-fog">SERVICE:</span> {services.find(s => s.id === selectedService)?.name}</p>
                <p><span className="text-fog">BARBER:</span> {selectedStaff ? staff.find(s => s.id === selectedStaff)?.name : 'Cualquiera'}</p>
                <p><span className="text-fog">DATETIME:</span> {date} {time}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Tu Nombre"
                  value={clientData.name}
                  onChange={e => setClientData({...clientData, name: e.target.value})}
                  className="w-full bg-steel border border-border rounded px-4 py-3 text-white focus:outline-none focus:border-accent"
                  required 
                />
                <input 
                  type="tel" 
                  placeholder="WhatsApp (+595...)"
                  value={clientData.whatsapp}
                  onChange={e => setClientData({...clientData, whatsapp: e.target.value})}
                  className="w-full bg-steel border border-border rounded px-4 py-3 text-white focus:outline-none focus:border-accent"
                  required 
                />
                
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-4 bg-accent text-void font-bold transition-opacity hover:opacity-90 rounded-sm mt-6 font-mono disabled:opacity-50 glow-accent"
                >
                  {submitting ? 'PROCESSING...' : 'CONFIRM_BOOKING'}
                </button>
              </form>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-20 h-20 rounded-full bg-positive-muted border border-positive/30 mx-auto flex items-center justify-center text-positive text-3xl mb-6">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">¡Reserva Confirmada!</h2>
              <p className="text-fog font-mono text-sm">Redirigiendo a WhatsApp para confirmación final...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
