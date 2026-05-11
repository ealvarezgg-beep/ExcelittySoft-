import { useState } from 'react'
import { motion } from 'framer-motion'
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
        // Auto switch to login
        setIsLogin(true)
        setError('Registration successful. Please log in.')
      }
    } catch (err: any) {
      setError(err.detail || err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-void text-titanium flex items-center justify-center overflow-hidden noise-bg">
      <div className="absolute inset-0 z-0">
        <ParticleField />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8 card-bento backdrop-blur-xl bg-carbon/80"
      >
        <div className="text-center mb-8">
          <div className="font-display font-bold tracking-widest text-xl mb-2">
            EXCELITTY<span className="text-accent">SOFT</span>
          </div>
          <p className="font-mono text-xs text-fog">
            {isLogin ? 'SECURE_AUTH_PORTAL' : 'INITIALIZE_NEW_NODE'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-danger-muted border border-danger/30 text-danger text-sm font-mono rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block font-mono text-xs text-fog mb-1">NODE_NAME (BARBERIA)</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-steel border border-border rounded px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                  required 
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-fog mb-1">CONTACT_WHATSAPP</label>
                <input 
                  type="tel" 
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full bg-steel border border-border rounded px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                  required 
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-mono text-xs text-fog mb-1">AUTH_EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-steel border border-border rounded px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
              required 
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-fog mb-1">AUTH_PASSWORD</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-steel border border-border rounded px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-titanium text-void font-bold hover:bg-white transition-colors rounded-sm mt-6 font-mono disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : (isLogin ? 'AUTHENTICATE' : 'INITIALIZE')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="font-mono text-xs text-fog hover:text-accent transition-colors"
          >
            {isLogin ? 'REQUEST_NEW_NODE_ACCESS' : 'RETURN_TO_AUTH_PORTAL'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
