// @ts-check
/**
 * @type {import("eslint").ESLint.Plugin}
 */
const eslintPluginZodCoerce = {
  rules: {
    "z-number": {
      meta: {
        type: "problem",
        fixable: "code",
        docs: {
          description:
            "Disallow direct use of z.number(), use z.coerce.number() instead",
          recommended: true,
        },
        messages: {
          useCoerceNumber: "Use z.coerce.number() instead of z.number()",
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            const { callee } = node;
            if (
              callee.type === "MemberExpression" &&
              callee.object.name === "z" &&
              callee.property.name === "number"
            ) {
              context.report({
                node,
                messageId: "useCoerceNumber",
                fix(fixer) {
                  return fixer.replaceText(node, "z.coerce.number()");
                },
              });
            }
          },
        };
      },
    },
  },
};

export default eslintPluginZodCoerce;
