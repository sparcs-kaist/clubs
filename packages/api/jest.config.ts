import type { Config } from "jest";

const config: Config = {
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  moduleNameMapper: {
    "src/(.*)": "<rootDir>/$1",
    "@sparcs-clubs/api/(.*)": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["dotenv/config"],
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "tsconfig.spec.json" }],
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};

export default config;
