'use client';

import type { Scenario, SupportedLang } from '@/types/rupantar.types';
import { SCENARIOS } from '@/lib/scenarios';
import styles from './RupantarCode.module.css';

interface Props {
  lang: SupportedLang;
  active: string | null;
  onSelect: (scenario: Scenario) => void;
}

export default function ScenarioBar({ lang, active, onSelect }: Props) {
  const scenarios = SCENARIOS[lang] ?? [];

  return (
    <div className={styles.scenarioBar} role="toolbar" aria-label="Code scenarios">
      {scenarios.map(s => (
        <button
          key={s.name}
          onClick={() => onSelect(s)}
          className={`${styles.scenarioBtn} ${active === s.name ? styles.scenarioBtnActive : ''}`}
          aria-pressed={active === s.name}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
