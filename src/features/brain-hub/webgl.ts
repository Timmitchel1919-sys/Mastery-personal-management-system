/**
 * Cheap, one-shot WebGL capability probe. Used by the BrainHub to decide whether
 * the spatial (renderer) view is viable; when it is not, the accessible module
 * list becomes the primary navigation. Pure — safe to call on the server (returns
 * `false`).
 */
let cached: boolean | null = null;

export function supportsWebgl(): boolean {
  if (cached !== null) return cached;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    cached = gl != null;
  } catch {
    cached = false;
  }
  return cached;
}
