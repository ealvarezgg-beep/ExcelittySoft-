import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
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
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-display font-black tracking-widest text-xl">
            EXCELITTY<span className="text-accent">SOFT</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-mono text-fog">
            <a href="#features" className="hover:text-white transition-colors">CARACTERÍSTICAS</a>
            <a href="#tech" className="hover:text-white transition-colors">TECNOLOGÍA</a>
            <Link to="/login" className="px-6 py-3 border border-border rounded-lg hover:border-accent hover:text-accent transition-colors bg-steel">
              INICIAR_SESIÓN
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-carbon/50 text-xs font-mono text-accent mb-8 glow-accent">
            <div className="dot-pulse" />
            SISTEMA OPERATIVO v2.0
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[1.1] mb-8">
            OPERACIONES DE<br/>
            BARBERÍA <span className="text-gradient">EMPRESARIAL</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-fog max-w-2xl font-light leading-relaxed mb-12">
            Automatiza la programación de turnos, el cálculo de comisiones para tu staff y el análisis financiero con una arquitectura multi-tenant de grado militar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 font-mono text-sm">
            <Link to="/login" className="inline-flex items-center justify-center px-8 py-5 bg-titanium text-void font-bold hover:bg-white transition-colors rounded-lg">
              INICIAR_DESPLIEGUE
            </Link>
            <a href="#features" className="inline-flex items-center justify-center px-8 py-5 border border-border hover:border-accent hover:text-accent transition-colors rounded-lg bg-carbon/50 backdrop-blur-sm">
              LEER_DOCUMENTACIÓN
            </a>
          </div>
        </motion.div>

        {/* Bento Grid Features */}
        <div id="features" className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: '01', title: 'ENRUTAMIENTO_AUTOMATIZADO', desc: 'Programación de citas sin intervención manual con redirección y webhooks de confirmación automática vía WhatsApp.' },
            { id: '02', title: 'MOTOR_FINANCIERO', desc: 'Seguimiento de ingresos en tiempo real, registro de gastos operativos y cálculos dinámicos de comisiones del staff.' },
            { id: '03', title: 'AISLAMIENTO_DE_DATOS', desc: 'Arquitectura multi-tenant de grado bancario que garantiza la privacidad absoluta de los datos de tus clientes y barberos.' },
            { id: '04', title: 'DISEÑO_NEUBRUTALISTA', desc: 'Interfaz de usuario premium y oscura diseñada para operaciones de alto rendimiento y fatiga visual nula.' },
            { id: '05', title: 'CONTROL_MAESTRO', desc: 'Panel de administración centralizado para gestionar el pago de tu suscripción mensual (150.000 Gs) y soporte 24/7.' },
            { id: '06', title: 'SOPORTE_MOVIL', desc: 'La SPA está construida para reaccionar perfectamente a cualquier tamaño de pantalla de dispositivos móviles.' }
          ].map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (idx % 3) * 0.1 }}
              className="card-bento group h-full flex flex-col justify-between"
            >
              <div>
                <div className="text-accent/50 font-mono text-xs mb-4">{feature.id} //</div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-accent transition-colors">{feature.title}</h3>
                <p className="text-fog text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-40 mb-20 text-center">
          <h2 className="text-4xl font-black mb-6">PREPARADO PARA ACTUALIZAR TU INFRAESTRUCTURA?</h2>
          <p className="text-fog mb-10 max-w-xl mx-auto">Únete a la red ExcelittySoft y obtén control absoluto sobre tus operaciones comerciales.</p>
          <Link to="/login" className="inline-flex items-center justify-center px-10 py-5 bg-accent text-void font-bold hover:bg-white transition-colors rounded-lg font-mono glow-accent">
            CREAR_TU_NODO_AHORA
          </Link>
        </div>
      </main>
      
      <footer className="border-t border-border bg-obsidian py-8 relative z-10 text-center font-mono text-xs text-fog">
        <p>EXCELITTYSOFT © 2026. TODOS LOS DERECHOS RESERVADOS.</p>
        <p className="mt-2">SOPORTE: +595 992 901 387</p>
      </footer>
    </div>
  )
}
