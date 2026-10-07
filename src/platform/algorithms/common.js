/* Shared frame recorder. Each algorithm calls F.add(line, note, kind, vizState) to record one animation frame.
   `line` is the 1-based line of the displayed code that is executing at that moment. */
export const MAX_FRAMES = 5000;

class Stop extends Error {}

export class Frames {
  constructor() { this.list = []; this.truncated = false; }
  add(line, note, kind, viz) {
    if (this.list.length >= MAX_FRAMES) { this.truncated = true; throw new Stop('frame cap'); }
    this.list.push({ line, note, kind: kind || 'info', ...viz });
  }
}

export function collect(fn) {
  const F = new Frames();
  try { fn(F); } catch (e) { if (!(e instanceof Stop)) throw e; }
  return { frames: F.list, truncated: F.truncated };
}
