import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { superAdmin } from '../lib/api'

export default function SuperAdmin() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadTenants = async () => {
    try {
      const data = await superAdmin.tenants()
      setTenants(data as any[])
    } catch (err) {
      console.error(err)
      // Si falla, probablemente el token expiró o no es admin
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTenants()
  }, [])

  const toggleStatus = async (id: number, isActive: boolean) => {
    try {
      await superAdmin.updateStatus(id, { is_active: isActive })
      loadTenants() 
    } catch (err) {
      alert("Error al actualizar el estado del nodo en la base de datos.")
    }
  }

  const approvePayment = async (id: number) => {
    if(!window.confirm("¿Confirmar que este nodo ha realizado el pago de 150.000 Gs?")) return
    try {
      await superAdmin.updateStatus(id, { is_active: true, payment_status: 'paid' })
      loadTenants() 
    } catch (err) {
      alert("Error de conexión al aprobar pago.")
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  if (loading) {
    return <div className="min-h-screen bg-void flex items-center justify-center"><div className="dot-pulse" /></div>
  }

  const activeCount = tenants.filter(t => t.is_active).length
  const pendingCount = tenants.filter(t => t.payment_status !== 'paid').length
  const mrr = activeCount * 150000

  return (
    <div className="min-h-screen bg-void text-titanium flex flex-col font-sans noise-bg">
      {/* Topbar */}
      <header className="h-24 bg-carbon/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-8 z-10 sticky top-0">
        <div className="flex items-center gap-6">
          <h2 className="font-display text-3xl font-black text-white tracking-widest">CONTROL_MAESTRO</h2>
          <div className="hidden md:flex px-4 py-2 items-center gap-3 border border-border bg-steel rounded-full">
            <div className="dot-pulse" />
            <span className="text-xs font-mono text-accent">SISTEMA 100% OPERATIVO</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs font-mono text-danger hover:text-white px-4 py-2 border border-danger/30 rounded hover:bg-danger transition-colors"
        >
          CERRAR_SESION
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10 max-w-7xl mx-auto w-full">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-bento relative overflow-hidden bg-gradient-to-br from-carbon to-void">
            <div className="absolute -right-4 -top-4 text-steel opacity-20 text-8xl font-black">R</div>
            <p className="font-mono text-xs text-fog mb-3 tracking-widest">REVENUE_MRR (MENSUAL)</p>
            <h3 className="text-4xl font-display font-black text-white mb-2">{(mrr/1000).toLocaleString()}k</h3>
            <p className="text-xs text-accent font-mono">Gs Proyectados</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-bento relative overflow-hidden bg-gradient-to-br from-carbon to-void">
            <div className="absolute -right-4 -top-4 text-steel opacity-20 text-8xl font-black">A</div>
            <p className="font-mono text-xs text-fog mb-3 tracking-widest">NODOS_ACTIVOS</p>
            <h3 className="text-4xl font-display font-black text-white mb-2">{activeCount}</h3>
            <p className="text-xs text-positive font-mono">Barberías operando</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-bento relative overflow-hidden bg-gradient-to-br from-carbon to-void border-warning/30">
            <div className="absolute -right-4 -top-4 text-steel opacity-20 text-8xl font-black">P</div>
            <p className="font-mono text-xs text-fog mb-3 tracking-widest">PAGOS_PENDIENTES</p>
            <h3 className="text-4xl font-display font-black text-white mb-2">{pendingCount}</h3>
            <p className="text-xs text-warning font-mono">Requieren validación</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-bento relative overflow-hidden bg-gradient-to-br from-carbon to-void">
            <div className="absolute -right-4 -top-4 text-steel opacity-20 text-8xl font-black">T</div>
            <p className="font-mono text-xs text-fog mb-3 tracking-widest">TOTAL_NUEVOS_NODOS</p>
            <h3 className="text-4xl font-display font-black text-white mb-2">{tenants.length}</h3>
            <p className="text-xs text-fog font-mono">Desde el inicio</p>
          </motion.div>
        </div>

        {/* Matrix Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-bento overflow-hidden p-0 border-border">
          <div className="p-6 border-b border-border bg-carbon/50">
            <h3 className="font-mono text-sm text-fog tracking-widest flex items-center gap-3">
              <i className="fa-solid fa-server text-accent"></i>
              MATRIZ_DE_NODOS_DESPLEGADOS
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-steel/30">
                <tr className="border-b border-border text-fog font-mono text-xs tracking-widest">
                  <th className="p-6 font-normal">ID</th>
                  <th className="p-6 font-normal">DATOS_DEL_NODO</th>
                  <th className="p-6 font-normal">FECHA_DESPLIEGUE</th>
                  <th className="p-6 font-normal">ESTADO_FINANCIERO</th>
                  <th className="p-6 font-normal">ESTADO_TECNICO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-steel/30 transition-colors group">
                    <td className="p-6 font-mono text-fog font-bold">#N-{String(t.id).padStart(3, '0')}</td>
                    <td className="p-6">
                      <div className="font-bold text-white text-base mb-1">{t.name}</div>
                      <div className="text-xs text-accent font-mono bg-accent/10 inline-block px-2 py-0.5 rounded border border-accent/20">
                        {t.slug}
                      </div>
                      <div className="text-xs text-fog mt-2"><i className="fa-brands fa-whatsapp mr-1"></i> {t.whatsapp_number || 'Sin número'}</div>
                    </td>
                    <td className="p-6 text-fog font-mono text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="p-6">
                      {t.payment_status === 'paid' ? (
                        <span className="px-3 py-1.5 bg-positive-muted text-positive text-xs rounded border border-positive/30 font-mono tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          CUOTAS_AL_DIA
                        </span>
                      ) : (
                        <div className="flex flex-col items-start gap-2">
                          <span className="px-3 py-1.5 bg-warning-muted text-warning text-xs rounded border border-warning/30 font-mono tracking-wider animate-pulse">
                            PAGO_PENDIENTE
                          </span>
                          <button 
                            onClick={() => approvePayment(t.id)}
                            className="text-[10px] font-mono border border-accent/50 text-accent px-3 py-1.5 rounded hover:bg-accent hover:text-void transition-colors"
                          >
                            VERIFICAR_Y_APROBAR
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <label className="relative inline-flex items-center cursor-pointer group-hover:scale-105 transition-transform">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={t.is_active}
                            onChange={(e) => toggleStatus(t.id, e.target.checked)}
                          />
                          <div className="w-14 h-7 bg-void border border-border rounded-full peer peer-checked:after:translate-x-[150%] after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-fog after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carbon peer-checked:border-accent peer-checked:after:bg-accent peer-checked:after:glow-accent"></div>
                        </label>
                        <span className={`text-xs font-mono font-bold tracking-widest ${t.is_active ? 'text-accent' : 'text-fog'}`}>
                          {t.is_active ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
