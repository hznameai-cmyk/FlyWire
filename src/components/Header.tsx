import React, { useState } from 'react';
import { 
  Brain, 
  Volume2, 
  VolumeX, 
  Activity,
  Bot,
  Target,
  Github,
  X,
  CheckCircle2,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { ActiveTab } from '../types';
import { sounds } from '../utils/audio';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  soundEnabled,
  onToggleSound
}) => {
  const [showDeployModal, setShowDeployModal] = useState(false);

  const tabs = [
    { id: 'connectome' as ActiveTab, label: 'Мозг мухи (FlyWire)', icon: Brain, badge: '139k нейронов' },
    { id: 'fly-pilot' as ActiveTab, label: 'Fly-Pilot (Полет мухи)', icon: Bot, badge: 'BCI Игра' },
    { id: 'circuits' as ActiveTab, label: 'Нейроцепи и рефлексы', icon: Activity, badge: 'Симуляция' },
    { id: 'catch-fly' as ActiveTab, label: 'Поймай муху (GF)', icon: Target, badge: 'Тест реакции' },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      {/* Top Banner with Drosophila FlyWire landmark notification & Deploy Button */}
      <div className="bg-gradient-to-r from-blue-900/60 via-purple-900/40 to-slate-900 px-4 py-1.5 border-b border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-semibold text-white">FlyWire v783 (Drosophila melanogaster Connectome, Nature 2024):</span>
          <span className="text-slate-300 hidden sm:inline">139,255 нейронов • 54.5 млн синапсов • 8,453 клеточных типа</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-slate-400">
          <button
            onClick={() => {
              setShowDeployModal(true);
              sounds.playPop();
            }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/80 text-cyan-300 border border-cyan-500/40 transition cursor-pointer shadow-sm"
            title="Инструкция по публикации на GitHub Pages"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px]">GitHub Pages</span>
          </button>

          <button
            onClick={() => {
              onToggleSound();
              sounds.playPop();
            }}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            title="Переключить звуковые эффекты"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-[10px] hidden sm:inline">{soundEnabled ? 'Звук вкл' : 'Без звука'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>FlyWire</span>
                <span className="text-cyan-400">Connectome Lab</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-normal border border-blue-500/30">
                  Drosophila Brain
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              Интерактивный 3D коннектом целого мозга дрозофилы (Nature 2024), симулятор полета Fly-Pilot и нейроцепи
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => {
                  onTabChange(tab.id);
                  sounds.playPop();
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 bg-slate-900/70 border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                    isActive
                      ? 'bg-blue-700/60 text-blue-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* GitHub Pages Deployment Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl shadow-cyan-950/50 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Публикация на GitHub Pages</h3>
                  <p className="text-xs text-slate-400">Проект полностью подготовлен к деплою</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeployModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-cyan-200">Все настройки выполнены:</strong> Относительные пути ассетов (<code className="text-cyan-300 bg-cyan-950 px-1 py-0.5 rounded">base: './'</code>), сборка <code className="text-cyan-300 bg-cyan-950 px-1 py-0.5 rounded">dist</code> и файл автоматического деплоя <code className="text-cyan-300 bg-cyan-950 px-1 py-0.5 rounded">.github/workflows/deploy.yml</code> уже включены в проект.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-white text-xs uppercase tracking-wider block">
                  Вариант 1: Экспорт через AI Studio (самый простой)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
                  <li>В правом верхнем углу интерфейса AI Studio нажмите <strong>меню / шестерёнку</strong> ➔ <strong>Export to GitHub</strong>.</li>
                  <li>Выберите ваш аккаунт и создайте репозиторий.</li>
                  <li>В созданном репозитории на GitHub откройте <strong>Settings</strong> ➔ <strong>Pages</strong> ➔ в блоке <strong>Source</strong> выберите <strong>GitHub Actions</strong>.</li>
                  <li>Вкладка <strong>Actions</strong> автоматически соберёт и опубликует сайт!</li>
                </ol>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <span className="font-bold text-white text-xs uppercase tracking-wider block">
                  Вариант 2: Через Git в терминале
                </span>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1">
                  <div className="text-slate-500"># Привяжите ваш репозиторий и отправьте код:</div>
                  <div className="text-emerald-400">git remote add origin https://github.com/&lt;ВАШ_ЛОГИН&gt;/&lt;РЕПОЗИТОРИЙ&gt;.git</div>
                  <div className="text-emerald-400">git push -u origin main</div>
                  <div className="text-slate-500 pt-1"># Либо деплой одной командой через gh-pages:</div>
                  <div className="text-cyan-300">npm run deploy</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowDeployModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
