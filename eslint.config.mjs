import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];
