/** @jest-environment node */
import { a1, arityProblem, checkFormula, dateToSerial, formatDate, functionNames, isError, Sheet, type Scalar, type SheetSpec } from '../index';

/**
 * Most functions are checked against real Excel in parity.test.ts. This file covers what
 * Excel can't be the answer key for: XLOOKUP (the Excel that built the workbook is too
 * old to have it) and TODAY (Excel would give the real date, not the fixed one).
 */

const shop: SheetSpec = {
  cols: 7,
  rows: 9,
  grid: [
    ['Code', 'Product', 'Price', 'Stock', 'Score', 'Grade'],
    ['A1x', 'Pen', 1.5, 200, 0, 'F'],
    ['B2y', 'Notebook', 4.25, 35, 50, 'D'],
    ['C3z', 'Stapler', 12, 0, 60, 'C'],
    ['D4w', 'Lamp', 30, 12, 70, 'B'],
    ['E5v', 'Desk', 150, 3, 85, 'A'],
    [],
    ['B2y', 'pen', null, 35],
  ],
};

function calc(formula: string, spec: SheetSpec = shop): number | string | boolean | null {
  const sheet = Sheet.fromSpec(spec);
  sheet.setRaw(a1('G1'), formula);
  const value: Scalar = sheet.getValue(a1('G1'));
  return isError(value) ? value.code : value;
}

describe('the function library', () => {
  it('has the 24 functions of version 1', () => {
    expect(functionNames()).toEqual(
      [
        'AND', 'AVERAGE', 'CONCAT', 'COUNT', 'COUNTA', 'COUNTIF', 'IF', 'IFERROR', 'LEFT', 'LEN', 'LOWER', 'MAX',
        'MIN', 'NOT', 'OR', 'RIGHT', 'ROUND', 'SUM', 'SUMIF', 'TODAY', 'TRIM', 'UPPER', 'VLOOKUP', 'XLOOKUP',
      ].sort(),
    );
  });

  it('says what is wrong when a function is given too few or too many inputs', () => {
    expect(arityProblem('IF', 1)).toBe('IF needs 2 to 3 inputs: IF(test, value_if_true, [value_if_false])');
    expect(arityProblem('ROUND', 1)).toBe('ROUND needs exactly 2 inputs: ROUND(number, digits)');
    expect(arityProblem('TODAY', 1)).toBe('TODAY takes nothing inside its brackets: TODAY()');
    expect(arityProblem('SUM', 3)).toBeNull();
    expect(checkFormula('=IF(B2>1)')).toMatchObject({ ok: false });
    expect(checkFormula('=TODAY()')).toMatchObject({ ok: true });
  });
});

describe('XLOOKUP, as Microsoft documents it', () => {
  it('finds an exact match and returns the value beside it', () => {
    expect(calc('=XLOOKUP("Lamp",B2:B6,C2:C6)')).toBe(30);
    expect(calc('=XLOOKUP("D4w",A2:A6,D2:D6)')).toBe(12);
    expect(calc('=XLOOKUP(12,C2:C6,B2:B6)')).toBe('Stapler');
  });

  it('ignores case, and can look to the left', () => {
    expect(calc('=XLOOKUP("lamp",B2:B6,C2:C6)')).toBe(30);
    expect(calc('=XLOOKUP("Pen",B2:B6,A2:A6)')).toBe('A1x');
  });

  it('is exact unless told otherwise, so a near miss is #N/A', () => {
    expect(calc('=XLOOKUP(65,E2:E6,F2:F6)')).toBe('#N/A');
    expect(calc('=XLOOKUP("Chair",B2:B6,C2:C6)')).toBe('#N/A');
  });

  it('uses the fourth input when nothing is found', () => {
    expect(calc('=XLOOKUP("Chair",B2:B6,C2:C6,"none")')).toBe('none');
    expect(calc('=XLOOKUP("Chair",B2:B6,C2:C6,0)')).toBe(0);
  });

  it('can take the next smaller or next larger value', () => {
    expect(calc('=XLOOKUP(65,E2:E6,F2:F6,"?",-1)')).toBe('C');
    expect(calc('=XLOOKUP(65,E2:E6,F2:F6,"?",1)')).toBe('B');
    expect(calc('=XLOOKUP(60,E2:E6,F2:F6,"?",-1)')).toBe('C');
    expect(calc('=XLOOKUP(-1,E2:E6,F2:F6,"?",-1)')).toBe('?');
    expect(calc('=XLOOKUP(99,E2:E6,F2:F6,"?",1)')).toBe('?');
  });

  it('only treats * and ? as wildcards in wildcard mode', () => {
    expect(calc('=XLOOKUP("St*",B2:B6,C2:C6,"none",2)')).toBe(12);
    expect(calc('=XLOOKUP("St*",B2:B6,C2:C6,"none")')).toBe('none');
  });

  it('returns the first match, or the last when searching from the bottom', () => {
    expect(calc('=XLOOKUP(35,D2:D8,B2:B8)')).toBe('Notebook');
    expect(calc('=XLOOKUP(35,D2:D8,B2:B8,"x",0,-1)')).toBe('pen');
  });

  it('works along a row as well as down a column', () => {
    expect(calc('=XLOOKUP("Price",A1:F1,A3:F3)')).toBe(4.25);
  });

  it('refuses ranges of different sizes', () => {
    expect(calc('=XLOOKUP("Pen",B2:B6,C2:C5)')).toBe('#VALUE!');
    expect(calc('=XLOOKUP("Pen",B2:C6,D2:D6)')).toBe('#VALUE!');
  });

  it('can be wrapped in IFERROR', () => {
    expect(calc('=IFERROR(XLOOKUP("Chair",B2:B6,C2:C6),"Not found")')).toBe('Not found');
  });
});

describe('TODAY and dates', () => {
  it('gives the injected date as an Excel day number, the same every time', () => {
    // The fixed date for exercises is 16 March 2026, which Excel numbers 46097.
    expect(calc('=TODAY()')).toBe(46097);
    expect(calc('=TODAY()+7')).toBe(46104);
    expect(calc('=TODAY()-TODAY()')).toBe(0);
  });

  it('numbers days the way Excel does', () => {
    expect(dateToSerial(new Date(1900, 2, 1))).toBe(61);
    expect(dateToSerial(new Date(2000, 0, 1))).toBe(36526);
    expect(dateToSerial(new Date(2026, 10, 14))).toBe(46340);
  });

  it('shows a date so the month cannot be mistaken for the day', () => {
    expect(formatDate(46097)).toBe('16 Mar 2026');
    expect(formatDate(36526)).toBe('1 Jan 2000');
    const sheet = Sheet.fromSpec({ cols: 2, rows: 2 });
    sheet.setRaw(a1('A1'), '=TODAY()');
    sheet.setRaw(a1('B1'), '=TODAY()+1');
    sheet.setRaw(a1('A2'), '=1+1');
    expect(sheet.getDisplay(a1('A1'))).toBe('16 Mar 2026');
    expect(sheet.getDisplay(a1('B1'))).toBe('17 Mar 2026');
    expect(sheet.getDisplay(a1('A2'))).toBe('2');
  });

  it('follows a different clock when one is injected', () => {
    const sheet = new Sheet(1, 1, { today: () => new Date(2026, 10, 14) });
    sheet.setRaw(a1('A1'), '=TODAY()');
    expect(sheet.getValue(a1('A1'))).toBe(46340);
  });
});
