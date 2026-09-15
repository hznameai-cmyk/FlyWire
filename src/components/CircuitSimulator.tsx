import React, { useState } from 'react';
import { 
  Compass, 
  Activity, 
  Zap, 
  Sparkles, 
  Play, 
  RotateCcw, 
  CheckCircle2,
  Sliders,
  Flame,
  Volume2
} from 'lucide-react';
import { CIRCUIT_PATHWAYS } from '../data/flywireConnectome';
import { sounds } from '../utils/audio';

export const CircuitSimulator: React.FC = () => {
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('sun_compass');
  const [compassHeading, setCompassHeading] = useState<number>(45); // 0..360 degrees
  const [loomingSize, setLoomingSize] = useState<number>(20); // 0..100%
  const [isEscapeTriggered, setIsEscapeTriggered] = useState<boolean>(false);
  const [sugarConditioned, setSugarConditioned] = useState<boolean>(false);

  const currentCircuit = CIRCUIT_PATHWAYS.find((c) => c.id === selectedCircuitId) || CIRCUIT_PATHWAYS[0];

  // Compass wedge calculation: 16 wedges in Ellipsoid Body (EB)
  const numWedges = 16;
  const activeWedgeIndex = Math.floor(((compassHeading % 360) / 360) * numWedges);

  const handleTriggerEscape = () => {
    setIsEscapeTriggered(true);
    sounds.playZap();
    setTimeout(() => {
      setIsEscapeTriggered(false);
      setLoomingSize(20);
    }, 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100 p-6 space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Симулятор нейронных цепей дрозофилы
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Биофизика
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Интерактивная проверка работы реальных нейронных путей, открытых проектом FlyWire
          </p>
        </div>

        {/* Circuit Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CIRCUIT_PATHWAYS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCircuitId(c.id);
                sounds.playPop();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedCircuitId === c.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {c.russianName.split('(')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Circuit Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Experiment Stage (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/80 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[380px] relative">
          
          {/* SIMULATION 1: SUN COMPASS */}
          {selectedCircuitId === 'sun_compass' && (
            <div className="w-full space-y-6 flex flex-col items-center">
              <div className="text-center">
                <span className="text-xs text-blue-400 font-mono uppercase tracking-wider block">
                  Кольцевой аттрактор эллипсоидного тела (EB)
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Вращение волнового бугорка активности нейронов EPG
                </h3>
              </div>

              {/* Interactive Compass Ring (SVG) */}
              <div className="relative w-64 h-64 flex items-center justify-center select-none">
                <svg className="w-full h-full" viewBox="0 0 240 240">
                  <defs>
                    <radialGradient id="ringGlow">
                      <stop offset="60%" stopColor="#1E293B" />
                      <stop offset="90%" stopColor="#0F172A" />
                    </radialGradient>
                  </defs>

                  <circle cx="120" cy="120" r="105" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                  
                  {/* 16 EPG Wedge Segments */}
                  {Array.from({ length: numWedges }).map((_, i) => {
                    const startAngle = (i * 360) / numWedges - 90;
                    const endAngle = ((i + 1) * 360) / numWedges - 90;
                    const isActive = i === activeWedgeIndex;
                    const isAdjacent = Math.abs(i - activeWedgeIndex) === 1 || Math.abs(i - activeWedgeIndex) === numWedges - 1;

                    const rIn = 65;
                    const rOut = 95;

                    const sRad = (startAngle * Math.PI) / 180;
                    const eRad = (endAngle * Math.PI) / 180;

                    const x1 = 120 + rIn * Math.cos(sRad);
                    const y1 = 120 + rIn * Math.sin(sRad);
                    const x2 = 120 + rOut * Math.cos(sRad);
                    const y2 = 120 + rOut * Math.sin(sRad);
                    const x3 = 120 + rOut * Math.cos(eRad);
                    const y3 = 120 + rOut * Math.sin(eRad);
                    const x4 = 120 + rIn * Math.cos(eRad);
                    const y4 = 120 + rIn * Math.sin(eRad);

                    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${rOut} ${rOut} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rIn} ${rIn} 0 0 0 ${x1} ${y1} Z`;

                    let fill = '#1E293B';
                    if (isActive) fill = '#38BDF8';
                    else if (isAdjacent) fill = '#0284C7';

                    return (
                      <path
                        key={i}
                        d={d}
                        fill={fill}
                        stroke="#0F172A"
                        strokeWidth="2"
                        className="transition-all duration-150"
                        style={{
                          filter: isActive ? 'drop-shadow(0 0 8px #38BDF8)' : 'none'
                        }}
                      />
                    );
                  })}

                  {/* Fly Heading Needle */}
                  <g transform={`rotate(${compassHeading}, 120, 120)`}>
                    <line x1="120" y1="120" x2="120" y2="40" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" />
                    <polygon points="120,30 114,46 126,46" fill="#F43F5E" />
                    <circle cx="120" cy="120" r="16" fill="#0F172A" stroke="#F43F5E" strokeWidth="2" />
                    {/* Tiny Fly silhouette */}
                    <circle cx="120" cy="120" r="6" fill="#E2E8F0" />
                    <ellipse cx="114" cy="120" rx="3" ry="8" fill="#94A3B8" opacity="0.6" />
                    <ellipse cx="126" cy="120" rx="3" ry="8" fill="#94A3B8" opacity="0.6" />
                  </g>
                </svg>
              </div>

              {/* Slider for fly orientation */}
              <div className="w-full max-w-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Курс мухи относительно солнца:</span>
                  <span className="font-mono font-bold text-cyan-400">{Math.round(compassHeading)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={compassHeading}
                  onChange={(e) => {
                    setCompassHeading(Number(e.target.value));
                    if (Math.random() > 0.8) sounds.playPencilStroke();
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0° (Север)</span>
                  <span>90° (Восток)</span>
                  <span>180° (Юг)</span>
                  <span>270° (Запад)</span>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION 2: GIANT FIBER ESCAPE */}
          {selectedCircuitId === 'escape_reflex' && (
            <div className="w-full space-y-6 flex flex-col items-center">
              <div className="text-center">
                <span className="text-xs text-red-400 font-mono uppercase tracking-wider block">
                  Рефлекс спасения (Giant Fiber)
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Приближение хищника и взрывной прыжок за 5 мс
                </h3>
              </div>

              {/* Looming Shadow Canvas */}
              <div className="w-64 h-64 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                {/* Looming Dark Circle simulating predator/swatter */}
                <div
                  className="rounded-full bg-red-600/30 border-2 border-red-500 transition-all duration-100 flex items-center justify-center"
                  style={{
                    width: `${loomingSize * 2.2}px`,
                    height: `${loomingSize * 2.2}px`,
                    boxShadow: isEscapeTriggered ? '0 0 40px #EF4444' : 'none'
                  }}
                >
                  <span className="text-[10px] font-mono font-bold text-red-300">
                    {loomingSize > 40 ? 'УГРОЗА' : ''}
                  </span>
                </div>

                {/* Drosophila on surface */}
                <div 
                  className={`absolute transition-all duration-200 ${
                    isEscapeTriggered ? 'scale-150 -translate-y-24 opacity-20' : 'scale-100'
                  }`}
                >
                  <span className="text-3xl">🪰</span>
                </div>

                {isEscapeTriggered && (
                  <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center text-white font-bold animate-pulse">
                    <span className="text-lg">ПАКЕТ ВЫБРОШЕН!</span>
                    <span className="text-xs font-mono">Прыжок спасения за 5.2 мс</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Размер тени хищника (Looming rate):</span>
                  <span className="font-mono font-bold text-red-400">{loomingSize}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={loomingSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLoomingSize(val);
                    if (val >= 80 && !isEscapeTriggered) {
                      handleTriggerEscape();
                    }
                  }}
                  className="w-full accent-red-500 cursor-pointer"
                />
                <button
                  onClick={handleTriggerEscape}
                  className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Удар мухобойки (Тест порога)</span>
                </button>
              </div>
            </div>
          )}

          {/* SIMULATION 3 & 4: MEMORY & FEEDING */}
          {(selectedCircuitId === 'odor_learning' || selectedCircuitId === 'sugar_feeding') && (
            <div className="w-full space-y-6 flex flex-col items-center">
              <div className="text-center">
                <span className="text-xs text-purple-400 font-mono uppercase tracking-wider block">
                  Грибовидные тела (MB) и Подглоточная зона (SEZ)
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Ассоциативное обучение и пищевой рефлекс
                </h3>
              </div>

              <div className="w-64 h-64 rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-4">
                <span className="text-5xl">{sugarConditioned ? '🍌❤️🪰' : '🍌...🪰'}</span>
                <div>
                  <div className="text-xs font-bold text-white">
                    {sugarConditioned ? 'Память сформирована!' : 'Нейтральный запах'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {sugarConditioned 
                      ? 'Выброс дофамина ослабил торможение MBON. Теперь запах банана вызывает влечение!' 
                      : 'Запах банана активирует клубочек DM1, но нет подкрепления сахаром.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSugarConditioned(!sugarConditioned);
                  if (!sugarConditioned) sounds.playSparkleChime();
                  else sounds.playPop();
                }}
                className={`px-4 py-2 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-2 ${
                  sugarConditioned ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{sugarConditioned ? 'Сбросить ассоциацию' : 'Подкрепить сахаром (Дофамин DAN)'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Right: Synaptic Pathway Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/60 rounded-xl border border-slate-800 p-5 space-y-4">
          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
              Схема прохождения сигнала:
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              {currentCircuit.russianName}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {currentCircuit.description}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Стимул:</span>
              <span className="text-amber-300 font-semibold">{currentCircuit.stimulus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Реакция:</span>
              <span className="text-emerald-300 font-semibold">{currentCircuit.behavioralOutput}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Время задержки:</span>
              <span className="font-mono text-cyan-400 font-bold">{currentCircuit.latencyMs} мс</span>
            </div>
          </div>

          {/* Step-by-step nodes */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block">
              Синаптические звенья:
            </span>
            <div className="space-y-2">
              {currentCircuit.nodes.map((node, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start gap-2.5 text-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-100 font-mono">{node.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {node.transmitter}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      {node.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
