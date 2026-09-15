import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Activity, 
  Layers, 
  Sparkles, 
  Info,
  Play,
  Zap,
  Filter,
  Target
} from 'lucide-react';
import { NeuropilRegion, ConnectomeNeuron } from '../types';
import { NEUROPIL_REGIONS, CONNECTOME_FEATURED_NEURONS, FLYWIRE_GLOBAL_STATS } from '../data/flywireConnectome';
import { sounds } from '../utils/audio';

interface ConnectomeBrainViewerProps {
  onOpenFlyPilot?: () => void;
  onOpenCatchFly?: () => void;
}

export const ConnectomeBrainViewer: React.FC<ConnectomeBrainViewerProps> = ({ onOpenFlyPilot, onOpenCatchFly }) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('cx');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.1);
  const [activeStimulus, setActiveStimulus] = useState<string | null>(null);
  const [showSynapses, setShowSynapses] = useState<boolean>(true);
  const [showNeurons, setShowNeurons] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const selectedRegion = NEUROPIL_REGIONS.find((r) => r.id === selectedRegionId) || NEUROPIL_REGIONS[0];

  // Auto-rotation animation loop
  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.5) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // Handle stimulus impulse propagation
  const triggerStimulus = (type: 'light' | 'odor' | 'sugar' | 'sun') => {
    setActiveStimulus(type);
    sounds.playZap();
    if (type === 'light') setSelectedRegionId('ol_left');
    if (type === 'odor') setSelectedRegionId('al');
    if (type === 'sugar') setSelectedRegionId('sez');
    if (type === 'sun') setSelectedRegionId('cx');

    setTimeout(() => {
      setActiveStimulus(null);
    }, 2800);
  };

  // Convert 3D coordinate to 2D screen projection with rotation
  const project3D = (x: number, y: number, z: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Rotate around Y axis
    const rotX = x * cos - z * sin;
    const rotZ = x * sin + z * cos;
    const rotY = y;

    // Perspective factor
    const cameraDistance = 240;
    const fov = cameraDistance / (cameraDistance + rotZ);

    const screenX = 260 + rotX * fov * zoomLevel;
    const screenY = 220 + rotY * fov * zoomLevel;
    const depthScale = Math.max(0.4, Math.min(1.6, fov));

    return { x: screenX, y: screenY, z: rotZ, scale: depthScale };
  };

  // Filter regions
  const displayedRegions = NEUROPIL_REGIONS.filter((r) => {
    if (filterCategory === 'all') return true;
    return r.category === filterCategory;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100">
      
      {/* Viewer Header */}
      <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Brain className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              3D Атлас коннектома Drosophila melanogaster (FlyWire)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Целый мозг
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Интерактивная проекция всех ключевых нейропилей, синаптических трактов и импульсов возбуждения
          </p>
        </div>

        {/* Global Dataset Stats Pills & Quick Mode Launchers */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCatchFly && (
            <button
              id="btn-open-catch-fly"
              onClick={() => {
                onOpenCatchFly();
                sounds.playPop();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>🎯 Поймай муху (GF)</span>
            </button>
          )}
          {onOpenFlyPilot && (
            <button
              onClick={() => {
                onOpenFlyPilot();
                sounds.playPop();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🎮 Fly-Pilot (Муха у руля)</span>
            </button>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Нейронов</span>
            <span className="font-bold text-cyan-400 font-mono">139,255</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Синапсов</span>
            <span className="font-bold text-purple-400 font-mono">54,500,000</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Разрешение EM</span>
            <span className="font-bold text-amber-400 font-mono">4×4×40 нм</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        
        {/* Left / Center: 3D Canvas Stage (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col justify-between relative bg-radial from-slate-900 via-slate-950 to-slate-950 min-h-[460px]">
          
          {/* Top Controls Overlay */}
          <div className="flex items-center justify-between gap-2 z-10 flex-wrap">
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Фильтр:</span>
              </span>
              {[
                { id: 'all', label: 'Все' },
                { id: 'sensory', label: 'Сенсорика' },
                { id: 'central', label: 'Компас' },
                { id: 'learning', label: 'Память' },
                { id: 'motor', label: 'Моторика' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilterCategory(f.id);
                    sounds.playPop();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    filterCategory === f.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Viewport Actions */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  setIsAutoRotating(!isAutoRotating);
                  sounds.playPop();
                }}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  isAutoRotating ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white'
                }`}
                title="Авто-вращение 3D модели"
              >
                <RotateCw className={`w-4 h-4 ${isAutoRotating ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Увеличить"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Уменьшить"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SVG 3D Canvas Projection */}
          <div className="w-full flex items-center justify-center my-4 overflow-hidden select-none">
            <svg
              className="w-full max-w-[540px] h-[360px] cursor-grab active:cursor-grabbing"
              viewBox="0 0 520 440"
              onMouseDown={(e) => {
                setIsAutoRotating(false);
                const startX = e.clientX;
                const startAngle = rotationAngle;
                const onMouseMove = (moveEvent: MouseEvent) => {
                  const delta = moveEvent.clientX - startX;
                  setRotationAngle((startAngle + delta * 0.5) % 360);
                };
                const onMouseUp = () => {
                  window.removeEventListener('mousemove', onMouseMove);
                  window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
              }}
            >
              <defs>
                <radialGradient id="flyBrainGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#818CF8" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
                <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Central Background Ambient Glow */}
              <circle cx="260" cy="220" r="180" fill="url(#flyBrainGlow)" />

              {/* Fly Outline Silhouette Wireframe (Anatomical Reference) */}
              <ellipse 
                cx="260" 
                cy="220" 
                rx="150" 
                ry="110" 
                fill="none" 
                stroke="#334155" 
                strokeWidth="1.5" 
                strokeDasharray="4 6" 
                opacity="0.4" 
              />

              {/* Synaptic Network Fiber Tracks */}
              {showSynapses && (
                <g opacity="0.6">
                  {displayedRegions.map((source, idx) => {
                    const next = displayedRegions[(idx + 1) % displayedRegions.length];
                    const p1 = project3D(source.center.x, source.center.y, source.center.z, rotationAngle);
                    const p2 = project3D(next.center.x, next.center.y, next.center.z, rotationAngle);
                    
                    const isStimulated = activeStimulus && (source.id === selectedRegionId || next.id === selectedRegionId);

                    return (
                      <g key={`tract-${source.id}-${next.id}`}>
                        <line
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke={isStimulated ? '#F43F5E' : source.color}
                          strokeWidth={isStimulated ? 3 : 1.2}
                          strokeDasharray={isStimulated ? '4 2' : 'none'}
                          opacity={isStimulated ? 0.9 : 0.35}
                          className={isStimulated ? 'animate-pulse' : ''}
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Neuropil Spheres / Centers */}
              {displayedRegions.map((region) => {
                const proj = project3D(region.center.x, region.center.y, region.center.z, rotationAngle);
                const isSelected = region.id === selectedRegionId;
                const r = region.radius * proj.scale * 0.55;

                return (
                  <g 
                    key={region.id}
                    onClick={() => {
                      setSelectedRegionId(region.id);
                      sounds.playPop();
                    }}
                    className="cursor-pointer transition-all hover:opacity-100"
                    style={{ opacity: isSelected ? 1 : 0.75 }}
                  >
                    {/* Outer glow ring */}
                    <circle
                      cx={proj.x}
                      cy={proj.y}
                      r={isSelected ? r + 12 : r + 4}
                      fill={region.color}
                      fillOpacity={isSelected ? 0.35 : 0.12}
                      stroke={region.color}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? 'none' : '3 3'}
                      filter={isSelected ? 'url(#glowEffect)' : undefined}
                    />

                    {/* Inner Core */}
                    <circle
                      cx={proj.x}
                      cy={proj.y}
                      r={Math.max(6, r * 0.7)}
                      fill={region.color}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 2.5 : 1}
                      fillOpacity="0.85"
                    />

                    {/* Label Tag */}
                    <text
                      x={proj.x}
                      y={proj.y - r - 6}
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : '#CBD5E1'}
                      fontSize={isSelected ? '12' : '10'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="monospace"
                      className="pointer-events-none drop-shadow"
                    >
                      {region.abbreviation}
                    </text>
                  </g>
                );
              })}

              {/* Key Individual Neurons (Points of interest) */}
              {showNeurons && CONNECTOME_FEATURED_NEURONS.map((neuron) => {
                const proj = project3D(neuron.position.x, neuron.position.y, neuron.position.z, rotationAngle);
                return (
                  <g key={neuron.id} className="pointer-events-none">
                    <circle
                      cx={proj.x}
                      cy={proj.y}
                      r="3.5"
                      fill="#38BDF8"
                      stroke="#0F172A"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Sensory Stimulation Trigger Bar */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 z-10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Запуск импульса стимуляции (Propagation):</span>
              </span>
              {activeStimulus && (
                <span className="text-emerald-400 font-mono text-[11px] animate-pulse">
                  Импульс в цепи...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => triggerStimulus('light')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeStimulus === 'light'
                    ? 'bg-red-600 text-white ring-2 ring-red-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <span>⚡ Угроза (Тень)</span>
              </button>
              <button
                onClick={() => triggerStimulus('odor')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeStimulus === 'odor'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <span>🍌 Запах дрожжей</span>
              </button>
              <button
                onClick={() => triggerStimulus('sugar')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeStimulus === 'sugar'
                    ? 'bg-pink-600 text-white ring-2 ring-pink-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <span>🍯 Сахар (PER)</span>
              </button>
              <button
                onClick={() => triggerStimulus('sun')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeStimulus === 'sun'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <span>🧭 Поворот солнца</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Selected Neuropil Deep Inspector (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-slate-950/60 flex flex-col justify-between space-y-4">
          
          <div className="space-y-4">
            {/* Header of selected region */}
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between gap-2">
                <span 
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${selectedRegion.color}33`, color: selectedRegion.color }}
                >
                  {selectedRegion.abbreviation}
                </span>
                <span className="text-[11px] text-slate-400 capitalize font-mono">
                  Категория: {selectedRegion.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {selectedRegion.russianName}
              </h3>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {selectedRegion.name}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedRegion.description}
            </p>

            {/* Quantitative Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Нейронов в зоне</span>
                <span className="text-sm font-bold text-blue-400">
                  {selectedRegion.neuronCount.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Синаптических связей</span>
                <span className="text-sm font-bold text-purple-400">
                  {selectedRegion.synapseCount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Neurotransmitter Composition */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Состав нейромедиаторов:</span>
              </div>
              <div className="space-y-1.5">
                {selectedRegion.transmitters.map((nt) => (
                  <div key={nt.name} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{nt.name}</span>
                      <span className="font-mono font-bold" style={{ color: nt.color }}>{nt.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${nt.percentage}%`, backgroundColor: nt.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Neuron Types */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block">
                Ключевые клеточные типы FlyWire:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedRegion.keyNeuronTypes.map((type) => (
                  <span
                    key={type}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700/60 font-mono"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Functions */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 block">
                Биологические функции:
              </span>
              <ul className="text-[11px] text-slate-400 space-y-1">
                {selectedRegion.functions.map((fn, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{fn}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick select other regions */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block mb-1.5">
              Быстрый выбор зоны:
            </span>
            <div className="flex flex-wrap gap-1">
              {NEUROPIL_REGIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRegionId(r.id);
                    sounds.playPop();
                  }}
                  className={`text-[10px] px-2 py-1 rounded-md font-mono transition cursor-pointer ${
                    r.id === selectedRegionId
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {r.abbreviation}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
