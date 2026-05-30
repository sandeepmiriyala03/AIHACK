'use client';

import { useState, useCallback, useEffect } from 'react';
import type { SupportedLang, Scenario, TestResult, ConversionResult } from '@/types/rupantar.types';
import { LANG_META } from '@/lib/langMeta';
import { SCENARIOS } from '@/lib/scenarios';
import { convertCode } from '@/lib/converter';
import { highlightPython } from '@/lib/highlighter';
import { TEST_SUITES } from '@/lib/testSuites';

import LangSelector from './LangSelector';
import ScenarioBar from './ScenarioBar';
import { InputPanel, OutputPanel } from './CodePanel';
import TestPanel from './TestPanel';
import styles from './RupantarCode.module.css';

export default function RupantarCode() {
  const [lang, setLang]               = useState<SupportedLang>('java');
  const [code, setCode]               = useState('');
  const [scenario, setScenario]       = useState<string | null>(null);
  const [conversion, setConversion]   = useState<ConversionResult | null>(null);
  const [outputHtml, setOutputHtml]   = useState('');
  const [converting, setConverting]   = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testRunning, setTestRunning] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);

  // Auto-load first scenario when lang changes
  useEffect(() => {
    const first = SCENARIOS[lang]?.[0];
    if (first) handleScenarioSelect(first);
    else {
      setCode('');
      setScenario(null);
      setConversion(null);
      setOutputHtml('');
      setTestResults([]);
    }
  }, [lang]);

  const handleLangChange = useCallback((newLang: SupportedLang) => {
    setLang(newLang);
    setTestResults([]);
  }, []);

  const handleScenarioSelect = useCallback((s: Scenario) => {
    setScenario(s.name);
    setCode(s.code);
    setTestResults([]);
    // Auto-convert
    triggerConvert(lang, s.code);
  }, [lang]);

  const triggerConvert = useCallback((l: SupportedLang, c: string) => {
    if (!c.trim()) return;
    setConverting(true);
    // Small delay to let UI update
    setTimeout(() => {
      const result = convertCode(l, c);
      setConversion(result);
      setOutputHtml(highlightPython(result.python));
      setConverting(false);
    }, 200);
  }, []);

  const handleConvert = useCallback(() => {
    triggerConvert(lang, code);
  }, [lang, code, triggerConvert]);

  const handleRunTests = useCallback(async () => {
    if (!scenario) return;
    const suite = TEST_SUITES[lang]?.[scenario];
    if (!suite?.length) {
      setTestResults([{ name: 'No tests for this scenario', passed: false, error: 'Add test cases in testSuites.ts' }]);
      return;
    }

    setTestRunning(true);
    setTestResults([]);

    const results: TestResult[] = [];
    for (const test of suite) {
      await new Promise(r => setTimeout(r, 50)); // stagger for animation
      let passed = false;
      let error: string | undefined;
      try {
        const res = test.fn();
        passed = res instanceof Promise ? await res : res;
      } catch (e) {
        passed = false;
        error = e instanceof Error ? e.message : String(e);
      }
      results.push({ name: test.name, passed, error });
      setTestResults([...results]); // progressive update
    }

    setTestRunning(false);
  }, [lang, scenario]);

  const handleCopy = useCallback(async () => {
    if (!conversion?.python) return;
    await navigator.clipboard.writeText(conversion.python);
    setCopyVisible(true);
    setTimeout(() => setCopyVisible(false), 1500);
  }, [conversion]);

  const handleDownload = useCallback(() => {
    if (!conversion?.python) return;
    const fileName = (scenario ?? 'converted')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    const blob = new Blob([conversion.python], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${fileName}_rupantarcode.py`;
    a.click();
    URL.revokeObjectURL(url);
  }, [conversion, scenario]);

  const passCount = testResults.filter(r => r.passed).length;
  const failCount = testResults.filter(r => !r.passed).length;

  return (
    <div className={styles.root}>

      {/* ── Header ─────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span aria-hidden="true">🐍</span>
          <div>
            <div className={styles.logoText}>
              Rupantar<span className={styles.logoAccent}>Code</span>
            </div>
            <div className={styles.logoSub}>Any Code → Python</div>
          </div>
        </div>

        <LangSelector current={lang} onChange={handleLangChange} />

        {converting && (
          <div className={styles.convertingAnim} aria-live="polite" aria-label="Converting">
            <div className={styles.dotPulse}>
              <span /><span /><span />
            </div>
            Converting...
          </div>
        )}

        <div className={styles.headerRight}>
          <button
            className={`${styles.btn} ${styles.btnTest}`}
            onClick={handleRunTests}
            disabled={testRunning || !scenario}
            aria-label="Run unit tests"
          >
            ▶ Run Tests
          </button>

          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={handleCopy}
            disabled={!conversion?.python}
            aria-label="Copy Python output"
          >
            Copy
          </button>
          <span
            className={`${styles.copyFlash} ${copyVisible ? styles.copyFlashVisible : ''}`}
            aria-live="polite"
          >
            Copied!
          </span>

          <button
            className={`${styles.btn} ${styles.btnDownload}`}
            onClick={handleDownload}
            disabled={!conversion?.python}
            aria-label="Download as .py file"
          >
            ⬇ .py
          </button>

          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleConvert}
            disabled={converting || !code.trim()}
            aria-label="Convert to Python"
          >
            Convert →
          </button>
        </div>
      </header>

      {/* ── Scenario Bar ───────────────────────────────── */}
      <ScenarioBar
        lang={lang}
        active={scenario}
        onSelect={handleScenarioSelect}
      />

      {/* ── Split Editor ───────────────────────────────── */}
      <main className={styles.main}>
        <InputPanel
          lang={lang}
          value={code}
          onChange={setCode}
        />
        <div className={styles.divider} aria-hidden="true" />
        <OutputPanel
          html={outputHtml}
          lineCount={conversion?.linesOut ?? 0}
        />
      </main>

      {/* ── Test Panel ─────────────────────────────────── */}
      <TestPanel
        results={testResults}
        isRunning={testRunning}
      />

      {/* ── Stats Bar ──────────────────────────────────── */}
      <footer className={styles.statsBar}>
        <div className={styles.stat}>
          <span>Lang:</span>
          <span className={styles.statVal}>{LANG_META[lang].label}</span>
        </div>
        <div className={styles.stat}>
          <span>Scenario:</span>
          <span className={styles.statVal}>{scenario ?? '—'}</span>
        </div>
        {conversion && (
          <div className={styles.stat}>
            <span>Lines:</span>
            <span className={styles.statVal}>{conversion.linesIn} → {conversion.linesOut}</span>
          </div>
        )}
        {testResults.length > 0 && (
          <>
            <div className={`${styles.stat} ${styles.statPass}`}>
              <span className={styles.statVal}>{passCount}</span>
              <span>passed</span>
            </div>
            {failCount > 0 && (
              <div className={`${styles.stat} ${styles.statFail}`}>
                <span className={styles.statVal}>{failCount}</span>
                <span>failed</span>
              </div>
            )}
          </>
        )}
        <span className={styles.statCredit}>
          RupantarCode · AksharaTantra · Offline Ready
        </span>
      </footer>

    </div>
  );
}
