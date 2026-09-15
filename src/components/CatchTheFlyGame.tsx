import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Zap, 
  Eye, 
  Target, 
  ShieldAlert, 
  Trophy, 
  RotateCcw, 
  Play, 
  Pause, 
  Volume2, 
  Sliders, 
  Sparkles, 
  Hand, 
  HelpCircle, 
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Info,
  Keyboard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';
import { CatchToolId, CatchDifficulty, CatchAttemptLog, FlyBehaviorState } from '../types';

interface FlyPhysics {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // in radians
  targetX: number;
  targetY: number;
  altitude: number; // 0 = on ground/perched, >0 = in air
  wingPhase: number;
}

interface SugarDrop {
  id: string;
  x: number;
  y: number;
  amount: number;
}

export const CatchTheFlyGame: React.FC = () => {
  // Game Settings & Modes
  const [difficulty, setDifficulty] = useState<CatchDifficulty>('normal');
  const [selectedTool, setSelectedTool] = useState<CatchToolId>('swatter');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Sugar drops in the arena (bait for fly)
  const [sugarDrops, setSugarDrops] = useState<SugarDrop[]>([
    { id: 'sugar-init', x: 260, y: 220, amount: 100 }
  ]);
  const sugarDropsRef = useRef<SugarDrop[]>([
    { id: 'sugar-init', x: 260, y: 220, amount: 100 }
  ]);

  // Keep sugarDropsRef synchronized with state
  useEffect(() => {
    sugarDropsRef.current = sugarDrops;
  }, [sugarDrops]);

  // Arena & Cursor Refs
  const arenaRef = useRef<HTMLDivElement>(null);
  const cursorTrackerRef = useRef<{ x: number; y: number; lastX: number; lastY: number; speed: number; lastTime: number }>({
    x: 200,
    y: 200,
    lastX: 200,
    lastY: 200,
    speed: 0,
    lastTime: performance.now()
  });

  // Tool position visible in the arena (controlled by keyboard or mouse)
  const [toolPos, setToolPos] = useState<{ x: number; y: number }>({ x: 200, y: 200 });
  const [isKeyboardMode, setIsKeyboardMode] = useState<boolean>(false);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Fly State
  const [flyState, setFlyState] = useState<FlyBehaviorState>('perched');
  const flyPosRef = useRef<FlyPhysics>({
    x: 250,
    y: 250,
    vx: 0,
    vy: 0,
    angle: 0.5,
    targetX: 250,
    targetY: 250,
    altitude: 0,
    wingPhase: 0
  });

  // UI state for reactive rendering
  const [flyVisual, setFlyVisual] = useState<{ x: number; y: number; angle: number; altitude: number; wingPhase: number }>({
    x: 250,
    y: 250,
    angle: 0.5,
    altitude: 0,
    wingPhase: 0
  });

  // Neurobiology telemetry
  const [loomingThreat, setLoomingThreat] = useState<number>(0); // 0 to 100%
  const [membranePotential, setMembranePotential] = useState<number>(-70); // -70mV to -45mV
  const [stealthActive, setStealthActive] = useState<boolean>(false);
  const [lastEscapeReason, setLastEscapeReason] = useState<string | null>(null);
  const [escapeFlash, setEscapeFlash] = useState<boolean>(false);

  // Score & History
  const [catchesCount, setCatchesCount] = useState<number>(0);
  const [escapesCount, setEscapesCount] = useState<number>(0);
  const [stealthCatchesCount, setStealthCatchesCount] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [attemptLogs, setAttemptLogs] = useState<CatchAttemptLog[]>([]);
  const [lastAttemptResult, setLastAttemptResult] = useState<{
    result: 'caught' | 'escaped_gf';
    humanMs: number;
    flyMs: number;
    tool: CatchToolId;
    message: string;
  } | null>(null);

  // Click strike visual effect
  const [strikeEffect, setStrikeEffect] = useState<{ x: number; y: number; active: boolean; tool: CatchToolId } | null>(null);

  // Thresholds based on difficulty
  const config = {
    easy: {
      gfThreshold: 85, // Looming needed to trigger GF
      stealthSpeedMax: 35, // Cursor speed allowed for stealth (px/s)
      jumpSpeed: 16,
      humanReactionBase: 220,
      flyReactionMs: 14,
      name: 'Сонная мушка (Новичок)',
      desc: 'Наелась сахара, сниженная чувствительность зрительных нейронов LC4'
    },
    normal: {
      gfThreshold: 60,
      stealthSpeedMax: 18,
      jumpSpeed: 24,
      humanReactionBase: 240,
      flyReactionMs: 10,
      name: 'Дикая дрозофила (Стандарт)',
      desc: 'Точная модель коннектома FlyWire: 10мс латентность через Giant Fiber'
    },
    wild: {
      gfThreshold: 42,
      stealthSpeedMax: 10,
      jumpSpeed: 34,
      humanReactionBase: 260,
      flyReactionMs: 6,
      name: 'Нейро-Ас FlyWire (Экстрим)',
      desc: 'Сверхбыстрые электрические синапсы, панорамный охват 360°, жужжальца'
    }
  }[difficulty];

  // Tool characteristics
  const toolSpecs = {
    hand: {
      name: 'Рука / Ладонь',
      radius: 40,
      sound: 'playSwatMiss',
      windFactor: 1.0,
      icon: Hand,
      catchBonus: 'Классический захват',
      color: 'amber'
    },
    swatter: {
      name: 'Мухобойка',
      radius: 46, // Уменьшена в 2 раза площадь поражения (S = π * 46² ≈ 0.5 * π * 65²)
      sound: 'playSwatMiss',
      windFactor: 1.25, // Меньше площадь сетки -> умеренный воздушный поток
      icon: Target,
      catchBonus: 'Компактная сетка',
      color: 'rose'
    },
    glass_jar: {
      name: 'Стеклянная банка',
      radius: 48,
      sound: 'playJarTrap',
      windFactor: 0.6, // Transparent, less optical expansion
      icon: Sparkles,
      catchBonus: 'Накрывает живьем',
      color: 'cyan'
    }
  };

  // Sound buzz timer for airborne fly
  useEffect(() => {
    if (!isPlaying) return;
    let buzzTimer: NodeJS.Timeout;

    if (flyState === 'airborne' || flyState === 'takeoff') {
      const buzz = () => {
        sounds.playBuzz(230 + Math.sin(Date.now() * 0.005) * 20);
        buzzTimer = setTimeout(buzz, 180);
      };
      buzz();
    }

    return () => clearTimeout(buzzTimer);
  }, [flyState, isPlaying]);

  // Main Game Loop: Fly autonomous behavior, hovering, resting, looming detection & Keyboard Tool Movement
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastTick = performance.now();
    let stateTimer = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTick) / 1000, 0.1);
      lastTick = now;

      const fly = flyPosRef.current;
      const tracker = cursorTrackerRef.current;
      const arena = arenaRef.current;

      const arenaWidth = arena ? arena.clientWidth : 600;
      const arenaHeight = arena ? arena.clientHeight : 400;

      // Handle keyboard movement for tool if arrow keys or WASD are pressed
      const keys = keysPressedRef.current;
      let moveX = 0;
      let moveY = 0;
      if (keys['ArrowUp'] || keys['KeyW']) moveY -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) moveY += 1;
      if (keys['ArrowLeft'] || keys['KeyA']) moveX -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        setIsKeyboardMode(true);
        // Normalize direction
        const len = Math.hypot(moveX, moveY);
        const normX = moveX / len;
        const normY = moveY / len;
        // Moderate keyboard speed allows precision and stealth approach (Shift allows extra slow stealth)
        const isShift = keys['ShiftLeft'] || keys['ShiftRight'];
        const kbSpeed = isShift ? 25 : 280;
        const newX = Math.max(30, Math.min(arenaWidth - 30, tracker.x + normX * kbSpeed * dt));
        const newY = Math.max(30, Math.min(arenaHeight - 30, tracker.y + normY * kbSpeed * dt));

        tracker.x = newX;
        tracker.y = newY;
        tracker.lastX = newX;
        tracker.lastY = newY;
        tracker.speed = kbSpeed;
        tracker.lastTime = now;
        setToolPos({ x: Math.round(newX), y: Math.round(newY) });
      } else {
        // Friction on speed when neither keyboard nor mouse is moving
        const timeSinceMove = now - tracker.lastTime;
        if (timeSinceMove > 50) {
          tracker.speed = Math.max(0, tracker.speed - 600 * dt);
        }
      }

      // Calculate distance to player's tool / cursor in toroidal space
      let dx = tracker.x - fly.x;
      if (dx > arenaWidth / 2) dx -= arenaWidth;
      if (dx < -arenaWidth / 2) dx += arenaWidth;

      let dy = tracker.y - fly.y;
      if (dy > arenaHeight / 2) dy -= arenaHeight;
      if (dy < -arenaHeight / 2) dy += arenaHeight;

      const dist = Math.hypot(dx, dy);

      // Find closest active sugar drop in toroidal space
      const currentSugarDrops = sugarDropsRef.current;
      let targetSugar: { drop: SugarDrop; dist: number; dx: number; dy: number } | null = null;
      for (const drop of currentSugarDrops) {
        let sdx = drop.x - fly.x;
        if (sdx > arenaWidth / 2) sdx -= arenaWidth;
        if (sdx < -arenaWidth / 2) sdx += arenaWidth;
        let sdy = drop.y - fly.y;
        if (sdy > arenaHeight / 2) sdy -= arenaHeight;
        if (sdy < -arenaHeight / 2) sdy += arenaHeight;
        const sDist = Math.hypot(sdx, sdy);
        if (!targetSugar || sDist < targetSugar.dist) {
          targetSugar = { drop, dist: sDist, dx: sdx, dy: sdy };
        }
      }

      // Natural fly head/body tracking: when perched/feeding/grooming, fly watches the approaching object!
      if (flyState === 'perched' || flyState === 'feeding' || flyState === 'grooming') {
        if (dist < 280) {
          const angleToThreat = Math.atan2(dy, dx);
          // Turn head/body to track threatening tool (visual compound eye focus)
          let angleDiff = angleToThreat - fly.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          fly.angle += angleDiff * 0.12;
        }
      }

      // Looming stimulus calculation:
      // In Drosophila neurobiology: looming threat eta = dTheta/dt (angular velocity of expansion / approach).
      const currentTool = toolSpecs[selectedTool];
      const cursorSpeed = tracker.speed;
      const approachFactor = Math.max(0, 320 - dist) / 320; // 0 (far > 320px) to 1 (near)
      const windMultiplier = currentTool.windFactor;

      // Is stealth active? (Moving very slowly below threshold)
      const isStealth = cursorSpeed < config.stealthSpeedMax;
      setStealthActive(isStealth && dist < 240);

      let computedLooming = 0;
      if (dist < 320 && flyState !== 'trapped') {
        if (isStealth) {
          // Stealth approach: slow movement partially bypasses LC4 lobula columnar motion detectors
          computedLooming = (cursorSpeed / config.stealthSpeedMax) * 30 * approachFactor;
          // But inside immediate tool zone, proximity triggers mechanoreceptors / visual occlusion
          if (dist < currentTool.radius + 12) {
            computedLooming = Math.max(computedLooming, 75);
          }
        } else {
          // Dynamic approach creates looming threat.
          const speedThreat = Math.min((cursorSpeed / 50) * 40, 70);
          const proximityThreat = Math.pow(approachFactor, 1.25) * 60;
          computedLooming = Math.min(100, (speedThreat + proximityThreat) * windMultiplier);
        }

        // Drosophila neurobiology: feeding on sucrose stimulates Gr5a/octopamine,
        // which dampens visual looming sensitivity by ~65%
        if (flyState === 'feeding') {
          computedLooming *= 0.35;
        }
      }

      setLoomingThreat(Math.round(computedLooming));

      // Calculate Giant Fiber membrane potential (-70mV resting, -45mV action potential threshold)
      const vm = -70 + (computedLooming / 100) * 26; // reaches -44mV when looming > 96%
      setMembranePotential(Math.round(vm * 10) / 10);

      // Trigger Giant Fiber Reflex Escape Jump if looming exceeds threshold or threat penetrates danger zone without stealth
      const dangerZone = flyState === 'feeding' ? (currentTool.radius + 14) : (currentTool.radius + 35);
      const isTooCloseNonStealth = dist < dangerZone && !isStealth;
      const isDangerThresholdExceeded = computedLooming >= config.gfThreshold;

      if ((isDangerThresholdExceeded || isTooCloseNonStealth) && (flyState === 'perched' || flyState === 'feeding' || flyState === 'grooming')) {
        // TRIGGER GIANT FIBER SPIKE!
        sounds.playGiantFiberSpike();
        sounds.playSwoosh();
        setEscapeFlash(true);
        setTimeout(() => setEscapeFlash(false), 300);

        setLastEscapeReason(`Рефлекс Giant Fiber! Угроза: ${Math.round(computedLooming)}%`);
        setEscapesCount((prev) => prev + 1);
        setCurrentStreak(0);

        // Fly calculates escape angle directly away from threat in toroidal space
        const escapeAngle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.4;
        const jumpSpeed = (difficulty === 'wild' ? 1100 : difficulty === 'easy' ? 750 : 920);
        fly.vx = Math.cos(escapeAngle) * jumpSpeed;
        fly.vy = Math.sin(escapeAngle) * jumpSpeed;
        fly.angle = escapeAngle;
        fly.altitude = 1;
        
        // Relocate across endless field (no corner trapping)
        const escapeDist = 280 + Math.random() * 220;
        const rawTargetX = fly.x + Math.cos(escapeAngle) * escapeDist;
        const rawTargetY = fly.y + Math.sin(escapeAngle) * escapeDist;
        fly.targetX = ((rawTargetX % arenaWidth) + arenaWidth) % arenaWidth;
        fly.targetY = ((rawTargetY % arenaHeight) + arenaHeight) % arenaHeight;

        setFlyState('takeoff');
        stateTimer = now;

        setTimeout(() => {
          setFlyState('airborne');
        }, 100);
      }

      // Fly Autonomous State Machine
      if (flyState === 'perched' || flyState === 'feeding' || flyState === 'grooming') {
        // Stationary friction
        fly.vx *= 0.8;
        fly.vy *= 0.8;
        fly.altitude = 0;
        fly.wingPhase = 0;

        if (flyState === 'feeding') {
          // Stays contentedly feeding for 6-9 seconds unless frightened
          if (now - stateTimer > 7000 + Math.random() * 2000) {
            setFlyState('grooming');
            stateTimer = now;
          }
        } else {
          // If sugar drop is detected in the arena and no immediate danger, fly actively seeks sugar!
          const timeSinceRest = now - stateTimer;
          if (targetSugar && dist > 140 && timeSinceRest > 1500 && Math.random() < 0.75) {
            // Chemosensory olfactory attraction (Gr5a / Orco)
            fly.targetX = targetSugar.drop.x;
            fly.targetY = targetSugar.drop.y;
            fly.altitude = 1;
            setFlyState('airborne');
            sounds.playBuzz(240);
            stateTimer = now;
          } else if (timeSinceRest > 3500 + Math.random() * 3000) {
            const rand = Math.random();
            if (rand < 0.35) {
              setFlyState('grooming');
            } else if (targetSugar) {
              fly.targetX = targetSugar.drop.x;
              fly.targetY = targetSugar.drop.y;
              fly.altitude = 1;
              setFlyState('airborne');
              sounds.playBuzz(240);
            } else {
              // Spontaneous flight to random toroidal spot
              fly.targetX = Math.random() * arenaWidth;
              fly.targetY = Math.random() * arenaHeight;
              fly.altitude = 1;
              setFlyState('airborne');
              sounds.playBuzz(240);
            }
            stateTimer = now;
          }
        }
      } else if (flyState === 'takeoff' || flyState === 'airborne') {
        // Fly in air: rapid wing oscillation (240Hz visual flutter)
        fly.wingPhase += dt * 75;

        // Toroidal shortest vector to target location
        let tdx = fly.targetX - fly.x;
        if (tdx > arenaWidth / 2) tdx -= arenaWidth;
        if (tdx < -arenaWidth / 2) tdx += arenaWidth;

        let tdy = fly.targetY - fly.y;
        if (tdy > arenaHeight / 2) tdy -= arenaHeight;
        if (tdy < -arenaHeight / 2) tdy += arenaHeight;

        const tDist = Math.hypot(tdx, tdy);

        // Fast agile cruise speed (420 - 640 px/s)
        const baseFlightSpeed = (difficulty === 'wild' ? 640 : difficulty === 'easy' ? 420 : 520);

        let desiredAngle = Math.atan2(tdy, tdx);
        let speedMultiplier = 1.0;

        if (dist < 180) {
          // Evasive steering: accelerate away from threat
          const awayAngle = Math.atan2(-dy, -dx);
          desiredAngle = awayAngle;
          speedMultiplier = 1.45; // Emergency evasive speed burst
        } else if (targetSugar && targetSugar.dist < 500) {
          // Sugar chemotaxis: actively steer toward the sucrose droplet!
          desiredAngle = Math.atan2(targetSugar.dy, targetSugar.dx);
          fly.targetX = targetSugar.drop.x;
          fly.targetY = targetSugar.drop.y;
        }

        // Smooth but rapid angular turn with shortest angle diff
        let angleDiff = desiredAngle - fly.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        fly.angle += angleDiff * Math.min(1, 16 * dt);

        // Fly trajectory includes natural sinusoidal flutter
        const flutter = Math.sin(now * 0.018) * 0.22;
        const heading = fly.angle + flutter;

        const currentSpeed = Math.hypot(fly.vx, fly.vy);
        const targetSpeed = baseFlightSpeed * speedMultiplier;
        const newSpeed = currentSpeed + (targetSpeed - currentSpeed) * Math.min(1, 6 * dt);

        fly.vx = Math.cos(heading) * newSpeed;
        fly.vy = Math.sin(heading) * newSpeed;

        const isNearSugar = targetSugar && targetSugar.dist < 32;
        const isNearTarget = tDist <= 32;

        if ((isNearSugar || isNearTarget) && dist > 150) {
          // Safe to initiate landing
          fly.altitude = Math.max(0, fly.altitude - dt * 4);
          if (fly.altitude <= 0.05) {
            fly.altitude = 0;
            fly.vx = 0;
            fly.vy = 0;
            if (isNearSugar && targetSugar) {
              fly.x = targetSugar.drop.x + (Math.random() - 0.5) * 6;
              fly.y = targetSugar.drop.y + (Math.random() - 0.5) * 6;
              setFlyState('feeding');
            } else {
              setFlyState('perched');
            }
            stateTimer = now;
          }
        } else if (tDist <= 32 && dist <= 150) {
          // Threat is near landing spot: abort landing and pick new escape target across infinite field
          const abortAngle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.8;
          const rawX = fly.x + Math.cos(abortAngle) * 280;
          const rawY = fly.y + Math.sin(abortAngle) * 280;
          fly.targetX = ((rawX % arenaWidth) + arenaWidth) % arenaWidth;
          fly.targetY = ((rawY % arenaHeight) + arenaHeight) % arenaHeight;
        }
      }

      // Update position
      fly.x += fly.vx * dt;
      fly.y += fly.vy * dt;

      // Infinite Field (Toroidal Wrap):
      // Fly seamlessly crosses any boundary and emerges on the opposite side! Never cornered!
      const wrapPad = 24;
      if (arenaWidth > 0 && arenaHeight > 0) {
        if (fly.x < -wrapPad) {
          fly.x += arenaWidth + wrapPad * 2;
        } else if (fly.x > arenaWidth + wrapPad) {
          fly.x -= arenaWidth + wrapPad * 2;
        }

        if (fly.y < -wrapPad) {
          fly.y += arenaHeight + wrapPad * 2;
        } else if (fly.y > arenaHeight + wrapPad) {
          fly.y -= arenaHeight + wrapPad * 2;
        }
      }

      // Sync state for visual rendering
      setFlyVisual({
        x: Math.round(fly.x),
        y: Math.round(fly.y),
        angle: fly.angle,
        altitude: fly.altitude,
        wingPhase: fly.wingPhase
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, flyState, difficulty, selectedTool, config, isKeyboardMode]);

  // Handle Mouse Movement in Arena to calculate velocity & looming
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const arena = arenaRef.current;
    if (!arena) return;

    const rect = arena.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    const tracker = cursorTrackerRef.current;
    const dt = Math.max(1, now - tracker.lastTime);
    const distMoved = Math.hypot(x - tracker.lastX, y - tracker.lastY);

    // Speed in pixels per second with smoothing
    const rawSpeed = (distMoved / dt) * 1000;
    tracker.speed = tracker.speed * 0.3 + rawSpeed * 0.7;

    tracker.x = x;
    tracker.y = y;
    tracker.lastX = x;
    tracker.lastY = y;
    tracker.lastTime = now;

    setToolPos({ x: Math.round(x), y: Math.round(y) });
    setIsKeyboardMode(false);
  }, []);

  // Release trapped fly
  const handleReleaseFly = useCallback(() => {
    sounds.playBuzz(240);
    sounds.playSwoosh();
    const arena = arenaRef.current;
    const arenaWidth = arena ? arena.clientWidth : 600;
    const arenaHeight = arena ? arena.clientHeight : 400;

    const fly = flyPosRef.current;
    fly.altitude = 1;
    fly.vx = (Math.random() - 0.5) * 400;
    fly.vy = -350;
    fly.targetX = ((Math.random() * arenaWidth) + arenaWidth) % arenaWidth;
    fly.targetY = ((Math.random() * arenaHeight) + arenaHeight) % arenaHeight;
    setFlyState('airborne');
    setLastAttemptResult(null);
  }, []);

  // Drop or relocate sugar droplet bait
  const handleDropSugar = useCallback((x?: number, y?: number) => {
    const arena = arenaRef.current;
    const w = arena ? arena.clientWidth : 600;
    const h = arena ? arena.clientHeight : 400;

    const dropX = x !== undefined ? Math.max(30, Math.min(w - 30, x)) : (toolPos.x || w * 0.5);
    const dropY = y !== undefined ? Math.max(30, Math.min(h - 30, y)) : (toolPos.y || h * 0.5);

    sounds.playPop();
    setSugarDrops((prev) => {
      const newDrop: SugarDrop = {
        id: `sugar-${Date.now()}`,
        x: Math.round(dropX),
        y: Math.round(dropY),
        amount: 100
      };
      // Keep up to 3 sugar drops in the arena
      const updated = [newDrop, ...prev.slice(0, 2)];
      sugarDropsRef.current = updated;
      return updated;
    });
  }, [toolPos]);

  // Core Strike / Catch Execution Logic (Invoked by Mouse Click or Spacebar)
  const executeCatch = useCallback((targetX: number, targetY: number) => {
    if (!isPlaying) return;

    const arena = arenaRef.current;
    if (!arena) return;

    const fly = flyPosRef.current;
    const tool = toolSpecs[selectedTool];

    // Toroidal distance calculation
    let dCatchX = Math.abs(targetX - fly.x);
    if (dCatchX > arena.clientWidth / 2) dCatchX = arena.clientWidth - dCatchX;
    let dCatchY = Math.abs(targetY - fly.y);
    if (dCatchY > arena.clientHeight / 2) dCatchY = arena.clientHeight - dCatchY;
    const distToFly = Math.hypot(dCatchX, dCatchY);

    // Show strike visual effect
    setStrikeEffect({
      x: targetX,
      y: targetY,
      active: true,
      tool: selectedTool
    });
    setTimeout(() => setStrikeEffect(null), 350);

    // If already trapped, catch action releases fly
    if (flyState === 'trapped') {
      handleReleaseFly();
      return;
    }

    const isWithinCatchRadius = distToFly <= tool.radius;
    const isFlyGrounded = flyState === 'perched' || flyState === 'feeding' || flyState === 'grooming';
    const isStealth = stealthActive;

    const humanTime = Math.round(config.humanReactionBase + (Math.random() * 40 - 20));
    const flyTime = config.flyReactionMs;

    // Can the strike succeed?
    // Grounded:
    // - Succeeds if in stealth mode, OR loomingThreat is low (< threshold * 0.65), OR fly is feeding on sucrose
    // - FAILS if fly is alert (loomingThreat >= threshold * 0.65) and player rushed without stealth!
    const isFlyAlert = loomingThreat >= (config.gfThreshold * 0.65) && !isStealth && flyState !== 'feeding';

    if (isWithinCatchRadius && !isFlyAlert) {
      if (isFlyGrounded || (selectedTool === 'swatter' && distToFly < tool.radius * 0.7)) {
        // SUCCESSFUL CATCH!
        if (selectedTool === 'glass_jar') {
          sounds.playJarTrap();
          setFlyState('trapped');
        } else {
          sounds.playCatchSuccess();
          setFlyState('trapped');
        }

        sounds.playSparkleChime();
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch {}

        setCatchesCount((prev) => prev + 1);
        if (isStealth) setStealthCatchesCount((prev) => prev + 1);
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);

        const resultObj = {
          result: 'caught' as const,
          humanMs: humanTime,
          flyMs: flyTime,
          tool: selectedTool,
          message: isStealth 
            ? 'ИДЕАЛЬНЫЙ СКРЫТНЫЙ ЗАХВАТ! Нейроны LC4/T4 не успели обнаружить скрытное движение.' 
            : flyState === 'feeding'
            ? 'УСПЕХ! Муха увлеклась каплей сахара и не успела активировать TTMn-прыжок.'
            : 'УСПЕШНАЯ ПОИМКА! Вы опередили поворот крыловых мотонейронов мухи.'
        };
        setLastAttemptResult(resultObj);

        setAttemptLogs((prev) => [
          {
            id: String(Date.now()),
            timestamp: Date.now(),
            result: 'caught',
            humanReactionMs: humanTime,
            flyReactionMs: flyTime,
            toolUsed: selectedTool,
            wasStealth: isStealth,
            notes: isStealth ? 'Скрытное приближение' : flyState === 'feeding' ? 'Отвлеклась на сахар' : 'Точный тайминг удара'
          },
          ...prev.slice(0, 7)
        ]);

        return;
      }
    }

    // MISSED CATCH / FLY ESCAPES VIA EXPLOSIVE GF CATAPULT REFLEX!
    sounds.playSwatMiss();
    sounds.playGiantFiberSpike();
    sounds.playEscapeBuzz();

    setEscapesCount((prev) => prev + 1);
    setCurrentStreak(0);

    // Fly escapes away with lightning catapult speed in toroidal space
    let escDx = fly.x - targetX;
    if (escDx > arena.clientWidth / 2) escDx -= arena.clientWidth;
    if (escDx < -arena.clientWidth / 2) escDx += arena.clientWidth;

    let escDy = fly.y - targetY;
    if (escDy > arena.clientHeight / 2) escDy -= arena.clientHeight;
    if (escDy < -arena.clientHeight / 2) escDy += arena.clientHeight;

    const escapeAngle = Math.atan2(escDy, escDx) + (Math.random() - 0.5) * 0.4;
    const jumpSpeed = (difficulty === 'wild' ? 1150 : difficulty === 'easy' ? 800 : 960);
    fly.vx = Math.cos(escapeAngle) * jumpSpeed;
    fly.vy = Math.sin(escapeAngle) * jumpSpeed;
    fly.altitude = 1;
    fly.angle = escapeAngle;
    
    // Choose a distant safe landing location across endless toroidal field!
    const escapeDistance = 300 + Math.random() * 240;
    const rawTargetX = fly.x + Math.cos(escapeAngle) * escapeDistance;
    const rawTargetY = fly.y + Math.sin(escapeAngle) * escapeDistance;
    fly.targetX = ((rawTargetX % arena.clientWidth) + arena.clientWidth) % arena.clientWidth;
    fly.targetY = ((rawTargetY % arena.clientHeight) + arena.clientHeight) % arena.clientHeight;

    setFlyState('takeoff');
    setTimeout(() => {
      setFlyState('airborne');
    }, 100);

    const resultObj = {
      result: 'escaped_gf' as const,
      humanMs: humanTime,
      flyMs: flyTime,
      tool: selectedTool,
      message: isFlyAlert
        ? `МУХА УСПЕЛА УБЕЖАТЬ! Угроза была ${loomingThreat}% — рефлекс GF сработал за ${flyTime} мс (ваш удар: ${humanTime} мс).`
        : `ПРОМАХ! Коннектомный рефлекс GF сработал за ${flyTime} мс (ваша реакция: ${humanTime} мс).`
    };
    setLastAttemptResult(resultObj);

    setAttemptLogs((prev) => [
      {
        id: String(Date.now()),
        timestamp: Date.now(),
        result: 'escaped_gf',
        humanReactionMs: humanTime,
        flyReactionMs: flyTime,
        toolUsed: selectedTool,
        wasStealth: false,
        notes: isFlyAlert ? `Угроза ${loomingThreat}%: прыжок за ${flyTime}мс` : `Прыжок TTMn за ${flyTime}мс`
      },
      ...prev.slice(0, 7)
    ]);
  }, [isPlaying, flyState, selectedTool, stealthActive, config, currentStreak, bestStreak, handleReleaseFly, loomingThreat, difficulty]);

  // Handle Mouse Click in Arena
  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const arena = arenaRef.current;
    if (!arena) return;

    const rect = arena.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const tracker = cursorTrackerRef.current;
    tracker.x = clickX;
    tracker.y = clickY;
    setToolPos({ x: Math.round(clickX), y: Math.round(clickY) });

    executeCatch(clickX, clickY);
  };

  // Global Keyboard Event Listener: Arrow Keys / WASD for Moving Tool, Space for Catch, B for Sugar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        keysPressedRef.current[e.code] = true;
        setIsKeyboardMode(true);
      } else if (e.code === 'Space') {
        e.preventDefault();
        const tracker = cursorTrackerRef.current;
        executeCatch(tracker.x, tracker.y);
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        const tracker = cursorTrackerRef.current;
        handleDropSugar(tracker.x, tracker.y);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        keysPressedRef.current[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [executeCatch, handleDropSugar]);

  // Reset stats
  const handleResetStats = () => {
    setCatchesCount(0);
    setEscapesCount(0);
    setStealthCatchesCount(0);
    setCurrentStreak(0);
    setAttemptLogs([]);
    setLastAttemptResult(null);
    sounds.playPop();
  };

  // Move fly to a fresh starting point
  const handleResetFlyPos = () => {
    const arena = arenaRef.current;
    const w = arena ? arena.clientWidth : 600;
    const h = arena ? arena.clientHeight : 400;
    const fly = flyPosRef.current;
    fly.x = w * 0.5;
    fly.y = h * 0.5;
    fly.vx = 0;
    fly.vy = 0;
    fly.altitude = 0;
    setFlyState('perched');
    sounds.playPop();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Target className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Режим «Поймай муху»: Вызов рефлексу Giant Fiber</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                FlyWire Evasion
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Испытайте свою реакцию против биологического коннектома дрозофилы: спайк гигантского волокна за 8–12 мс!
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition cursor-pointer border border-slate-700"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{showGuide ? 'Скрыть подсказки' : 'Как поймать муху?'}</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              isPlaying 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Пауза' : 'Продолжить'}</span>
          </button>
        </div>
      </div>

      {/* Scientific Guide Collapse */}
      {showGuide && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Info className="w-4 h-4" />
            <span>Нейробиологический секрет: Почему муху почти невозможно прихлопнуть?</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <strong className="text-white block">1. Рефлекс Looming (расширяющейся тени)</strong>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Фасеточные глаза мухи фиксируют увеличение углового размера руки со скоростью 300 кадров/сек.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <strong className="text-cyan-300 block">2. Нейрон Giant Fiber (GF)</strong>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Самый толстый аксон в мозге мухи соединяется с ногами через электрические синапсы (задержка всего 3–5 мс против 240 мс у человека).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <strong className="text-emerald-400 block">3. Метод биологов: Скрытность (Stealth)</strong>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Детекторы T4/T5 не реагируют на сверхмедленное движение! Приближайте курсор плавно и медленно, пока индикатор «Скрытность» зелёный.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Arena & Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: The Arena (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Tool & Difficulty Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            
            {/* Tools */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Орудие:</span>
              {(['swatter', 'hand', 'glass_jar'] as CatchToolId[]).map((toolId) => {
                const spec = toolSpecs[toolId];
                const Icon = spec.icon;
                const isSelected = selectedTool === toolId;
                return (
                  <button
                    key={toolId}
                    onClick={() => {
                      setSelectedTool(toolId);
                      sounds.playPop();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{spec.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Difficulty Pills & Control Mode */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-300 text-[11px] font-mono">
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span>Стрелки / Пробел</span>
              </div>

              <div className="flex items-center gap-1">
                {(['easy', 'normal', 'wild'] as CatchDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      sounds.playPop();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      difficulty === d
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d === 'easy' ? 'Сонная' : d === 'normal' ? 'Дикая' : 'Экстрим ⚡'}
                  </button>
                ))}
              </div>

              {/* Add Sugar Droplet Bait Button */}
              <button
                onClick={() => handleDropSugar()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer shadow-sm active:scale-95"
                title="Капнуть сахарную приманку (клавиша B). Привлекает муху и снижает её бдительность на 65%!"
              >
                <span>🍯</span>
                <span className="hidden sm:inline">Капнуть сахар</span>
                <span className="sm:hidden">Сахар</span>
                <span className="text-[10px] opacity-75 font-mono">(B)</span>
              </button>
            </div>

          </div>

          {/* Arena Canvas Area */}
          <div
            ref={arenaRef}
            onMouseMove={handleMouseMove}
            onClick={handleArenaClick}
            className={`w-full h-[460px] sm:h-[500px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-3xl border relative overflow-hidden select-none cursor-crosshair transition-all duration-300 ${
              escapeFlash 
                ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-rose-900/30' 
                : flyState === 'trapped'
                ? 'border-emerald-500/60 ring-2 ring-emerald-500/30'
                : 'border-slate-800 hover:border-slate-700'
            }`}
            style={{
              backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.4) 0%, transparent 70%),
                linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 32px 32px, 32px 32px'
            }}
          >
            {/* Top Lab Environment Props */}
            {/* Petri dish decoration */}
            <div className="absolute top-6 left-6 w-32 h-32 rounded-full border border-cyan-500/20 bg-cyan-950/10 pointer-events-none flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-cyan-500/10 flex items-center justify-center">
                <span className="text-[10px] text-cyan-500/30 font-mono select-none">Petri #42</span>
              </div>
            </div>

            {/* Dynamic Sugar droplets (Sucrose Bait) */}
            {sugarDrops.map((drop, idx) => {
              const isFeedingHere = flyState === 'feeding' && Math.hypot(flyVisual.x - drop.x, flyVisual.y - drop.y) < 42;
              return (
                <div
                  key={drop.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center z-[2]"
                  style={{ left: drop.x, top: drop.y }}
                >
                  {/* Scent dispersion wave rings */}
                  <div className="absolute w-24 h-24 rounded-full border border-amber-400/20 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-14 h-14 rounded-full border border-amber-400/35 animate-pulse pointer-events-none" />

                  {/* Sugar Droplet body */}
                  <div className={`w-9 h-9 rounded-full backdrop-blur-sm shadow-xl flex items-center justify-center transition-all ${
                    isFeedingHere
                      ? 'bg-amber-400/40 border-2 border-amber-300 ring-4 ring-amber-400/30 scale-110 shadow-amber-500/50'
                      : 'bg-amber-400/25 border border-amber-400/50 shadow-amber-500/30'
                  }`}>
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 to-amber-100 shadow-inner" />
                  </div>

                  {/* Label */}
                  <div className="mt-1 px-2 py-0.5 rounded-full bg-slate-950/90 border border-amber-500/40 text-[9px] font-mono text-amber-300 whitespace-nowrap shadow-sm flex items-center gap-1">
                    <span>🍯 Сахарная капля {idx === 0 && '(свежая)'}</span>
                    {isFeedingHere && <span className="text-emerald-400 font-bold animate-pulse">● Муха ест!</span>}
                  </div>
                </div>
              );
            })}

            {/* Peach slice prop */}
            <div className="absolute bottom-8 right-10 w-28 h-20 rounded-full border border-orange-500/20 bg-gradient-to-tr from-orange-950/20 to-amber-900/10 pointer-events-none flex items-center justify-center -rotate-12">
              <span className="text-[9px] text-orange-400/30 font-mono select-none">Спелый персик</span>
            </div>

            {/* Flash Overlay on Giant Fiber Escape */}
            {escapeFlash && (
              <div className="absolute inset-0 bg-rose-500/15 pointer-events-none flex items-center justify-center animate-ping">
                <div className="bg-rose-950/90 border border-rose-500 text-rose-200 px-4 py-1.5 rounded-full text-xs font-bold font-mono shadow-xl flex items-center gap-2">
                  <Zap className="w-4 h-4 text-rose-400" />
                  <span>GF SPIKE TRIGGERED! ESCAPE JUMP!</span>
                </div>
              </div>
            )}

            {/* Strike Click Effect Visual */}
            {strikeEffect && (
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-300 animate-out fade-out zoom-out-50"
                style={{
                  left: strikeEffect.x,
                  top: strikeEffect.y,
                  width: toolSpecs[strikeEffect.tool].radius * 2,
                  height: toolSpecs[strikeEffect.tool].radius * 2,
                  borderColor: strikeEffect.tool === 'swatter' ? '#f43f5e' : strikeEffect.tool === 'glass_jar' ? '#06b6d4' : '#f59e0b',
                  backgroundColor: strikeEffect.tool === 'swatter' ? 'rgba(244,63,94,0.2)' : strikeEffect.tool === 'glass_jar' ? 'rgba(6,182,212,0.2)' : 'rgba(245,158,11,0.2)'
                }}
              />
            )}

            {/* Fly SVG Rendering */}
            <div
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform ease-out"
              style={{
                left: flyVisual.x,
                top: flyVisual.y,
                transform: `translate(-50%, -50%) rotate(${flyVisual.angle * (180 / Math.PI) + 90}deg) scale(${1 + flyVisual.altitude * 0.3})`,
                filter: flyVisual.altitude > 0 ? 'drop-shadow(0 14px 12px rgba(0,0,0,0.6))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                className="w-16 h-16"
              >
                {/* Wings - Oscillating during flight or perched */}
                <g>
                  {/* Left Wing */}
                  <ellipse
                    cx={flyVisual.altitude > 0 ? 22 + Math.sin(flyVisual.wingPhase) * 4 : 24}
                    cy="30"
                    rx="18"
                    ry="6"
                    fill="rgba(224, 242, 254, 0.65)"
                    stroke="#38BDF8"
                    strokeWidth="1.2"
                    transform={`rotate(${flyVisual.altitude > 0 ? -40 + Math.sin(flyVisual.wingPhase) * 35 : -30} 24 30)`}
                  />
                  {/* Right Wing */}
                  <ellipse
                    cx={flyVisual.altitude > 0 ? 42 - Math.sin(flyVisual.wingPhase) * 4 : 40}
                    cy="30"
                    rx="18"
                    ry="6"
                    fill="rgba(224, 242, 254, 0.65)"
                    stroke="#38BDF8"
                    strokeWidth="1.2"
                    transform={`rotate(${flyVisual.altitude > 0 ? 40 - Math.sin(flyVisual.wingPhase) * 35 : 30} 40 30)`}
                  />
                </g>

                {/* Legs (6 articulated walking legs) */}
                <g stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none">
                  {/* Front legs */}
                  <path d={flyState === 'grooming' ? 'M 28 22 Q 22 14 26 10 M 36 22 Q 42 14 38 10' : 'M 28 22 Q 18 16 12 12 M 36 22 Q 46 16 52 12'} />
                  {/* Middle legs (Giant fiber jump catapults) */}
                  <path d="M 27 28 Q 14 28 8 28 M 37 28 Q 50 28 56 28" />
                  {/* Hind legs */}
                  <path d="M 28 34 Q 16 42 10 50 M 36 34 Q 48 42 54 50" />
                </g>

                {/* Abdomen with characteristic Drosophila stripes */}
                <ellipse cx="32" cy="42" rx="7.5" ry="12" fill="#F59E0B" stroke="#451A03" strokeWidth="1.5" />
                {/* Abdominal melanin bands */}
                <path d="M 25 36 Q 32 39 39 36 M 25 41 Q 32 44 39 41 M 26 46 Q 32 49 38 46 M 28 50 Q 32 52 36 50" stroke="#451A03" strokeWidth="1.4" fill="none" />

                {/* Thorax */}
                <ellipse cx="32" cy="27" rx="6.5" ry="7" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />

                {/* Head */}
                <circle cx="32" cy="18" r="5" fill="#FBBF24" stroke="#78350F" strokeWidth="1.2" />

                {/* Ruby Red Compound Eyes (800 ommatidia) */}
                <circle cx="28" cy="17" r="3.2" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
                <circle cx="36" cy="17" r="3.2" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
                {/* Eye glint */}
                <circle cx="27" cy="16" r="0.8" fill="#FEE2E2" />
                <circle cx="35" cy="16" r="0.8" fill="#FEE2E2" />

                {/* Antennae & Arista */}
                <path d="M 31 13 Q 28 9 26 7 M 33 13 Q 36 9 38 7" stroke="#451A03" strokeWidth="1" fill="none" />

                {/* Proboscis (when feeding) */}
                {flyState === 'feeding' && (
                  <path d="M 32 23 L 32 28" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
                )}
              </svg>

              {/* Status Badge floating above fly */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shadow-sm font-semibold border ${
                  flyState === 'trapped'
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                    : flyState === 'takeoff' || flyState === 'airborne'
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 animate-pulse'
                    : loomingThreat > 50
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 animate-pulse'
                    : stealthActive
                    ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700'
                }`}>
                  {flyState === 'trapped' 
                    ? 'ПОЙМАНА! 🪰' 
                    : flyState === 'airborne' || flyState === 'takeoff'
                    ? 'ПОЛЕТ 240 Гц'
                    : loomingThreat > 50
                    ? `Тревога LC4! (${loomingThreat}%)`
                    : flyState === 'feeding'
                    ? 'Питается сахаром'
                    : flyState === 'grooming'
                    ? 'Чистит лапки'
                    : 'Внимательно следит'}
                </span>
              </div>
            </div>

            {/* Glass Jar Overlay if Trapped with Glass Jar */}
            {flyState === 'trapped' && selectedTool === 'glass_jar' && (
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-cyan-400/80 bg-cyan-500/20 backdrop-blur-[1px] shadow-2xl shadow-cyan-500/30 flex items-center justify-center animate-in zoom-in-95"
                style={{
                  left: flyVisual.x,
                  top: flyVisual.y,
                  width: toolSpecs.glass_jar.radius * 2,
                  height: toolSpecs.glass_jar.radius * 2
                }}
              >
                <div className="text-[11px] font-bold text-cyan-200 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
                  В банке!
                </div>
              </div>
            )}

            {/* Controllable Tool Item Visible in Arena (moves via Keyboard WASD/Arrows or Mouse) */}
            <div
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 z-10 flex flex-col items-center justify-center"
              style={{
                left: toolPos.x,
                top: toolPos.y,
                width: toolSpecs[selectedTool].radius * 2,
                height: toolSpecs[selectedTool].radius * 2,
              }}
            >
              {/* Radius outline indicating hit area */}
              <div
                className={`w-full h-full rounded-full border border-dashed transition-colors duration-200 flex items-center justify-center ${
                  selectedTool === 'swatter'
                    ? 'border-rose-400/50 bg-rose-500/10'
                    : selectedTool === 'glass_jar'
                    ? 'border-cyan-400/50 bg-cyan-500/10'
                    : 'border-amber-400/50 bg-amber-500/10'
                }`}
              >
                {/* Specific tool visual rendering */}
                {selectedTool === 'swatter' ? (
                  <div className="flex flex-col items-center">
                    {/* Swatter grid head */}
                    <div className="w-8 h-9 border-2 border-rose-400 bg-rose-500/25 rounded-md shadow-lg shadow-rose-950/50 grid grid-cols-3 grid-rows-4 gap-0.5 p-0.5">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-rose-400/40 rounded-[1px]" />
                      ))}
                    </div>
                    {/* Swatter handle */}
                    <div className="w-1.5 h-4 bg-rose-600 rounded-b shadow-sm -mt-0.5" />
                  </div>
                ) : selectedTool === 'glass_jar' ? (
                  <div className="flex flex-col items-center">
                    {/* Jar rim */}
                    <div className="w-7 h-2 bg-cyan-300 rounded-t-sm shadow-sm" />
                    {/* Jar glass body */}
                    <div className="w-10 h-11 border-2 border-cyan-300 bg-cyan-400/25 rounded-b-xl shadow-lg shadow-cyan-950/50 relative flex items-center justify-center">
                      <div className="absolute top-1 right-1.5 w-1.5 h-6 bg-white/40 rounded-full blur-[0.5px]" />
                      <div className="text-[10px] text-cyan-200 font-bold font-mono">JAR</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* Hand / Palm */}
                    <div className="w-10 h-10 rounded-full border-2 border-amber-400 bg-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-950/50">
                      <span className="text-xl select-none">✋</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tool key prompt badge */}
              <div className="mt-1 px-1.5 py-0.5 bg-slate-950/90 border border-slate-700/80 rounded text-[9px] text-slate-300 font-mono whitespace-nowrap shadow-md flex items-center gap-1">
                <span>Пробел: поймать</span>
              </div>
            </div>

          </div>

          {/* Telemetry HUD Console Strip (Placed outside arena to never obstruct the game field) */}
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800 p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
            
            {/* Looming threat gauge */}
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300 font-mono text-[11px]">Угроза приближения (Looming):</span>
                  <span className={`font-mono font-bold text-xs ${
                    loomingThreat > config.gfThreshold ? 'text-rose-400 animate-pulse' : loomingThreat > 30 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {loomingThreat}%
                  </span>
                </div>
                <div className="w-32 sm:w-44 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-150 rounded-full ${
                      loomingThreat > config.gfThreshold ? 'bg-rose-500' : loomingThreat > 30 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, loomingThreat)}%` }}
                  />
                </div>
              </div>

              {/* Giant Fiber Voltage */}
              <div className="hidden sm:block border-l border-slate-800 pl-3">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Потенциал GF:</span>
                  <span className={`font-bold ${membranePotential > -50 ? 'text-rose-400' : 'text-cyan-300'}`}>
                    {membranePotential} mV
                  </span>
                </div>
                <span className="text-[9px] text-slate-400">Порог спайка: -45 mV</span>
              </div>
            </div>

            {/* Stealth & Infinite Field Badges & Trapped Action */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 border border-cyan-500/30 rounded-xl text-cyan-300 text-[11px] font-mono">
                <span>🌀 Сквозные границы (бесконечное поле)</span>
              </div>

              <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 border ${
                stealthActive
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800'
              }`}>
                <span className={`w-2 h-2 rounded-full ${stealthActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                <span>{stealthActive ? 'Скрытный подход: АКТИВЕН' : 'Обычное движение'}</span>
              </div>

              {flyState === 'trapped' && (
                <button
                  onClick={handleReleaseFly}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Выпустить муху 🪰
                </button>
              )}
            </div>

          </div>

          {/* Quick instructions under arena */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-300 font-medium">Клавиатура:</span> стрелки / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[11px] font-mono text-slate-200">WASD</kbd>, <kbd className="px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded text-[11px] font-mono">Shift</kbd> — скрытно, <kbd className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[11px] font-mono">Пробел</kbd> — поймать, <kbd className="px-1.5 py-0.5 bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded text-[11px] font-mono font-bold">B</kbd> — капнуть сахар 🍯
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline">
                Муха свободно пересекает границы арены (бесконечный стол)
              </span>
            </div>
            <button
              onClick={handleResetFlyPos}
              className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium text-xs ml-auto"
            >
              Вернуть муху в центр
            </button>
          </div>

        </div>

        {/* Right: Neuro-Analysis & Stats Dashboard (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Reaction Time Comparison Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Сравнение времени реакции
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">FlyWire Connectome</span>
            </div>

            <div className="space-y-3">
              {/* Fly Latency */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    🪰 Дрозофила (Giant Fiber)
                  </span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">
                    ~{config.flyReactionMs} мс
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Электрические щелевые контакты (gap junctions) зрительной доли передают спайк прямо на мотонейроны ножек TTMn.
                </p>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '8%' }} />
                </div>
              </div>

              {/* Human Latency */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    👤 Человек (Глаз ➔ Мышца руки)
                  </span>
                  <span className="font-mono text-amber-400 font-bold text-sm">
                    ~{config.humanReactionBase} мс
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Сетчатка ➔ Зрительная кора V1 ➔ Моторная кора ➔ Спинной мозг ➔ Палец руки. Муха быстрее в 20 раз!
                </p>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Player Score & Records */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Ваши рекорды
                </h3>
              </div>
              <button
                onClick={handleResetStats}
                className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded hover:bg-slate-800 cursor-pointer"
                title="Сбросить счет"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Поймано</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">
                  {catchesCount}
                </span>
                <span className="text-[9px] text-slate-400">из {catchesCount + escapesCount}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Серия (Streak)</span>
                <span className="text-2xl font-bold text-amber-400 font-mono mt-0.5 block">
                  {currentStreak}
                </span>
                <span className="text-[9px] text-slate-400">Рекорд: {bestStreak}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Скрытных поимок</span>
                <span className="text-lg font-bold text-cyan-300 font-mono mt-0.5 block">
                  {stealthCatchesCount}
                </span>
                <span className="text-[9px] text-cyan-400/70">Stealth mastery</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Успешность</span>
                <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                  {catchesCount + escapesCount > 0
                    ? `${Math.round((catchesCount / (catchesCount + escapesCount)) * 100)}%`
                    : '0%'}
                </span>
                <span className="text-[9px] text-slate-400">Win rate</span>
              </div>
            </div>

            {/* Last Attempt Outcome Notice */}
            {lastAttemptResult && (
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 animate-in fade-in duration-200 ${
                lastAttemptResult.result === 'caught'
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              }`}>
                {lastAttemptResult.result === 'caught' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-0.5">
                  <span className="font-bold block">
                    {lastAttemptResult.result === 'caught' ? 'Муха поймана!' : 'Муха увернулась!'}
                  </span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {lastAttemptResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recent attempts log */}
          {attemptLogs.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase block">
                Журнал попыток
              </span>
              <div className="space-y-2">
                {attemptLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${log.result === 'caught' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="text-slate-300 font-medium">
                        {log.result === 'caught' ? 'Поймана' : 'Побег GF'}
                      </span>
                      <span className="text-slate-400">({toolSpecs[log.toolUsed].name})</span>
                    </div>
                    <span className="font-mono text-slate-400">
                      {log.notes}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
