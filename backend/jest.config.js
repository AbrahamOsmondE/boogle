module.exports = {
  verbose: true,
  moduleFileExtensions: ["js", "jsx", "json", "ts"],
  transformIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {},
  testMatch: ["**/src/**/*.(spec|test).(js|jsx|ts|tsx)"],
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  testEnvironment: "node",
};
