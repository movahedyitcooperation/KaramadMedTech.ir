/* main.js — boot: state, render loop, router, timers. */

import { initState, getState, setState, subscribe } from "./lib/state.js";
import { mount } from "./lib/dom.js";
import { startRouter } from "./lib/router.js";
import { applySeo } from "./lib/seo.js";
import { renderApp } from "./app.js";
import { initialState, bootstrap, onRoute, heroTick, resendTick, closeOverlays } from "./actions.js";

const root = document.getElementById("app");

initState(initialState);
const render = mount(root, renderApp);

subscribe(() => {
  render();
  applySeo(getState());
});

render();

(async () => {
  await bootstrap();
  render();
  startRouter(onRoute);

  // hero autoplay — 6.5s, paused on hover / route, never under reduced-motion (handled in heroTick)
  setInterval(heroTick, 6500);
  // OTP resend countdown
  setInterval(resendTick, 1000);
})();

// Escape closes every open overlay (mega menu, cart dropdown, drawers, filter sheet)
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeOverlays();
});

// Keep the motion posture in sync if the OS setting changes mid-session.
const rmQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
rmQuery.addEventListener("change", (e) => setState({ reducedMotion: e.matches }));
