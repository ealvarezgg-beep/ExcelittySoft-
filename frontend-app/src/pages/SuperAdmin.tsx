import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { superAdmin } from '../lib/api'

export default function SuperAdmin() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadTenants = async () => {
    try {
      const data = await superAdmin.tenants()
      setTenants(data as any[])
    } catch (err) {
      console.error(err)
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
      loadTenants() // refresh
    } catch (err) {
      console.error(err)
      alert("Error al actualizar estado")
    }
  }

  const approvePayment = async (id: number) => {
    try {
      await superAdmin.updateStatus(id, { is_active: true, payment_status: 'paid' })
      loadTenants() // refresh
    } catch (err) {
      console.error(err)
      alert("Error al aprobar pago")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="dot-pulse" />
      </div>
    )
  }

  const activeCount = tenants.filter(t => t.is_active).length
  const mrr = activeCount * 150000

  return (
    <div className="min-h-screen bg-void text-titanium flex flex-col font-sans noise-bg">
      {/* Topbar */}
      <header className="h-20 bg-carbon/50 backdrop-blur-xl border-b border-border flex items-center justify-between px-8 z-10">
        <h2 className="font-display text-2xl font-bold text-white tracking-wide">MASTER_CONTROL</h2>
        <div className="flex items-center gap-6">
          <div className="px-4 py-2 flex items-center gap-3 border border-border bg-steel rounded">
            <div className="dot-pulse" />
            <span className="text-sm font-mono text-accent">STATE: 100% OPERATIVO</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 z-10 max-w-7xl mx-auto w-full">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-bento relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-steel opacity-30 text-8xl">M</div>
            <p className="font-mono text-xs text-fog mb-2">REVENUE_MRR</p>
            <h3 className="text-4xl font-display font-bold text-white mb-2">{(mrr/1000000).toFixed(1)}M <span className="text-xl text-accent">PYG</span></h3>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-bento relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-steel opacity-30 text-8xl">N</div>
            <p className="font-mono text-xs text-fog mb-2">ACTIVE_NODES</p>
            <h3 className="text-4xl font-display font-bold text-white mb-2">{activeCount} <span className="text-xl text-fog">Tenants</span></h3>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-bento relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-steel opacity-30 text-8xl">T</div>
            <p className="font-mono text-xs text-fog mb-2">TOTAL_REGISTERED</p>
            <h3 className="text-4xl font-display font-bold text-white mb-2">{tenants.length} <span className="text-xl text-fog">Nodes</span></h3>
          </motion.div>
        </div>

        {/* Matrix Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-bento overflow-hidden">
          <h3 className="font-mono text-xs text-fog mb-6">TENANT_MATRIX</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-fog font-mono">
                  <th className="pb-4 font-normal">NODE_ID</th>
                  <th className="pb-4 font-normal">IDENTIFIER</th>
                  <th className="pb-4 font-normal">CREATED</th>
                  <th className="pb-4 font-normal">STATUS</th>
                  <th className="pb-4 font-normal">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-steel/50 transition-colors">
                    <td className="py-4 font-mono text-fog">#N-{String(t.id).padStart(3, '0')}</td>
                    <td className="py-4">
                      <div className="font-bold text-white">{t.name}</div>
                      <div className="text-xs text-fog font-mono">{t.slug}</div>
                    </td>
                    <td className="py-4 text-fog">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="py-4">
                      {t.payment_status === 'paid' ? (
                        <span className="px-2 py-1 bg-positive-muted text-positive text-xs rounded border border-positive/30 font-mono">
                          PAID
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-warning-muted text-warning text-xs rounded border border-warning/30 font-mono">
                            PENDING
                          </span>
                          <button 
                            onClick={() => approvePayment(t.id)}
                            className="text-xs border border-border px-2 py-1 hover:border-accent hover:text-accent transition-colors"
                          >
                            APPROVE
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono ${t.is_active ? 'text-accent' : 'text-fog'}`}>
                          {t.is_active ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={t.is_active}
                            onChange={(e) => toggleStatus(t.id, e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-zinc rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent glow-accent"></div>
                        </label>
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
