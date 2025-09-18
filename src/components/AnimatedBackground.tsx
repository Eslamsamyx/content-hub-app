'use client'

import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)

    // Asset type shapes
    const shapes: Shape[] = []
    const shapeCount = 15 // Reduced for better performance

    interface Shape {
      x: number
      y: number
      size: number
      type: 'video' | 'image' | '3d' | 'document' | 'audio'
      speed: number
      opacity: number
      rotation: number
      rotationSpeed: number
    }

    // Create shapes
    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 40 + 20,
        type: ['video', 'image', '3d', 'document', 'audio'][Math.floor(Math.random() * 5)] as Shape['type'],
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.1 + 0.02, // Very subtle opacity
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      })
    }

    // Draw shape based on type
    const drawShape = (shape: Shape) => {
      ctx.save()
      ctx.translate(shape.x, shape.y)
      ctx.rotate(shape.rotation)
      ctx.globalAlpha = shape.opacity

      const isDark = document.documentElement.classList.contains('dark')
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 2

      switch (shape.type) {
        case 'video':
          // Play button triangle
          ctx.beginPath()
          ctx.moveTo(-shape.size / 3, -shape.size / 2)
          ctx.lineTo(-shape.size / 3, shape.size / 2)
          ctx.lineTo(shape.size / 2, 0)
          ctx.closePath()
          ctx.stroke()
          break
        
        case 'image':
          // Image frame with mountain
          ctx.strokeRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size)
          ctx.beginPath()
          ctx.moveTo(-shape.size / 2, shape.size / 4)
          ctx.lineTo(-shape.size / 6, -shape.size / 6)
          ctx.lineTo(shape.size / 6, shape.size / 6)
          ctx.lineTo(shape.size / 2, -shape.size / 4)
          ctx.stroke()
          break
        
        case '3d':
          // Cube outline
          const s = shape.size / 2
          ctx.beginPath()
          // Front face
          ctx.moveTo(-s, -s)
          ctx.lineTo(s, -s)
          ctx.lineTo(s, s)
          ctx.lineTo(-s, s)
          ctx.closePath()
          // Back face connections
          ctx.moveTo(-s, -s)
          ctx.lineTo(-s * 0.6, -s * 1.4)
          ctx.moveTo(s, -s)
          ctx.lineTo(s * 1.4, -s * 0.6)
          ctx.moveTo(s, s)
          ctx.lineTo(s * 1.4, s * 0.6)
          ctx.stroke()
          break
        
        case 'document':
          // Document with lines
          ctx.strokeRect(-shape.size / 2, -shape.size / 2, shape.size * 0.8, shape.size)
          ctx.beginPath()
          ctx.moveTo(-shape.size / 3, -shape.size / 4)
          ctx.lineTo(shape.size / 4, -shape.size / 4)
          ctx.moveTo(-shape.size / 3, 0)
          ctx.lineTo(shape.size / 4, 0)
          ctx.moveTo(-shape.size / 3, shape.size / 4)
          ctx.lineTo(shape.size / 4, shape.size / 4)
          ctx.stroke()
          break
        
        case 'audio':
          // Waveform
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            const x = (i - 2) * (shape.size / 4)
            const height = Math.sin(i * 0.5 + shape.rotation) * shape.size / 3
            ctx.moveTo(x, -height)
            ctx.lineTo(x, height)
          }
          ctx.stroke()
          break
      }

      ctx.restore()
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      shapes.forEach((shape) => {
        drawShape(shape)

        // Update position (slow vertical movement)
        shape.y -= shape.speed
        shape.rotation += shape.rotationSpeed

        // Reset position when shape goes off screen
        if (shape.y + shape.size < 0) {
          shape.y = canvas.height + shape.size
          shape.x = Math.random() * canvas.width
        }
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasSize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.5 }}
    />
  )
}