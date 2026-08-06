const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',
  // next/jest derives this from tsconfig `paths`, but its generated regex
  // breaks under this repo's rootDir (contains literal parentheses) — define
  // it explicitly instead of relying on the auto-detected version.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/prisma-singleton.ts'],
  // testMatch (glob-based) breaks when rootDir contains literal parentheses
  // (this repo lives under a "(Instep-consulting)" folder) — testRegex is
  // matched against the resolved absolute path as a plain RegExp instead.
  testRegex: '[\\\\/]test[\\\\/].*\\.test\\.ts$',
  reporters: [
    'default',
    [
      // jest-html-reporters (plural) renders via a bundled React/webpack app —
      // that app fails to boot when the file is opened straight from disk
      // (file://), which is exactly how a report gets viewed after being
      // emailed or downloaded. jest-html-reporter (singular) instead writes a
      // plain static HTML/CSS table with no client-side JS required to render,
      // so it opens correctly by plain double-click every time.
      'jest-html-reporter',
      {
        pageTitle: 'Indonesia Tanpa Polusi — API Test Report',
        outputPath: './test-report/report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        includeConsoleLog: true,
        sort: 'status',
        executionTimeWarningThreshold: 10,
        dateFormat: 'yyyy-mm-dd HH:MM:ss',
      },
    ],
  ],
}

module.exports = createJestConfig(customJestConfig)
