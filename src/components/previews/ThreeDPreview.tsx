'use client'

import React, { Suspense, useRef, useState, useEffect, Fragment } from 'react'
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber'
import { 
  OrbitControls, 
  Grid, 
  Environment, 
  Center, 
  useGLTF, 
  Loader,
  GizmoHelper,
  GizmoViewport,
  ContactShadows,
  Box,
  Edges,
  Html,
  useProgress,
  Bounds,
  Line
} from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { 
  ViewfinderCircleIcon, 
  CubeIcon, 
  SunIcon, 
  MoonIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  CameraIcon,
  Square3Stack3DIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  TagIcon,
  Cog6ToothIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'

// Model component that loads GLB files
const Model = React.forwardRef<THREE.Group, { url: string; wireframe: boolean; showBounds: boolean }>(
  function Model({ url, wireframe, showBounds }, ref) {
  const { scene } = useGLTF(url)
  const localRef = useRef<THREE.Group>(null)
  const modelRef = ref || localRef
  
  // Calculate model bounds for info display
  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      
      // Log actual model dimensions
      console.log('Raw model size (Three.js units):', size)
      console.log('Model center:', center)
      
      // Note: GLB files can have different scales
      // Some are in meters, some in centimeters, some in arbitrary units
      // The scale={[0.5, 0.5, 0.5]} below also affects the final size
      console.log('Scaled size (with 0.5 scale):', {
        x: size.x * 0.5,
        y: size.y * 0.5,
        z: size.z * 0.5
      })
    }
  }, [scene])

  // Apply wireframe mode
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.wireframe = wireframe
      }
    })
  }, [scene, wireframe])
  
  return (
    <group ref={modelRef}>
      <Center>
        <primitive object={scene} scale={[0.5, 0.5, 0.5]} />
        {showBounds && (
          <Box args={[1, 1, 1]} material-opacity={0.1} material-transparent>
            <Edges color="yellow" />
          </Box>
        )}
      </Center>
    </group>
  )
})

// Loading component with progress
function LoadingProgress() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="text-white text-center">
        <div className="mb-2">Loading 3D Model...</div>
        <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-sm">{Math.round(progress)}%</div>
      </div>
    </Html>
  )
}

// Custom performance stats component
function PerformanceStats() {
  const [fps, setFps] = useState(0)
  const frameRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  
  useFrame(() => {
    frameRef.current++
    const currentTime = performance.now()
    
    if (currentTime >= lastTimeRef.current + 1000) {
      setFps(Math.round((frameRef.current * 1000) / (currentTime - lastTimeRef.current)))
      frameRef.current = 0
      lastTimeRef.current = currentTime
    }
  })
  
  return (
    <Html position={[-5, 4, 0]} style={{ userSelect: 'none' }}>
      <div className="bg-black/90 text-green-400 px-3 py-2 rounded-lg font-mono text-sm border border-green-400/30 shadow-lg">
        <div className="flex flex-col gap-1">
          <div>FPS: {fps}</div>
          <div className="text-xs text-gray-400">60 target</div>
        </div>
      </div>
    </Html>
  )
}

// Camera animation component - complete rewrite
function CameraAnimator({ targetPosition, controlsRef, onComplete }: { 
  targetPosition: [number, number, number] | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  onComplete?: () => void;
}) {
  const { camera } = useThree()
  const [isAnimating, setIsAnimating] = useState(false)
  const [lastTargetPosition, setLastTargetPosition] = useState<[number, number, number] | null>(null)
  
  useEffect(() => {
    if (targetPosition && (!lastTargetPosition || 
        targetPosition[0] !== lastTargetPosition[0] ||
        targetPosition[1] !== lastTargetPosition[1] ||
        targetPosition[2] !== lastTargetPosition[2])) {
      setIsAnimating(true)
      setLastTargetPosition(targetPosition)
    }
  }, [targetPosition, lastTargetPosition])
  
  useFrame(() => {
    if (targetPosition && isAnimating) {
      // Get current position
      const currentPos = camera.position
      const target = new THREE.Vector3(...targetPosition)
      
      // Calculate distance to target
      const distance = currentPos.distanceTo(target)
      
      // If we're close enough, stop animating
      if (distance < 0.01) {
        camera.position.set(...targetPosition)
        camera.lookAt(0, 0, 0)
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0)
          controlsRef.current.update()
        }
        setIsAnimating(false)
        onComplete?.()
        return
      }
      
      // Smooth interpolation
      const speed = 0.15 // Increased for faster animation
      currentPos.lerp(target, speed)
      
      // Always look at center during animation
      camera.lookAt(0, 0, 0)
      
      // Update controls if available
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0)
        controlsRef.current.update()
      }
    }
  })
  
  return null
}

// Measurement component
function MeasurementTool({ enabled }: { enabled: boolean }) {
  const [points, setPoints] = useState<THREE.Vector3[]>([])
  const [measuring, setMeasuring] = useState(false)
  useThree()

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!enabled) return
    
    event.stopPropagation()
    const point = event.point
    
    if (points.length === 0) {
      setPoints([point])
      setMeasuring(true)
    } else if (points.length === 1) {
      setPoints([...points, point])
      setMeasuring(false)
    } else {
      // Start new measurement
      setPoints([point])
      setMeasuring(true)
    }
  }

  const getDistance = () => {
    if (points.length === 2) {
      return points[0].distanceTo(points[1]).toFixed(2)
    }
    return '0.00'
  }

  const getMidpoint = () => {
    if (points.length === 2) {
      return new THREE.Vector3().lerpVectors(points[0], points[1], 0.5)
    }
    return new THREE.Vector3()
  }

  if (!enabled) return null

  return (
    <>
      {/* Invisible plane to capture clicks */}
      <mesh visible={false} onPointerDown={handleClick}>
        <planeGeometry args={[1000, 1000]} />
      </mesh>

      {/* Measurement line */}
      {points.length === 2 && (
        <>
          <Line
            points={points}
            color="#fbbf24"
            lineWidth={3}
            dashed
            dashScale={2}
            dashSize={0.1}
            gapSize={0.1}
          />
          
          {/* Start point */}
          <mesh position={points[0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
          
          {/* End point */}
          <mesh position={points[1]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
          
          {/* Distance label */}
          <Html position={getMidpoint()} center>
            <div className="bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold whitespace-nowrap">
              {getDistance()} units
            </div>
          </Html>
        </>
      )}
      
      {/* Current point while measuring */}
      {measuring && points.length === 1 && (
        <mesh position={points[0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}
    </>
  )
}

// Booth dimensions overlay with lines
function BoothDimensions({ show, model }: { show: boolean; model?: THREE.Group }) {
  const [bounds, setBounds] = useState<THREE.Box3 | null>(null)
  const [size, setSize] = useState<THREE.Vector3>(new THREE.Vector3(6, 3.5, 4))
  const [center, setCenter] = useState<THREE.Vector3>(new THREE.Vector3())
  const [actualSize, setActualSize] = useState<{ x: number; y: number; z: number }>({ x: 6, y: 3.5, z: 4 })
  
  useEffect(() => {
    if (model && show) {
      const box = new THREE.Box3().setFromObject(model)
      const newSize = box.getSize(new THREE.Vector3())
      const newCenter = box.getCenter(new THREE.Vector3())
      setBounds(box)
      setSize(newSize)
      setCenter(newCenter)
      
      // Important: These are the actual dimensions from the GLB file
      // The values will be in whatever units the GLB was created in
      // Common conventions:
      // - Architectural models: usually in meters
      // - Game assets: often in arbitrary units
      // - CAD exports: could be mm, cm, or m
      
      // For booth designs, we'll assume the units are in meters
      // since that's standard for architectural/exhibition models
      setActualSize({
        x: newSize.x,
        y: newSize.y,
        z: newSize.z
      })
      
      console.log('Booth dimensions from GLB:', {
        width: newSize.x.toFixed(2) + 'm',
        height: newSize.y.toFixed(2) + 'm',
        depth: newSize.z.toFixed(2) + 'm',
        area: (newSize.x * newSize.z).toFixed(2) + 'm²'
      })
    }
  }, [model, show])
  
  if (!show || !bounds) return null
  
  const halfSize = size.clone().multiplyScalar(0.5)
  
  return (
    <>
      {/* Width dimension line and label */}
      <group position={[center.x, bounds.min.y - 0.5, center.z]}>
        <Line
          points={[[-halfSize.x, 0, 0], [halfSize.x, 0, 0]]}
          color="#3b82f6"
          lineWidth={2}
        />
        {/* Arrow heads */}
        <Line
          points={[
            [-halfSize.x, 0, 0],
            [-halfSize.x + 0.2, 0.1, 0],
            [-halfSize.x + 0.2, -0.1, 0],
            [-halfSize.x, 0, 0]
          ]}
          color="#3b82f6"
          lineWidth={2}
        />
        <Line
          points={[
            [halfSize.x, 0, 0],
            [halfSize.x - 0.2, 0.1, 0],
            [halfSize.x - 0.2, -0.1, 0],
            [halfSize.x, 0, 0]
          ]}
          color="#3b82f6"
          lineWidth={2}
        />
        <Html center>
          <div className="bg-blue-600/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shadow-lg">
            {actualSize.x.toFixed(1)}m
          </div>
        </Html>
      </group>
      
      {/* Depth dimension line and label */}
      <group position={[bounds.max.x + 0.5, bounds.min.y - 0.5, center.z]}>
        <Line
          points={[[0, 0, -halfSize.z], [0, 0, halfSize.z]]}
          color="#3b82f6"
          lineWidth={2}
        />
        {/* End caps */}
        <Line
          points={[[-0.1, 0, -halfSize.z], [0.1, 0, -halfSize.z]]}
          color="#3b82f6"
          lineWidth={2}
        />
        <Line
          points={[[-0.1, 0, halfSize.z], [0.1, 0, halfSize.z]]}
          color="#3b82f6"
          lineWidth={2}
        />
        <Html center>
          <div className="bg-blue-600/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shadow-lg">
            {actualSize.z.toFixed(1)}m
          </div>
        </Html>
      </group>
      
      {/* Height dimension line and label */}
      <group position={[bounds.min.x - 0.5, center.y, bounds.max.z]}>
        <Line
          points={[[0, -halfSize.y, 0], [0, halfSize.y, 0]]}
          color="#3b82f6"
          lineWidth={2}
        />
        {/* End caps */}
        <Line
          points={[[-0.1, -halfSize.y, 0], [0.1, -halfSize.y, 0]]}
          color="#3b82f6"
          lineWidth={2}
        />
        <Line
          points={[[-0.1, halfSize.y, 0], [0.1, halfSize.y, 0]]}
          color="#3b82f6"
          lineWidth={2}
        />
        <Html center>
          <div className="bg-blue-600/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shadow-lg">
            {actualSize.y.toFixed(1)}m
          </div>
        </Html>
      </group>
      
      {/* Floor area label */}
      <Html position={[center.x, bounds.max.y + 1, center.z]} center>
        <div className="bg-green-600/90 backdrop-blur text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap shadow-lg">
          Floor Area: {(actualSize.x * actualSize.z).toFixed(1)}m²
        </div>
      </Html>
    </>
  )
}

// Floor plan grid
function FloorPlanGrid({ show }: { show: boolean }) {
  if (!show) return null
  
  return (
    <Grid
      args={[20, 20]}
      cellSize={1}
      cellThickness={1}
      cellColor="#6b7280"
      sectionSize={5}
      sectionThickness={2}
      sectionColor="#3b82f6"
      fadeDistance={30}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid
    />
  )
}

interface ThreeDPreviewProps {
  fileUrl: string
  thumbnail?: string
  title: string
}

function ThreeDPreview({ fileUrl, title }: ThreeDPreviewProps) {
  const [autoRotate, setAutoRotate] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGizmo, setShowGizmo] = useState(true)
  const [showShadows, setShowShadows] = useState(true)
  const [showBounds, setShowBounds] = useState(false)
  const [lightingMode, setLightingMode] = useState<'studio' | 'sunset' | 'dawn' | 'night'>('studio')
  const [cameraPreset, setCameraPreset] = useState('default')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [targetCameraPosition, setTargetCameraPosition] = useState<[number, number, number] | null>([5, 5, 5])
  const [isCameraAnimating, setIsCameraAnimating] = useState(false)
  const [measurementEnabled, setMeasurementEnabled] = useState(false)
  const [showFloorPlan, setShowFloorPlan] = useState(false)
  const [showDimensions, setShowDimensions] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const modelRef = useRef<THREE.Group>(null)

  // Camera positions for each preset
  const cameraPositions: Record<string, [number, number, number]> = {
    default: [5, 5, 5],
    front: [0, 0, 8],
    back: [0, 0, -8],
    left: [-8, 0, 0],
    right: [8, 0, 0],
    top: [0, 8, 0],
    bottom: [0, -8, 0],
    isometric: [5, 5, 5],
    floorplan: [0, 12, 0.1]
  }

  // View presets with custom icon components
  const viewPresets = [
    { 
      id: 'default', 
      label: 'Default', 
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      id: 'front', 
      label: 'Front', 
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18m0 0l-6-6m6 6l-6 6" />
        </svg>
      )
    },
    { 
      id: 'left', 
      label: 'Left', 
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
      )
    },
    { 
      id: 'top', 
      label: 'Top', 
      icon: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    },
    { id: 'back', label: 'Back', icon: Square3Stack3DIcon },
    { id: 'right', label: 'Right', icon: Square3Stack3DIcon },
    { id: 'bottom', label: 'Bottom', icon: Square3Stack3DIcon },
    { id: 'isometric', label: 'Isometric', icon: CubeIcon },
    { id: 'floorplan', label: 'Floor Plan', icon: ViewfinderCircleIcon }
  ]
  
  // Handle camera preset change
  const handleCameraPreset = (preset: string) => {
    setAutoRotate(false) // Stop rotation when changing view
    setCameraPreset(preset)
    const position = cameraPositions[preset]
    if (position) {
      setIsCameraAnimating(true)
      setTargetCameraPosition(position)
      
      // Enable floor plan grid for floor plan view
      if (preset === 'floorplan') {
        setShowFloorPlan(true)
        setShowDimensions(true)
      }
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && canvasRef.current) {
      canvasRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Take screenshot
  const takeScreenshot = () => {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${title}-screenshot.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      })
    }
  }

  return (
    <div className="glass rounded-xl p-6">
      {/* Main 3D Viewer */}
      <div 
        ref={canvasRef}
        className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 ${
          isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'
        }`}
      >
        {error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Error loading 3D viewer</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
        <Canvas
          camera={{ position: [5, 5, 5], fov: 50 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          shadows={showShadows}
          onCreated={() => {
            try {
              // Canvas created successfully
              console.log('3D Canvas initialized')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to initialize 3D viewer')
            }
          }}
        >
          <Suspense fallback={<LoadingProgress />}>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow={showShadows} />
            
            {/* Environment */}
            <Environment preset={lightingMode} background blur={0.6} />
            
            {/* Grid */}
            {showGrid && !showFloorPlan && (
              <Grid
                args={[20, 20]}
                cellSize={0.5}
                cellThickness={0.5}
                cellColor="#6b7280"
                sectionSize={2}
                sectionThickness={1}
                sectionColor="#9333ea"
                fadeDistance={20}
                fadeStrength={1}
                followCamera={false}
              />
            )}
            
            {/* Floor Plan Grid for booth layout */}
            <FloorPlanGrid show={showFloorPlan} />
            
            {/* Contact Shadows */}
            {showShadows && (
              <ContactShadows 
                opacity={0.5} 
                scale={10} 
                blur={2} 
                far={10} 
                resolution={256} 
                color="#000000"
              />
            )}
            
            {/* Model */}
            <Bounds fit clip observe margin={1.2}>
              <Model ref={modelRef} url={fileUrl} wireframe={wireframe} showBounds={showBounds} />
            </Bounds>
            
            {/* Measurement Tool */}
            <MeasurementTool enabled={measurementEnabled} />
            
            {/* Booth Dimensions Overlay */}
            <BoothDimensions show={showDimensions} model={modelRef.current || undefined} />
            
            {/* Camera Animation */}
            <CameraAnimator 
              targetPosition={targetCameraPosition} 
              controlsRef={controlsRef}
              onComplete={() => setIsCameraAnimating(false)}
            />
            
            {/* Orbit Controls */}
            <OrbitControls
              ref={controlsRef}
              enablePan={!isCameraAnimating && !measurementEnabled}
              enableZoom={!isCameraAnimating && !measurementEnabled}
              enableRotate={!isCameraAnimating && !measurementEnabled}
              autoRotate={autoRotate && !isCameraAnimating && !measurementEnabled}
              autoRotateSpeed={2}
              makeDefault
              target={[0, 0, 0]}
            />
            
            {/* Gizmo */}
            {showGizmo && (
              <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport 
                  axisColors={['#e11d48', '#22c55e', '#3b82f6']} 
                  labelColor="black"
                  axisHeadScale={1.5}
                  hideNegativeAxes={false}
                />
              </GizmoHelper>
            )}
            
            {/* Performance Stats inside Canvas */}
            {showStats && <PerformanceStats />}
          </Suspense>
        </Canvas>
        )}
        
        {/* Loading overlay */}
        <Loader />
        
        {/* Measurement mode indicator */}
        {measurementEnabled && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-yellow-500/90 text-black px-4 py-2 rounded-lg font-medium animate-pulse">
              Click two points to measure distance
            </div>
          </div>
        )}
        
        {/* Toolbar Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          {/* Left toolbar */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            {/* View presets */}
            <div className="bg-gray-900/60 backdrop-blur-md rounded-lg p-1 flex gap-0 border border-white/10">
              <div className="text-xs text-gray-300 px-2 py-2 border-r border-gray-600/50">Views</div>
              {viewPresets.slice(0, 4).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleCameraPreset(preset.id)}
                  className={`p-2 rounded hover:bg-white/20 transition-colors ${
                    cameraPreset === preset.id ? 'bg-white/20 text-white' : 'text-gray-300'
                  }`}
                  title={preset.label}
                >
                  {React.createElement(preset.icon, { className: "w-4 h-4" })}
                </button>
              ))}
            </div>
          </div>
          
          {/* Right toolbar */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={() => setMeasurementEnabled(!measurementEnabled)}
              className={`bg-gray-900/60 backdrop-blur-md rounded-lg p-2 hover:bg-gray-800/70 transition-colors border border-white/10 ${
                measurementEnabled ? 'bg-yellow-600/60 hover:bg-yellow-700/70' : ''
              }`}
              title="Measurement Tool"
            >
              <CalculatorIcon className={`w-5 h-5 ${measurementEnabled ? 'text-yellow-300' : 'text-white'}`} />
            </button>
            <button
              onClick={takeScreenshot}
              className="bg-gray-900/60 backdrop-blur-md rounded-lg p-2 hover:bg-gray-800/70 transition-colors border border-white/10"
              title="Take Screenshot"
            >
              <CameraIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="bg-gray-900/60 backdrop-blur-md rounded-lg p-2 hover:bg-gray-800/70 transition-colors border border-white/10"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5 text-white" /> : <ArrowsPointingOutIcon className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
        
        {/* Exit fullscreen button */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 bg-gray-900/60 backdrop-blur-md rounded-lg p-3 hover:bg-gray-800/70 transition-colors border border-white/10"
          >
            <ArrowsPointingInIcon className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
      
      {/* Enhanced Controls */}
      <div className="mt-4 space-y-4">
        {/* Quick Controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 glass rounded-lg text-sm transition-colors flex items-center gap-2 ${
              autoRotate ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            {autoRotate ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            Auto Rotate
          </button>
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-3 py-1.5 glass rounded-lg text-sm transition-colors flex items-center gap-2 ${
              wireframe ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <CubeIcon className="w-4 h-4" />
            Wireframe
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1.5 glass rounded-lg text-sm transition-colors flex items-center gap-2 ${
              showGrid ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <Square3Stack3DIcon className="w-4 h-4" />
            Grid
          </button>
          <button
            onClick={() => setShowShadows(!showShadows)}
            className={`px-3 py-1.5 glass rounded-lg text-sm transition-colors flex items-center gap-2 ${
              showShadows ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            {showShadows ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            Shadows
          </button>
          <button
            onClick={() => setShowBounds(!showBounds)}
            className={`px-3 py-1.5 glass rounded-lg text-sm transition-colors flex items-center gap-2 ${
              showBounds ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <ViewfinderCircleIcon className="w-4 h-4" />
            Bounds
          </button>
          <button
            onClick={() => setShowGizmo(!showGizmo)}
            className={`px-3 py-1.5 glass rounded-lg text-sm transition-colors flex items-center gap-2 ${
              showGizmo ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4" />
            Gizmo
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-3 py-1.5 glass rounded-lg text-sm transition-colors flex items-center gap-2 ${
              showStats ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <ChartBarIcon className="w-4 h-4" />
            Stats
          </button>
          <button
            onClick={() => setMeasurementEnabled(!measurementEnabled)}
            className={`px-3 py-1.5 glass rounded-lg text-sm transition-colors flex items-center gap-2 ${
              measurementEnabled ? 'bg-yellow-500/30 text-yellow-300' : 'hover:bg-white/10'
            }`}
          >
            <CalculatorIcon className="w-4 h-4" />
            Measure
          </button>
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-3 py-1.5 glass rounded-lg text-sm transition-colors flex items-center gap-2 ${
              showDimensions ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <TagIcon className="w-4 h-4" />
            Dimensions
          </button>
          <button
            onClick={() => setShowFloorPlan(!showFloorPlan)}
            className={`px-3 py-1.5 glass rounded-lg text-sm transition-colors flex items-center gap-2 ${
              showFloorPlan ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <ViewfinderCircleIcon className="w-4 h-4" />
            Floor Grid
          </button>
        </div>
        
        {/* Environment & View Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lighting Presets */}
          <div className="glass rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <SunIcon className="w-4 h-4" />
              Environment Lighting
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {['studio', 'sunset', 'dawn', 'night'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLightingMode(mode as 'studio' | 'sunset' | 'dawn' | 'night')}
                  className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                    lightingMode === mode 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'glass hover:bg-white/10'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          
          {/* Camera Views */}
          <div className="glass rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <CameraIcon className="w-4 h-4" />
              Camera Views
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {viewPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleCameraPreset(preset.id)}
                  className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                    cameraPreset === preset.id 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'glass hover:bg-white/10'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Booth Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model Information */}
          <div className="glass rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4" />
              Model Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-semibold">GLB</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Format</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">13MB</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">File Size</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">24.5k</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Vertices</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">48k</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Triangles</div>
              </div>
            </div>
          </div>
          
          {/* Booth Specifications */}
          <div className="glass rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Square3Stack3DIcon className="w-4 h-4" />
              Booth Specifications
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-semibold">6×4m</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Dimensions</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">24m²</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Floor Area</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">3.5m</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Max Height</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">Island</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Booth Type</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-3 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <DocumentArrowDownIcon className="w-5 h-5" />
            Download Model
          </button>
          <button 
            onClick={takeScreenshot}
            className="px-4 py-3 glass rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <CameraIcon className="w-5 h-5" />
            Screenshot
          </button>
          <button className="px-4 py-3 glass rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2">
            <ShareIcon className="w-5 h-5" />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}

// Preload the GLB model
useGLTF.preload('/metafactory-booth/source/metafactory_booth2.glb')

export default ThreeDPreview