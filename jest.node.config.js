// Jest for server-side code (agent readiness: Markdown, llms.txt, JSON-LD, proxy).
// Runs in Node, without jsdom or @testing-library, so it works on any machine:
//   npm run test:agent
const nextJest = require("next/jest");

module.exports = nextJest({ dir: "./" })({
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  testMatch: [
    "<rootDir>/lib/agent-markdown.test.ts",
    "<rootDir>/lib/site-content.test.ts",
    "<rootDir>/lib/json-ld.test.ts",
    "<rootDir>/src/proxy.test.ts",
    "<rootDir>/src/app/api/agent-md/**/*.test.ts",
    "<rootDir>/src/app/llms.txt/**/*.test.ts",
    "<rootDir>/components/PageIntro.test.tsx",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  transform: { "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
});
