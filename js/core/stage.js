// The stage: every redrawn screen is laid out on a fixed 1133 x 640 stage
// (iPad mini landscape, under the top bar), scaled to fit whatever screen
// it's on and centred below the top bar. Things on it are measured in
// stage units, so layouts don't drift between Safari and the Home Screen
// app, or between iPads.
import * as Drag from "./drag.js";

export const STAGE_W = 1133;
export const STAGE_H = 640;

const stage = document.getElementById("stage");
const topbar = document.getElementById("topbar");
let scale = 1;

// the bottom safe area (the Home indicator), read from CSS
const probe = document.createElement("div");
probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;height:env(safe-area-inset-bottom)";
document.body.appendChild(probe);

export function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  const top = topbar.getBoundingClientRect().bottom;
  const bottom = Math.max(6, probe.getBoundingClientRect().height);
  const availH = Math.max(100, h - top - bottom);
  scale = Math.min(w / STAGE_W, availH / STAGE_H);
  const left = (w - STAGE_W * scale) / 2;
  const y = top + (availH - STAGE_H * scale) / 2;
  stage.style.transform = `translate(${left}px, ${y}px) scale(${scale})`;
}

export function stageScale() {
  return scale;
}

Drag.setScale(stageScale);
window.addEventListener("resize", fit);
window.addEventListener("orientationchange", () => setTimeout(fit, 250));
if ("ResizeObserver" in window) new ResizeObserver(fit).observe(topbar);
fit();
