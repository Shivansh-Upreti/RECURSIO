const KW = new Set(['function', 'return', 'if', 'else', 'const', 'let', 'var', 'for', 'while', 'of', 'new', 'in', 'true', 'false', 'null', 'undefined', 'break', 'continue', 'Math', 'Infinity']);

/** Tiny JS tokenizer -> [text, className] pairs (rendered as React text, never HTML). */
export function tokenize(line) {
  const ci = line.indexOf('//');
  const code = ci >= 0 ? line.slice(0, ci) : line, comment = ci >= 0 ? line.slice(ci) : '';
  const out = []; const re = /([A-Za-z_$][\w$]*)(?=\s*\()|[A-Za-z_$][\w$]*|\d+|\s+|./g; let m;
  while ((m = re.exec(code))) {
    const w = m[0]; let cls = '';
    if (KW.has(w)) cls = 'text-purple-600 dark:text-purple-400'; else if (/^\d+$/.test(w)) cls = 'text-orange-600 dark:text-orange-400'; else if (m[1]) cls = 'text-blue-700 dark:text-blue-400';
    out.push([w, cls]);
  }
  if (comment) out.push([comment, 'italic text-slate-400 dark:text-zinc-500']);
  return out;
}
