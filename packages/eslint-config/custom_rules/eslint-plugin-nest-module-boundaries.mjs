// @ts-check

const normalizePath = filename => filename.replaceAll("\\", "/");

const isFeatureModuleFile = filename => {
  const normalized = normalizePath(filename);
  return (
    normalized.includes("src/feature/") && normalized.endsWith(".module.ts")
  );
};

const getPropertyName = node => {
  if (!node) {
    return "";
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "Literal") {
    return String(node.value);
  }

  return "";
};

const getExportedProviderName = node => {
  if (!node) {
    return "";
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "MemberExpression" && !node.computed) {
    return getPropertyName(node.property);
  }

  return "";
};

const isModuleDecorator = node =>
  node?.type === "Decorator" &&
  node.expression.type === "CallExpression" &&
  node.expression.callee.type === "Identifier" &&
  node.expression.callee.name === "Module";

const getModuleMetadata = decorator => {
  if (!isModuleDecorator(decorator)) {
    return null;
  }

  const [metadata] = decorator.expression.arguments;
  return metadata?.type === "ObjectExpression" ? metadata : null;
};

/**
 * @type {import("eslint").ESLint.Plugin}
 */
const eslintPluginNestModuleBoundaries = {
  rules: {
    "public-service-exports-only": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Allow Nest feature modules to export only public service providers.",
          recommended: true,
        },
        messages: {
          usePublicService:
            "Nest module exports can expose only *PublicService providers. Keep '{{name}}' module-private.",
          useStaticExports:
            "Nest module exports must be a static array so the public provider surface can be guarded.",
        },
      },
      create(context) {
        const filename = context.filename ?? context.getFilename();

        if (!isFeatureModuleFile(filename)) {
          return {};
        }

        return {
          ClassDeclaration(node) {
            for (const decorator of node.decorators ?? []) {
              const metadata = getModuleMetadata(decorator);
              if (!metadata) {
                continue;
              }

              const exportsProperty = metadata.properties.find(
                property =>
                  property.type === "Property" &&
                  getPropertyName(property.key) === "exports",
              );

              if (!exportsProperty) {
                continue;
              }

              if (exportsProperty.value.type !== "ArrayExpression") {
                context.report({
                  node: exportsProperty.value,
                  messageId: "useStaticExports",
                });
                continue;
              }

              for (const element of exportsProperty.value.elements) {
                const exportedName = getExportedProviderName(element);
                if (exportedName && exportedName.endsWith("PublicService")) {
                  continue;
                }

                context.report({
                  node: element ?? exportsProperty.value,
                  messageId: "usePublicService",
                  data: {
                    name: element ? context.sourceCode.getText(element) : "",
                  },
                });
              }
            }
          },
        };
      },
    },
  },
};

export default eslintPluginNestModuleBoundaries;
