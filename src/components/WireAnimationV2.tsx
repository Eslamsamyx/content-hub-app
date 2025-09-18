'use client'

import { useEffect, useState } from 'react'

export default function WireAnimationV2() {
  const [mounted, setMounted] = useState(false)
  const [isPowered, setIsPowered] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }


  return (
    <div className="fixed left-0 bottom-0 w-40 h-[70vh] z-[15] hidden lg:block pointer-events-none">
      <svg
        className="w-full h-full pointer-events-auto"
        viewBox="0 0 160 750"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="wireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#6b7280" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#9333ea" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
          </linearGradient>

          <radialGradient id="brainGrad">
            <stop offset="0%" stopColor="#f9a8d4" />
            <stop offset="30%" stopColor="#e879f9" />
            <stop offset="60%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
            </feMerge>
          </filter>

          {/* Wire Path */}
          <path
            id="wirePath"
            d="M 60 650 
               C 60 600, 40 550, 60 500
               C 80 450, 40 400, 60 350
               C 80 300, 50 250, 70 200
               C 90 150, 60 100, 60 80"
            fill="none"
            strokeWidth="0"
          />
        </defs>

        {/* Wire Visual */}
        <path
          d="M 60 650 
             C 60 600, 40 550, 60 500
             C 80 450, 40 400, 60 350
             C 80 300, 50 250, 70 200
             C 90 150, 60 100, 60 80"
          fill="none"
          stroke="url(#wireGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity={isPowered ? "0.8" : "0.3"}
        />

        {/* Power Socket Base */}
        <g transform="translate(60, 650)">
          {/* Socket body */}
          <rect 
            x="-30" 
            y="-15" 
            width="60" 
            height="30" 
            rx="8" 
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="2"
          />
          
          {/* Socket holes */}
          <circle cx="-15" cy="0" r="3" fill="#0f172a" />
          <circle cx="15" cy="0" r="3" fill="#0f172a" />
          
          {/* Power switch */}
          <g transform="translate(0, 20)">
            {/* Clickable overlay - larger area for easier clicking */}
            <rect 
              x="-30" 
              y="-30" 
              width="60" 
              height="60" 
              fill="transparent"
              stroke="transparent"
              strokeWidth="0"
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => {
                setHasInteracted(true)
                setIsPowered(!isPowered)
              }}
            />
            
            {/* Hover effect */}
            {isHovering && (
              <rect 
                x="-22" 
                y="-10" 
                width="44" 
                height="20" 
                rx="10" 
                fill="none"
                stroke={isPowered ? "#a78bfa" : "#64748b"}
                strokeWidth="2"
                opacity="0.5"
                style={{ pointerEvents: 'none' }}
              />
            )}
            
            {/* Switch track */}
            <rect 
              x="-20" 
              y="-8" 
              width="40" 
              height="16" 
              rx="8" 
              fill={isPowered ? "#8b5cf6" : "#1e293b"}
              stroke={isPowered ? "#a78bfa" : "#334155"}
              strokeWidth="1"
              style={{ transition: 'all 0.3s ease', pointerEvents: 'none' }}
            />
            
            {/* Inner track highlight when on */}
            {isPowered && (
              <rect 
                x="-18" 
                y="-6" 
                width="36" 
                height="12" 
                rx="6" 
                fill="#a78bfa"
                opacity="0.3"
                style={{ pointerEvents: 'none' }}
              />
            )}
            
            {/* Switch thumb */}
            <circle 
              cx={isPowered ? 12 : -12} 
              cy="0" 
              r="7" 
              fill={isPowered ? "#ffffff" : "#64748b"}
              stroke={isPowered ? "#8b5cf6" : "#475569"}
              strokeWidth="1"
              style={{ transition: 'all 0.3s ease', pointerEvents: 'none' }}
            >
              {isPowered && (
                <animate 
                  attributeName="r" 
                  values="7;7.5;7" 
                  dur="2s" 
                  repeatCount="indefinite"
                />
              )}
            </circle>
            
            {/* ON/OFF text */}
            <text 
              x={isPowered ? -10 : 10} 
              y="1" 
              fontSize="8" 
              fontWeight="bold"
              fill={isPowered ? "#e9d5ff" : "#64748b"}
              textAnchor="middle"
              style={{ transition: 'all 0.3s ease', pointerEvents: 'none', userSelect: 'none' }}
            >
              {isPowered ? "ON" : "OFF"}
            </text>
            
            {/* Power indicator */}
            <circle 
              cx="0" 
              cy="-18" 
              r="3" 
              fill={isPowered ? "#10b981" : "#6b7280"}
              filter={isPowered ? "url(#glow)" : "none"}
              style={{ transition: 'fill 0.3s ease', pointerEvents: 'none' }}
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

        {/* Brain */}
        <g transform="translate(60, 80)">
          {/* Brain Glow */}
          {isPowered && (
            <ellipse cx="0" cy="0" rx="60" ry="50" fill="url(#brainGrad)" opacity="0.2" filter="url(#glow)">
              <animate attributeName="rx" values="60;65;60" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="ry" values="50;55;50" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;0.2;0.2" dur="0.5s" fill="freeze"/>
            </ellipse>
          )}

          {/* Brain Icon - Tabler style */}
          <g transform="scale(3) translate(-12, -12)">
            <path
              d="M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8"
              fill={isPowered ? "url(#brainGrad)" : "#94a3b8"}
              stroke={isPowered ? "#8b5cf6" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 1 : 0.4}
              filter={isPowered ? "url(#glow)" : "none"}
              style={{ transition: hasInteracted ? 'all 0.5s ease' : 'none' }}
            />
            <path
              d="M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1 -7 0v-1.8"
              fill={isPowered ? "url(#brainGrad)" : "#94a3b8"}
              stroke={isPowered ? "#8b5cf6" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 1 : 0.4}
              filter={isPowered ? "url(#glow)" : "none"}
              style={{ transition: hasInteracted ? 'all 0.5s ease' : 'none' }}
            />
            <path
              d="M17.5 16a3.5 3.5 0 0 0 0 -7h-.5"
              fill="none"
              stroke={isPowered ? "#a78bfa" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 0.8 : 0.3}
              style={{ transition: hasInteracted ? 'all 0.5s ease' : 'none' }}
            />
            <path
              d="M19 9.3v-2.8a3.5 3.5 0 0 0 -7 0"
              fill="none"
              stroke={isPowered ? "#a78bfa" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 0.8 : 0.3}
              style={{ transition: hasInteracted ? 'all 0.5s ease' : 'none' }}
            />
            <path
              d="M6.5 16a3.5 3.5 0 0 1 0 -7h.5"
              fill="none"
              stroke={isPowered ? "#a78bfa" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 0.8 : 0.3}
              style={{ transition: hasInteracted ? 'all 0.5s ease' : 'none' }}
            />
            <path
              d="M5 9.3v-2.8a3.5 3.5 0 0 1 7 0v10"
              fill="none"
              stroke={isPowered ? "#a78bfa" : "#64748b"}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPowered ? 0.8 : 0.3}
              style={{ transition: hasInteracted ? 'all 0.5s ease' : 'none' }}
            />
          </g>
        </g>

        {/* Animated Icons */}
        {isPowered && [0, 1, 2, 3, 4].map((index) => {
          const icons = ['video', 'image', '3d', 'document', 'audio']
          const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899']
          const icon = icons[index]
          const color = colors[index]
          
          return (
            <g key={index} opacity="0">
              <animate 
                attributeName="opacity" 
                values="0;0;1;1;1;0" 
                dur="12s" 
                begin={`${index * 2.4}s`}
                keyTimes="0;0.01;0.1;0.9;0.99;1"
                repeatCount="indefinite"
              />
              <animateMotion
                dur="12s"
                repeatCount="indefinite"
                begin={`${index * 2.4}s`}
                keyTimes="0;0.1;0.9;1"
                keyPoints="0;0;1;1"
              >
                <mpath href="#wirePath" />
              </animateMotion>
              
              <g>
                {/* Icon Glow - Larger, more faded */}
                <circle cx="0" cy="0" r="35" fill={color} opacity="0.1" filter="url(#softGlow)" />
                <circle cx="0" cy="0" r="28" fill={color} opacity="0.15" filter="url(#softGlow)" />
                <circle cx="0" cy="0" r="22" fill={color} opacity="0.2" filter="url(#glow)" />
                
                {/* Circular container with subtle background */}
                <circle
                  cx="0"
                  cy="0"
                  r="18"
                  fill="rgba(255,255,255,0.05)"
                  stroke="none"
                />
                
                {/* Icons */}
                <g>
                  
                  {icon === 'video' && (
                    <path d="M -10 -8 L -10 8 L 8 8 L 8 -8 Z M 10 -6 L 16 -10 L 16 10 L 10 6 Z" 
                          fill={color} />
                  )}
                  
                  {icon === 'image' && (
                    <g>
                      <rect x="-12" y="-8" width="24" height="16" fill="none" stroke={color} strokeWidth="2"/>
                      <circle cx="-4" cy="-2" r="3" fill={color}/>
                      <path d="M -12 8 L -2 -2 L 4 4 L 12 -4" stroke={color} strokeWidth="2" fill="none"/>
                    </g>
                  )}
                  
                  {icon === '3d' && (
                    <g>
                      <path d="M 0 -12 L -10 -6 L -10 6 L 0 12 L 10 6 L 10 -6 Z" 
                            fill="none" stroke={color} strokeWidth="2"/>
                      <line x1="0" y1="-12" x2="0" y2="12" stroke={color} strokeWidth="2"/>
                      <line x1="-10" y1="-6" x2="10" y2="-6" stroke={color} strokeWidth="2"/>
                    </g>
                  )}
                  
                  {icon === 'document' && (
                    <g>
                      <path d="M -8 -12 L -8 12 L 8 12 L 8 -4 L 0 -12 Z" 
                            fill="none" stroke={color} strokeWidth="2"/>
                      <path d="M 0 -12 L 0 -4 L 8 -4" fill="none" stroke={color} strokeWidth="2"/>
                      <line x1="-4" y1="0" x2="4" y2="0" stroke={color} strokeWidth="2"/>
                      <line x1="-4" y1="4" x2="4" y2="4" stroke={color} strokeWidth="2"/>
                      <line x1="-4" y1="8" x2="2" y2="8" stroke={color} strokeWidth="2"/>
                    </g>
                  )}
                  
                  {icon === 'audio' && (
                    <g>
                      <circle cx="-8" cy="6" r="6" fill="none" stroke={color} strokeWidth="2"/>
                      <circle cx="8" cy="2" r="6" fill="none" stroke={color} strokeWidth="2"/>
                      <path d="M -8 0 L -8 -8 L 8 -12 L 8 -4" fill="none" stroke={color} strokeWidth="2"/>
                      <line x1="-8" y1="-8" x2="8" y2="-12" stroke={color} strokeWidth="2"/>
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