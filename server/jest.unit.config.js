module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/jest.unit.setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/tests/unit/**/*.test.ts"],
  verbose: true,
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
};
