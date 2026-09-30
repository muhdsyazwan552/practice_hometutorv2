// resources/js/utils/calculatorEngine.js
//
// The maths behind the student scientific calculator. The expression is ONE
// list of tokens: each token knows what it shows on screen (d) and what it
// means to mathjs (e), so the screen and the calculation can never disagree.
import { create, all } from 'mathjs';

const math = create(all);

/**
 * Token kinds:
 *  num     digits, '.', and the ° ′ ″ marker (they join into one number)
 *  const   π, e, Ans, M: a complete value
 *  fn      opens a bracket: sin(, √(, (, ...
 *  close   ')'
 *  postfix needs a value before it: ², !, %, ...
 *  op      needs a value before it and after it: + × ÷ ^ ...
 *  minus   '−' works both as subtract and as a negative sign
 *  comma   separates arguments: nCr(5,2), x̄(2,4,6)
 */
export const KEYS = {
  // Numbers
  ...Object.fromEntries('0123456789'.split('').map((digit) => [digit, { d: digit, e: digit, kind: 'num' }])),
  '.': { d: '.', e: '.', kind: 'num' },
  dms: { d: '°', e: '°', kind: 'num', dms: true },

  // Operators
  '+': { d: '+', e: '+', kind: 'op' },
  '-': { d: '−', e: '-', kind: 'minus' },
  '*': { d: '×', e: '*', kind: 'op' },
  '/': { d: '÷', e: '/', kind: 'op' },
  pow: { d: '^(', e: '^(', kind: 'op' },
  // Standard form: like a Casio, 1÷2×10³ means 1 ÷ (2×10³), so it joins the number.
  exp10: { d: '×10^', e: 'e', kind: 'num', sci: true },
  ',': { d: ',', e: ',', kind: 'comma' },

  // Brackets
  '(': { d: '(', e: '(', kind: 'fn' },
  ')': { d: ')', e: ')', kind: 'close' },

  // After a value
  sq: { d: '²', e: '^2', kind: 'postfix' },
  cube: { d: '³', e: '^3', kind: 'postfix' },
  inv: { d: '⁻¹', e: '^(-1)', kind: 'postfix' },
  fact: { d: '!', e: '!', kind: 'postfix' },
  percent: { d: '%', e: '*0.01', kind: 'postfix' },

  // Constants
  pi: { d: 'π', e: '(pi)', kind: 'const' },
  e: { d: 'e', e: '(e)', kind: 'const' },
  ans: { d: 'Ans', e: '(ANS)', kind: 'const' },
  mem: { d: 'M', e: '(MEM)', kind: 'const' },

  // Functions (each opens a bracket; missing ')' are closed automatically)
  sqrt: { d: '√(', e: 'sqrt(', kind: 'fn' },
  cbrt: { d: '∛(', e: 'cbrt(', kind: 'fn' },
  root: { d: 'ⁿ√(', e: 'nroot(', kind: 'fn' },
  sin: { d: 'sin(', e: 'tsin(', kind: 'fn' },
  cos: { d: 'cos(', e: 'tcos(', kind: 'fn' },
  tan: { d: 'tan(', e: 'ttan(', kind: 'fn' },
  asin: { d: 'sin⁻¹(', e: 'tasin(', kind: 'fn' },
  acos: { d: 'cos⁻¹(', e: 'tacos(', kind: 'fn' },
  atan: { d: 'tan⁻¹(', e: 'tatan(', kind: 'fn' },
  ln: { d: 'ln(', e: 'log(', kind: 'fn' },
  log: { d: 'log(', e: 'log10(', kind: 'fn' },
  logab: { d: 'logₐ(', e: 'logab(', kind: 'fn' },
  exp: { d: 'e^(', e: 'exp(', kind: 'fn' },
  pow10: { d: '10^(', e: '10^(', kind: 'fn' },
  abs: { d: 'Abs(', e: 'abs(', kind: 'fn' },
  ncr: { d: 'nCr(', e: 'combinations(', kind: 'fn' },
  npr: { d: 'nPr(', e: 'permutations(', kind: 'fn' },

  // Statistics: numbers separated by commas, e.g. x̄(2,4,6)
  mean: { d: 'x̄(', e: 'mean(', kind: 'fn' },
  sd: { d: 's(', e: 'std(', kind: 'fn' },
  sdp: { d: 'σ(', e: 'sdp(', kind: 'fn' },
  variance: { d: 's²(', e: 'variance(', kind: 'fn' },
  varp: { d: 'σ²(', e: 'varp(', kind: 'fn' },
  sum: { d: 'Σx(', e: 'sum(', kind: 'fn' },
  count: { d: 'n(', e: 'count(', kind: 'fn' },
  median: { d: 'med(', e: 'median(', kind: 'fn' },
};

const endsValue = (token) => ['num', 'const', 'close', 'postfix'].includes(token.kind);
const startsValue = (token) => ['num', 'const', 'fn'].includes(token.kind);

/** Keys that continue from the previous answer when pressed straight after "=". */
export const continuesFromAnswer = (key) => ['op', 'postfix'].includes(KEYS[key]?.kind) || key === '-';

/** What the screen shows for a token list; ° markers become ° ′ ″ in order. */
export function displayTokens(tokens) {
  let dmsCount = 0;
  return tokens.map((token) => {
    if (token.dms) {
      return ['°', '′', '″'][Math.min(dmsCount++, 2)];
    }
    if (token.kind !== 'num') dmsCount = 0;
    return token.d;
  }).join('');
}

/** The mathjs expression for a token list. */
export function buildExpression(tokens) {
  let expression = '';
  tokens.forEach((token, index) => {
    const previous = tokens[index - 1];
    if (token.sci) {
      // 2×10^5 is the literal 2e5; after anything but a plain number it is ordinary ×10^.
      if (previous?.kind === 'num' && !previous.dms && !previous.sci) expression += 'e';
      else expression += previous && endsValue(previous) ? '*10^' : '10^';
      return;
    }
    // Implicit multiplication (2π, 3sin(30), (1+2)(3+4)) is written out as *,
    // so mathjs never has to guess (e.g. "2exp(" would otherwise misparse).
    if (previous && endsValue(previous) && startsValue(token) && !(previous.kind === 'num' && token.kind === 'num')) {
      expression += '*';
    }
    expression += token.e;
  });

  // Degrees-minutes-seconds: 30°15°20° -> (30 + 15/60 + 20/3600)
  expression = expression.replace(
    /(\d+(?:\.\d+)?)°(?:(\d+(?:\.\d+)?)°(?:(\d+(?:\.\d+)?)°)?)?/g,
    (_, d, m, s) => `(${d}+${m || 0}/60+${s || 0}/3600)`,
  );

  // Close any brackets the student left open, like a real calculator does.
  const open = (expression.match(/\(/g) || []).length - (expression.match(/\)/g) || []).length;
  return expression + ')'.repeat(Math.max(0, open));
}

// A trig result this close to 0 is 0 (sin 180° is 1.2e-16 in floating point).
const tidyTrig = (value) => (Math.abs(value) < 1e-12 ? 0 : value);

function scopeFor({ angle = 'DEG', ans = 0, memory = 0 }) {
  const degrees = angle === 'DEG';
  const toRadians = (x) => (degrees ? (x * Math.PI) / 180 : x);
  const fromRadians = (x) => (degrees ? (x * 180) / Math.PI : x);
  const modulo = (x, m) => ((x % m) + m) % m;

  return {
    ANS: ans,
    MEM: memory,
    tsin: (x) => (degrees && modulo(x, 180) === 0 ? 0 : tidyTrig(Math.sin(toRadians(x)))),
    tcos: (x) => (degrees && modulo(x, 180) === 90 ? 0 : tidyTrig(Math.cos(toRadians(x)))),
    ttan: (x) => {
      if (degrees && modulo(x, 180) === 90) return NaN; // tan 90° is undefined
      if (degrees && modulo(x, 180) === 0) return 0;
      const value = Math.tan(toRadians(x));
      return Math.abs(value) > 1e15 ? NaN : tidyTrig(value);
    },
    tasin: (x) => fromRadians(Math.asin(x)),
    tacos: (x) => fromRadians(Math.acos(x)),
    tatan: (x) => fromRadians(Math.atan(x)),
    nroot: (n, x) => math.nthRoot(x, n),
    logab: (base, x) => Math.log(x) / Math.log(base),
    sdp: (...values) => math.std(values, 'uncorrected'),
    varp: (...values) => math.variance(values, 'uncorrected'),
    count: (...values) => values.length,
  };
}

/**
 * Work out a token list. Returns { ok: true, value } or
 * { ok: false, error: 'Math ERROR' | 'Syntax ERROR' } like a real calculator.
 */
export function evaluateTokens(tokens, options = {}) {
  if (!tokens.length) return { ok: false, error: null };

  let result;
  try {
    result = math.evaluate(buildExpression(tokens), scopeFor(options));
  } catch (error) {
    // Parse problems are the student's typing; anything else is maths (e.g. nCr(2,5)).
    return { ok: false, error: error instanceof SyntaxError ? 'Syntax ERROR' : 'Math ERROR' };
  }

  // Real numbers only: √(−1) is complex, 1÷0 is infinite; both are errors here.
  if (typeof result !== 'number' || !Number.isFinite(result)) {
    return { ok: false, error: result === undefined ? 'Syntax ERROR' : 'Math ERROR' };
  }
  return { ok: true, value: result };
}

const SUPERSCRIPT = { '-': '⁻', '+': '', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

/** 10 significant figures; very large/small numbers as a × 10ⁿ. */
export function formatNumber(value) {
  if (value === 0 || Object.is(value, -0)) return '0';
  const text = math.format(value, { notation: 'auto', precision: 10, lowerExp: -9, upperExp: 10 });
  const [mantissa, exponent] = text.split('e');
  if (exponent === undefined) return mantissa;
  return `${mantissa}×10${exponent.split('').map((char) => SUPERSCRIPT[char] ?? char).join('')}`;
}

/** The value as a fraction (e.g. 0.75 -> 3/4, 1.25 -> 5/4), or null if it is not a simple fraction. */
export function toFraction(value) {
  if (Number.isInteger(value) || Math.abs(value) > 1e9) return null;
  try {
    const fraction = math.fraction(value);
    const numerator = Number(fraction.n) * Number(fraction.s);
    const denominator = Number(fraction.d);
    if (denominator === 1 || denominator > 100000 || Math.abs(numerator / denominator - value) > 1e-10) return null;
    return `${numerator}⁄${denominator}`;
  } catch {
    return null;
  }
}

/** The value in degrees-minutes-seconds, e.g. 30.2556 -> 30°15′20″. */
export function toDMS(value) {
  const sign = value < 0 ? '−' : '';
  let seconds = Math.round(Math.abs(value) * 3600 * 100) / 100;
  const degrees = Math.floor(seconds / 3600);
  seconds -= degrees * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.round((seconds - minutes * 60) * 100) / 100;
  return `${sign}${degrees}°${minutes}′${seconds}″`;
}

/** Read one number typed into an equation box; accepts things like -3, 1/2, √2 as sqrt(2). */
export function readNumber(text) {
  const clean = String(text ?? '').trim()
    .replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi')
    .replace(/√\s*([\d.]+)/g, 'sqrt($1)') // √2 -> sqrt(2)
    .replace(/√/g, 'sqrt');               // √(…) -> sqrt(…)
  if (clean === '') return null;
  try {
    const value = math.evaluate(clean);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * ax² + bx + c = 0. Returns the roots, what kind they are (b² − 4ac) and the
 * turning point, which is what Add Math questions ask about.
 */
export function solveQuadratic(a, b, c) {
  if (a === 0) {
    if (b === 0) return { error: c === 0 ? 'Every x is a solution' : 'No solution' };
    return { linear: true, roots: [-c / b] };
  }
  const discriminant = b * b - 4 * a * c;
  const turningPoint = { x: -b / (2 * a), y: c - (b * b) / (4 * a), kind: a > 0 ? 'minimum' : 'maximum' };

  if (Math.abs(discriminant) < 1e-12) {
    return { discriminant: 0, nature: 'equal', roots: [-b / (2 * a)], turningPoint };
  }
  if (discriminant > 0) {
    const root = Math.sqrt(discriminant);
    const roots = [(-b + root) / (2 * a), (-b - root) / (2 * a)].sort((x, y) => y - x);
    return { discriminant, nature: 'distinct', roots, turningPoint };
  }
  const real = -b / (2 * a);
  const imaginary = Math.sqrt(-discriminant) / (2 * Math.abs(a));
  return { discriminant, nature: 'none', complex: { real, imaginary }, turningPoint };
}

/** Linear simultaneous equations: rows of [coefficients..., constant]. */
export function solveLinearSystem(rows) {
  const size = rows.length;
  const coefficients = rows.map((row) => row.slice(0, size));
  const constants = rows.map((row) => row[size]);
  if (Math.abs(math.det(coefficients)) < 1e-12) return { error: 'No unique solution' };
  // Round away floating-point noise (1.9999999999999998 -> 2).
  const solution = math.lusolve(coefficients, constants).map((row) => Number(row[0].toPrecision(12)));
  return { solution };
}
