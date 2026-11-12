import React from 'react';
import { RotateCcw, Globe } from 'lucide-react';
import { Language, ModuleId } from '../types/physics';
import { TranslationSet } from '../i18n/translations';

interface TopNavProps {
  activeModule: ModuleId;
  onSelectModule: (mod: ModuleId) => void;
  language: Language;
  onToggleLanguage: () => void;
  onReset: () => void;
  t: TranslationSet;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeModule,
  onSelectModule,
  language,
  onToggleLanguage,
  onReset,
  t,
}) => {
  const modules: { id: ModuleId; label: string }[] = [
    { id: 'vertical', label: t.tabs.vertical.short },
    { id: 'combined', label: t.tabs.combined.short },
    { id: 'pendulum', label: t.tabs.pendulum.short },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sky-200 shadow-xs">
      <div className="max-w-[1680px] mx-auto px-4 lg:px-6 py-2.5 flex flex-wrap xl:flex-nowrap items-center justify-between gap-4">
        {/* Left: Studio Title */}
        <div className="flex items-center min-w-0 shrink-0">
          <h1 className="text-base lg:text-[17px] font-extrabold tracking-tight text-slate-950 truncate max-w-[340px] 2xl:max-w-none">
            {t.studioTitle}
          </h1>
        </div>

        {/* Center: 3 Interactive Lab Mode Tabs (Pill Navigation) */}
        <nav
          aria-label="Physics Lab Modules"
          className="order-3 xl:order-2 w-full xl:w-auto flex items-center gap-1 p-1 bg-sky-100/80 border border-sky-200 rounded-full overflow-x-auto"
        >
          {modules.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onSelectModule(mod.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs lg:text-[13px] font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/70'
                }`}
              >
                {mod.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Language Switcher, Reset, and Bold Red Institution Badge */}
        <div className="order-2 xl:order-3 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-900 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <Globe className="w-3.5 h-3.5 text-sky-700" />
            <span>{t.langToggle}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-sky-200 text-slate-900 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-700" />
            <span>{t.reset}</span>
          </button>

          <span className="bg-rose-50 border border-rose-300 text-rose-600 font-extrabold px-3 py-1 rounded-full text-sm whitespace-nowrap shrink-0">
            উদ্ভাস
          </span>
        </div>
      </div>
    </header>
  );
};
