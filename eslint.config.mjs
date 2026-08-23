import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  // The flight tracker demo under /public is a compiled Expo export, not source.
  { ignores: ['public/flight-tracker/**'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
