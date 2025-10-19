// Simple constants and helpers
window.Utils = (function(){
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const randRange = (min, max) => Math.random() * (max - min) + min;
  const now = () => performance.now();
  return { clamp, lerp, randRange, now };
})();
