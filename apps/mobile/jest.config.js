module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/store/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      statements: 55,
      branches: 40,
      functions: 60,
      lines: 55,
    },
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
