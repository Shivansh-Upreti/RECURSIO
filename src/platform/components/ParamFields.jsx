import { useEffect, useState } from 'react';

function Field({ p, value, onCommit }) {
  const [text, setText] = useState(String(value));
  useEffect(() => { setText(String(value)); }, [value]);
  const commit = (e) => onCommit(p.key, e.currentTarget.value);
  if (p.type === 'select') {
    return (
      <label className="flex min-w-[140px] flex-1 flex-col gap-1">
        <span className="eyebrow">{p.label}</span>
        <select className="field !py-1" value={value} onChange={(e) => onCommit(p.key, e.target.value)}>{p.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
      </label>
    );
  }
  return (
    <label className={`flex flex-col gap-1 ${p.wide ? 'min-w-[220px] flex-[2]' : 'min-w-[110px] flex-1'}`}>
      <span className="eyebrow">{p.label}</span>
      <input className="field !py-1" type={p.type === 'int' ? 'number' : 'text'} min={p.min} max={p.max} value={text} spellCheck={false} maxLength={p.maxLen || 80}
        onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') { commit(e); e.currentTarget.blur(); } }} />
    </label>
  );
}

export default function ParamFields({ schema, values, onChange }) {
  return <div className="flex flex-wrap items-end gap-2">{schema.map((p) => <Field key={p.key} p={p} value={values[p.key]} onCommit={onChange} />)}</div>;
}
