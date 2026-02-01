# Self-Improving QA Loop

This directory contains a self-improving QA system that learns from past bugs and applies patterns to catch issues before they reach production.

## How It Works

1. **Pattern Matching**: When running QA, apply learned patterns from `patterns.json`
2. **Fix Immediately**: Don't just report issues - fix them
3. **Log Findings**: Record all findings in `session-log.md`
4. **Learn**: Add new patterns when bugs are found
5. **Score**: Track progress using RL-style scoring in `metrics.json`

## Files

| File | Purpose |
|------|---------|
| `patterns.json` | Learned bug patterns with weights |
| `checklist.md` | Comprehensive QA checklist |
| `session-log.md` | Session findings log |
| `metrics.json` | Score tracking |
| `mistakes.json` | Manual bug reports |

## Quick Start

When asked to run QA:

```
1. Read patterns.json - load all patterns
2. Read checklist.md - follow the checklist
3. Apply high-weight patterns first
4. Fix issues immediately
5. Log to session-log.md
6. Update metrics.json score
7. Add new patterns if novel bugs found
```

## RL-Style Scoring

**Penalties** (bugs found):
- CRITICAL: -100 points
- HIGH: -50 points
- MEDIUM: -20 points
- LOW: -5 points

**Rewards**:
- No new bugs in session: +200 points
- Fewer bugs than last session: +100 points
- Pattern caught a bug: +10 points per catch
- New pattern added: +25 points

**Goal**: Reach cumulative score of +500

## Pattern Format

```json
{
  "id": "P001",
  "trigger": "When I see...",
  "check": "Check for...",
  "severity": "HIGH",
  "category": "state-management",
  "stats": {
    "bugsFound": 0,
    "timesApplied": 0,
    "weight": 1.0,
    "lastUsed": null
  }
}
```

## Issue Trigger

When user message starts with **"Issue:"**, automatically:

1. Parse the issue details
2. Add to `mistakes.json`
3. Create pattern in `patterns.json`
4. Fix the bug
5. Search for similar issues
6. Update score

Format: `Issue: [file:line] - [description], [SEVERITY]`

Example:
```
Issue: src/screens/TradeScreen.tsx:150 - Dollar input allows negative values, MEDIUM
```

## Adding Patterns

When a bug is found that wasn't caught by existing patterns:

1. Identify the root cause
2. Create a pattern that would catch it
3. Add to `patterns.json` with initial weight 1.0
4. Search codebase for similar issues
5. Fix all occurrences

## Regression Testing

After fixing ANY bug:

1. Add a regression test for the fix
2. Run: `npm test`
3. If tests pass, commit
4. If tests fail, fix regression first
