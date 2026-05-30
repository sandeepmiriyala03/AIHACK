// ============================================================
// RupantarCode — Type Definitions
// AksharaTantra · Yuktishaalaa AI Lab
// ============================================================

export type SupportedLang = 'java' | 'csharp' | 'js' | 'ts' | 'sql';

export interface Scenario {
  name: string;
  code: string;
}

export interface TestCase {
  name: string;
  fn: () => boolean | Promise<boolean>;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface LangMeta {
  label: string;
  icon: string;
  color: string;
  textColor: string;
}

export interface ConversionResult {
  python: string;
  linesIn: number;
  linesOut: number;
}
