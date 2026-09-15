// Global TypeScript types for FlyWire Fruit Fly Connectome Lab

export type ActiveTab = 'connectome' | 'fly-pilot' | 'circuits' | 'catch-fly';

export interface NeuropilRegion {
  id: string;
  name: string;
  russianName: string;
  abbreviation: string;
  category: 'sensory' | 'central' | 'learning' | 'motor';
  neuronCount: number;
  synapseCount: number;
  color: string;
  description: string;
  center: { x: number; y: number; z: number };
  radius: number;
  functions: string[];
  keyNeuronTypes: string[];
  transmitters: { name: string; percentage: number; color: string }[];
}

export interface SynapseLink {
  id: string;
  sourceId: string;
  targetId: string;
  strength: number; // 0..1
  type: 'excitatory' | 'inhibitory' | 'modulatory';
  transmitter: 'ACh' | 'GABA' | 'Glutamate' | 'Dopamine' | 'Serotonin';
}

export interface ConnectomeNeuron {
  id: string;
  flywireId: string;
  name: string;
  type: string;
  neuropil: string;
  position: { x: number; y: number; z: number };
  polarity: 'sensory' | 'interneuron' | 'motor' | 'neuroendocrine';
  transmitter: 'ACh' | 'GABA' | 'Glutamate' | 'Dopamine';
  connectionsCount: number;
}

export interface CircuitPathway {
  id: string;
  name: string;
  russianName: string;
  stimulus: string;
  behavioralOutput: string;
  latencyMs: number;
  nodes: {
    regionId: string;
    label: string;
    role: string;
    transmitter: string;
  }[];
  description: string;
}

export type CatchToolId = 'hand' | 'swatter' | 'glass_jar';
export type CatchDifficulty = 'easy' | 'normal' | 'wild';
export type FlyBehaviorState = 'perched' | 'grooming' | 'feeding' | 'takeoff' | 'airborne' | 'trapped';

export interface CatchAttemptLog {
  id: string;
  timestamp: number;
  result: 'caught' | 'escaped_gf' | 'missed_early';
  humanReactionMs: number;
  flyReactionMs: number;
  toolUsed: CatchToolId;
  wasStealth: boolean;
  notes: string;
}
