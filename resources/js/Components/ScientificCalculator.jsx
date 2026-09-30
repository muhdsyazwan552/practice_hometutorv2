import React, { useEffect, useRef, useState } from 'react';
import {
  KEYS,
  continuesFromAnswer,
  displayTokens,
  evaluateTokens,
  formatNumber,
  readNumber,
  solveLinearSystem,
  solveQuadratic,
  toDMS,
  toFraction,
} from '@/utils/calculatorEngine';

// Styles are plain Tailwind colours on purpose: no bg-white/border/shadow or
// blue/sky/indigo classes, which the student theme layer in app.css restyles.
const STYLE = {
  num: 'bg-slate-600 hover:bg-slate-500 text-white text-sm',
  op: 'bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold',
  fn: 'bg-slate-700 hover:bg-slate-600 text-slate-100 text-[11px]',
  stat: 'bg-teal-700 hover:bg-teal-600 text-white text-[11px]',
  mem: 'bg-slate-800 hover:bg-slate-700 text-amber-200 text-[10px]',
  clear: 'bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold',
  equals: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base font-extrabold',
};

// [key, label, style]
const SCI_KEYS = [
  [['sin', 'sin', 'fn'], ['cos', 'cos', 'fn'], ['tan', 'tan', 'fn'], ['ln', 'ln', 'fn'], ['log', 'log', 'fn']],
  [['asin', 'sin⁻¹', 'fn'], ['acos', 'cos⁻¹', 'fn'], ['atan', 'tan⁻¹', 'fn'], ['exp', 'eˣ', 'fn'], ['pow10', '10ˣ', 'fn']],
  [['cube', 'x³', 'fn'], ['cbrt', '∛', 'fn'], ['root', 'ⁿ√', 'fn'], ['inv', 'x⁻¹', 'fn'], ['logab', 'logₐb', 'fn']],
  [['pi', 'π', 'fn'], ['e', 'e', 'fn'], ['fact', 'x!', 'fn'], ['ncr', 'nCr', 'fn'], ['npr', 'nPr', 'fn']],
  [['abs', '|x|', 'fn'], ['dms', '°′″', 'fn'], [',', ',', 'fn'], ['percent', '%', 'fn'], ['SD', 'S⇔D', 'fn']],
  [['MC', 'MC', 'mem'], ['mem', 'MR', 'mem'], ['M+', 'M+', 'mem'], ['M-', 'M−', 'mem'], ['ANGLE', 'DEG/RAD', 'mem']],
];

const STAT_KEYS = [
  [['mean', 'x̄', 'stat'], ['sd', 's', 'stat'], ['sdp', 'σ', 'stat'], ['variance', 's²', 'stat'], ['varp', 'σ²', 'stat']],
  [['sum', 'Σx', 'stat'], ['count', 'n', 'stat'], ['median', 'med', 'stat'], [',', ',', 'fn'], ['SD', 'S⇔D', 'fn']],
];

const MAIN_KEYS = [
  [['AC', 'AC', 'clear'], ['DEL', 'DEL', 'clear'], ['(', '(', 'fn'], [')', ')', 'fn'], ['/', '÷', 'op']],
  [['7', '7', 'num'], ['8', '8', 'num'], ['9', '9', 'num'], ['pow', 'xʸ', 'fn'], ['*', '×', 'op']],
  [['4', '4', 'num'], ['5', '5', 'num'], ['6', '6', 'num'], ['sq', 'x²', 'fn'], ['-', '−', 'op']],
  [['1', '1', 'num'], ['2', '2', 'num'], ['3', '3', 'num'], ['sqrt', '√', 'fn'], ['+', '+', 'op']],
  [['0', '0', 'num'], ['.', '.', 'num'], ['exp10', '×10ˣ', 'fn'], ['ans', 'Ans', 'fn'], ['=', '=', 'equals']],
];

const KEYBOARD = {
  Enter: '=', '=': '=', Backspace: 'DEL', Delete: 'AC',
  '+': '+', '-': '-', '*': '*', x: '*', '/': '/', '^': 'pow',
  '(': '(', ')': ')', ',': ',', '.': '.', '%': 'percent', '!': 'fact',
  ...Object.fromEntries('0123456789'.split('').map((digit) => [digit, digit])),
};

const TABS = [['sci', 'Scientific'], ['stat', 'Statistics'], ['eqn', 'Equations']];

function Keypad({ rows, onPress }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {rows.flat().map(([key, label, style]) => (
        <button
          key={`${key}-${label}`}
          type="button"
          onClick={() => onPress(key)}
          className={`h-7 rounded-md font-semibold leading-none transition active:scale-95 ${STYLE[style]}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function showValue(value) {
  const fraction = toFraction(value);
  return fraction ? `${formatNumber(value)}  (${fraction})` : formatNumber(value);
}

/** Quadratic and simultaneous-equation solver (like the EQN mode on a Casio). */
function EquationSolver() {
  const [mode, setMode] = useState('quad');
  const [values, setValues] = useState({});
  const [answer, setAnswer] = useState(null);

  const layouts = {
    quad: { title: 'ax² + bx + c = 0', rows: [['a', 'b', 'c']] },
    sim2: { title: 'ax + by = c', rows: [['a₁', 'b₁', 'c₁'], ['a₂', 'b₂', 'c₂']] },
    sim3: { title: 'ax + by + cz = d', rows: [['a₁', 'b₁', 'c₁', 'd₁'], ['a₂', 'b₂', 'c₂', 'd₂'], ['a₃', 'b₃', 'c₃', 'd₃']] },
  };
  const layout = layouts[mode];

  const selectMode = (next) => {
    setMode(next);
    setValues({});
    setAnswer(null);
  };

  const solve = () => {
    const numbers = layout.rows.map((row) => row.map((name) => readNumber(values[name])));
    if (numbers.flat().some((number) => number === null)) {
      setAnswer({ error: 'Fill in every box with a number (e.g. -3, 1/2, √2).' });
      return;
    }
    if (mode === 'quad') {
      const [a, b, c] = numbers[0];
      setAnswer({ quad: solveQuadratic(a, b, c) });
    } else {
      const result = solveLinearSystem(numbers);
      setAnswer(result.error ? { error: result.error } : { sim: result.solution });
    }
  };

  const quad = answer?.quad;
  const natureText = {
    distinct: 'b² − 4ac > 0: two different real roots',
    equal: 'b² − 4ac = 0: two equal real roots',
    none: 'b² − 4ac < 0: no real roots',
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1">
        {[['quad', 'Quadratic'], ['sim2', '2 unknowns'], ['sim3', '3 unknowns']].map(([key, label]) => (
          <button key={key} type="button" onClick={() => selectMode(key)} className={`h-7 rounded-md text-[11px] font-semibold ${mode === key ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}>
            {label}
          </button>
        ))}
      </div>

      <p className="text-center font-mono text-xs text-emerald-200">{layout.title}</p>

      <div className="space-y-1">
        {layout.rows.map((row) => (
          <div key={row.join()} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
            {row.map((name) => (
              <label key={name} className="block">
                <span className="mb-0.5 block text-center text-[10px] text-slate-400">{name}</span>
                <input
                  value={values[name] ?? ''}
                  onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                  onKeyDown={(event) => event.key === 'Enter' && solve()}
                  className="h-7 w-full rounded-md border-0 bg-slate-950 px-1.5 text-center font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="0"
                  autoComplete="off"
                />
              </label>
            ))}
          </div>
        ))}
      </div>

      <button type="button" onClick={solve} className={`h-8 w-full rounded-md ${STYLE.equals}`}>Solve</button>

      {answer && (
        <div className="space-y-0.5 rounded-md bg-emerald-50 p-2 font-mono text-xs text-slate-900">
          {answer.error && <p className="font-sans font-semibold text-rose-700">{answer.error}</p>}
          {quad?.error && <p className="font-sans font-semibold text-rose-700">{quad.error}</p>}
          {quad?.linear && <p>x = {showValue(quad.roots[0])}</p>}
          {quad?.roots && !quad.linear && quad.roots.map((root, index) => (
            <p key={index}>x{quad.roots.length > 1 ? index + 1 : ''} = {showValue(root)}</p>
          ))}
          {quad?.complex && (
            <>
              <p>x₁ = {formatNumber(quad.complex.real)} + {formatNumber(quad.complex.imaginary)}i</p>
              <p>x₂ = {formatNumber(quad.complex.real)} − {formatNumber(quad.complex.imaginary)}i</p>
            </>
          )}
          {quad?.nature && (
            <p className="pt-1 font-sans text-[11px] leading-4 text-slate-600">
              {natureText[quad.nature]} (b² − 4ac = {formatNumber(quad.discriminant)})
            </p>
          )}
          {quad?.turningPoint && (
            <p className="font-sans text-[11px] leading-4 text-slate-600">
              {quad.turningPoint.kind === 'minimum' ? 'Minimum' : 'Maximum'} point: ({formatNumber(quad.turningPoint.x)}, {formatNumber(quad.turningPoint.y)})
            </p>
          )}
          {answer.sim && answer.sim.map((value, index) => (
            <p key={index}>{['x', 'y', 'z'][index]} = {showValue(value)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

const ScientificCalculator = () => {
  const [tokens, setTokens] = useState([]);
  const [result, setResult] = useState(null); // { value } or { error }
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [ans, setAns] = useState(0);
  const [memory, setMemory] = useState(0);
  const [angle, setAngle] = useState('DEG');
  const [view, setView] = useState('dec'); // how the answer is shown: dec | frac | dms
  const [tab, setTab] = useState('sci');
  const [history, setHistory] = useState([]);
  const rootRef = useRef(null);

  // Focus the calculator when it opens so keyboard typing works straight away.
  useEffect(() => rootRef.current?.focus({ preventScroll: true }), []);

  const evaluate = () => {
    const outcome = evaluateTokens(tokens, { angle, ans, memory });
    if (!outcome.ok) {
      if (outcome.error) setResult({ error: outcome.error });
      return null;
    }
    setAns(outcome.value);
    setResult({ value: outcome.value });
    setView('dec');
    setJustEvaluated(true);
    setHistory((items) => [{ expression: displayTokens(tokens), value: outcome.value }, ...items].slice(0, 20));
    return outcome.value;
  };

  const insert = (token, continues) => {
    let base = tokens;
    if (justEvaluated) {
      // After "=", an operator carries on from the answer; anything else starts fresh.
      base = continues ? [KEYS.ans] : [];
      setJustEvaluated(false);
    }
    setResult(null);
    setTokens([...base, token]);
  };

  const press = (key) => {
    switch (key) {
      case 'AC':
        setTokens([]);
        setResult(null);
        setJustEvaluated(false);
        return;
      case 'DEL':
        setResult(null);
        if (justEvaluated) setJustEvaluated(false);
        else setTokens((current) => current.slice(0, -1));
        return;
      case '=':
        evaluate();
        return;
      case 'M+':
      case 'M-': {
        const value = justEvaluated && result?.value !== undefined ? result.value : evaluate();
        if (value !== null) setMemory((current) => current + (key === 'M+' ? value : -value));
        return;
      }
      case 'MC':
        setMemory(0);
        return;
      case 'ANGLE':
        setAngle((current) => (current === 'DEG' ? 'RAD' : 'DEG'));
        return;
      case 'SD':
        if (result?.value !== undefined) setView((current) => (current === 'frac' ? 'dec' : 'frac'));
        return;
      case 'dms':
        // Like a Casio: on an answer the °′″ key converts it; otherwise it marks degrees/minutes/seconds.
        if (justEvaluated && result?.value !== undefined) {
          setView((current) => (current === 'dms' ? 'dec' : 'dms'));
          return;
        }
        break;
      default:
        break;
    }
    if (KEYS[key]) insert({ ...KEYS[key] }, continuesFromAnswer(key));
  };

  const reuse = (value) => insert({ d: formatNumber(value), e: `(${value})`, kind: 'const' }, false);

  const onKeyDown = (event) => {
    if (event.target.tagName === 'INPUT' || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = KEYBOARD[event.key];
    if (!key || tab === 'eqn') return;
    event.preventDefault();
    press(key);
  };

  let answerText = '';
  let answerNote = '';
  if (result?.error) {
    answerText = result.error;
    answerNote = 'Press DEL to fix, or AC to clear';
  } else if (result?.value !== undefined) {
    answerText = formatNumber(result.value);
    if (view === 'frac') {
      const fraction = toFraction(result.value);
      if (fraction) answerText = fraction;
      else answerNote = 'This answer is not a simple fraction';
    } else if (view === 'dms') {
      answerText = toDMS(result.value);
    }
  }

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="w-[min(18rem,calc(100vw-1rem))] select-none rounded-lg bg-slate-900 p-2 text-white outline-none"
    >
      {/* Screen */}
      <div className="mb-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-slate-900">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
          <button type="button" onClick={() => press('ANGLE')} className="rounded bg-slate-900 px-1.5 py-px text-emerald-200" title="Switch degrees / radians">
            {angle}
          </button>
          {memory !== 0 && <span title={`Memory: ${formatNumber(memory)}`}>M</span>}
          {view === 'frac' && <span>Fraction</span>}
          {view === 'dms' && <span>°′″</span>}
        </div>
        <div className="mt-0.5 min-h-[1.25rem] break-all font-mono text-xs leading-5">
          {displayTokens(tokens) || <span className="text-slate-400">0</span>}
        </div>
        <div className={`min-h-[1.75rem] text-right font-mono font-semibold leading-7 ${result?.error ? 'text-base text-rose-700' : 'text-xl'}`}>
          {answerText}
        </div>
        {answerNote && <p className="text-right text-[10px] text-slate-500">{answerNote}</p>}
      </div>

      {/* Tabs */}
      <div className="mb-1.5 grid grid-cols-3 gap-1 rounded-md bg-slate-800 p-0.5">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`h-6 rounded text-[11px] font-semibold ${tab === key ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'eqn' ? (
        <EquationSolver />
      ) : (
        <>
          <Keypad rows={tab === 'sci' ? SCI_KEYS : STAT_KEYS} onPress={press} />
          {tab === 'stat' && (
            <p className="mt-1.5 text-[10px] leading-[14px] text-slate-400">
              Type numbers with commas, e.g. x̄ 2,4,6 = 4. s / s² = sample, σ / σ² = population.
            </p>
          )}
          <div className="my-1.5 h-px bg-slate-700" />
          <Keypad rows={MAIN_KEYS} onPress={press} />
        </>
      )}

      {/* History: tap an answer to use it again */}
      {history.length > 0 && tab !== 'eqn' && (
        <details className="mt-1.5 text-[11px] text-slate-300">
          <summary className="cursor-pointer hover:text-white">History ({history.length})</summary>
          <div className="mt-1 max-h-24 space-y-1 overflow-y-auto">
            {history.map((item, index) => (
              <button key={index} type="button" onClick={() => reuse(item.value)} className="block w-full rounded bg-slate-800 px-2 py-1 text-left hover:bg-slate-700">
                <span className="block truncate text-slate-400">{item.expression}</span>
                <span className="font-mono text-emerald-300">= {formatNumber(item.value)}</span>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default ScientificCalculator;
