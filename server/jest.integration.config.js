/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/jest.integration.setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/tests/integration/**/*.test.ts"], // ignora pasta e2e
  verbose: true,
  // Evita interferência entre suítes que truncam o banco
  maxWorkers: 1,
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
};
