require('dotenv').config();

module.exports = {
  preset: 'ts-jest',
  testMatch: ['<rootDir>/backend/test/**/*.spec.ts', '<rootDir>/backend/test/**/*.e2e-spec.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/backend/test'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'ES2022',
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        strict: false,
        moduleResolution: 'node',
        types: ['node', 'jest'],
        strictPropertyInitialization: false,
      },
    }],
  },
  testTimeout: 120000,
};
