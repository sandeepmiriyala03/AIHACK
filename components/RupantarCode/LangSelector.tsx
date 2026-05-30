'use client';

import type { SupportedLang } from '@/types/rupantar.types';
import { LANG_META } from '@/lib/langMeta';
import styles from './RupantarCode.module.css';

interface Props {
  current: SupportedLang;
  onChange: (lang: SupportedLang) => void;
}

const LANGS: SupportedLang[] = ['java', 'csharp', 'js', 'ts', 'sql'];

export default function LangSelector({ current, onChange }: Props) {
  return (
    <div className={styles.langSelector}>
      {LANGS.map(lang => {
        const meta = LANG_META[lang];
        const isActive = lang === current;
        return (
          <button
            key={lang}
            onClick={() => onChange(lang)}
            className={`${styles.langBtn} ${isActive ? styles.langBtnActive : ''}`}
            style={isActive ? { background: meta.color, color: meta.textColor } : {}}
            aria-pressed={isActive}
          >
            {meta.icon && <span>{meta.icon}</span>}
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
