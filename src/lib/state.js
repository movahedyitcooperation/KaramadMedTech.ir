/* state.js — module-scoped store with subscribe/notify. Replaces the Zustand
   store and the prototype's this.state / this.setState. */

let state = {};
const subs = new Set();
let scheduled = false;

export function initState(initial) {
  state = { ...initial };
}

export function getState() {
  return state;
}

/** setState(patch | (prev) => patch). Shallow-merges, then notifies once per frame. */
export function setState(update) {
  const patch = typeof update === "function" ? update(state) : update;
  if (!patch) return;
  state = { ...state, ...patch };
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(() => { scheduled = false; subs.forEach((fn) => fn(state)); });
  }
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
