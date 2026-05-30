// ============================================================
// RupantarCode — Language Metadata
// ============================================================

import type { LangMeta, SupportedLang } from '@/types/rupantar.types';

export const LANG_META: Record<SupportedLang, LangMeta> = {
  java: {
    label: 'Java',
    icon: '☕',
    color: '#f89820',
    textColor: '#000',
  },
  csharp: {
    label: 'C#',
    icon: '',
    color: '#9b4f96',
    textColor: '#fff',
  },
  js: {
    label: 'JS',
    icon: '',
    color: '#f7df1e',
    textColor: '#000',
  },
  ts: {
    label: 'TS',
    icon: '',
    color: '#3178c6',
    textColor: '#fff',
  },
  sql: {
    label: 'SQL',
    icon: '',
    color: '#cc2927',
    textColor: '#fff',
  },
};
