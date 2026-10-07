import { fmt } from '../../engine/engine.js';

export const MAX_CODE_CHARS = 8000;
const HARD_TIMEOUT_MS = 3000;

/** Run learner code against a contract inside the sandbox worker; never throws, always resolves. */
export function runUserCode(code, contract, { withStress = false } = {}) {
  if (String(code).length > MAX_CODE_CHARS) return Promise.resolve({ status: 'error', message: `Code is longer than ${MAX_CODE_CHARS} characters.`, tests: [], logs: [] });
  return new Promise((resolve) => {
    let worker;
    try { worker = new Worker(new URL('./usercode.worker.js', import.meta.url), { type: 'module' }); }
    catch (e) { resolve({ status: 'error', message: 'The sandbox could not start in this browser.', tests: [], logs: [] }); return; }
    let lastTest = -2, partial = null, timer = null;
    const finish = (r) => { clearTimeout(timer); worker.terminate(); resolve(r); };
    const judge = (results, logs) => {
      const tests = contract.tests.map((t, i) => {
        const r = (results || [])[i] || { error: 'No result' };
        if (r.error) return { label: t.label, pass: false, error: r.error, ms: r.ms };
        let verdict;
        try { verdict = contract.check(r.got, t.args, t, r.after); } catch (err) { verdict = { ok: false, expected: '?' }; }
        return { label: t.label, pass: !!verdict.ok, got: fmt(r.got, 80), expected: fmt(verdict.expected, 80), ms: r.ms };
      });
      return { status: tests.every((x) => x.pass) ? 'pass' : 'fail', tests, logs };
    };
    const arm = (ms) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (partial) { // only the optional speed check ran out of time: keep the correctness verdict
          finish({ ...partial, slow: contract.stress ? { ms: '> ' + ms, limit: contract.stress.slowMs, hint: contract.stress.hint } : null });
          return;
        }
        const t = contract && contract.tests[lastTest];
        finish({ status: 'timeout', message: `Stopped after ${ms / 1000} s${t ? ` while running the test "${t.label.slice(0, 60)}"` : ''}. This usually means an infinite loop, or a loop whose index never reaches its end.`, tests: [], logs: [], timedOutAt: lastTest });
      }, ms);
    };
    arm(HARD_TIMEOUT_MS);
    worker.onerror = (ev) => { if (ev.preventDefault) ev.preventDefault(); finish({ status: 'error', message: 'The sandbox crashed while running your code.', tests: [], logs: [] }); };
    worker.onmessage = (ev) => {
      const d = ev.data || {};
      if (d.type === 'progress') { lastTest = d.i; return; }
      const logs = Array.isArray(d.logs) ? d.logs.filter((x) => typeof x === 'string').slice(0, 40) : [];
      if (d.type === 'partial') { if (!contract) return; partial = judge(d.results, logs); if (withStress && contract && contract.stress) arm(2500); else finish(partial); return; }
      if (d.type !== 'done') return;
      if (d.phase === 'load') { finish({ status: 'error', message: String(d.error || 'Your code could not be loaded.'), tests: [], logs }); return; }
      if (d.phase === 'missing') { finish({ status: 'missing', message: `Define a function named ${contract.fn}(…) so the tests can call it.`, tests: [], logs }); return; }
      if (!contract) { finish({ status: 'ok', message: 'Your code ran without errors.', tests: [], logs }); return; }
      let slow = null;
      if (withStress && contract.stress && typeof d.stressMs === 'number' && d.stressMs > contract.stress.slowMs) slow = { ms: Math.round(d.stressMs), limit: contract.stress.slowMs, hint: contract.stress.hint };
      finish({ ...(partial || judge([], logs)), stressMs: d.stressMs, slow });
    };
    const stress = withStress && contract && contract.stress ? contract.stress.build() : null;
    worker.postMessage({ code: String(code), fn: contract ? contract.fn : null, tests: contract ? contract.tests.map((t) => ({ args: t.args })) : [], stress });
  });
}
