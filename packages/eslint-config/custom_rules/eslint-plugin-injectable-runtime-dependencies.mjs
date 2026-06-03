// @ts-check

const normalizePath = filename => filename.replaceAll("\\", "/");

const isAllowedClockFile = filename =>
  normalizePath(filename).endsWith("src/common/clock/system-clock.ts");

const isAllowedRandomFile = filename =>
  normalizePath(filename).endsWith(
    "src/common/random/system-random-generator.ts",
  );

const isAllowedConfigFile = filename => {
  const normalized = normalizePath(filename);
  return (
    normalized.endsWith("src/env.ts") ||
    normalized.endsWith("src/config/env.ts")
  );
};

const isIdentifier = (node, name) =>
  node && node.type === "Identifier" && node.name === name;

const isProperty = (node, objectName, propertyName) =>
  node &&
  node.type === "MemberExpression" &&
  !node.computed &&
  isIdentifier(node.object, objectName) &&
  isIdentifier(node.property, propertyName);

const isProcessEnvObject = node => isProperty(node, "process", "env");

const isProcessEnvMemberAccess = node =>
  node && node.type === "MemberExpression" && isProcessEnvObject(node.object);

const isProcessEnvReference = node =>
  node &&
  isProcessEnvObject(node) &&
  !(
    node.parent &&
    node.parent.type === "MemberExpression" &&
    node.parent.object === node
  );

/**
 * @type {import("eslint").ESLint.Plugin}
 */
const eslintPluginInjectableRuntimeDependencies = {
  rules: {
    "no-direct-runtime-source": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow direct runtime sources that should be injected for unit-testability.",
          recommended: true,
        },
        messages: {
          useClock:
            "Use the injected Clock instead of reading the current time directly.",
          useRandomGenerator:
            "Use the injected RandomGenerator instead of reading randomness directly.",
          useConfig:
            "Use the injected config service instead of reading process.env directly.",
        },
      },
      create(context) {
        const filename = context.filename ?? context.getFilename();

        return {
          NewExpression(node) {
            if (
              !isAllowedClockFile(filename) &&
              isIdentifier(node.callee, "Date") &&
              node.arguments.length === 0
            ) {
              context.report({ node, messageId: "useClock" });
            }
          },
          CallExpression(node) {
            const { callee } = node;

            if (
              !isAllowedClockFile(filename) &&
              isProperty(callee, "Date", "now")
            ) {
              context.report({ node, messageId: "useClock" });
              return;
            }

            const isDirectRandomUUID = isIdentifier(callee, "randomUUID");
            const isDirectRandomBytes = isIdentifier(callee, "randomBytes");
            const isCryptoRandomUUID =
              callee &&
              callee.type === "MemberExpression" &&
              !callee.computed &&
              isIdentifier(callee.object, "crypto") &&
              isIdentifier(callee.property, "randomUUID");
            const isCryptoRandomBytes =
              callee &&
              callee.type === "MemberExpression" &&
              !callee.computed &&
              isIdentifier(callee.object, "crypto") &&
              isIdentifier(callee.property, "randomBytes");

            if (
              !isAllowedRandomFile(filename) &&
              (isDirectRandomUUID ||
                isDirectRandomBytes ||
                isCryptoRandomUUID ||
                isCryptoRandomBytes)
            ) {
              context.report({ node, messageId: "useRandomGenerator" });
            }
          },
          MemberExpression(node) {
            if (
              !isAllowedConfigFile(filename) &&
              (isProcessEnvMemberAccess(node) || isProcessEnvReference(node))
            ) {
              context.report({ node, messageId: "useConfig" });
            }
          },
        };
      },
    },
  },
};

export default eslintPluginInjectableRuntimeDependencies;
