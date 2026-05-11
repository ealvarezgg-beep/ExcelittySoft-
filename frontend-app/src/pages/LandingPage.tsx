import { motion } from 'framer-motion'
import ParticleField from '../components/three/ParticleField'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-void text-titanium overflow-hidden noise-bg">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ParticleField />
      </div>

      {/* Top Nav */}
      <nav className="relative z-10 border-b border-border bg-carbon/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-display font-bold tracking-widest text-lg">
            EXCELITTY<span className="text-accent">SOFT</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-mono text-fog">
            <a href="#features" className="hover:text-white transition-colors">SYS_FEATURES</a>
            <a href="#register" className="hover:text-white transition-colors">INITIALIZE</a>
            <a href="/login" className="px-4 py-2 border border-border rounded-lg hover:border-accent hover:text-accent transition-colors">
              AUTH_LOGIN
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-carbon/50 text-xs font-mono text-accent mb-8 glow-accent">
            <div className="dot-pulse" />
            SYSTEM OPERATIONAL v2.0
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1] mb-8">
            ENTERPRISE<br/>
            BARBER <span className="text-gradient">OPERATIONS</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-fog max-w-2xl font-light leading-relaxed mb-12">
            Automate scheduling, staff commissions, and financial analytics with a military-grade multi-tenant architecture.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 font-mono text-sm">
            <a href="#register" className="inline-flex items-center justify-center px-8 py-4 bg-titanium text-void font-bold hover:bg-white transition-colors rounded-sm">
              INITIATE_DEPLOYMENT
            </a>
            <a href="#docs" className="inline-flex items-center justify-center px-8 py-4 border border-border hover:border-accent hover:text-accent transition-colors rounded-sm bg-carbon/50 backdrop-blur-sm">
              READ_DOCUMENTATION
            </a>
          </div>
        </motion.div>

        {/* Bento Grid Features */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: '01', title: 'AUTOMATED_ROUTING', desc: 'Zero-touch appointment scheduling with WhatsApp webhooks.' },
            { id: '02', title: 'FINANCIAL_ENGINE', desc: 'Real-time revenue tracking and dynamic staff commission calculations.' },
            { id: '03', title: 'DATA_ISOLATION', desc: 'Bank-grade multi-tenant architecture ensuring absolute data privacy.' }
          ].map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 + 0.4 }}
              className="card-bento group"
            >
              <div className="text-accent/50 font-mono text-xs mb-4">{feature.id} //</div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{feature.title}</h3>
              <p className="text-fog text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
