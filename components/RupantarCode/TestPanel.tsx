'use client';

import { useState } from 'react';
import type { TestResult } from '@/types/rupantar.types';
import styles from './RupantarCode.module.css';

interface Props {
  results: TestResult[];
  isRunning: boolean;
}

export default function TestPanel({ results, isRunning }: Props) {
  const [expanded, setExpanded] = useState(false);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return (
    <div
      className={`${styles.testPanel} ${expanded ? styles.testPanelExpanded : styles.testPanelCollapsed}`}
    >
      <button
        className={styles.testPanelHeader}
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-controls="test-results"
      >
        <span className={styles.testPanelTitle}>🧪 Unit Tests</span>

        {results.length > 0 && (
          <>
            <span className={`${styles.badge} ${styles.badgePass}`}>
              {passed} passed
            </span>
            {failed > 0 && (
              <span className={`${styles.badge} ${styles.badgeFail}`}>
                {failed} failed
              </span>
            )}
          </>
        )}

        {isRunning && (
          <span className={styles.runningDots} aria-live="polite">
            <span /><span /><span />
          </span>
        )}

        <span className={styles.testToggle} aria-hidden="true">
          {expanded ? '▼ COLLAPSE' : '▲ EXPAND'}
        </span>
      </button>

      <div id="test-results" className={styles.testResults} role="log" aria-live="polite">
        {results.length === 0 && !isRunning && (
          <p className={styles.testPlaceholder}>
            Click ▶ Run Tests to validate the converted Python logic in browser...
          </p>
        )}

        {results.map((result, i) => (
          <div
            key={i}
            className={`${styles.testItem} ${result.passed ? styles.testItemPass : styles.testItemFail}`}
            role="listitem"
          >
            <span className={styles.testIcon} aria-hidden="true">
              {result.passed ? '✅' : '❌'}
            </span>
            <div className={styles.testContent}>
              <span className={styles.testName}>{result.name}</span>
              {result.error && (
                <span className={styles.testError}>{result.error}</span>
              )}
            </div>
            <span className={`${styles.badge} ${result.passed ? styles.badgePass : styles.badgeFail}`}>
              {result.passed ? 'PASS' : 'FAIL'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
