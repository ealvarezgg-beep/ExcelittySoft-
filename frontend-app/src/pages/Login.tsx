import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import ParticleField from '../components/three/ParticleField'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const res = await auth.login(email, password)
        localStorage.setItem('access_token', res.access_token)
        localStorage.setItem('tenant_id', res.tenant_id.toString())
        localStorage.setItem('tenant_slug', res.tenant_slug)
        localStorage.setItem('role', res.role)

        if (res.role === 'super_admin') {
          navigate('/super-admin')
        } else {
          navigate('/admin')
        }
      } else {
        await auth.register({
          barberName: name,
          barberEmail: email,
          barberPassword: password,
          barberWhatsapp: whatsapp
        })
        setIsLogin(true)
        setError('Registro exitoso. El sistema está evaluando tu nodo. Por favor, inicia sesión.')
      }
    } catch (err: any) {
      setError(err.detail || err.message || 'Se produjo un error de conexión con la red principal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-void text-titanium flex items-center justify-center overflow-hidden noise-bg">
      {/* Fondo 3D */}
      <div className="absolute inset-0 z-0">
        <ParticleField />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg p-8 md:p-12 card-bento backdrop-blur-xl bg-carbon/80 border border-border/50 shadow-2xl"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-display font-black tracking-widest text-3xl mb-3"
          >
            EXCELITTY<span className="text-accent">SOFT</span>
          </motion.div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-border bg-steel text-xs font-mono text-fog">
            <div className="dot-pulse" />
            {isLogin ? 'PORTAL_DE_ACCESO_SEGURO' : 'INICIALIZACIÓN_DE_NODO'}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-4 bg-danger-muted border border-danger/30 text-danger text-sm font-mono rounded"
            >
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden"
              >
                <div>
                  <label className="block font-mono text-xs text-fog mb-2 tracking-wider">IDENTIFICADOR DEL NODO (NOMBRE BARBERÍA)</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. El Rey Barber Shop"
                    className="w-full bg-steel border border-border rounded-lg px-4 py-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    required={!isLogin}
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-fog mb-2 tracking-wider">WHATSAPP DE CONTACTO</label>
                  <input 
                    type="tel" 
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="+595 992 901 387"
                    className="w-full bg-steel border border-border rounded-lg px-4 py-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block font-mono text-xs text-fog mb-2 tracking-wider">CORREO ELECTRÓNICO ENCRIPTADO</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@tu-barberia.com"
              className="w-full bg-steel border border-border rounded-lg px-4 py-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              required 
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-fog mb-2 tracking-wider">LLAVE DE ACCESO (CONTRASEÑA)</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-steel border border-border rounded-lg px-4 py-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-titanium text-void font-bold hover:bg-white transition-all rounded-lg mt-8 font-mono disabled:opacity-50 relative overflow-hidden group"
          >
            <span className="relative z-10">
              {loading ? 'PROCESANDO_VERIFICACIÓN...' : (isLogin ? 'AUTENTICAR_SESIÓN' : 'DESPLEGAR_NUEVO_NODO')}
            </span>
            <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="font-mono text-xs text-fog hover:text-accent transition-colors"
          >
            {isLogin ? '> SOLICITAR_DESPLIEGUE_DE_NUEVO_NODO' : '> RETORNAR_AL_PORTAL_DE_AUTENTICACIÓN'}
          </button>
        </div>
      </motion.div>

      {/* Info Flotante para el usuario */}
      <div className="absolute bottom-8 text-center w-full z-10 pointer-events-none">
        <p className="font-mono text-[10px] text-fog/50 tracking-widest">
          EXCELITTYSOFT BARBER SAAS v2.0 • INFRAESTRUCTURA SEGURA
        </p>
      </div>
    </div>
  )
}
