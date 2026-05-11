import { useEffect, useState } from 'react'
import { motion, animate, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { tenant, upload } from '../lib/api'

// Counter animation component
function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.floor(v))
    })
    return controls.stop
  }, [value])

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>
}

export default function TenantAdmin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [tenantData, setTenantData] = useState<any>(null)
  
  // Data States
  const [stats, setStats] = useState({ income: 0, expenses: 0, appointments: 0, clients: 0 })
  const [chartData, setChartData] = useState<{name: string, value: number}[]>([])
  
  const [appointmentsList, setAppointmentsList] = useState<any[]>([])
  const [servicesList, setServicesList] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [expensesList, setExpensesList] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)

  // Forms states
  const [newService, setNewService] = useState({ name: '', price: '', duration: '30' })
  const [newStaff, setNewStaff] = useState({ name: '', commission: '50' })
  const [newExpense, setNewExpense] = useState({ category: 'Insumos', amount: '', description: '' })
  
  // Settings state
  const [settings, setSettings] = useState({ themeColor: '#00D4FF', whatsapp: '', address: '', bankDetails: '' })

  const tenantId = Number(localStorage.getItem('tenant_id') || 1)
  const tenantSlug = localStorage.getItem('tenant_slug') || ''

  const loadData = async () => {
    setLoading(true)
    try {
      const [tData, apps, exps, services, staff] = await Promise.all([
        tenant.get(tenantId),
        tenant.appointments.list(tenantId),
        tenant.expenses.list(tenantId),
        tenant.services.list(tenantId),
        tenant.staff.list(tenantId)
      ])

      setTenantData(tData)
      setAppointmentsList(apps as any[])
      setExpensesList(exps as any[])
      setServicesList(services as any[])
      setStaffList(staff as any[])
      
      setSettings({
        themeColor: (tData as any).theme_color || '#00D4FF',
        whatsapp: (tData as any).whatsapp_number || '',
        address: (tData as any).address || '',
        bankDetails: (tData as any).bank_details || ''
      })

      const srvPrices = Object.fromEntries((services as any[]).map(s => [s.id, s.price]))
      
      let totalIncome = 0
      let todayApps = 0
      const clients = new Set()
      const todayStr = new Date().toISOString().split('T')[0]
      const dailyRev: Record<string, number> = {}

      ;(apps as any[]).forEach(app => {
        const price = srvPrices[app.service_id] || 0
        if (app.status === 'booked' || app.status === 'completed') {
          totalIncome += price
          clients.add(app.client_whatsapp)
          const day = app.start_time.split('T')[0]
          dailyRev[day] = (dailyRev[day] || 0) + price
        }
        if (app.start_time.startsWith(todayStr)) {
          todayApps++
        }
      })

      const totalExps = (exps as any[]).reduce((sum, e) => sum + e.amount, 0)
      setStats({ income: totalIncome, expenses: totalExps, appointments: todayApps, clients: clients.size })

      const sortedDays = Object.keys(dailyRev).sort()
      const formattedData = sortedDays.slice(-7).map(d => ({
        name: d.split('-').slice(1).join('/'),
        value: dailyRev[d]
      }))
      
      if (formattedData.length === 0) {
        formattedData.push({ name: 'Lun', value: 0 }, { name: 'Mar', value: 0 })
      }
      setChartData(formattedData)
      
    } catch (err: any) {
      if (err.status === 402) {
        alert(err.detail) // Subscription required logic
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await tenant.services.create(tenantId, { name: newService.name, price: Number(newService.price), duration_minutes: Number(newService.duration) })
      setNewService({ name: '', price: '', duration: '30' })
      loadData()
    } catch (err) { alert("Error al crear servicio") }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await tenant.staff.create(tenantId, { name: newStaff.name, commission_percentage: Number(newStaff.commission), base_salary: 0 })
      setNewStaff({ name: '', commission: '50' })
      loadData()
    } catch (err) { alert("Error al crear staff") }
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await tenant.expenses.create(tenantId, { category: newExpense.category, amount: Number(newExpense.amount), description: newExpense.description })
      setNewExpense({ category: 'Insumos', amount: '', description: '' })
      loadData()
    } catch (err) { alert("Error al registrar gasto") }
  }

  const handleUpdateAppo = async (id: number, status: string) => {
    try {
      await tenant.appointments.updateStatus(tenantId, id, status)
      loadData()
    } catch (err) { alert("Error al actualizar turno") }
  }

  const handleSaveSettings = async () => {
    try {
      await tenant.settings.update(tenantId, {
        theme_color: settings.themeColor,
        whatsapp_number: settings.whatsapp,
        address: settings.address,
        bank_details: settings.bankDetails
      })
      alert("Configuración guardada exitosamente.")
      loadData()
    } catch (err) { alert("Error al guardar ajustes") }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  if (loading) {
    return <div className="min-h-screen bg-void flex items-center justify-center"><div className="dot-pulse" /></div>
  }

  return (
    <div className="min-h-screen bg-void text-titanium flex flex-col md:flex-row font-sans noise-bg">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-obsidian flex flex-col p-6 z-10">
        <div className="font-display font-bold text-xl tracking-wider mb-8 flex justify-between items-center">
          <div>EXCELITTY<span className="text-accent">SOFT</span></div>
        </div>
        <div className="font-mono text-xs text-fog mb-8 px-2">TENANT: {tenantData?.name}</div>
        
        <nav className="flex-1 space-y-2 font-mono text-sm">
          {[
            { id: 'dashboard', label: 'METRICAS_GLOBALES' },
            { id: 'appointments', label: 'AGENDA_TURNOS' },
            { id: 'finance', label: 'MOTOR_FINANCIERO' },
            { id: 'staff', label: 'GESTION_PERSONAL' },
            { id: 'services', label: 'SERVICIOS_PRECIOS' },
            { id: 'settings', label: 'CONFIGURACION_SIS' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left ${
                activeTab === tab.id 
                  ? 'bg-carbon border-border-active text-white' 
                  : 'border-transparent hover:bg-carbon hover:text-white text-fog'
              }`}
            >
              {activeTab === tab.id && <span className="w-2 h-2 rounded-full bg-accent glow-accent" />}
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="mt-8 border-t border-border pt-4">
          <a href={`/book/${tenantSlug}`} target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-steel border border-border hover:border-accent transition-colors text-white text-xs font-mono mb-2">
            Ver Enlace Público
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-danger-muted hover:text-danger transition-colors text-fog text-xs font-mono text-left">
            CERRAR_SESION
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="text-accent font-mono text-xs mb-2 flex items-center gap-2">
              <div className="dot-pulse" /> SISTEMA_ONLINE
            </div>
            <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider">
              {activeTab.replace('_', ' ')}
            </h1>
          </div>
          <div className="font-mono text-xs text-fog bg-carbon px-4 py-2 border border-border rounded flex flex-col gap-1">
            <span>ID: N-{String(tenantId).padStart(3, '0')}</span>
            <span className={tenantData?.is_active ? 'text-positive' : 'text-danger'}>ESTADO: {tenantData?.is_active ? 'ACTIVO' : 'SUSPENDIDO'}</span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card-bento">
                  <p className="font-mono text-xs text-fog mb-2">INGRESOS_BRUTOS</p>
                  <h3 className="text-3xl font-display font-bold text-white text-emerald-400">
                    <AnimatedCounter value={stats.income} suffix=" Gs" />
                  </h3>
                </div>
                <div className="card-bento">
                  <p className="font-mono text-xs text-fog mb-2">GASTOS_OPERATIVOS</p>
                  <h3 className="text-3xl font-display font-bold text-white text-rose-400">
                    <AnimatedCounter value={stats.expenses} suffix=" Gs" />
                  </h3>
                </div>
                <div className="card-bento">
                  <p className="font-mono text-xs text-fog mb-2">TURNOS_DE_HOY</p>
                  <h3 className="text-3xl font-display font-bold text-white">
                    <AnimatedCounter value={stats.appointments} />
                  </h3>
                </div>
                <div className="card-bento">
                  <p className="font-mono text-xs text-fog mb-2">CLIENTES_UNICOS</p>
                  <h3 className="text-3xl font-display font-bold text-white">
                    <AnimatedCounter value={stats.clients} />
                  </h3>
                </div>
              </div>

              <div className="card-bento h-[400px] mb-8">
                <h3 className="font-mono text-xs text-fog mb-6">VELOCIDAD_DE_INGRESOS_7D (Gs)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#555" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-carbon)', border: '1px solid var(--color-border)', borderRadius: '8px', fontFamily: 'monospace' }} itemStyle={{ color: 'var(--color-accent)' }} />
                    <Area type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <motion.div key="appointments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card-bento overflow-hidden">
              <h3 className="font-mono text-xs text-fog mb-6">REGISTRO_DE_TURNOS</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="font-mono text-fog border-b border-border">
                    <tr>
                      <th className="pb-4 font-normal">CLIENTE</th>
                      <th className="pb-4 font-normal">FECHA / HORA</th>
                      <th className="pb-4 font-normal">SERVICIO</th>
                      <th className="pb-4 font-normal">BARBERO</th>
                      <th className="pb-4 font-normal">ESTADO</th>
                      <th className="pb-4 font-normal">ACCION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {appointmentsList.slice().reverse().map(app => {
                      const srv = servicesList.find(s => s.id === app.service_id)
                      const stf = staffList.find(s => s.id === app.staff_id)
                      const dateObj = new Date(app.start_time)
                      
                      return (
                        <tr key={app.id} className="hover:bg-steel/50">
                          <td className="py-4 text-white">
                            <div className="font-bold">{app.client_name}</div>
                            <div className="text-xs text-fog font-mono">{app.client_whatsapp}</div>
                          </td>
                          <td className="py-4 text-fog font-mono text-xs">
                            {dateObj.toLocaleDateString()} <br/>
                            <span className="text-white">{dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td className="py-4 text-white">{srv?.name || '---'}</td>
                          <td className="py-4 text-fog">{stf?.name || 'Cualquiera'}</td>
                          <td className="py-4">
                            {app.status === 'pending_approval' && <span className="text-warning text-xs font-mono border border-warning/30 bg-warning-muted px-2 py-1 rounded">PENDIENTE</span>}
                            {app.status === 'booked' && <span className="text-accent text-xs font-mono border border-accent/30 bg-accent-muted px-2 py-1 rounded">CONFIRMADO</span>}
                            {app.status === 'completed' && <span className="text-positive text-xs font-mono border border-positive/30 bg-positive-muted px-2 py-1 rounded">COMPLETADO</span>}
                            {app.status === 'cancelled' && <span className="text-danger text-xs font-mono border border-danger/30 bg-danger-muted px-2 py-1 rounded">CANCELADO</span>}
                          </td>
                          <td className="py-4">
                            {app.status === 'pending_approval' && (
                              <button onClick={() => handleUpdateAppo(app.id, 'booked')} className="text-xs bg-accent text-void font-bold px-3 py-1 rounded hover:bg-white transition-colors mr-2">APROBAR</button>
                            )}
                            {app.status === 'booked' && (
                              <button onClick={() => handleUpdateAppo(app.id, 'completed')} className="text-xs bg-positive text-void font-bold px-3 py-1 rounded hover:bg-white transition-colors mr-2">COMPLETAR</button>
                            )}
                            {app.status !== 'cancelled' && app.status !== 'completed' && (
                              <button onClick={() => handleUpdateAppo(app.id, 'cancelled')} className="text-xs border border-danger text-danger px-3 py-1 rounded hover:bg-danger hover:text-white transition-colors">X</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {appointmentsList.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-fog font-mono">NO_DATA_FOUND</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* FINANCE TAB */}
          {activeTab === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card-bento">
                <h3 className="font-mono text-xs text-fog mb-6">REGISTRAR_GASTO_OPERATIVO</h3>
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-fog mb-1">CATEGORIA</label>
                    <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full bg-steel border border-border rounded px-4 py-2 text-white outline-none focus:border-accent">
                      <option value="Insumos">Insumos (Geles, Navajas...)</option>
                      <option value="Servicios">Servicios (Luz, Agua, Internet)</option>
                      <option value="Alquiler">Alquiler del Local</option>
                      <option value="Marketing">Marketing / Publicidad</option>
                      <option value="Otros">Otros Gastos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-fog mb-1">MONTO (Gs)</label>
                    <input type="number" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full bg-steel border border-border rounded px-4 py-2 text-white outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-fog mb-1">DESCRIPCION (Opcional)</label>
                    <input type="text" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full bg-steel border border-border rounded px-4 py-2 text-white outline-none focus:border-accent" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-titanium text-void font-bold rounded hover:bg-white transition-colors font-mono mt-4">AGREGAR_GASTO</button>
                </form>

                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="font-mono text-xs text-fog mb-4">HISTORIAL_GASTOS</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {expensesList.slice().reverse().map(e => (
                      <div key={e.id} className="flex justify-between items-center p-3 bg-steel rounded border border-border">
                        <div>
                          <div className="text-white text-sm font-bold">{e.category}</div>
                          <div className="text-fog text-xs font-mono">{e.description || 'Sin detalle'} • {new Date(e.date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-rose-400 font-mono text-sm">-{e.amount.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card-bento">
                <h3 className="font-mono text-xs text-fog mb-6">COMISIONES_PERSONAL</h3>
                <div className="space-y-4">
                  {staffList.map(stf => {
                    // Calculate commissions for this staff member
                    let revenue = 0
                    let count = 0
                    appointmentsList.forEach(app => {
                      if (app.staff_id === stf.id && (app.status === 'booked' || app.status === 'completed')) {
                        const price = servicesList.find(s => s.id === app.service_id)?.price || 0
                        revenue += price
                        count++
                      }
                    })
                    const commission = (revenue * (stf.commission_percentage / 100))

                    return (
                      <div key={stf.id} className="p-4 bg-steel rounded border border-border flex justify-between items-center">
                        <div>
                          <div className="text-white font-bold">{stf.name}</div>
                          <div className="text-fog text-xs font-mono">{count} Cortes • {stf.commission_percentage}% Com.</div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-mono font-bold">{commission.toLocaleString()} Gs</div>
                          <div className="text-fog text-xs font-mono mt-1">Generó: {revenue.toLocaleString()}</div>
                        </div>
                      </div>
                    )
                  })}
                  {staffList.length === 0 && <p className="text-fog text-xs font-mono text-center">NO_STAFF_DATA</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* STAFF & SERVICES TAB */}
          {(activeTab === 'staff' || activeTab === 'services') && (
            <motion.div key="staff-services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="card-bento">
                <h3 className="font-mono text-xs text-fog mb-6">GESTION_SERVICIOS</h3>
                <form onSubmit={handleCreateService} className="flex gap-2 mb-6">
                  <input type="text" placeholder="Corte Clásico" required value={newService.name} onChange={e=>setNewService({...newService, name: e.target.value})} className="flex-1 bg-steel border border-border rounded px-3 py-2 text-white outline-none focus:border-accent text-sm" />
                  <input type="number" placeholder="Precio" required value={newService.price} onChange={e=>setNewService({...newService, price: e.target.value})} className="w-24 bg-steel border border-border rounded px-3 py-2 text-white outline-none focus:border-accent text-sm" />
                  <button type="submit" className="px-4 bg-accent text-void font-bold rounded hover:bg-white transition-colors">+</button>
                </form>
                <div className="space-y-2">
                  {servicesList.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-steel rounded border border-border">
                      <div className="text-white font-medium">{s.name} <span className="text-fog text-xs ml-2">({s.duration_minutes}m)</span></div>
                      <div className="text-accent font-mono text-sm">{s.price.toLocaleString()} Gs</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-bento">
                <h3 className="font-mono text-xs text-fog mb-6">EQUIPO_DE_TRABAJO</h3>
                <form onSubmit={handleCreateStaff} className="flex gap-2 mb-6">
                  <input type="text" placeholder="Nombre Barbero" required value={newStaff.name} onChange={e=>setNewStaff({...newStaff, name: e.target.value})} className="flex-1 bg-steel border border-border rounded px-3 py-2 text-white outline-none focus:border-accent text-sm" />
                  <input type="number" placeholder="% Comision" required value={newStaff.commission} onChange={e=>setNewStaff({...newStaff, commission: e.target.value})} className="w-28 bg-steel border border-border rounded px-3 py-2 text-white outline-none focus:border-accent text-sm" />
                  <button type="submit" className="px-4 bg-accent text-void font-bold rounded hover:bg-white transition-colors">+</button>
                </form>
                <div className="space-y-2">
                  {staffList.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-steel rounded border border-border">
                      <div className="text-white font-medium flex items-center gap-2">
                        <div className="w-6 h-6 bg-carbon rounded-full flex items-center justify-center text-xs text-fog">B</div>
                        {s.name}
                      </div>
                      <div className="text-emerald-400 font-mono text-sm">{s.commission_percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl card-bento">
              <h3 className="font-mono text-xs text-fog mb-6">CONFIGURACION_DEL_NODO</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-fog mb-2">WHATSAPP DE RECEPCION</label>
                  <input type="tel" value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} className="w-full bg-steel border border-border rounded px-4 py-3 text-white outline-none focus:border-accent" />
                  <p className="text-xs text-fog/50 mt-1">A este número los clientes enviarán el mensaje tras hacer la reserva.</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-fog mb-2">DIRECCION FÍSICA</label>
                  <input type="text" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full bg-steel border border-border rounded px-4 py-3 text-white outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-fog mb-2">DATOS BANCARIOS (PARA EL CLIENTE)</label>
                  <textarea value={settings.bankDetails} onChange={e => setSettings({...settings, bankDetails: e.target.value})} rows={3} className="w-full bg-steel border border-border rounded px-4 py-3 text-white outline-none focus:border-accent font-mono text-sm" placeholder="Ej: Banco Ueno | Cuenta 123 | CI 123" />
                  <p className="text-xs text-fog/50 mt-1">Estos datos se mostrarán al cliente si elige pagar por transferencia.</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-fog mb-2">COLOR DE MARCA (HEX)</label>
                  <div className="flex gap-4">
                    <input type="color" value={settings.themeColor} onChange={e => setSettings({...settings, themeColor: e.target.value})} className="w-12 h-12 bg-steel border border-border rounded cursor-pointer p-1" />
                    <input type="text" value={settings.themeColor} onChange={e => setSettings({...settings, themeColor: e.target.value})} className="flex-1 bg-steel border border-border rounded px-4 py-3 text-white outline-none focus:border-accent font-mono" />
                  </div>
                </div>
                
                <button onClick={handleSaveSettings} className="w-full py-4 bg-accent text-void font-bold rounded hover:bg-white transition-colors font-mono mt-8 glow-accent">
                  GUARDAR_CAMBIOS_EN_SISTEMA
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
