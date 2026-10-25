export const QUALITY_PRESETS = {
  low: {
    rainCount: 4000,
    rainSplash: false,
    shadows: false,
    shadowMapSize: 512,
    pixelRatio: 1,
    bloom: false,
    reflectorResolution: 256,
    fogDensity: 0.018,
    lanternCount: 8,
    postScale: 0.75,
  },
  medium: {
    rainCount: 12000,
    rainSplash: true,
    shadows: true,
    shadowMapSize: 1024,
    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
    bloom: true,
    reflectorResolution: 512,
    fogDensity: 0.022,
    lanternCount: 14,
    postScale: 1,
  },
  high: {
    rainCount: 22000,
    rainSplash: true,
    shadows: true,
    shadowMapSize: 2048,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    bloom: true,
    reflectorResolution: 1024,
    fogDensity: 0.026,
    lanternCount: 20,
    postScale: 1,
  },
};

export function detectDefaultQuality() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) return 'low';
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : '';
  const weak =
    /intel|swiftshader|llvmpipe|mesa/i.test(renderer) &&
    !/iris|xe|arc/i.test(renderer);
  if (weak) return 'low';
  return window.innerWidth < 900 ? 'medium' : 'medium';
}
