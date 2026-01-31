#!/usr/bin/env node

/**
 * K2 QA Self-Improvement Loop
 *
 * This script implements an automated testing and improvement cycle:
 * 1. Run all tests
 * 2. Collect and analyze failures
 * 3. Generate fix suggestions
 * 4. Track improvements over iterations
 * 5. Report on quality metrics
 *
 * Usage:
 *   node scripts/qa-loop.js              # Run once
 *   node scripts/qa-loop.js --iterate 5  # Run up to 5 iterations until all pass
 *   node scripts/qa-loop.js --watch      # Watch mode with continuous testing
 */

import { spawn, execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const REPORTS_DIR = join(ROOT_DIR, 'qa-reports');

// Ensure reports directory exists
if (!existsSync(REPORTS_DIR)) {
  mkdirSync(REPORTS_DIR, { recursive: true });
}

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(70) + '\n');
}

/**
 * Test Suite Configuration
 */
const TEST_SUITES = [
  {
    name: 'Unit Tests - Types Package',
    command: 'pnpm --filter @k2/types test',
    category: 'unit',
    critical: true,
  },
  {
    name: 'Unit Tests - Trading Service',
    command: 'pnpm --filter @k2/trading test',
    category: 'unit',
    critical: true,
  },
  {
    name: 'Type Check - All Packages',
    command: 'pnpm -r exec tsc --noEmit',
    category: 'typecheck',
    critical: true,
  },
  {
    name: 'Lint - All Packages',
    command: 'pnpm -r lint',
    category: 'lint',
    critical: false,
  },
  {
    name: 'Integration Tests',
    command: 'pnpm --filter @k2/trading test:integration',
    category: 'integration',
    critical: true,
  },
];

/**
 * Run a single test suite
 */
async function runTestSuite(suite) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';

    const proc = spawn('sh', ['-c', suite.command], {
      cwd: ROOT_DIR,
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({
        suite: suite.name,
        category: suite.category,
        critical: suite.critical,
        passed: code === 0,
        exitCode: code,
        duration,
        stdout,
        stderr,
        output: stdout + stderr,
      });
    });

    proc.on('error', (err) => {
      resolve({
        suite: suite.name,
        category: suite.category,
        critical: suite.critical,
        passed: false,
        exitCode: -1,
        duration: Date.now() - startTime,
        stdout,
        stderr: stderr + err.message,
        output: stdout + stderr + err.message,
        error: err.message,
      });
    });
  });
}

/**
 * Parse test failures from output
 */
function parseFailures(result) {
  const failures = [];
  const output = result.output;

  // Parse Vitest failures
  const vitestFailureRegex = /FAIL\s+(.+?)\s*\n[\s\S]*?Error:\s*(.+?)(?=\n\s*at|\n\n)/g;
  let match;
  while ((match = vitestFailureRegex.exec(output)) !== null) {
    failures.push({
      file: match[1].trim(),
      error: match[2].trim(),
      type: 'test_failure',
    });
  }

  // Parse TypeScript errors
  const tsErrorRegex = /(.+\.ts)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)/g;
  while ((match = tsErrorRegex.exec(output)) !== null) {
    failures.push({
      file: match[1],
      line: parseInt(match[2]),
      column: parseInt(match[3]),
      code: match[4],
      error: match[5],
      type: 'typescript_error',
    });
  }

  // Parse ESLint errors
  const eslintErrorRegex = /(.+\.tsx?)\n\s+(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+(\S+)$/gm;
  while ((match = eslintErrorRegex.exec(output)) !== null) {
    failures.push({
      file: match[1],
      line: parseInt(match[2]),
      column: parseInt(match[3]),
      severity: match[4],
      error: match[5],
      rule: match[6],
      type: 'lint_error',
    });
  }

  // Parse assertion failures
  const assertionRegex = /AssertionError:\s*(.+)/g;
  while ((match = assertionRegex.exec(output)) !== null) {
    failures.push({
      error: match[1],
      type: 'assertion_failure',
    });
  }

  return failures;
}

/**
 * Analyze failures and generate fix suggestions
 */
function analyzeFailures(results) {
  const analysis = {
    totalSuites: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    criticalFailures: results.filter((r) => !r.passed && r.critical).length,
    byCategory: {},
    failures: [],
    suggestions: [],
  };

  for (const result of results) {
    // Categorize
    if (!analysis.byCategory[result.category]) {
      analysis.byCategory[result.category] = { passed: 0, failed: 0 };
    }
    if (result.passed) {
      analysis.byCategory[result.category].passed++;
    } else {
      analysis.byCategory[result.category].failed++;
    }

    // Parse failures
    if (!result.passed) {
      const failures = parseFailures(result);
      analysis.failures.push({
        suite: result.suite,
        category: result.category,
        critical: result.critical,
        failures,
      });

      // Generate suggestions based on failure patterns
      for (const failure of failures) {
        const suggestion = generateSuggestion(failure);
        if (suggestion) {
          analysis.suggestions.push(suggestion);
        }
      }
    }
  }

  return analysis;
}

/**
 * Generate fix suggestion based on failure type
 */
function generateSuggestion(failure) {
  const suggestions = {
    typescript_error: {
      TS2307: `Module not found. Check import path or install missing dependency.`,
      TS2345: `Type mismatch in function argument. Check expected vs actual type.`,
      TS2339: `Property does not exist on type. Add property to interface or check spelling.`,
      TS2322: `Type assignment error. Ensure value matches declared type.`,
      TS7006: `Parameter has implicit 'any' type. Add explicit type annotation.`,
    },
    lint_error: {
      '@typescript-eslint/no-unused-vars': `Remove unused variable or prefix with underscore.`,
      '@typescript-eslint/no-explicit-any': `Replace 'any' with specific type.`,
      'prefer-const': `Change 'let' to 'const' for variables that are never reassigned.`,
    },
  };

  if (failure.type === 'typescript_error' && suggestions.typescript_error[failure.code]) {
    return {
      file: failure.file,
      line: failure.line,
      issue: failure.error,
      suggestion: suggestions.typescript_error[failure.code],
      autoFixable: false,
    };
  }

  if (failure.type === 'lint_error' && suggestions.lint_error[failure.rule]) {
    return {
      file: failure.file,
      line: failure.line,
      issue: failure.error,
      suggestion: suggestions.lint_error[failure.rule],
      autoFixable: true,
    };
  }

  if (failure.type === 'test_failure') {
    return {
      file: failure.file,
      issue: failure.error,
      suggestion: `Review test expectations and implementation. Check if mock data matches expected format.`,
      autoFixable: false,
    };
  }

  return null;
}

/**
 * Generate quality report
 */
function generateReport(analysis, iteration) {
  const timestamp = new Date().toISOString();
  const reportPath = join(REPORTS_DIR, `qa-report-${timestamp.replace(/[:.]/g, '-')}.json`);

  const report = {
    timestamp,
    iteration,
    summary: {
      totalSuites: analysis.totalSuites,
      passed: analysis.passed,
      failed: analysis.failed,
      passRate: ((analysis.passed / analysis.totalSuites) * 100).toFixed(1) + '%',
      criticalFailures: analysis.criticalFailures,
      healthScore: calculateHealthScore(analysis),
    },
    byCategory: analysis.byCategory,
    failures: analysis.failures,
    suggestions: analysis.suggestions,
  };

  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return { report, reportPath };
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(analysis) {
  let score = 100;

  // Deduct for failures
  score -= analysis.failed * 10;

  // Extra penalty for critical failures
  score -= analysis.criticalFailures * 20;

  // Bonus for high pass rate
  if (analysis.passed === analysis.totalSuites) {
    score = 100;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Print summary to console
 */
function printSummary(analysis, iteration) {
  logSection(`QA Summary - Iteration ${iteration}`);

  const healthScore = calculateHealthScore(analysis);
  const healthColor = healthScore >= 80 ? 'green' : healthScore >= 50 ? 'yellow' : 'red';

  log(`Health Score: ${healthScore}/100`, healthColor);
  console.log('');

  log(`Test Suites: ${analysis.passed}/${analysis.totalSuites} passed`, analysis.failed === 0 ? 'green' : 'red');

  if (analysis.criticalFailures > 0) {
    log(`Critical Failures: ${analysis.criticalFailures}`, 'red');
  }

  console.log('\nBy Category:');
  for (const [category, stats] of Object.entries(analysis.byCategory)) {
    const status = stats.failed === 0 ? '✓' : '✗';
    const color = stats.failed === 0 ? 'green' : 'red';
    log(`  ${status} ${category}: ${stats.passed}/${stats.passed + stats.failed}`, color);
  }

  if (analysis.suggestions.length > 0) {
    console.log('\nSuggested Fixes:');
    for (const suggestion of analysis.suggestions.slice(0, 10)) {
      log(`  • ${suggestion.file || 'General'}:`, 'yellow');
      log(`    Issue: ${suggestion.issue}`, 'reset');
      log(`    Fix: ${suggestion.suggestion}`, 'cyan');
    }
    if (analysis.suggestions.length > 10) {
      log(`  ... and ${analysis.suggestions.length - 10} more`, 'yellow');
    }
  }

  console.log('');
}

/**
 * Main QA loop
 */
async function runQALoop(options = {}) {
  const maxIterations = options.iterate || 1;
  let iteration = 1;
  let allPassed = false;

  log('\n🔬 K2 QA Self-Improvement Loop', 'bright');
  log('━'.repeat(50), 'cyan');

  while (iteration <= maxIterations && !allPassed) {
    logSection(`Running Test Suites - Iteration ${iteration}/${maxIterations}`);

    const results = [];

    for (const suite of TEST_SUITES) {
      log(`\n▶ ${suite.name}`, 'blue');
      log('─'.repeat(40), 'reset');

      const result = await runTestSuite(suite);
      results.push(result);

      if (result.passed) {
        log(`✓ PASSED (${result.duration}ms)`, 'green');
      } else {
        log(`✗ FAILED (exit code: ${result.exitCode})`, 'red');
      }
    }

    // Analyze results
    const analysis = analyzeFailures(results);

    // Generate report
    const { report, reportPath } = generateReport(analysis, iteration);

    // Print summary
    printSummary(analysis, iteration);

    log(`Report saved: ${reportPath}`, 'cyan');

    allPassed = analysis.failed === 0;

    if (!allPassed && iteration < maxIterations) {
      log('\n⟳ Failures detected. Starting next iteration...', 'yellow');
      iteration++;

      // Brief pause between iterations
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      iteration++;
    }
  }

  // Final status
  logSection('Final Status');

  if (allPassed) {
    log('✓ ALL TESTS PASSED!', 'green');
    log('The codebase is in good health.', 'green');
    return 0;
  } else {
    log('✗ SOME TESTS FAILED', 'red');
    log('Review the suggestions above and fix the issues.', 'yellow');
    return 1;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--iterate' && args[i + 1]) {
    options.iterate = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--watch') {
    options.watch = true;
  }
}

// Run
runQALoop(options).then((exitCode) => {
  process.exit(exitCode);
});
