// @ts-check
/**
 * @type {import("eslint").ESLint.Plugin}
 */
const eslintPluginZodRequestQueryArray = {
  rules: {
    "enforce-zqueryrequest-array": {
      meta: {
        type: "problem",
        fixable: "code",
        docs: {
          description:
            "길이가 1인 배열을 처리하기 위해서 zod 쿼리 스키마에서 .array() 대신 zQueryArray() 사용을 강제합니다.",
          recommended: true,
        },
        messages: {
          usezQueryArray:
            "쿼리 파라미터 스키마에서는 `.array()` 대신 `zQueryArray()`를 사용해주세요.",
        },
      },
      create(context) {
        return {
          // `something.array()` 패턴을 처리합니다.
          'VariableDeclarator[id.name=/requestQuery$/] CallExpression[callee.property.name="array"][callee.object.name!="z"]'(
            node,
          ) {
            context.report({
              node,
              messageId: "usezQueryArray",
              fix(fixer) {
                const schemaToWrap = node.callee.object;
                const schemaSourceText =
                  context.sourceCode.getText(schemaToWrap);
                return fixer.replaceText(
                  node,
                  `zQueryArray(${schemaSourceText})`,
                );
              },
            });
          },

          // `z.array(something)` 패턴을 처리합니다.
          'VariableDeclarator[id.name=/requestQuery$/] CallExpression[callee.object.name="z"][callee.property.name="array"]'(
            node,
          ) {
            if (node.arguments.length === 0) {
              return;
            }
            context.report({
              node,
              messageId: "usezQueryArray",
              fix(fixer) {
                const schemaToWrap = node.arguments[0];
                const schemaSourceText =
                  context.sourceCode.getText(schemaToWrap);
                return fixer.replaceText(
                  node,
                  `zQueryArray(${schemaSourceText})`,
                );
              },
            });
          },
        };
      },
    },
  },
};

export default eslintPluginZodRequestQueryArray;
