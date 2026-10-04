/* Recursio engine: tracing, deterministic replay, tree layout, step narration.
 *
 * A "trace" is a flat list of events produced once per run:
 *   call     – a frame is pushed             {k,id,line,g}
 *   line     – a frame executes a line       {k,id,line,note,vars,out,g}
 *   ret      – a frame returns and is popped {k,id,line,value,cached}
 *   overflow – depth limit hit               {k,id,line}
 * Every view is a pure function of (trace, eventIndex).
 *
 * Narration is returned as structured "parts" ({t:'t'|'c'|'b', v}) and rendered by React as
 * text nodes, so no HTML string is ever built from program data (XSS-safe by construction).
 */

export class TraceHalt extends Error {
  constructor(reason) { super(reason); this.reason = reason; }
}

export const DEFAULT_LIMITS = { maxDepth: 200, maxEvents: 6000, maxMs: 1500 };

export function fmt(v, max = 30) {
  let s;
  if (v === undefined) s = 'void';
  else if (v === null) s = 'null';
  else if (typeof v === 'string') s = v;
  else if (typeof v === 'function') s = 'ƒ';
  else if (Array.isArray(v)) s = '[' + v.map((x) => fmt(x, 12)).join(',') + ']';
  else if (typeof v === 'object') s = '{' + Object.keys(v).map((k) => k + ':' + fmt(v[k], 12)).join(', ') + '}';
  else s = String(v);
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export function label(n) {
  const hide = n.hide || [];
  const keys = Object.keys(n.args).filter((k) => !hide.includes(k));
  const body = hide.length ? keys.map((k) => k + '=' + fmt(n.args[k], 14)) : keys.map((k) => fmt(n.args[k], 14));
  return n.name + '(' + body.join(', ') + ')';
}

/** Copy any value into a small, structured-clone-safe, display-only form. */
export function snap(v, d = 0) {
  if (v === null || v === undefined || typeof v === 'number' || typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.length > 200 ? v.slice(0, 200) + '…' : v;
  if (typeof v === 'bigint') return String(v) + 'n';
  if (typeof v === 'function') return 'ƒ';
  if (typeof v === 'symbol') return String(v);
  if (d > 2) return '…';
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => snap(x, d + 1));
  const o = {};
  try { Object.keys(v).slice(0, 20).forEach((k) => { o[k] = snap(v[k], d + 1); }); } catch (e) { return '[object]'; }
  return o;
}

export class Tracer {
  constructor(limits) {
    const l = { ...DEFAULT_LIMITS, ...(limits || {}) };
    this.maxDepth = l.maxDepth; this.maxEvents = l.maxEvents;
    this.deadline = performance.now() + l.maxMs;
    this.events = []; this.nodes = []; this.stack = []; this.halt = null;
  }
  emit(e) {
    if (this.events.length >= this.maxEvents) { this.halt = 'events'; throw new TraceHalt('events'); }
    if ((this.events.length & 31) === 0 && performance.now() > this.deadline) { this.halt = 'time'; throw new TraceHalt('time'); }
    this.events.push(e);
  }
  enter(name, args, line, site, extra) {
    extra = extra || {};
    const parent = this.stack.length ? this.stack[this.stack.length - 1] : null;
    const node = {
      id: this.nodes.length, name, args: args || {}, parent: parent ? parent.id : null, children: [],
      depth: this.stack.length, site: site || null, line, hide: extra.hide || [], cached: false, ret: undefined,
    };
    this.nodes.push(node);
    if (parent) parent.children.push(node.id);
    this.stack.push(node);
    this.emit({ k: 'call', id: node.id, line, g: extra.g });
    if (this.stack.length > this.maxDepth) {
      this.emit({ k: 'overflow', id: node.id, line });
      this.halt = 'depth';
      throw new TraceHalt('depth');
    }
    return node.id;
  }
  at(id, line, note, extra) {
    extra = extra || {};
    this.emit({ k: 'line', id, line, note, vars: extra.vars, out: extra.out, g: extra.g });
  }
  exit(id, value, line, extra) {
    const node = this.nodes[id];
    node.ret = value;
    if (extra && extra.cached) node.cached = true;
    this.stack.pop();
    this.emit({ k: 'ret', id, line, value, cached: !!(extra && extra.cached) });
    return value;
  }
}

export function buildTrace(run, limits) {
  const T = new Tracer(limits);
  let result, error = null;
  try {
    result = run(T);
  } catch (e) {
    if (!(e instanceof TraceHalt)) error = String((e && e.message) || e).slice(0, 300);
  }
  layoutTree(T.nodes);
  return {
    events: T.events, nodes: T.nodes, halt: T.halt, error, result: snap(result), maxDepth: T.maxDepth,
    overflow: T.halt === 'depth', truncated: T.halt === 'events', timedOut: T.halt === 'time',
  };
}

/** Layout from the *final* tree so positions never jump while the tree grows. */
export function layoutTree(nodes) {
  let leaf = 0;
  const place = (n) => {
    if (!n.children.length) { n.gx = leaf++; return; }
    n.children.forEach((c) => place(nodes[c]));
    n.gx = (nodes[n.children[0]].gx + nodes[n.children[n.children.length - 1]].gx) / 2;
  };
  nodes.filter((n) => n.parent === null).forEach(place);
}

export function replay(trace, upto) {
  const nodes = trace.nodes;
  const st = nodes.map(() => ({ status: 'pending', curLine: null, waitLine: null, waitChild: null, vars: {}, ret: undefined, lastChild: null, cachedHit: false }));
  const stack = [], out = [];
  let globals = {}, overflow = false, last = null;
  for (let i = 0; i <= upto && i < trace.events.length; i++) {
    const e = trace.events[i], n = nodes[e.id], s = st[e.id];
    last = e;
    if (e.g) globals = { ...globals, ...e.g };
    if (e.k === 'call') {
      if (n.parent !== null) { const p = st[n.parent]; p.status = 'waiting'; p.waitLine = p.curLine; p.waitChild = e.id; }
      s.status = 'active'; s.curLine = e.line; s.vars = { ...n.args };
      stack.push(e.id);
    } else if (e.k === 'line') {
      s.status = 'active'; s.curLine = e.line;
      if (e.vars) Object.assign(s.vars, e.vars);
      if (e.out !== undefined) out.push(String(e.out));
    } else if (e.k === 'ret') {
      s.status = 'done'; s.ret = e.value; s.curLine = e.line; s.cachedHit = !!e.cached;
      stack.pop();
      if (n.parent !== null) { const p = st[n.parent]; p.status = 'active'; p.waitChild = null; p.waitLine = null; p.lastChild = { id: e.id, value: e.value }; }
    } else if (e.k === 'overflow') overflow = true;
  }
  const waitCounts = {};
  stack.forEach((id) => { const s = st[id]; if (s.status === 'waiting' && s.waitLine) waitCounts[s.waitLine] = (waitCounts[s.waitLine] || 0) + 1; });
  const finished = trace.events.length > 0 && upto >= trace.events.length - 1;
  return { st, stack, out, globals, overflow, last, lastIdx: upto, waitCounts, finished };
}

/* ---- narration ---- */
const t = (v) => ({ t: 't', v });
const c = (v) => ({ t: 'c', v });
const b = (v) => ({ t: 'b', v });

/** Parse a metaphor template ("<b>{c}</b> says {v}") into safe parts. Only <b> and {c}{p}{v} are recognised. */
export function rich(template, vars) {
  const parts = []; let bold = false;
  String(template).split(/(<b>|<\/b>|\{[cpv]\})/).forEach((tok) => {
    if (!tok) return;
    if (tok === '<b>') bold = true;
    else if (tok === '</b>') bold = false;
    else if (/^\{[cpv]\}$/.test(tok)) parts.push(bold ? b(vars[tok[1]] ?? '') : t(vars[tok[1]] ?? ''));
    else parts.push(bold ? b(tok) : t(tok));
  });
  return parts;
}

export function describe(trace, idx) {
  if (idx < 0) return { kind: 'idle', title: 'Ready', parts: [t('Nothing has run yet. Press '), b('Step'), t(' (or the → key) to start, or Play to watch it unfold. Before you do: what do you expect the first frame to be?')] };
  const e = trace.events[idx], n = trace.nodes[e.id], L = label(n);
  const p = n.parent !== null ? trace.nodes[n.parent] : null;
  if (e.k === 'call') {
    if (!p) return { kind: 'call', title: 'Initial call', parts: [t('The program calls '), c(L), t('. The runtime builds a '), b('stack frame'), t(' (arguments plus the line being executed) and pushes it onto the call stack.')] };
    const parts = [c(label(p)), t(' reaches its call to '), c(L)];
    if (n.site && n.site !== '▢') parts.push(t(' while evaluating '), c(n.site));
    parts.push(t('. It '), b('cannot finish'), t(' until that answer exists, so its frame is '), b('frozen mid-line'), t(' and stays on the stack. A new frame for '), c(L), t(' is pushed on top.'));
    return { kind: 'call', title: 'Pause parent, push child', parts };
  }
  if (e.k === 'line') return { kind: 'line', title: 'Line ' + e.line, parts: [t(e.note || 'Executing line ' + e.line + '.')] };
  if (e.k === 'overflow') return { kind: 'error', title: 'Stack overflow', parts: [t('The depth limit ('), b(String(trace.maxDepth)), t(') was hit and the run was stopped. A real runtime throws '), c('RangeError: Maximum call stack size exceeded'), t('. No call ever reached a base case, so nothing could return and unwind.')] };
  const v = fmt(e.value, 40), leaf = !n.children.length;
  const parts = [c(L), t(' returns '), b(v)];
  if (e.cached) parts.push(t(' straight from the '), b('cache'), t(', skipping its whole subtree'));
  else if (leaf) parts.push(t(' — a '), b('base case'), t(': no further recursive call was needed'));
  else parts.push(t(' now that all its sub-calls have finished'));
  parts.push(t('. Its frame is popped.'));
  if (p) {
    if (n.site && n.site.trim() !== '▢') parts.push(t(' The value '), b('bubbles up'), t(' to '), c(label(p)), t(', which resumes: '), c(n.site.replace('▢', v)), t('.'));
    else parts.push(t(' '), c(label(p)), t(' resumes at the next line; the result was handed back (void / discarded).'));
  } else parts.push(t(' That was the outermost call, so the stack is now empty and the caller receives '), b(v), t('.'));
  return { kind: 'ret', title: 'Return & unwind', parts };
}
