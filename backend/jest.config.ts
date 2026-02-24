import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',

  extensionsToTreatAsEsm: ['.ts'],

  moduleNameMapper: {
    // Map ESM .js imports using @ alias to actual .ts source files
    '^@/(.*)\\.js$': '<rootDir>/src/$1.ts',
    // Map @ alias to src folder (for non .js imports)
    '^@/(.*)$': '<rootDir>/src/$1',

    // Remove .js extension from relative imports so ts-jest can resolve .ts files
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  globalSetup: './tests/integration/setup.ts',
  clearMocks: true,
};

export default config;
