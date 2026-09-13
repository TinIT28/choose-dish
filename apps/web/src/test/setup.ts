import '@testing-library/jest-dom/vitest';

Object.assign(HTMLElement.prototype, {
  hasPointerCapture: () => false,
  releasePointerCapture: () => undefined,
  scrollIntoView: () => undefined,
  setPointerCapture: () => undefined,
});
