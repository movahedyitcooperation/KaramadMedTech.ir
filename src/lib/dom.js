/* dom.js — a ~140-line hyperscript + keyed reconciler. Replaces React/dc-runtime.
   The app renders its whole tree from state on every change (small tree, 17 products);
   patch() diffs against the live DOM so inputs keep focus and caret position. */

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set(["svg", "path", "circle", "rect", "g", "line", "polyline", "polygon", "ellipse", "defs", "use"]);

/**
 * h(tag, props, ...children) -> vnode
 * props: style (object|string), class/className, on<Event> handlers, value, checked,
 * disabled, key, data- / aria- attributes, everything else set as attribute.
 * children: strings, numbers, vnodes, arrays, null/false/undefined (skipped).
 */
export function h(tag, props, ...children) {
  return { tag, props: props || {}, children: flatten(children) };
}

function flatten(list, out = []) {
  for (const c of list) {
    if (c == null || c === false || c === true || c === "") continue;
    if (Array.isArray(c)) flatten(c, out);
    else out.push(typeof c === "object" ? c : { text: String(c) });
  }
  return out;
}

function createNode(vnode) {
  if (vnode.text !== undefined) return document.createTextNode(vnode.text);
  const isSvg = SVG_TAGS.has(vnode.tag);
  const el = isSvg ? document.createElementNS(SVG_NS, vnode.tag) : document.createElement(vnode.tag);
  el.__vnode = vnode;
  el.__handlers = {};
  applyProps(el, {}, vnode.props, isSvg);
  for (const child of vnode.children) el.appendChild(createNode(child));
  // <select>.value only binds once its <option>s exist; applyProps ran before them.
  if (vnode.tag === "select" && vnode.props.value != null) el.value = String(vnode.props.value);
  return el;
}

// CSS properties whose bare-number values must NOT get a "px" suffix.
const UNITLESS = new Set([
  "opacity", "zIndex", "fontWeight", "lineHeight", "flex", "flexGrow", "flexShrink",
  "order", "zoom", "columnCount", "fillOpacity", "strokeOpacity", "strokeWidth",
  "gridRow", "gridColumn", "aspectRatio", "tabSize", "animationIterationCount",
  "WebkitLineClamp", "widows", "orphans", "flexOrder",
]);

function setStyle(el, style) {
  el.style.cssText = "";
  if (!style) return;
  if (typeof style === "string") { el.style.cssText = style; return; }
  for (const k in style) {
    const v = style[k];
    if (v == null || v === false) continue;
    if (k.startsWith("--")) { el.style.setProperty(k, String(v)); continue; }
    el.style[k] = typeof v === "number" && !UNITLESS.has(k) ? v + "px" : String(v);
  }
}

function applyProps(el, oldProps, props, isSvg) {
  // remove props that vanished
  for (const k in oldProps) {
    if (k in props) continue;
    if (k === "style") setStyle(el, null);
    else if (/^on[A-Z]/.test(k)) el.__handlers[k.slice(2).toLowerCase()] = null;
    else if (k === "class" || k === "className") el.removeAttribute("class");
    else if (k === "value" || k === "checked") el[k] = k === "checked" ? false : "";
    else el.removeAttribute(k);
  }

  for (const k in props) {
    const v = props[k];
    if (k === "key") continue;
    if (k === "style") { setStyle(el, v); continue; }
    if (k === "class" || k === "className") {
      if (v) el.setAttribute("class", v); else el.removeAttribute("class");
      continue;
    }
    if (/^on[A-Z]/.test(k) || /^on[a-z]+$/.test(k)) {
      const type = k.replace(/^on/, "").toLowerCase();
      if (!(type in el.__handlers)) {
        el.__handlers[type] = null;
        el.addEventListener(type, (e) => { const fn = el.__handlers[type]; if (fn) fn(e); });
      }
      el.__handlers[type] = typeof v === "function" ? v : null;
      continue;
    }
    if (k === "value") {
      // <option value=""> — before its text node exists el.value already reads "",
      // so the guard below would skip it and the value attr would never be set,
      // leaving option.value falling back to the text. Pin the attribute directly.
      if (el.tagName === "OPTION") el.setAttribute("value", v ?? "");
      else if (el.value !== String(v ?? "")) el.value = v ?? "";
      continue;
    }
    if (k === "checked") { el.checked = !!v; continue; }
    if (k === "disabled") { el.disabled = !!v && v !== "false"; if (el.disabled) el.setAttribute("disabled", ""); else el.removeAttribute("disabled"); continue; }
    if (k === "html") { el.innerHTML = v; continue; }
    if (v == null || v === false) { el.removeAttribute(k); continue; }
    if (v === true) { el.setAttribute(k, ""); continue; }
    el.setAttribute(k, String(v));
  }
}

function sameType(a, b) {
  if (a.text !== undefined || b.text !== undefined) return a.text !== undefined && b.text !== undefined;
  return a.tag === b.tag && (a.props.key ?? null) === (b.props.key ?? null);
}

/** patch(parentDom, newVnode, index) — reconciles parentDom.childNodes[index]. */
export function patch(parent, vnode, index = 0) {
  const existing = parent.childNodes[index];
  if (!existing) { parent.appendChild(createNode(vnode)); return; }
  const old = existing.__vnode || (existing.nodeType === 3 ? { text: existing.nodeValue } : null);

  if (!old || !sameType(old, vnode)) {
    parent.replaceChild(createNode(vnode), existing);
    return;
  }
  if (vnode.text !== undefined) {
    if (existing.nodeValue !== vnode.text) existing.nodeValue = vnode.text;
    return;
  }

  const isSvg = SVG_TAGS.has(vnode.tag);
  applyProps(existing, old.props, vnode.props, isSvg);
  existing.__vnode = vnode;

  // keyed child reconciliation
  const oldKids = old.children;
  const newKids = vnode.children;
  const oldKeyed = oldKids.some((c) => c.props && c.props.key != null);

  if (oldKeyed) {
    const map = new Map();
    Array.from(existing.childNodes).forEach((node) => {
      const k = node.__vnode && node.__vnode.props ? node.__vnode.props.key : null;
      if (k != null) map.set(k, node);
    });
    newKids.forEach((childV, i) => {
      const key = childV.props && childV.props.key != null ? childV.props.key : null;
      const moved = key != null ? map.get(key) : null;
      if (moved) {
        if (existing.childNodes[i] !== moved) existing.insertBefore(moved, existing.childNodes[i] || null);
        patchNode(moved, childV);
        map.delete(key);
      } else {
        const fresh = createNode(childV);
        existing.insertBefore(fresh, existing.childNodes[i] || null);
      }
    });
    map.forEach((node) => node.remove());
    while (existing.childNodes.length > newKids.length) existing.lastChild.remove();
  } else {
    newKids.forEach((childV, i) => patch(existing, childV, i));
    while (existing.childNodes.length > newKids.length) existing.lastChild.remove();
  }

  // re-bind <select>.value after its <option>s are reconciled (applyProps ran first)
  if (vnode.tag === "select" && vnode.props.value != null && existing.value !== String(vnode.props.value)) {
    existing.value = String(vnode.props.value);
  }
}

function patchNode(node, vnode) {
  const parent = node.parentNode;
  const idx = Array.prototype.indexOf.call(parent.childNodes, node);
  patch(parent, vnode, idx);
}

/** mount(container, renderFn) — returns a render() that reconciles once. */
export function mount(container, renderFn) {
  return function render() {
    const tree = renderFn();
    if (tree == null) return;
    patch(container, tree, 0);
    while (container.childNodes.length > 1) container.lastChild.remove();
  };
}
