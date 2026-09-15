import React, { useState } from 'react';
import { Header } from './components/Header';
import { ConnectomeBrainViewer } from './components/ConnectomeBrainViewer';
import { CircuitSimulator } from './components/CircuitSimulator';
import { FlyPilotGame } from './components/FlyPilotGame';
import { CatchTheFlyGame } from './components/CatchTheFlyGame';
import { ActiveTab } from './types';
import { sounds } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('connectome');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* TAB 1: WHOLE-BRAIN FLYWIRE CONNECTOME 3D ATLAS */}
        {activeTab === 'connectome' && (
          <div className="space-y-6">
            <ConnectomeBrainViewer 
              onOpenFlyPilot={() => setActiveTab('fly-pilot')} 
              onOpenCatchFly={() => setActiveTab('catch-fly')}
            />
          </div>
        )}

        {/* TAB 2: FLY-PILOT CYBER-DRONE BCI GAME */}
        {activeTab === 'fly-pilot' && (
          <div className="space-y-6">
            <FlyPilotGame />
          </div>
        )}

        {/* TAB 3: DROSOPHILA NEURAL CIRCUITS & BIOPHYSICAL SIMULATOR */}
        {activeTab === 'circuits' && (
          <div className="space-y-6">
            <CircuitSimulator />
          </div>
        )}

        {/* TAB 4: CATCH THE FLY (GIANT FIBER ESCAPE CHALLENGE) */}
        {activeTab === 'catch-fly' && (
          <div className="space-y-6">
            <CatchTheFlyGame />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/90 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">FlyWire Connectome Lab</span>
            <span>•</span>
            <span>Дрозофила (Drosophila melanogaster) & Нейросимуляция</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>Nature Landmark Connectome 2024</span>
            <span>•</span>
            <span>139,255 Neurons</span>
            <span>•</span>
            <span>54.5M Synapses</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
