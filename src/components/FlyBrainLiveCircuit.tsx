import React, { useState } from 'react';
import { Brain, Zap, Eye, Compass, Waves, Activity, Sparkles, Info, ShieldAlert } from 'lucide-react';

export interface FlyBrainLiveActivity {
  headingDeg: number;
  epgActiveWedge: number;
  leftT4T5OpticalFlow: number; // 0..100
  rightT4T5OpticalFlow: number; // 0..100
  dm1OdorSignal: number; // 0..100
  giantFiberActive: boolean;
  motorCommand: string;
  dopamineLevel: number;
  gabaLevel: number;
  achLevel: number;
  isAutopilot: boolean;
  recentAction: string;
}

interface Props {
  activity: FlyBrainLiveActivity;
}

export const FlyBrainLiveCircuit: React.FC<Props> = ({ activity }) => {
  const [selectedCircuit, setSelectedCircuit] = useState<'all' | 'vision' | 'compass' | 'olfaction' | 'escape'>('all');
  const [showSynapseLabels, setShowSynapseLabels] = useState<boolean>(true);

  // Optical flow differences
  const leftEyeActive = activity.leftT4T5OpticalFlow > 25;
  const rightEyeActive = activity.rightT4T5OpticalFlow > 25;
  const odorActive = activity.dm1OdorSignal > 30;
  const gfActive = activity.giantFiberActive;

  // Colors
  const eyeLeftColor = leftEyeActive ? '#EF4444' : '#64748B';
  const eyeRightColor = rightEyeActive ? '#EF4444' : '#64748B';
  const compassColor = '#38BDF8';
  const odorColor = odorActive ? '#F59E0B' : '#64748B';
  const gfColor = gfActive ? '#22D3EE' : '#64748B';

  return (
    <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-4 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Мозг мухи онлайн: Коннектом FlyWire</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-[10px] text-slate-400">
              Синхронная активация нейронов в ответ на события в полете
            </p>
          </div>
        </div>

        {/* Filter tags */}
        <div className="flex items-center gap-1">
          {(['all', 'vision', 'compass', 'olfaction', 'escape'] as const).map((filter) => {
            const labels = {
              all: 'Все',
              vision: 'Зрение',
              compass: 'Компас',
              olfaction: 'Запах',
              escape: 'Побег',
            };
            return (
              <button
                key={filter}
                onClick={() => setSelectedCircuit(filter)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                  selectedCircuit === filter
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main SVG: Synaptic Circuit diagram of Fly Brain */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-2 overflow-hidden select-none">
        
        {/* Live action banner */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-cyan-300">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>Команда: {activity.motorCommand}</span>
        </div>

        <svg viewBox="0 0 380 260" className="w-full h-auto max-h-[260px]">
          <defs>
            <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="alGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
            <filter id="glowEffect">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Brain Contour outline (Fly Head / Protocerebrum) */}
          <path
            d="M 60 70 C 40 10, 110 5, 190 8 C 270 5, 340 10, 320 70 C 310 130, 270 210, 190 215 C 110 210, 70 130, 60 70 Z"
            fill="#0F172A"
            stroke="#1E293B"
            strokeWidth="2"
            opacity="0.9"
          />

          {/* SYNAPTIC PATHWAY LINES */}
          {/* 1. Vision T4/T5 -> LPLC2 -> Giant Fiber & Central Complex */}
          {(selectedCircuit === 'all' || selectedCircuit === 'vision' || selectedCircuit === 'escape') && (
            <g>
              {/* Left Eye to CX */}
              <path
                d="M 85 55 Q 120 70 160 100"
                fill="none"
                stroke={leftEyeActive ? '#EF4444' : '#334155'}
                strokeWidth={leftEyeActive ? 2.5 : 1}
                strokeDasharray={leftEyeActive ? '4 4' : 'none'}
                className={leftEyeActive ? 'animate-pulse' : ''}
              />
              {/* Right Eye to CX */}
              <path
                d="M 295 55 Q 260 70 220 100"
                fill="none"
                stroke={rightEyeActive ? '#EF4444' : '#334155'}
                strokeWidth={rightEyeActive ? 2.5 : 1}
                strokeDasharray={rightEyeActive ? '4 4' : 'none'}
                className={rightEyeActive ? 'animate-pulse' : ''}
              />
              {/* Looming threats to Giant Fiber */}
              <path
                d="M 85 55 Q 100 130 180 165"
                fill="none"
                stroke={gfActive ? '#22D3EE' : '#334155'}
                strokeWidth={gfActive ? 3 : 1}
              />
              <path
                d="M 295 55 Q 280 130 200 165"
                fill="none"
                stroke={gfActive ? '#22D3EE' : '#334155'}
                strokeWidth={gfActive ? 3 : 1}
              />
            </g>
          )}

          {/* 2. Olfactory Antennal Lobe DM1 -> Mushroom Body KC -> MBON */}
          {(selectedCircuit === 'all' || selectedCircuit === 'olfaction') && (
            <g>
              {/* Antenna to AL DM1 */}
              <line
                x1="190"
                y1="18"
                x2="190"
                y2="42"
                stroke={odorActive ? '#F59E0B' : '#334155'}
                strokeWidth={odorActive ? 2.5 : 1}
                strokeDasharray={odorActive ? '3 3' : 'none'}
              />
              {/* AL DM1 to MB Calyx */}
              <path
                d="M 190 45 Q 150 50 140 70"
                fill="none"
                stroke={odorActive ? '#F59E0B' : '#334155'}
                strokeWidth={odorActive ? 2 : 1}
              />
              <path
                d="M 190 45 Q 230 50 240 70"
                fill="none"
                stroke={odorActive ? '#F59E0B' : '#334155'}
                strokeWidth={odorActive ? 2 : 1}
              />
            </g>
          )}

          {/* 3. Central Complex -> Descending Neurons (DNa02) -> Flight Motor */}
          {(selectedCircuit === 'all' || selectedCircuit === 'compass') && (
            <g>
              <line
                x1="190"
                y1="125"
                x2="190"
                y2="165"
                stroke="#38BDF8"
                strokeWidth="2"
              />
              {/* DNa02 branching to Left/Right Wing Muscles */}
              <path
                d="M 190 195 Q 160 215 130 240"
                fill="none"
                stroke={activity.motorCommand.includes('ВЛЕВО') ? '#10B981' : '#38BDF8'}
                strokeWidth={activity.motorCommand.includes('ВЛЕВО') ? 3 : 1.5}
              />
              <path
                d="M 190 195 Q 220 215 250 240"
                fill="none"
                stroke={activity.motorCommand.includes('ВПРАВО') ? '#10B981' : '#38BDF8'}
                strokeWidth={activity.motorCommand.includes('ВПРАВО') ? 3 : 1.5}
              />
            </g>
          )}

          {/* NEUROPIL NODES */}

          {/* A. LEFT OPTIC LOBE (T4/T5 motion detectors) */}
          <g transform="translate(85, 55)">
            <ellipse cx="0" cy="0" rx="22" ry="34" fill={leftEyeActive ? 'url(#eyeGlow)' : '#1E293B'} stroke={eyeLeftColor} strokeWidth="2" />
            <text x="0" y="-12" textAnchor="middle" fill="#F87171" fontSize="8" fontWeight="bold">T4/T5 Left</text>
            <text x="0" y="3" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace">
              {activity.leftT4T5OpticalFlow}%
            </text>
            <text x="0" y="16" textAnchor="middle" fill="#94A3B8" fontSize="7">Оптич. поток</text>
          </g>

          {/* B. RIGHT OPTIC LOBE (T4/T5 motion detectors) */}
          <g transform="translate(295, 55)">
            <ellipse cx="0" cy="0" rx="22" ry="34" fill={rightEyeActive ? 'url(#eyeGlow)' : '#1E293B'} stroke={eyeRightColor} strokeWidth="2" />
            <text x="0" y="-12" textAnchor="middle" fill="#F87171" fontSize="8" fontWeight="bold">T4/T5 Right</text>
            <text x="0" y="3" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace">
              {activity.rightT4T5OpticalFlow}%
            </text>
            <text x="0" y="16" textAnchor="middle" fill="#94A3B8" fontSize="7">Оптич. поток</text>
          </g>

          {/* C. ANTENNAL LOBE (AL Glomerulus DM1 - Apple cider vinegar & sugar) */}
          <g transform="translate(190, 42)">
            <circle cx="0" cy="0" r="16" fill={odorActive ? 'url(#alGlow)' : '#1E293B'} stroke={odorColor} strokeWidth="2" />
            <text x="0" y="-2" textAnchor="middle" fill="#FBBF24" fontSize="8" fontWeight="bold">AL: DM1</text>
            <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace">{activity.dm1OdorSignal}%</text>
          </g>

          {/* D. MUSHROOM BODY (Kenyon Cells - Olfactory memory & sugar reward) */}
          <g transform="translate(140, 72)">
            <circle cx="0" cy="0" r="12" fill="#2E1065" stroke="#A855F7" strokeWidth="1.5" />
            <text x="0" y="3" textAnchor="middle" fill="#D8B4FE" fontSize="7" fontWeight="bold">KC (L)</text>
          </g>
          <g transform="translate(240, 72)">
            <circle cx="0" cy="0" r="12" fill="#2E1065" stroke="#A855F7" strokeWidth="1.5" />
            <text x="0" y="3" textAnchor="middle" fill="#D8B4FE" fontSize="7" fontWeight="bold">KC (R)</text>
          </g>

          {/* E. CENTRAL COMPLEX (CX) - Ellipsoid Body Ring Compass */}
          <g transform="translate(190, 108)">
            <circle cx="0" cy="0" r="28" fill="url(#ringGlow)" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="18" fill="#0F172A" stroke="#0284C7" strokeWidth="1" strokeDasharray="2 2" />
            
            {/* 16 EPG Neurons in ring */}
            {Array.from({ length: 16 }).map((_, i) => {
              const ang = (i * 360) / 16 - 90;
              const rad = (ang * Math.PI) / 180;
              const nx = 21 * Math.cos(rad);
              const ny = 21 * Math.sin(rad);
              const isActive = i === activity.epgActiveWedge;
              return (
                <circle
                  key={i}
                  cx={nx}
                  cy={ny}
                  r={isActive ? 3.5 : 1.5}
                  fill={isActive ? '#38BDF8' : '#475569'}
                  stroke={isActive ? '#FFFFFF' : 'none'}
                  strokeWidth="0.8"
                />
              );
            })}
            
            {/* Arrow needle for orientation */}
            <line
              x1="0"
              y1="0"
              x2={14 * Math.cos(((activity.epgActiveWedge * 360) / 16 - 90) * Math.PI / 180)}
              y2={14 * Math.sin(((activity.epgActiveWedge * 360) / 16 - 90) * Math.PI / 180)}
              stroke="#38BDF8"
              strokeWidth="2"
              strokeLinecap="round"
            />

            <text x="0" y="2" textAnchor="middle" fill="#BAE6FD" fontSize="6" fontWeight="bold">EB (EPG)</text>
            <text x="0" y="38" textAnchor="middle" fill="#7DD3FC" fontSize="7" fontFamily="monospace">
              Угол: {Math.round(activity.headingDeg)}°
            </text>
          </g>

          {/* F. DESCENDING NEURONS & GIANT FIBER (Motor Output) */}
          <g transform="translate(190, 178)">
            {/* Giant Fiber emergency node */}
            <rect
              x="-28"
              y="-10"
              width="56"
              height="20"
              rx="6"
              fill={gfActive ? '#0891B2' : '#1E293B'}
              stroke={gfColor}
              strokeWidth={gfActive ? 2.5 : 1.5}
              className={gfActive ? 'animate-ping' : ''}
            />
            <text x="0" y="3" textAnchor="middle" fill={gfActive ? '#ECFEFF' : '#E2E8F0'} fontSize="8" fontWeight="bold">
              {gfActive ? '⚡ GF ПРЫЖОК' : 'DNa02 / GF Мотор'}
            </text>
          </g>

          {/* Wing Motor outputs */}
          <g transform="translate(130, 245)">
            <rect x="-24" y="-8" width="48" height="16" rx="4" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fill="#6EE7B7" fontSize="7" fontWeight="bold">Левое крыло</text>
          </g>
          <g transform="translate(250, 245)">
            <rect x="-24" y="-8" width="48" height="16" rx="4" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fill="#6EE7B7" fontSize="7" fontWeight="bold">Правое крыло</text>
          </g>

        </svg>

        {/* Legend pills */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            <span>T4/T5 (Оптич. поток)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span>EPG (Кольцевой компас)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span>DM1 (Запах сахара)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>DNa02 (Крылья)</span>
          </div>
        </div>

      </div>

      {/* Step-by-Step Functional Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
        
        {/* 1. Vision & Collision Avoidance */}
        <div className={`p-2.5 rounded-xl border transition ${
          leftEyeActive || rightEyeActive 
            ? 'bg-red-950/30 border-red-500/40 text-red-200' 
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <Eye className="w-3.5 h-3.5 text-red-400" />
            <span>1. Зрение (T4/T5 & LPLC2)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Когда препятствие приближается слева, нейроны левого глаза возбуждаются сильнее правого. Синаптический сигнал передается на мотонейрон <strong className="text-white">DNa02</strong>, заставляя правое крыло махать с большей амплитудой для отворота.
          </p>
        </div>

        {/* 2. Ring Compass Navigation */}
        <div className={`p-2.5 rounded-xl border transition ${
          'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
        }`}>
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. Компас EPG (Центральный комплекс)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            16 клиньев эллипсоидного тела образуют кольцевой аттрактор. Бугорок возбуждения (клин <strong className="text-white">#{activity.epgActiveWedge + 1}</strong>) вращается по кругу точно в соответствии с углом рыскания мухи относительно солнца.
          </p>
        </div>

        {/* 3. Escape Reflex */}
        <div className={`p-2.5 rounded-xl border transition ${
          gfActive 
            ? 'bg-cyan-900/50 border-cyan-400 text-cyan-100 animate-pulse' 
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <Zap className="w-3.5 h-3.5 text-cyan-300" />
            <span>3. Рефлекс Giant Fiber (Спасение)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            При надвигающейся тени хищника (быстро расширяющийся темный диск) активируется гигантский аксон <strong className="text-white">Giant Fiber</strong>: задержка всего 5 миллисекунд для взрывного прыжка в безопасную зону.
          </p>
        </div>

      </div>

    </div>
  );
};
