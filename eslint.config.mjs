import next from "eslint-config-next";

export default [
  ...next,
  { ignores: [".next/**", "node_modules/**", "design-reference/**", "scripts/**"] },
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off", // server components legitimately read the clock
      "react-hooks/refs": "off",
    },
  },
];
