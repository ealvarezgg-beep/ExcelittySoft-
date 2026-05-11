import { useEffect, useState } from 'react'
import { motion, animate } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { tenant } from '../lib/api'

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
  const [stats, setStats] = useState({ income: 0, expenses: 0, appointments: 0, clients: 0 })
  const [chartData, setChartData] = useState<{name: string, value: number}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const tenantId = Number(localStorage.getItem('tenant_id') || 1)
        const [apps, exps, services] = await Promise.all([
          tenant.appointments.list(tenantId),
          tenant.expenses.list(tenantId),
          tenant.services.list(tenantId)
        ])

        const srvPrices = Object.fromEntries((services as any[]).map(s => [s.id, s.price]))
        
        let totalIncome = 0
        let todayApps = 0
        const clients = new Set()
        const todayStr = new Date().toISOString().split('T')[0]
        
        // Mock chart data based on real appointments
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

        // Format chart data
        const sortedDays = Object.keys(dailyRev).sort()
        const formattedData = sortedDays.slice(-7).map(d => ({
          name: d.split('-').slice(1).join('/'),
          value: dailyRev[d]
        }))
        // Fallback if empty
        if (formattedData.length === 0) {
          formattedData.push(
            { name: 'Mon', value: 120000 },
            { name: 'Tue', value: 180000 },
            { name: 'Wed', value: 150000 },
            { name: 'Thu', value: 240000 },
            { name: 'Fri', value: 300000 },
            { name: 'Sat', value: 450000 },
            { name: 'Sun', value: 200000 }
          )
        }
        setChartData(formattedData)
        
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="dot-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void text-titanium flex font-sans noise-bg">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-obsidian flex flex-col p-6 z-10">
        <div className="font-display font-bold text-xl tracking-wider mb-12">
          EXCELITTY<span className="text-accent">SOFT</span>
        </div>
        <nav className="flex-1 space-y-2 font-mono text-sm">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-carbon border border-border-active text-white">
            <span className="w-2 h-2 rounded-full bg-accent glow-accent" />
            DASHBOARD
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-carbon hover:text-white transition-colors text-fog">
            APPOINTMENTS
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-carbon hover:text-white transition-colors text-fog">
            FINANCE_ENGINE
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-carbon hover:text-white transition-colors text-fog">
            SYSTEM_SETTINGS
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto relative z-10">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <div className="text-accent font-mono text-xs mb-2 flex items-center gap-2">
              <div className="dot-pulse" /> SYSTEM_ONLINE
            </div>
            <h1 className="text-3xl font-display font-bold text-white">Terminal Overview</h1>
          </div>
          <div className="font-mono text-sm text-fog bg-carbon px-4 py-2 border border-border rounded">
            ID: TENANT_01
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-bento">
            <p className="font-mono text-xs text-fog mb-2">REVENUE_TOTAL</p>
            <h3 className="text-3xl font-display font-bold text-white">
              <AnimatedCounter value={stats.income} suffix=" Gs" />
            </h3>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-bento">
            <p className="font-mono text-xs text-fog mb-2">EXPENSES_TOTAL</p>
            <h3 className="text-3xl font-display font-bold text-white">
              <AnimatedCounter value={stats.expenses} suffix=" Gs" />
            </h3>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-bento">
            <p className="font-mono text-xs text-fog mb-2">ACTIVE_SESSIONS</p>
            <h3 className="text-3xl font-display font-bold text-white">
              <AnimatedCounter value={stats.appointments} />
            </h3>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-bento">
            <p className="font-mono text-xs text-fog mb-2">UNIQUE_CLIENTS</p>
            <h3 className="text-3xl font-display font-bold text-white">
              <AnimatedCounter value={stats.clients} />
            </h3>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-bento h-[400px]">
          <h3 className="font-mono text-xs text-fog mb-6">REVENUE_VELOCITY_7D</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#555" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-carbon)', border: '1px solid var(--color-border)', borderRadius: '8px', fontFamily: 'monospace' }}
                itemStyle={{ color: 'var(--color-accent)' }}
              />
              <Area type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </main>
    </div>
  )
}
