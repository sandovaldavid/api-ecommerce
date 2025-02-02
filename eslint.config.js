import globals from "globals";
import pluginJs from "@eslint/js";

export default [
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    pluginJs.configs.recommended,
    {
        rules: {
            "no-console": "off",
            "no-undef": "error",
            "no-unused-vars": "warn",
            "no-var": "error",
            "prefer-const": "error",
            "indent": ["error", 4], // Indentación de 2 espacios
            "object-curly-spacing": ["error", "always"],
            "array-bracket-spacing": ["error", "never"],
            "computed-property-spacing": ["error", "never"],
            "space-before-function-paren": ["error", "always"], // Ajuste similar a WebStorm
            "no-tabs": ["error", { allowIndentationTabs: true }], // No permitir tabs para indentación
            "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
            "object-shorthand": ["error", "always"],
            "no-trailing-spaces": ["error", { skipBlankLines: true }],
            "keyword-spacing": ["error", { after: true }],
            "semi": ["error", "always"], // Siempre usar punto y coma
            "quotes": ["error", "double"], // Usar comillas simples
            "eol-last": ["error", "never"],
            "camelcase": ["error", { "properties": "never" }]
        }
    }
];