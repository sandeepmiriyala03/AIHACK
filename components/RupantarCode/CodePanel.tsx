'use client';

import { useRef } from 'react';
import type { SupportedLang } from '@/types/rupantar.types';
import { LANG_META } from '@/lib/langMeta';
import styles from './RupantarCode.module.css';

interface InputPanelProps {
  lang: SupportedLang;
  value: string;
  onChange: (v: string) => void;
}

interface OutputPanelProps {
  html: string;
  lineCount: number;
}

export function InputPanel({ lang, value, onChange }: InputPanelProps) {
  const meta = LANG_META[lang];
  const lines = value ? value.split('\n').length : 0;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span
          className={styles.langDot}
          style={{ background: meta.color }}
          aria-hidden="true"
        />
        <span className={styles.panelLabel}>{meta.label} Input</span>
        <span className={styles.lineCount}>{lines} lines</span>
      </div>
      <div className={styles.codeArea}>
        <textarea
          className={styles.codeInput}
          value={value}
          onChange={e => onChange(e.target.value)}
          spellCheck={false}
          placeholder={`// Paste ${meta.label} code here or pick a scenario above...`}
          aria-label={`${meta.label} source code input`}
        />
      </div>
    </div>
  );
}

export function OutputPanel({ html, lineCount }: OutputPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span
          className={styles.langDot}
          style={{ background: '#3776ab' }}
          aria-hidden="true"
        />
        <span className={styles.panelLabel}>Python Output</span>
        {lineCount > 0 && (
          <span className={styles.lineCount}>{lineCount} lines</span>
        )}
      </div>
      <div className={styles.codeArea}>
        {html ? (
          <pre
            className={styles.codeOutput}
            dangerouslySetInnerHTML={{ __html: html }}
            aria-label="Converted Python code"
            role="region"
          />
        ) : (
          <div className={styles.emptyState} aria-label="No output yet">
            <span className={styles.emptyIcon} aria-hidden="true">🐍</span>
            <span className={styles.emptyText}>
              Pick a scenario or paste code, then click Convert
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
