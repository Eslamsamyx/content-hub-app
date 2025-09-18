'use client'

import { useEffect, useState } from 'react'

export default function WireAnimationV3() {
  const [mounted, setMounted] = useState(false)
  const [isPowered, setIsPowered] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed left-8 bottom-0 w-48 h-[66vh] z-[3] hidden lg:block">
      <svg
        className="w-full h-full"
        viewBox="0 0 200 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Modern gradient for wire */}
          <linearGradient id="wireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Brain gradient */}
          <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>

          {/* Active brain glow gradient */}
          <radialGradient id="brainGlow">
            <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ddd6fe" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.1" />
          </radialGradient>

          {/* Icon gradients */}
          <linearGradient id="iconGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="iconGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="iconGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="iconGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="iconGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Wire path definition */}
          <path
            id="flowPath"
            d="M 100 550 
               Q 80 500, 100 450
               T 100 350
               Q 120 300, 100 250
               T 100 150
               Q 80 100, 100 50"
            fill="none"
            stroke="none"
          />
        </defs>

        {/* Wire background */}
        <path
          d="M 100 550 
             Q 80 500, 100 450
             T 100 350
             Q 120 300, 100 250
             T 100 150
             Q 80 100, 100 50"
          fill="none"
          stroke="url(#wireGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity={isPowered ? "0.9" : "0.3"}
          style={{ transition: 'opacity 0.5s ease' }}
        />

        {/* Wire inner core (animated) */}
        {isPowered && (
          <path
            d="M 100 550 
               Q 80 500, 100 450
               T 100 350
               Q 120 300, 100 250
               T 100 150
               Q 80 100, 100 50"
            fill="none"
            stroke="#c4b5fd"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.6"
          >
            <animate
              attributeName="stroke-dasharray"
              values="0 600;600 0"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
        )}

        {/* Power Socket Base */}
        <g transform="translate(100, 550)">
          {/* Socket body */}
          <rect 
            x="-40" 
            y="-20" 
            width="80" 
            height="40" 
            rx="10" 
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="2"
          />
          
          {/* Socket holes */}
          <circle cx="-20" cy="0" r="4" fill="#0f172a" />
          <circle cx="20" cy="0" r="4" fill="#0f172a" />
          
          {/* Power switch */}
          <g 
            transform="translate(0, 25)"
            style={{ cursor: 'pointer' }}
            onClick={() => setIsPowered(!isPowered)}
          >
            {/* Switch track */}
            <rect 
              x="-25" 
              y="-10" 
              width="50" 
              height="20" 
              rx="10" 
              fill={isPowered ? "#8b5cf6" : "#475569"}
              style={{ transition: 'fill 0.3s ease' }}
            />
            
            {/* Switch thumb */}
            <circle 
              cx={isPowered ? 15 : -15} 
              cy="0" 
              r="8" 
              fill="#f8fafc"
              style={{ transition: 'cx 0.3s ease' }}
            />
            
            {/* Power indicator */}
            <circle 
              cx="0" 
              cy="-20" 
              r="3" 
              fill={isPowered ? "#10b981" : "#6b7280"}
              filter={isPowered ? "url(#softGlow)" : "none"}
              style={{ transition: 'fill 0.3s ease' }}
            >
              {isPowered && (
                <animate 
                  attributeName="opacity" 
                  values="0.5;1;0.5" 
                  dur="2s" 
                  repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        </g>

        {/* Brain Container */}
        <g transform="translate(100, 50)">
          {/* Brain glow effect */}
          {isPowered && (
            <ellipse 
              cx="0" 
              cy="0" 
              rx="70" 
              ry="60" 
              fill="url(#brainGlow)" 
              filter="url(#softGlow)"
            >
              <animate 
                attributeName="opacity" 
                values="0.3;0.6;0.3" 
                dur="4s" 
                repeatCount="indefinite"
              />
            </ellipse>
          )}

          {/* Brain Icon - Tabler style */}
          <g transform="scale(3) translate(-12, -12)">
            <path
              d="M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8"
              fill={isPowered ? "url(#brainGradient)" : "#94a3b8"}
              stroke={isPowered ? "#8b5cf6" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 1 : 0.4}
              style={{ transition: 'all 0.5s ease' }}
            />
            <path
              d="M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1 -7 0v-1.8"
              fill={isPowered ? "url(#brainGradient)" : "#94a3b8"}
              stroke={isPowered ? "#8b5cf6" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 1 : 0.4}
              style={{ transition: 'all 0.5s ease' }}
            />
            <path
              d="M17.5 16a3.5 3.5 0 0 0 0 -7h-.5"
              fill="none"
              stroke={isPowered ? "#a78bfa" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 0.8 : 0.3}
              style={{ transition: 'all 0.5s ease' }}
            />
            <path
              d="M19 9.3v-2.8a3.5 3.5 0 0 0 -7 0"
              fill="none"
              stroke={isPowered ? "#a78bfa" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 0.8 : 0.3}
              style={{ transition: 'all 0.5s ease' }}
            />
            <path
              d="M6.5 16a3.5 3.5 0 0 1 0 -7h.5"
              fill="none"
              stroke={isPowered ? "#a78bfa" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 0.8 : 0.3}
              style={{ transition: 'all 0.5s ease' }}
            />
            <path
              d="M5 9.3v-2.8a3.5 3.5 0 0 1 7 0v10"
              fill="none"
              stroke={isPowered ? "#a78bfa" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 0.8 : 0.3}
              style={{ transition: 'all 0.5s ease' }}
            />
          </g>
        </g>

        {/* Flowing Media Icons */}
        {isPowered && ['video', 'image', '3d', 'document', 'audio'].map((type, index) => {
          const gradients = ['iconGrad1', 'iconGrad2', 'iconGrad3', 'iconGrad4', 'iconGrad5']
          const gradient = gradients[index]
          
          return (
            <g key={`icon-${index}`}>
              <animateMotion
                dur="15s"
                repeatCount="indefinite"
                begin={`${index * 3}s`}
                keyTimes="0;0.02;0.98;1"
                keyPoints="0;0;1;1"
              >
                <mpath href="#flowPath" />
              </animateMotion>
              
              <g>
                {/* Icon background circle */}
                <circle
                  cx="0"
                  cy="0"
                  r="20"
                  fill="white"
                  opacity="0"
                >
                  <animate 
                    attributeName="opacity" 
                    values="0;0.1;0.1;0" 
                    dur="15s" 
                    begin={`${index * 3}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Icon container */}
                <g 
                  transform="scale(0.8)"
                  opacity="0"
                >
                  <animate 
                    attributeName="opacity" 
                    values="0;1;1;0" 
                    dur="15s" 
                    begin={`${index * 3}s`}
                    repeatCount="indefinite"
                  />
                  
                  {type === 'video' && (
                    <g>
                      <rect x="-12" y="-8" width="16" height="16" rx="2" fill={`url(#${gradient})`} />
                      <path d="M 4 -4 L 12 -8 L 12 8 L 4 4 Z" fill={`url(#${gradient})`} />
                    </g>
                  )}
                  
                  {type === 'image' && (
                    <g>
                      <rect x="-14" y="-10" width="28" height="20" rx="2" fill="none" stroke={`url(#${gradient})`} strokeWidth="2"/>
                      <circle cx="-6" cy="-4" r="3" fill={`url(#${gradient})`}/>
                      <path d="M -14 10 L -4 0 L 2 6 L 14 -6" stroke={`url(#${gradient})`} strokeWidth="2" fill="none"/>
                    </g>
                  )}
                  
                  {type === '3d' && (
                    <g>
                      <path d="M 0 -12 L -10 -6 L -10 6 L 0 12 L 10 6 L 10 -6 Z" 
                            fill="none" stroke={`url(#${gradient})`} strokeWidth="2"/>
                      <line x1="0" y1="-12" x2="0" y2="12" stroke={`url(#${gradient})`} strokeWidth="2"/>
                      <line x1="-10" y1="-6" x2="10" y2="-6" stroke={`url(#${gradient})`} strokeWidth="2"/>
                    </g>
                  )}
                  
                  {type === 'document' && (
                    <g>
                      <path d="M -10 -14 L -10 14 L 10 14 L 10 -6 L 2 -14 Z" 
                            fill={`url(#${gradient})`} opacity="0.2"/>
                      <path d="M -10 -14 L -10 14 L 10 14 L 10 -6 L 2 -14 Z" 
                            fill="none" stroke={`url(#${gradient})`} strokeWidth="2"/>
                      <path d="M 2 -14 L 2 -6 L 10 -6" fill="none" stroke={`url(#${gradient})`} strokeWidth="2"/>
                      <line x1="-6" y1="2" x2="6" y2="2" stroke={`url(#${gradient})`} strokeWidth="2"/>
                      <line x1="-6" y1="6" x2="6" y2="6" stroke={`url(#${gradient})`} strokeWidth="2"/>
                      <line x1="-6" y1="10" x2="3" y2="10" stroke={`url(#${gradient})`} strokeWidth="2"/>
                    </g>
                  )}
                  
                  {type === 'audio' && (
                    <g>
                      <circle cx="-10" cy="8" r="8" fill="none" stroke={`url(#${gradient})`} strokeWidth="2"/>
                      <circle cx="10" cy="4" r="8" fill="none" stroke={`url(#${gradient})`} strokeWidth="2"/>
                      <path d="M -10 0 L -10 -10 L 10 -14 L 10 -4" fill="none" stroke={`url(#${gradient})`} strokeWidth="2"/>
                      <line x1="-10" y1="-10" x2="10" y2="-14" stroke={`url(#${gradient})`} strokeWidth="2"/>
                    </g>
                  )}
                </g>
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}