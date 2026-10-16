# Lint checks

`npm run lint` is the complete Next/TypeScript lint report. After aligning eslint-config-next with Next 14.2.35, it exposes existing type/style debt that the previously broken configuration never reached.

`npm run lint:gate` is an incremental release gate, also run by `npm run build` through `prebuild`. It permits only the exact documented file/rule/message occurrence counts in `lint-baseline.json`. New findings fail. Parse errors, hook-order errors, and other runtime-oriented rules cannot be baselined. No ESLint rule is globally disabled.

The initial baseline contains 457 errors: explicit `any`, unused values, CommonJS imports, JSX text escaping, const preferences, and an empty-object type. These remain technical debt, not fixed findings. Warnings are reported separately. Remove baseline entries as the underlying code is repaired; do not regenerate the baseline to pass a failing release.
