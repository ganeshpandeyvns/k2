#!/usr/bin/env node

/**
 * Smart Regression Test Runner
 *
 * This script analyzes git changes and runs relevant tests.
 * It maps changed files to their corresponding test files and ensures
 * critical tests always run.
 *
 * Usage:
 *   node regression/run-regression.js          # Run tests for staged changes
 *   node regression/run-regression.js --all    # Run all tests
 *   node regression/run-regression.js --commit # Run tests for last commit
 *   node regression/run-regression.js --watch  # Watch mode for changed files
 *
 * Security Note: This script uses execSync with fixed commands only.
 * All command arguments come from config files, not user input.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load configuration
const CONFIG_PATH = path.join(__dirname, 'config.json');
const REGISTRY_PATH = path.join(__dirname, 'test-registry.json');

let config = {};
let registry = { tests: [], lastUpdated: null };

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (error) {
    log(`Warning: Could not load config: ${error.message}`, 'yellow');
    config = { alwaysRun: [], fileToTestMap: {}, criticalPaths: [] };
  }
}

function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    }
  } catch (error) {
    registry = { tests: [], lastUpdated: null };
  }
}

function saveRegistry() {
  try {
    registry.lastUpdated = new Date().toISOString();
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  } catch (error) {
    log(`Warning: Could not save registry: ${error.message}`, 'yellow');
  }
}

// Git commands are fixed strings - safe to use execSync
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function getLastCommitFiles() {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function getUnstagedChanges() {
  try {
    const output = execSync('git diff --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function isExcluded(file) {
  const excludePatterns = config.excludeFromTests || [];
  return excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(file);
    }
    return file.endsWith(pattern) || file.includes(pattern);
  });
}

function mapFileToTests(changedFile) {
  const tests = new Set();

  // Direct file mapping
  const directMap = config.fileToTestMap || {};
  if (directMap[changedFile]) {
    directMap[changedFile].forEach(test => tests.add(test));
  }

  // Pattern matching
  const patternMap = config.patternToTestMap || {};
  for (const [pattern, testPatterns] of Object.entries(patternMap)) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    if (regex.test(changedFile)) {
      // For pattern matches, derive test file name from source file
      const baseName = path.basename(changedFile, path.extname(changedFile));
      const testDir = changedFile.includes('/store/') ? '__tests__/store' :
                      changedFile.includes('/utils/') ? '__tests__/utils' :
                      changedFile.includes('/screens/') ? '__tests__/screens' :
                      changedFile.includes('/components/') ? '__tests__/components' : null;

      if (testDir) {
        const testFile = `${testDir}/${baseName}.test.ts`;
        tests.add(testFile);
      }
    }
  }

  return Array.from(tests);
}

function getTestsForChanges(changedFiles) {
  const testsToRun = new Set();
  const criticalFilesChanged = [];

  // Always add critical tests
  (config.alwaysRun || []).forEach(test => testsToRun.add(test));

  // Process each changed file
  changedFiles.forEach(file => {
    // Skip excluded files
    if (isExcluded(file)) {
      return;
    }

    // Skip if file is within mobile app directory structure
    const relativePath = file.replace(/^apps\/mobile\//, '');

    // Check if it's a critical path
    if ((config.criticalPaths || []).some(cp => relativePath.includes(cp) || file.includes(cp))) {
      criticalFilesChanged.push(file);
    }

    // Map to tests
    const mappedTests = mapFileToTests(relativePath);
    mappedTests.forEach(test => testsToRun.add(test));
  });

  return {
    tests: Array.from(testsToRun),
    criticalFilesChanged,
    totalChangedFiles: changedFiles.length,
  };
}

function checkTestExists(testPath) {
  const fullPath = path.join(process.cwd(), testPath);
  return fs.existsSync(fullPath);
}

// Validate test file paths to prevent injection
function validateTestPath(testPath) {
  // Only allow alphanumeric, dots, dashes, underscores, and slashes
  const validPattern = /^[a-zA-Z0-9._\-/]+$/;
  return validPattern.test(testPath) && !testPath.includes('..');
}

function runTests(testFiles, options = {}) {
  const existingTests = testFiles.filter(checkTestExists);
  const missingTests = testFiles.filter(t => !checkTestExists(t));

  if (missingTests.length > 0) {
    log('\nMissing test files (consider adding):', 'yellow');
    missingTests.forEach(t => log(`  - ${t}`, 'yellow'));
  }

  if (existingTests.length === 0) {
    log('\nNo matching test files found. Running all tests...', 'cyan');
    existingTests.push(''); // Run all
  }

  log(`\nRunning ${existingTests.length} test file(s)...`, 'cyan');
  existingTests.forEach(t => t && log(`  - ${t}`, 'blue'));

  // Validate all test paths before running
  const validTests = existingTests.filter(t => t === '' || validateTestPath(t));
  if (validTests.length !== existingTests.length) {
    log('\nWarning: Some test paths were invalid and skipped', 'yellow');
  }

  const jestArgs = validTests.length === 1 && validTests[0] === ''
    ? []
    : validTests.filter(Boolean);

  if (options.verbose) {
    jestArgs.push('--verbose');
  }

  if (options.coverage) {
    jestArgs.push('--coverage');
  }

  try {
    // Build command with validated paths only
    const cmd = jestArgs.length > 0
      ? `npx jest ${jestArgs.join(' ')}`
      : 'npx jest';

    execSync(cmd, {
      encoding: 'utf8',
      stdio: 'inherit',
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function addToRegistry(changedFiles, testResults) {
  const timestamp = new Date().toISOString();

  changedFiles.forEach(file => {
    const existingEntry = registry.tests.find(t => t.file === file);
    if (existingEntry) {
      existingEntry.lastTested = timestamp;
      existingEntry.testCount = (existingEntry.testCount || 0) + 1;
      existingEntry.lastResult = testResults.success ? 'passed' : 'failed';
    } else {
      registry.tests.push({
        file,
        addedAt: timestamp,
        lastTested: timestamp,
        testCount: 1,
        lastResult: testResults.success ? 'passed' : 'failed',
        mappedTests: mapFileToTests(file.replace(/^apps\/mobile\//, '')),
      });
    }
  });

  saveRegistry();
}

function printSummary(result, startTime) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  log('\n' + '='.repeat(60), 'bright');
  log('REGRESSION TEST SUMMARY', 'bright');
  log('='.repeat(60), 'bright');

  log(`\nFiles analyzed: ${result.totalChangedFiles}`, 'cyan');
  log(`Tests executed: ${result.tests.length}`, 'cyan');
  log(`Duration: ${duration}s`, 'cyan');

  if (result.criticalFilesChanged.length > 0) {
    log('\nCritical files changed:', 'yellow');
    result.criticalFilesChanged.forEach(f => log(`  - ${f}`, 'yellow'));
  }

  log('\n' + '='.repeat(60), 'bright');
}

function suggestNewTests(changedFiles) {
  const suggestions = [];

  changedFiles.forEach(file => {
    const relativePath = file.replace(/^apps\/mobile\//, '');
    const mappedTests = mapFileToTests(relativePath);

    mappedTests.forEach(testPath => {
      if (!checkTestExists(testPath)) {
        suggestions.push({
          sourceFile: file,
          suggestedTest: testPath,
        });
      }
    });
  });

  if (suggestions.length > 0) {
    log('\nSuggested new tests to add:', 'yellow');
    suggestions.forEach(s => {
      log(`  ${s.sourceFile} -> ${s.suggestedTest}`, 'yellow');
    });
  }

  return suggestions;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const startTime = Date.now();

  loadConfig();
  loadRegistry();

  log('\n' + '='.repeat(60), 'bright');
  log('MERU REGRESSION TEST RUNNER', 'bright');
  log('='.repeat(60), 'bright');

  let changedFiles = [];
  let mode = 'staged';

  if (args.includes('--all')) {
    mode = 'all';
    log('\nMode: Running ALL tests', 'cyan');
  } else if (args.includes('--commit')) {
    mode = 'commit';
    changedFiles = getLastCommitFiles();
    log(`\nMode: Testing last commit (${changedFiles.length} files)`, 'cyan');
  } else if (args.includes('--watch')) {
    changedFiles = [...getStagedFiles(), ...getUnstagedChanges()];
    mode = 'watch';
    log(`\nMode: Watch (${changedFiles.length} changed files)`, 'cyan');
  } else {
    changedFiles = getStagedFiles();
    log(`\nMode: Pre-commit (${changedFiles.length} staged files)`, 'cyan');
  }

  if (changedFiles.length > 0) {
    log('\nChanged files:', 'blue');
    changedFiles.slice(0, 10).forEach(f => log(`  - ${f}`, 'blue'));
    if (changedFiles.length > 10) {
      log(`  ... and ${changedFiles.length - 10} more`, 'blue');
    }
  }

  let result;
  let testResult;

  if (mode === 'all') {
    result = { tests: [], criticalFilesChanged: [], totalChangedFiles: 0 };
    testResult = runTests([''], { verbose: args.includes('--verbose') });
  } else {
    result = getTestsForChanges(changedFiles);

    // Suggest new tests for uncovered files
    suggestNewTests(changedFiles);

    testResult = runTests(result.tests, { verbose: args.includes('--verbose') });
  }

  // Update registry
  if (changedFiles.length > 0) {
    addToRegistry(changedFiles, testResult);
  }

  printSummary(result, startTime);

  if (testResult.success) {
    log('\nAll tests PASSED', 'green');
    process.exit(0);
  } else {
    log('\nSome tests FAILED', 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\nError: ${error.message}`, 'red');
  process.exit(1);
});
