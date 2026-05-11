import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 300, mouse }: { count?: number; mouse: React.RefObject<{ x: number; y: number }> }) {
  const mesh = useRef<THREE.Points>(null!)
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6
      vel[i * 3] = (Math.random() - 0.5) * 0.003
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.003
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001
    }
    return [pos, vel]
  }, [count])

  useFrame(() => {
    if (!mesh.current) return
    const posArr = mesh.current.geometry.attributes.position.array as Float32Array
    const mx = mouse.current ? mouse.current.x * 2 : 0
    const my = mouse.current ? mouse.current.y * 2 : 0

    for (let i = 0; i < count; i++) {
      const ix = i * 3
      posArr[ix] += velocities[ix] + (mx - posArr[ix]) * 0.0003
      posArr[ix + 1] += velocities[ix + 1] + (my - posArr[ix + 1]) * 0.0003
      posArr[ix + 2] += velocities[ix + 2]

      // Wrap around
      if (posArr[ix] > 5) posArr[ix] = -5
      if (posArr[ix] < -5) posArr[ix] = 5
      if (posArr[ix + 1] > 5) posArr[ix + 1] = -5
      if (posArr[ix + 1] < -5) posArr[ix + 1] = 5
    }
    mesh.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#00D4FF"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function GridFloor() {
  return (
    <gridHelper
      args={[20, 40, '#111111', '#0A0A0A']}
      position={[0, -3, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

export default function ParticleField({ className = '' }: { className?: string }) {
  const mouse = useRef({ x: 0, y: 0 })

  return (
    <div
      className={`absolute inset-0 ${className}`}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        mouse.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 5
        mouse.current.y = -((e.clientY - rect.top) / rect.height - 0.5) * 5
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.1} />
        <Particles mouse={mouse} />
        <GridFloor />
      </Canvas>
    </div>
  )
}
