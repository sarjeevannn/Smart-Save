'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] bg-slate-950">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
      
      {/* Interactive Orb tracking mouse slowly */}
      <motion.div
        animate={{
          x: mousePosition.x - 200, // offset by half width
          y: mousePosition.y - 200,
        }}
        transition={{ type: "spring", damping: 40, stiffness: 50, mass: 2 }}
        className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-[120px]"
      />

      {/* Floating Orb 1 */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px]"
      />

      {/* Floating Orb 2 */}
      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 150, -100, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[140px]"
      />
    </div>
  )
}
