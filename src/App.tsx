import { useEffect, useState } from 'react';
import { Language, ModuleId } from './types/physics';
import { TRANSLATIONS } from './i18n/translations';
import { TopNav } from './components/TopNav';
import { VerticalSpringLab } from './modules/VerticalSpringLab';
import { CombinedSpringsLab } from './modules/CombinedSpringsLab';
import { SimplePendulumLab } from './modules/SimplePendulumLab';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('vertical');
  const [language, setLanguage] = useState<Language>('bn');
  const [resetSignal, setResetSignal] = useState<number>(0);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.studioTitle;
  }, [language, t.studioTitle]);

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  const handleReset = () => {
    setResetSignal((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-sky-50 text-slate-950 flex flex-col">
      <TopNav
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onReset={handleReset}
        t={t}
      />

      <main className="flex-1 w-full max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-6 py-3.5">
        {activeModule === 'vertical' && (
          <VerticalSpringLab t={t} language={language} resetSignal={resetSignal} />
        )}
        {activeModule === 'combined' && (
          <CombinedSpringsLab t={t} resetSignal={resetSignal} />
        )}
        {activeModule === 'pendulum' && (
          <SimplePendulumLab t={t} language={language} resetSignal={resetSignal} />
        )}
      </main>
    </div>
  );
}
