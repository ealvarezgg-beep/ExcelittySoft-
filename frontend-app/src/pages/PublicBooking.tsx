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
        setError(err.detail || 'Barbería no encontrada o inactiva en el sistema.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [slug])

  useEffect(() => {
    if (date && slug) {
      publicApi.bookedTimes(slug, date).then((res: any) => {
        setBookedTimes(res.booked_times || [])
      }).catch(console.error)
    }
  }, [date, selectedStaff, slug])

  // Inject theme color dynamic styles
  useEffect(() => {
    if (tenant?.theme_color) {
      document.documentElement.style.setProperty('--color-accent', tenant.theme_color)
      document.documentElement.style.setProperty('--color-accent-glow', `${tenant.theme_color}40`)
    }
  }, [tenant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug || !selectedService || !date || !time) return

    setSubmitting(true)
    const selectedSrvObj = services.find(s => s.id === selectedService)
    const start_time = new Date(`${date}T${time}:00`) 
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
      setStep(5)
      
      if (tenant?.whatsapp_number) {
        const srvName = selectedSrvObj?.name || 'Corte'
        const wPhone = tenant.whatsapp_number.replace(/\D/g, '')
        const txt = `Hola, soy ${clientData.name}. Acabo de solicitar un turno para el servicio de *${srvName}* el día ${date} a las ${time}. Mi WhatsApp es ${clientData.whatsapp}. Quiero confirmar mi reserva.`
        const waUrl = `https://wa.me/${wPhone}?text=${encodeURIComponent(txt)}`
        setTimeout(() => window.location.href = waUrl, 4000)
      }
    } catch (err: any) {
      alert(err.detail || 'Error al reservar. El sistema rechazó la solicitud.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-void flex items-center justify-center"><div className="dot-pulse" /></div>
  if (error) return <div className="min-h-screen bg-void flex items-center justify-center text-danger font-mono p-4 text-center"><div className="card-bento bg-danger-muted border-danger/30">{error}</div></div>

  const generateTimeSlots = () => {
    const slots = []
    for (let h = 9; h <= 21; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`)
      slots.push(`${h.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  return (
    <div className="min-h-screen bg-void text-titanium flex flex-col noise-bg font-sans">
      <header className="h-24 border-b border-border bg-carbon/80 backdrop-blur-md flex flex-col items-center justify-center z-10 sticky top-0">
        <h1 className="font-display text-3xl font-black text-white tracking-widest uppercase">{tenant?.name}</h1>
        <p className="text-xs text-fog font-mono mt-1 flex items-center gap-2">
          <div className="dot-pulse" /> SISTEMA DE RESERVAS ACTIVO
        </p>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-8 flex flex-col justify-start pt-8 pb-32">
        <div className="flex items-center justify-between mb-8 px-2 relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-border -z-10" />
          {[1, 2, 3, 4].map(num => (
            <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${step >= num ? 'bg-accent text-void glow-accent' : 'bg-steel border border-border text-fog'}`}>
              {num}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="font-mono text-sm text-fog mb-6 tracking-widest text-center">PASO 1 // SELECCIONA EL SERVICIO</h2>
              {services.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => { setSelectedService(s.id); setStep(2); }}
                  className="card-bento cursor-pointer hover:border-accent transition-all hover:-translate-y-1 flex justify-between items-center group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <h3 className="font-bold text-white text-xl mb-1">{s.name}</h3>
                    <p className="text-fog text-sm flex items-center gap-2"><i className="fa-regular fa-clock"></i> {s.duration_minutes} min aprox.</p>
                  </div>
                  <div className="font-mono text-accent font-bold text-lg relative z-10">{s.price.toLocaleString()} Gs</div>
                </div>
              ))}
              {services.length === 0 && <p className="text-center text-fog font-mono py-10">NO HAY SERVICIOS CONFIGURADOS EN EL NODO</p>}
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(1)} className="text-fog hover:text-white font-mono text-xs px-3 py-1 bg-steel border border-border rounded hover:border-white transition-colors">&lt; VOLVER</button>
                <h2 className="font-mono text-sm text-fog tracking-widest">PASO 2 // ELIGE TU BARBERO</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => { setSelectedStaff(null); setStep(3); }}
                  className="card-bento text-center cursor-pointer hover:border-accent transition-all hover:-translate-y-1 group"
                >
                  <div className="w-16 h-16 rounded-full bg-steel border border-border mx-auto mb-4 flex items-center justify-center text-fog group-hover:text-accent transition-colors text-2xl">
                    <i className="fa-solid fa-users"></i>
                  </div>
                  <p className="font-bold text-white text-sm">Cualquiera disponible</p>
                </div>
                {staff.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => { setSelectedStaff(s.id); setStep(3); }}
                    className="card-bento text-center cursor-pointer hover:border-accent transition-all hover:-translate-y-1 group"
                  >
                    <div className="w-16 h-16 rounded-full bg-carbon border border-border mx-auto mb-4 flex items-center justify-center text-white text-xl font-mono">
                      {s.name.substring(0,2).toUpperCase()}
                    </div>
                    <p className="font-bold text-white text-sm">{s.name}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(2)} className="text-fog hover:text-white font-mono text-xs px-3 py-1 bg-steel border border-border rounded hover:border-white transition-colors">&lt; VOLVER</button>
                <h2 className="font-mono text-sm text-fog tracking-widest">PASO 3 // FECHA Y HORA</h2>
              </div>
              
              <div className="card-bento mb-6">
                <label className="block text-xs font-mono text-fog mb-2">SELECCIONA EL DÍA</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-steel border border-border rounded-lg px-4 py-4 text-white focus:outline-none focus:border-accent transition-colors font-mono"
                />
              </div>

              {date && (
                <div className="card-bento">
                  <label className="block text-xs font-mono text-fog mb-4">HORARIOS DISPONIBLES</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {generateTimeSlots().map(t => {
                      const isBooked = bookedTimes.includes(t)
                      return (
                        <button
                          key={t}
                          disabled={isBooked}
                          onClick={() => { setTime(t); setStep(4); }}
                          className={`py-3 rounded font-mono text-sm border transition-all ${
                            isBooked 
                              ? 'bg-obsidian border-void text-steel cursor-not-allowed opacity-50' 
                              : 'bg-steel border-border hover:border-accent text-white hover:text-accent hover:-translate-y-1 hover:shadow-lg'
                          }`}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(3)} className="text-fog hover:text-white font-mono text-xs px-3 py-1 bg-steel border border-border rounded hover:border-white transition-colors">&lt; VOLVER</button>
                <h2 className="font-mono text-sm text-fog tracking-widest">PASO 4 // CONFIRMAR Y FINALIZAR</h2>
              </div>
              
              <div className="card-bento mb-8 bg-steel/30">
                <h3 className="font-mono text-xs text-fog mb-4 border-b border-border pb-2">RESUMEN_DEL_SISTEMA</h3>
                <div className="space-y-3 font-mono text-sm">
                  <p className="flex justify-between"><span className="text-fog">SERVICIO:</span> <span className="text-white font-bold">{services.find(s => s.id === selectedService)?.name}</span></p>
                  <p className="flex justify-between"><span className="text-fog">PRECIO:</span> <span className="text-accent">{services.find(s => s.id === selectedService)?.price.toLocaleString()} Gs</span></p>
                  <p className="flex justify-between"><span className="text-fog">BARBERO:</span> <span className="text-white">{selectedStaff ? staff.find(s => s.id === selectedStaff)?.name : 'Cualquiera disponible'}</span></p>
                  <p className="flex justify-between"><span className="text-fog">DÍA Y HORA:</span> <span className="text-white bg-carbon px-2 py-1 rounded">{date} {time}</span></p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="card-bento space-y-6">
                <h3 className="font-mono text-xs text-fog mb-2">DATOS_DEL_CLIENTE</h3>
                <div>
                  <label className="block text-xs font-mono text-fog mb-2">TU NOMBRE COMPLETO</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Juan Pérez"
                    value={clientData.name}
                    onChange={e => setClientData({...clientData, name: e.target.value})}
                    className="w-full bg-steel border border-border rounded-lg px-4 py-4 text-white focus:outline-none focus:border-accent transition-colors"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-fog mb-2">TU WHATSAPP (CON CÓDIGO DE PAÍS)</label>
                  <input 
                    type="tel" 
                    placeholder="+595 992 901 387"
                    value={clientData.whatsapp}
                    onChange={e => setClientData({...clientData, whatsapp: e.target.value})}
                    className="w-full bg-steel border border-border rounded-lg px-4 py-4 text-white focus:outline-none focus:border-accent transition-colors font-mono"
                    required 
                  />
                </div>
                
                {tenant?.bank_details && (
                  <div className="mt-4 p-4 bg-obsidian border border-border rounded-lg">
                    <p className="text-xs font-mono text-fog mb-2">MÉTODO DE PAGO / TRANSFERENCIA BANCARIA</p>
                    <pre className="text-xs font-mono text-white whitespace-pre-wrap">{tenant.bank_details}</pre>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-5 bg-accent text-void font-bold transition-all rounded-lg mt-8 font-mono disabled:opacity-50 relative overflow-hidden group glow-accent hover:bg-white"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {submitting ? (
                      <><div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" /> REGISTRANDO_EN_EL_NODO...</>
                    ) : (
                      <><i className="fa-solid fa-check"></i> CONFIRMAR_TURNO_Y_NOTIFICAR</>
                    )}
                  </span>
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 5 - SUCCESS */}
          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card-bento text-center py-16">
              <div className="w-24 h-24 rounded-full bg-positive-muted border border-positive/30 mx-auto flex items-center justify-center text-positive text-5xl mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <i className="fa-solid fa-check"></i>
              </div>
              <h2 className="text-3xl font-display font-black text-white mb-4">RESERVA_CONFIRMADA</h2>
              <p className="text-fog font-mono text-sm max-w-sm mx-auto leading-relaxed mb-8">
                Tu turno ha sido registrado exitosamente en la base de datos de la barbería.
              </p>
              
              <div className="inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-steel border border-border font-mono text-xs text-white">
                <i className="fa-brands fa-whatsapp text-positive text-xl"></i>
                Abriendo WhatsApp para validación final...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {tenant?.address && (
        <footer className="text-center pb-8 text-fog font-mono text-xs">
          <i className="fa-solid fa-location-dot mr-2"></i> {tenant.address}
        </footer>
      )}
    </div>
  )
}
