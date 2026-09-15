import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Compass, 
  Zap, 
  Wind, 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Bot, 
  User, 
  Sliders, 
  ShieldAlert, 
  Volume2, 
  ArrowUp, 
  ArrowLeft, 
  ArrowRight,
  Target,
  Activity,
  Brain
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';
import { FlyBrainLiveCircuit } from './FlyBrainLiveCircuit';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  type: 'obstacle' | 'predator_shadow';
}

interface NectarItem {
  id: number;
  x: number;
  y: number;
  radius: number;
  value: number;
  pulsePhase: number;
}

export const FlyPilotGame: React.FC = () => {
  // Game mode: 'ai_fly' (Autopilot driven by simulated connectome) or 'manual' (Player controls)
  const [controlMode, setControlMode] = useState<'ai_fly' | 'manual'>('ai_fly');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const [sugarCollectedUg, setSugarCollectedUg] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(100);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Neurochemical tuning sliders
  const [dopamineLevel, setDopamineLevel] = useState<number>(75); // 0..100 (motivation / speed to sugar)
  const [gabaLevel, setGabaLevel] = useState<number>(60); // 0..100 (inhibition / course stability)
  const [achLevel, setAchLevel] = useState<number>(80); // 0..100 (cholinergic optical flow reaction)

  // Drone / Fly coordinates in arena (arena size: 680 width, 420 height)
  const arenaWidth = 680;
  const arenaHeight = 420;

  const droneRef = useRef({
    x: 340,
    y: 320,
    angle: 0, // degrees: 0 = straight up, -45 = left, +45 = right
    vx: 0,
    vy: 0,
    targetAngle: 0,
    wingFlap: 0,
    gfCooldown: 0,
    gfActive: false,
  });

  const [droneState, setDroneState] = useState({
    x: 340,
    y: 320,
    angle: 0,
    wingFlap: 0,
    gfActive: false,
    gfCooldown: 0,
  });

  // Telemetry state for Connectome HUD
  const [telemetry, setTelemetry] = useState({
    epgActiveWedge: 0,
    leftT4T5OpticalFlow: 0,
    rightT4T5OpticalFlow: 0,
    dm1OdorSignal: 0,
    dna02MotorCommand: 'Курс стабилен',
  });

  // Items and Obstacles refs for fast 60fps physics loop
  const nectarsRef = useRef<NectarItem[]>([
    { id: 1, x: 220, y: 120, radius: 14, value: 50, pulsePhase: 0 },
    { id: 2, x: 480, y: 180, radius: 16, value: 75, pulsePhase: 1 },
    { id: 3, x: 340, y: 80, radius: 15, value: 60, pulsePhase: 2 },
  ]);

  const obstaclesRef = useRef<Obstacle[]>([
    { id: 101, x: 180, y: -40, radius: 24, speedY: 1.8, speedX: 0.3, type: 'obstacle' },
    { id: 102, x: 440, y: -160, radius: 22, speedY: 2.1, speedX: -0.2, type: 'obstacle' },
    { id: 103, x: 300, y: -280, radius: 45, speedY: 3.2, speedX: 0, type: 'predator_shadow' },
  ]);

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Handle keyboard inputs for manual pilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        triggerGiantFiberEscape();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Emergency Giant Fiber Escape reflex
  const triggerGiantFiberEscape = useCallback(() => {
    const d = droneRef.current;
    if (d.gfCooldown > 0) return;

    d.gfActive = true;
    d.gfCooldown = 90; // frames
    d.vy = -7.5; // explosive jump forward/away
    sounds.playZap();
    sounds.playSwoosh();

    setTimeout(() => {
      d.gfActive = false;
    }, 350);
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    let animId: number;

    const loop = () => {
      const d = droneRef.current;
      d.wingFlap = (d.wingFlap + 1) % 4;

      if (d.gfCooldown > 0) {
        d.gfCooldown -= 1;
      }

      // 1. NEURAL TELEMETRY: Calculate Optical Flow (T4/T5) from nearest obstacles
      let leftFlow = 0;
      let rightFlow = 0;
      let nearestThreatDist = 999;
      let nearestThreat: Obstacle | null = null;

      obstaclesRef.current.forEach((obs) => {
        const dx = obs.x - d.x;
        const dy = obs.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 180 && dy < 40) {
          // Approaching threat
          if (dist < nearestThreatDist) {
            nearestThreatDist = dist;
            nearestThreat = obs;
          }
          if (dx < 0) {
            // Threat on left side
            leftFlow = Math.max(leftFlow, (180 - dist) / 180);
          } else {
            // Threat on right side
            rightFlow = Math.max(rightFlow, (180 - dist) / 180);
          }
        }
      });

      // 2. NEURAL TELEMETRY: Odor Gradient (DM1 Antennal Lobe) to nearest nectar
      let nearestNectar: NectarItem | null = null;
      let minNectarDist = 999;
      nectarsRef.current.forEach((nec) => {
        const dx = nec.x - d.x;
        const dy = nec.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minNectarDist) {
          minNectarDist = dist;
          nearestNectar = nec;
        }
      });

      const odorIntensity = Math.max(0, Math.min(100, Math.round((1 - minNectarDist / 400) * 100)));

      // 3. STEERING LOGIC: Manual vs Autopilot
      if (controlMode === 'manual') {
        // Player keyboard control
        const speed = 3.5 * (dopamineLevel / 75);
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) {
          d.vx = -speed;
          d.angle = Math.max(-45, d.angle - 3);
        } else if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) {
          d.vx = speed;
          d.angle = Math.min(45, d.angle + 3);
        } else {
          d.vx *= 0.88;
          d.angle *= 0.92;
        }

        if (keysPressed.current['ArrowUp'] || keysPressed.current['KeyW']) {
          d.vy = -speed;
        } else if (keysPressed.current['ArrowDown'] || keysPressed.current['KeyS']) {
          d.vy = speed * 0.8;
        } else {
          d.vy *= 0.88;
        }
      } else {
        // CONNECTOME AUTONOMOUS BIO-AI (Braitenberg & Ring Attractor)
        const achSensitivity = achLevel / 60;
        const dopamineDrive = dopamineLevel / 70;
        const gabaDamping = gabaLevel / 70;

        // Auto Giant Fiber Escape if predatory looming shadow is too close!
        if (nearestThreat && nearestThreat.type === 'predator_shadow' && nearestThreatDist < 90 && d.gfCooldown === 0) {
          triggerGiantFiberEscape();
        }

        // T4/T5 Optical Flow avoidance
        let steerForce = 0;
        if (leftFlow > 0.25 || rightFlow > 0.25) {
          // Turn away from stronger optical flow
          steerForce = (leftFlow - rightFlow) * 5.5 * achSensitivity;
        } else if (nearestNectar) {
          // Attracted to nectar odor gradient
          const dx = (nearestNectar as NectarItem).x - d.x;
          steerForce = (dx / 120) * 2.5 * dopamineDrive;
        }

        // Apply steering with GABA damping
        d.vx += steerForce * 0.4;
        d.vx *= 0.88 * gabaDamping;
        d.angle = Math.max(-40, Math.min(40, d.vx * 7));

        // Forward propulsion
        const targetY = nearestNectar ? (nearestNectar as NectarItem).y + 20 : 260;
        const dy = targetY - d.y;
        d.vy += (dy / 80) * 0.3 * dopamineDrive;
        d.vy *= 0.88;
      }

      // 4. Update Drone Position with Boundaries
      d.x += d.vx;
      d.y += d.vy;

      // Arena boundary limits
      if (d.x < 35) {
        d.x = 35;
        d.vx *= -0.5;
      }
      if (d.x > arenaWidth - 35) {
        d.x = arenaWidth - 35;
        d.vx *= -0.5;
      }
      if (d.y < 35) {
        d.y = 35;
        d.vy = 0;
      }
      if (d.y > arenaHeight - 40) {
        d.y = arenaHeight - 40;
        d.vy = 0;
      }

      // Update drone state for render
      setDroneState({
        x: d.x,
        y: d.y,
        angle: d.angle,
        wingFlap: d.wingFlap,
        gfActive: d.gfActive,
        gfCooldown: d.gfCooldown,
      });

      // 5. Update Obstacles movement & Spawning
      obstaclesRef.current.forEach((obs) => {
        obs.y += obs.speedY + (controlMode === 'manual' ? 0.6 : 0.8);
        obs.x += obs.speedX;

        // Wrap around top
        if (obs.y > arenaHeight + 60) {
          obs.y = -Math.random() * 120 - 40;
          obs.x = 60 + Math.random() * (arenaWidth - 120);
          obs.speedX = (Math.random() - 0.5) * 0.8;
        }

        // Collision Check with Drone
        const dx = obs.x - d.x;
        const dy = obs.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < obs.radius + 16 && !d.gfActive) {
          // Hit obstacle!
          setEnergy((prev) => {
            const next = Math.max(0, prev - (obs.type === 'predator_shadow' ? 35 : 18));
            if (next <= 0) {
              setGameOver(true);
            }
            return next;
          });
          sounds.playZap();
          obs.y = -60; // reset hit obstacle
        }
      });

      // 6. Update Nectar items & Collection
      nectarsRef.current.forEach((nec) => {
        nec.y += 1.2; // nectar scrolls slowly downward
        nec.pulsePhase = (nec.pulsePhase + 0.05) % (Math.PI * 2);

        // Respawn if fell off
        if (nec.y > arenaHeight + 30) {
          nec.y = -40;
          nec.x = 60 + Math.random() * (arenaWidth - 120);
        }

        // Check collection
        const dx = nec.x - d.x;
        const dy = nec.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < nec.radius + 20) {
          // Collected!
          setScore((s) => s + nec.value);
          setSugarCollectedUg((s) => s + nec.value * 2);
          setEnergy((e) => Math.min(100, e + 12));
          sounds.playCollect();

          // Respawn nectar at top
          nec.y = -Math.random() * 80 - 40;
          nec.x = 60 + Math.random() * (arenaWidth - 120);
        }
      });

      // 7. Calculate EPG Ring Attractor active wedge (16 wedges around 360 deg)
      // Reference: angle 0 = north, mapped to 0..15
      const headingNormalized = ((d.angle + 360) % 360);
      const activeWedge = Math.floor((headingNormalized / 360) * 16) % 16;

      let motorCommand = 'Стабильный курс';
      if (d.gfActive) motorCommand = '⚡ GIANT FIBER ПРЫЖОК!';
      else if (d.vx < -1.5) motorCommand = 'DNa02 поворот ВЛЕВО';
      else if (d.vx > 1.5) motorCommand = 'DNa02 поворот ВПРАВО';
      else if (d.vy < -1) motorCommand = 'Тяга вперед (85-200 Гц)';

      setTelemetry({
        epgActiveWedge: activeWedge,
        leftT4T5OpticalFlow: Math.round(leftFlow * 100),
        rightT4T5OpticalFlow: Math.round(rightFlow * 100),
        dm1OdorSignal: odorIntensity,
        dna02MotorCommand: motorCommand,
      });

      setDistanceTraveled((d) => d + 0.2);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameOver, controlMode, dopamineLevel, gabaLevel, achLevel, triggerGiantFiberEscape]);

  const handleRestart = () => {
    droneRef.current = {
      x: 340,
      y: 320,
      angle: 0,
      vx: 0,
      vy: 0,
      targetAngle: 0,
      wingFlap: 0,
      gfCooldown: 0,
      gfActive: false,
    };
    setScore(0);
    setDistanceTraveled(0);
    setSugarCollectedUg(0);
    setEnergy(100);
    setGameOver(false);
    setIsPlaying(true);
    sounds.playPop();
  };

  // Interactive spawn nectar by clicking anywhere in the arena
  const handleArenaClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * arenaWidth;
    const clickY = ((e.clientY - rect.top) / rect.height) * arenaHeight;

    // Spawn a bonus high-value nectar at click position
    nectarsRef.current.push({
      id: Date.now(),
      x: clickX,
      y: clickY,
      radius: 18,
      value: 100,
      pulsePhase: 0,
    });
    sounds.playPop();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100 p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Bot className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Fly-Pilot: Drosophila Cyber-Drone (Нейро-симулятор)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              BCI Connectome AI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Дрон управляется биологической моделью мозга дрозофилы: оптический поток T4/T5, кольцевой компас EPG и рефлекс спасения Giant Fiber
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setControlMode('ai_fly');
              sounds.playPop();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              controlMode === 'ai_fly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-300" />
            <span>Автопилот FlyWire</span>
          </button>
          <button
            onClick={() => {
              setControlMode('manual');
              sounds.playPop();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              controlMode === 'manual'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 text-emerald-300" />
            <span>Ручной пилот</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage Grid: Left (Flight Arena 7 cols) & Right (Live Brain Circuit & Connectome Telemetry 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Flight Arena Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          
          {/* Arena Stats Bar */}
          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Очки сахара</span>
              <span className="text-sm font-bold text-amber-400">{score}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Дистанция</span>
              <span className="text-sm font-bold text-cyan-400">{Math.round(distanceTraveled)} м</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Глюкоза (мкг)</span>
              <span className="text-sm font-bold text-emerald-400">{sugarCollectedUg} μg</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Энергия дрона</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-sm font-bold ${energy > 30 ? 'text-blue-400' : 'text-red-400 animate-pulse'}`}>
                  {energy}%
                </span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Flight Tunnel */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl select-none">
            
            {/* Click to drop nectar hint */}
            <div className="absolute top-3 left-3 z-10 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 pointer-events-none">
              Кликните по полю, чтобы бросить каплю сахара
            </div>

            {/* Sun Beacon indicator on top */}
            <div className="absolute top-2 right-4 z-10 flex items-center gap-1 text-[11px] text-amber-300 font-mono bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-500/30 pointer-events-none">
              <span>☀️ Поляризованный маяк</span>
            </div>

            <svg
              className="w-full h-[400px] cursor-crosshair"
              viewBox={`0 0 ${arenaWidth} ${arenaHeight}`}
              onClick={handleArenaClick}
            >
              <defs>
                <radialGradient id="sunGlow" cx="50%" cy="0%" r="60%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sugarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
                </radialGradient>
                <filter id="neonBlur">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Sun ambient field */}
              <rect x="0" y="0" width={arenaWidth} height="120" fill="url(#sunGlow)" />

              {/* Tunnel Flight Grid Gridlines */}
              <g stroke="#1E293B" strokeWidth="1" strokeDasharray="6 8" opacity="0.4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <line key={`vert-${i}`} x1={i * 85} y1="0" x2={i * 85} y2={arenaHeight} />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line key={`horiz-${i}`} x1="0" y1={i * 70} x2={arenaWidth} y2={i * 70} />
                ))}
              </g>

              {/* Nectar items with scent aroma rings */}
              {nectarsRef.current.map((nec) => (
                <g key={nec.id} className="transition-all">
                  {/* Concentric odor gradient rings */}
                  <circle
                    cx={nec.x}
                    cy={nec.y}
                    r={nec.radius + 14 + Math.sin(nec.pulsePhase) * 4}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.3"
                  />
                  <circle
                    cx={nec.x}
                    cy={nec.y}
                    r={nec.radius + 6}
                    fill="url(#sugarGlow)"
                  />
                  <circle
                    cx={nec.x}
                    cy={nec.y}
                    r={nec.radius}
                    fill="#FDE047"
                    stroke="#B45309"
                    strokeWidth="2"
                    filter="url(#neonBlur)"
                  />
                  <text
                    x={nec.x}
                    y={nec.y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#78350F"
                    className="select-none pointer-events-none"
                  >
                    🍯
                  </text>
                </g>
              ))}

              {/* Obstacles & Predatory Shadows */}
              {obstaclesRef.current.map((obs) => {
                if (obs.type === 'predator_shadow') {
                  return (
                    <g key={obs.id}>
                      {/* Looming Shadow of Swatter/Bird */}
                      <circle
                        cx={obs.x}
                        cy={obs.y}
                        r={obs.radius}
                        fill="#EF4444"
                        fillOpacity="0.25"
                        stroke="#DC2626"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="animate-pulse"
                      />
                      <circle
                        cx={obs.x}
                        cy={obs.y}
                        r={obs.radius * 0.6}
                        fill="#7F1D1D"
                        fillOpacity="0.7"
                      />
                      <text
                        x={obs.x}
                        y={obs.y + 5}
                        textAnchor="middle"
                        fill="#FCA5A5"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        ХИЩНИК
                      </text>
                    </g>
                  );
                }

                return (
                  <g key={obs.id}>
                    {/* Laser / Static Electric Obstacle */}
                    <circle
                      cx={obs.x}
                      cy={obs.y}
                      r={obs.radius}
                      fill="#3B82F6"
                      fillOpacity="0.2"
                      stroke="#60A5FA"
                      strokeWidth="2"
                    />
                    <circle
                      cx={obs.x}
                      cy={obs.y}
                      r={obs.radius * 0.5}
                      fill="#1D4ED8"
                      stroke="#93C5FD"
                      strokeWidth="1.5"
                    />
                    <text
                      x={obs.x}
                      y={obs.y + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      ⚡
                    </text>
                  </g>
                );
              })}

              {/* DROSOPHILA CYBER-DRONE (Player / Fly) */}
              <g
                transform={`translate(${droneState.x}, ${droneState.y}) rotate(${droneState.angle})`}
                className="transition-transform duration-75"
              >
                {/* Giant Fiber Shockwave Aura */}
                {droneState.gfActive && (
                  <circle
                    r="48"
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="3"
                    className="animate-ping"
                  />
                )}

                {/* Left & Right Wings (Flapping vibration animation) */}
                <ellipse
                  cx="-16"
                  cy={droneState.wingFlap % 2 === 0 ? '-6' : '-2'}
                  rx="16"
                  ry="7"
                  transform="rotate(-25)"
                  fill="#93C5FD"
                  fillOpacity="0.6"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />
                <ellipse
                  cx="16"
                  cy={droneState.wingFlap % 2 === 0 ? '-6' : '-2'}
                  rx="16"
                  ry="7"
                  transform="rotate(25)"
                  fill="#93C5FD"
                  fillOpacity="0.6"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />

                {/* Drone Torso / Fly Body */}
                <ellipse
                  cx="0"
                  cy="4"
                  rx="9"
                  ry="16"
                  fill="#1E1B4B"
                  stroke={droneState.gfActive ? '#22D3EE' : '#6366F1'}
                  strokeWidth="2"
                />

                {/* Central Complex Ellipsoid Body (Glowing Ring on Fly Thorax) */}
                <circle
                  cx="0"
                  cy="0"
                  r="5"
                  fill="#0284C7"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  className="animate-pulse"
                />

                {/* Left Compound Eye (T4/T5 Optical Flow Sensor) */}
                <circle
                  cx="-6"
                  cy="-10"
                  r="4"
                  fill={telemetry.leftT4T5OpticalFlow > 50 ? '#EF4444' : '#E11D48'}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />

                {/* Right Compound Eye (T4/T5 Optical Flow Sensor) */}
                <circle
                  cx="6"
                  cy="-10"
                  r="4"
                  fill={telemetry.rightT4T5OpticalFlow > 50 ? '#EF4444' : '#E11D48'}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />

                {/* Antennae Scent Sensors */}
                <line x1="-3" y1="-13" x2="-8" y2="-22" stroke="#38BDF8" strokeWidth="1.5" />
                <line x1="3" y1="-13" x2="8" y2="-22" stroke="#38BDF8" strokeWidth="1.5" />
                <circle cx="-8" cy="-22" r="1.5" fill="#F59E0B" />
                <circle cx="8" cy="-22" r="1.5" fill="#F59E0B" />
              </g>
            </svg>

            {/* Game Over Modal Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
                <ShieldAlert className="w-12 h-12 text-red-400 animate-bounce" />
                <h3 className="text-xl font-bold text-white">Энергия дрона исчерпана</h3>
                <p className="text-xs text-slate-300 max-w-sm">
                  Муха столкнулась со слишком большим числом препятствий. Собрано сахара: {score} очков ({sugarCollectedUg} μg глюкозы).
                </p>
                <button
                  onClick={handleRestart}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Перезапустить полет</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Manual Controls for Mobile / Mouse */}
          {controlMode === 'manual' && (
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">
                Управление: <span className="font-mono text-white">WASD</span> или стрелки.
              </div>
              <button
                onClick={triggerGiantFiberEscape}
                disabled={droneState.gfCooldown > 0}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Giant Fiber Прыжок [ПРОБЕЛ]</span>
              </button>
            </div>
          )}

          {/* Neurochemical Tuning Controls */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Тюнинг нейромедиаторов мозга мухи:</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-amber-300 font-semibold">Дофамин (DAN):</span>
                  <span className="font-mono text-amber-400">{dopamineLevel}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={dopamineLevel}
                  onChange={(e) => setDopamineLevel(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Тяга к сахару и скорость</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-cyan-300 font-semibold">ГАМК (GABA):</span>
                  <span className="font-mono text-cyan-400">{gabaLevel}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={gabaLevel}
                  onChange={(e) => setGabaLevel(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Курсовая стабильность</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-emerald-300 font-semibold">Ацетилхолин (ACh):</span>
                  <span className="font-mono text-emerald-400">{achLevel}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={achLevel}
                  onChange={(e) => setAchLevel(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Оптический поток T4/T5</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Connectome Live Brain Circuit & Telemetry (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Real-time Fly Brain Circuit Diagram */}
          <FlyBrainLiveCircuit
            activity={{
              headingDeg: droneState.angle,
              epgActiveWedge: telemetry.epgActiveWedge,
              leftT4T5OpticalFlow: telemetry.leftT4T5OpticalFlow,
              rightT4T5OpticalFlow: telemetry.rightT4T5OpticalFlow,
              dm1OdorSignal: telemetry.dm1OdorSignal,
              giantFiberActive: droneState.gfActive,
              motorCommand: telemetry.dna02MotorCommand,
              dopamineLevel,
              gabaLevel,
              achLevel,
              isAutopilot: controlMode === 'ai_fly',
              recentAction: droneState.gfActive ? 'GF Escape Reflex' : 'Active Flight',
            }}
          />

        </div>

      </div>

    </div>
  );
};
