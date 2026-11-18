/** @jest-environment node */
import {
  alignFor,
  checkFormula,
  closeBrackets,
  colToLetters,
  explainError,
  fitNumber,
  formatCurrency,
  formatPercent,
  isError,
  lettersToCol,
  parseBody,
  parseLiteral,
  parseRange,
  parseRef,
  printNode,
  rangeToA1,
  roundHalfAway,
  scanRefs,
  Sheet,
  toA1,
  tokenize,
  a1,
} from '../index';

// What formulas evaluate to is covered by parity.test.ts, with Excel as the answer key.
// These tests cover the parts Excel can't vouch for: our own messages, text handling and model.

const syntaxMessage = (body: string): string => {
  try {
    parseBody(body);
  } catch (e) {
    return (e as Error).message;
  }
  return 'no error';
};

describe('cell addresses', () => {
  it('converts columns both ways', () => {
    expect(colToLetters(0)).toBe('A');
    expect(colToLetters(25)).toBe('Z');
    expect(colToLetters(26)).toBe('AA');
    expect(lettersToCol('a')).toBe(0);
    expect(lettersToCol('AB')).toBe(27);
  });

  it('parses references with and without $', () => {
    expect(parseRef('B2')).toEqual({ col: 1, row: 1, absCol: false, absRow: false });
    expect(parseRef('$b$12')).toEqual({ col: 1, row: 11, absCol: true, absRow: true });
    expect(parseRef('B0')).toBeNull();
    expect(parseRef('2B')).toBeNull();
    expect(toA1({ col: 3, row: 6 })).toBe('D7');
  });

  it('puts reversed ranges in order', () => {
    expect(rangeToA1(parseRange('B6:B2')!)).toBe('B2:B6');
    expect(rangeToA1(parseRange('c3')!)).toBe('C3');
    expect(parseRange('B2:')).toBeNull();
  });

  it('finds references in half-typed formulas', () => {
    expect(scanRefs('=SUM(B2:B6').map((r) => r.text)).toEqual(['B2:B6']);
    expect(scanRefs('=B2+').map((r) => r.text)).toEqual(['B2']);
    expect(scanRefs('=B2-C2*$D$4').map((r) => r.text)).toEqual(['B2', 'C2', '$D$4']);
    expect(scanRefs('="A1"&B1').map((r) => r.text)).toEqual(['B1']);
    expect(scanRefs('=LOG10(A1)').map((r) => r.text)).toEqual(['A1']);
  });
});

describe('tokenizer', () => {
  it('tells references from function names', () => {
    const types = tokenize('SUM(B2:B6)+A1').map((t) => `${t.type}:${t.text}`);
    expect(types).toEqual(['ident:SUM', 'lparen:(', 'ref:B2', 'colon::', 'ref:B6', 'rparen:)', 'op:+', 'ref:A1']);
  });

  it('reads two-character operators and quoted text', () => {
    expect(tokenize('A1<=5').map((t) => t.text)).toEqual(['A1', '<=', '5']);
    expect(tokenize('"say ""hi"""').map((t) => t.type)).toEqual(['str']);
    expect(tokenize('#DIV/0!+1').map((t) => t.type)).toEqual(['err', 'op', 'num']);
  });
});

describe('parser', () => {
  it('prints a canonical form that ignores case, spaces, $ and range direction', () => {
    const canon = (body: string) => printNode(parseBody(body));
    expect(canon(' sum( b6 : b2 ) ')).toBe('SUM(B2:B6)');
    expect(canon('$B$2 + c3')).toBe('B2+C3');
    expect(canon('(1+2)*3')).toBe('(1+2)*3');
    expect(canon('1+(2*3)')).toBe('1+2*3');
    expect(canon('-2^2')).toBe('-2^2');
    expect(canon('2^3^2')).toBe('2^3^2');
    expect(canon('2^(3^2)')).toBe('2^(3^2)');
    expect(printNode(parseBody('$B$2+c3'), { keepAbsolute: true })).toBe('$B$2+C3');
  });

  it('explains what is wrong in plain English', () => {
    expect(syntaxMessage('')).toMatch(/after the = sign/);
    expect(syntaxMessage('SUM(B2:B6')).toMatch(/missing its closing bracket/);
    expect(syntaxMessage('(1+2')).toMatch(/missing its closing bracket/);
    expect(syntaxMessage('1+2)')).toMatch(/without an opening bracket/);
    expect(syntaxMessage('B2+')).toMatch(/stops too soon/);
    expect(syntaxMessage('B2 C2')).toMatch(/Something is missing before "C2"/);
    expect(syntaxMessage('B2:')).toMatch(/both sides of the colon/);
    expect(syntaxMessage('SUM(B2,,B3)')).toMatch(/empty spot/);
    expect(syntaxMessage('*B2')).toMatch(/needs a value in front/);
    expect(syntaxMessage('"abc')).toMatch(/closing quote/);
    expect(syntaxMessage('SUM(B2;B3)')).toMatch(/comma/);
  });
});

describe('checkFormula', () => {
  it('accepts a good formula and a misspelt function (which shows #NAME?)', () => {
    expect(checkFormula('=SUM(B2:B6)').ok).toBe(true);
    expect(checkFormula('=SUMM(B2:B6)').ok).toBe(true);
  });

  it('refuses unbalanced brackets and wrong input counts', () => {
    const open = checkFormula('=SUM(B2:B6');
    expect(open.ok).toBe(false);
    const empty = checkFormula('=SUM()');
    expect(empty).toMatchObject({ ok: false });
    expect(!empty.ok && empty.message).toMatch(/SUM needs at least 1/);
  });

  it('closes brackets the way Excel does on Enter', () => {
    expect(closeBrackets('=SUM(B2:B6')).toBe('=SUM(B2:B6)');
    expect(closeBrackets('=SUM((B2+1)*2')).toBe('=SUM((B2+1)*2)');
    expect(closeBrackets('=SUM(B2:B6)')).toBe('=SUM(B2:B6)');
    expect(closeBrackets('="("')).toBe('="("');
    expect(closeBrackets('hello (')).toBe('hello (');
  });
});

describe('typed values', () => {
  it('recognises numbers, percentages, currency and text', () => {
    expect(parseLiteral('120')).toEqual({ value: 120, numFmt: undefined });
    expect(parseLiteral('1,200')).toEqual({ value: 1200, numFmt: undefined });
    expect(parseLiteral('-3.5')).toEqual({ value: -3.5, numFmt: undefined });
    expect(parseLiteral('15%')).toEqual({ value: 0.15, numFmt: 'percent' });
    expect(parseLiteral('$4.50')).toEqual({ value: 4.5, numFmt: 'currency' });
    expect(parseLiteral('true')).toEqual({ value: true });
    expect(parseLiteral('Mon')).toEqual({ value: 'Mon' });
    expect(parseLiteral("'7")).toEqual({ value: '7' });
    expect(parseLiteral('  ')).toEqual({ value: null });
    expect(parseLiteral('12 apples')).toEqual({ value: '12 apples' });
  });
});

describe('number display', () => {
  it('rounds half away from zero on the decimal value', () => {
    expect(roundHalfAway(2.5, 0)).toBe(3);
    expect(roundHalfAway(-2.5, 0)).toBe(-3);
    expect(roundHalfAway(2.675, 2)).toBe(2.68);
    expect(roundHalfAway(1.005, 2)).toBe(1.01);
    expect(roundHalfAway(1234.5, -2)).toBe(1200);
    expect(roundHalfAway(0, 2)).toBe(0);
  });

  it('formats currency and percent', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency(-0.004)).toBe('$0.00');
    expect(formatCurrency(-12)).toBe('-$12.00');
    expect(formatPercent(0.07)).toBe('7%');
    expect(formatPercent(0.125)).toBe('13%');
  });

  it('fits numbers to a narrow cell like Excel does', () => {
    expect(fitNumber(120, 'general', 6)).toBe('120');
    expect(fitNumber(1 / 3, 'general', 6)).toBe('0.3333');
    expect(fitNumber(2 / 3, 'general', 6)).toBe('0.6667');
    expect(fitNumber(1234567, 'general', 5)).toBe('#####');
    expect(fitNumber(12345.678, 'general', 6)).toBe('12346');
    expect(fitNumber(1234.5, 'currency', 6)).toBe('######');
  });

  it('aligns by type', () => {
    expect(alignFor(5)).toBe('right');
    expect(alignFor('Mon')).toBe('left');
    expect(alignFor(true)).toBe('center');
    expect(alignFor(null)).toBe('left');
  });
});

describe('Sheet', () => {
  const tracker = () =>
    Sheet.fromSpec({
      cols: 4,
      rows: 8,
      grid: [
        ['Day', 'Sales', 'Costs'],
        ['Mon', 120, 80],
        ['Tue', 95, 60],
        ['Wed', 140, 90],
      ],
    });

  it('recalculates when the data changes', () => {
    const s = tracker();
    s.setRaw(a1('B6'), '=SUM(B2:B4)');
    expect(s.getValue(a1('B6'))).toBe(355);
    s.setRaw(a1('B2'), '200');
    expect(s.getValue(a1('B6'))).toBe(435);
  });

  it('follows chains of formulas', () => {
    const s = tracker();
    s.setRaw(a1('D2'), '=B2-C2');
    s.setRaw(a1('D3'), '=D2*2');
    expect(s.getValue(a1('D3'))).toBe(80);
  });

  it('reports a circular reference instead of hanging', () => {
    const s = tracker();
    s.setRaw(a1('D2'), '=D3+1');
    s.setRaw(a1('D3'), '=D2+1');
    const v = s.getValue(a1('D2'));
    expect(isError(v) && explainError(v)).toMatch(/refers back to its own cell/);
    s.setRaw(a1('D4'), '=D4');
    expect(isError(s.getValue(a1('D4')))).toBe(true);
  });

  it('keeps an unreadable formula and explains it', () => {
    const s = tracker();
    s.setRaw(a1('D2'), '=B2+');
    const v = s.getValue(a1('D2'));
    expect(isError(v) && v.code).toBe('#ERROR!');
    expect(isError(v) && explainError(v)).toMatch(/stops too soon/);
  });

  it('treats cells outside the sheet as empty', () => {
    const s = tracker();
    s.setRaw(a1('D2'), '=B2+Z99');
    expect(s.getValue(a1('D2'))).toBe(120);
    expect(() => s.setRaw(a1('Z99'), '1')).toThrow(/outside/);
  });

  it('applies the format a typed value implies, without overriding a chosen one', () => {
    const s = tracker();
    s.setRaw(a1('D2'), '15%');
    expect(s.getDisplay(a1('D2'))).toBe('15%');
    s.setRaw(a1('D3'), '$4.5');
    expect(s.getDisplay(a1('D3'))).toBe('$4.50');
    s.setFormat(parseRange('B2:B4')!, { numFmt: 'currency' });
    expect(s.getDisplay(a1('B2'))).toBe('$120.00');
  });

  it('clones independently and restores snapshots', () => {
    const s = tracker();
    const snap = s.snapshot();
    const copy = s.clone();
    copy.setRaw(a1('B2'), '1');
    expect(s.getValue(a1('B2'))).toBe(120);
    s.setRaw(a1('B2'), '5');
    s.restore(snap);
    expect(s.getValue(a1('B2'))).toBe(120);
  });

  it('previews a formula without changing the sheet', () => {
    const s = tracker();
    expect(s.preview(a1('B6'), '=SUM(B2:B4)')).toBe(355);
    expect(s.getRaw(a1('B6'))).toBe('');
  });
});
