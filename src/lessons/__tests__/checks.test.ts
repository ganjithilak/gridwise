/** @jest-environment node */
import { a1, Sheet, type SheetSpec } from '@/engine';

import { runChecks, valuesEqual, withOtherNumbers } from '../checks';
import { canonical, sameFormula } from '../normalize';
import type { Check } from '../types';

const spec: SheetSpec = {
  cols: 4,
  rows: 7,
  grid: [
    ['Day', 'Sales', 'Costs', 'Profit'],
    ['Mon', 120, 80],
    ['Tue', 95, 60],
    ['Wed', 140, 90],
    ['Thu', 110, 70],
    ['Fri', 160, 100],
    ['Total'],
  ],
};

const total: Check[] = [{ type: 'outcome', cell: 'B7', reference: '=SUM(B2:B6)' }];
const totalWithSum: Check[] = [...total, { type: 'formulaUses', cell: 'B7', fn: 'SUM' }];
const profit: Check[] = [{ type: 'outcome', cell: 'D4', reference: '=B4-C4' }];

const attempt = (checks: Check[], cell: string, typed: string) => {
  const sheet = Sheet.fromSpec(spec);
  sheet.setRaw(a1(cell), typed);
  return runChecks(checks, sheet);
};

describe('outcome check', () => {
  it('passes the reference formula', () => {
    expect(attempt(total, 'B7', '=SUM(B2:B6)')).toEqual({ status: 'pass' });
  });

  it('passes spellings that mean the same thing', () => {
    for (const typed of ['=sum(b2:b6)', '= SUM( B2 : B6 )', '=SUM($B$2:$B$6)', '=SUM(B6:B2)']) {
      expect(attempt(total, 'B7', typed)).toEqual({ status: 'pass' });
    }
  });

  it('passes a different formula that is equivalent', () => {
    expect(attempt(total, 'B7', '=B2+B3+B4+B5+B6')).toEqual({ status: 'pass' });
    expect(attempt(total, 'B7', '=SUM(B2:B4)+B5+B6')).toEqual({ status: 'pass' });
  });

  it('asks for the function when the exercise is about it, without calling it a miss', () => {
    const outcome = attempt(totalWithSum, 'B7', '=B2+B3+B4+B5+B6');
    expect(outcome).toMatchObject({ status: 'soft', code: 'function-not-used' });
    expect(outcome.status === 'soft' && outcome.message).toBe('Right answer. Now do it with SUM.');
    expect(attempt(totalWithSum, 'B7', '=SUM(B2:B6)')).toEqual({ status: 'pass' });
  });

  it('a real mistake wins over "now use the function"', () => {
    expect(attempt(totalWithSum, 'B7', '=B2+B3')).toMatchObject({ status: 'fail' });
  });

  it('catches an empty cell', () => {
    expect(runChecks(total, Sheet.fromSpec(spec))).toMatchObject({ status: 'fail', code: 'empty' });
  });

  it('catches the answer typed in as a number', () => {
    expect(attempt(total, 'B7', '625')).toMatchObject({ status: 'fail', code: 'typed-value' });
    expect(attempt(total, 'B7', '600')).toMatchObject({ status: 'fail', code: 'not-a-formula' });
  });

  it('catches a formula with no = sign', () => {
    expect(attempt(total, 'B7', 'SUM(B2:B6)')).toMatchObject({ status: 'fail', code: 'missing-equals' });
    expect(attempt(profit, 'D4', 'B4-C4')).toMatchObject({ status: 'fail', code: 'missing-equals' });
  });

  it('catches the answer typed inside a formula, using the hidden numbers', () => {
    expect(attempt(total, 'B7', '=625')).toMatchObject({ status: 'fail', code: 'not-general' });
    const partly = attempt(total, 'B7', '=B2+B3+B4+B5+160');
    expect(partly).toMatchObject({ status: 'fail', code: 'not-general' });
    expect(partly.status === 'fail' && partly.message).toMatch(/number is typed into your formula/);
  });

  it('says when the range stops short or runs on', () => {
    const short = attempt(total, 'B7', '=SUM(B2:B5)');
    expect(short).toMatchObject({ status: 'fail', code: 'range-short' });
    expect(short.status === 'fail' && short.message).toBe('Your formula covers B2:B5, so B6 is left out.');

    const shorter = attempt(total, 'B7', '=SUM(B2:B4)');
    expect(shorter.status === 'fail' && shorter.message).toBe('Your formula covers B2:B4, so B5:B6 are left out.');

    const sheet = Sheet.fromSpec({ ...spec, rows: 8 });
    sheet.setRaw(a1('B7'), '10');
    sheet.setRaw(a1('B8'), '=SUM(B2:B7)');
    const long = runChecks([{ type: 'outcome', cell: 'B8', reference: '=SUM(B2:B6)' }], sheet);
    expect(long).toMatchObject({ status: 'fail', code: 'range-long' });
    expect(long.status === 'fail' && long.message).toBe('Your formula covers B2:B7. It should stop at B6.');
  });

  it('says when the formula is on the wrong column or row, by name', () => {
    const column = attempt(total, 'B7', '=SUM(C2:C6)');
    expect(column).toMatchObject({ status: 'fail', code: 'wrong-column' });
    expect(column.status === 'fail' && column.message).toBe(
      'Your formula uses Costs (column C). This one is about Sales (column B).',
    );

    const row = attempt(profit, 'D4', '=B3-C3');
    expect(row).toMatchObject({ status: 'fail', code: 'wrong-row' });
    expect(row.status === 'fail' && row.message).toBe(
      'Your formula uses row 3 (Tue). This one is about row 4 (Wed).',
    );
  });

  it('says when the cells are right but the sign or the order is not', () => {
    const swapped = attempt(profit, 'D4', '=C4-B4');
    expect(swapped).toMatchObject({ status: 'fail', code: 'swapped' });
    expect(swapped.status === 'fail' && swapped.message).toBe(
      'Right cells, wrong way round: yours takes B4 away from C4.',
    );

    const sign = attempt(profit, 'D4', '=B4+C4');
    expect(sign).toMatchObject({ status: 'fail', code: 'wrong-operator' });
    expect(sign.status === 'fail' && sign.message).toMatch(/adds them together/);
  });

  it('explains an error value', () => {
    const outcome = attempt(profit, 'D4', '=B4/A7x');
    expect(outcome).toMatchObject({ status: 'fail', code: 'error-value' });
    expect(outcome.status === 'fail' && outcome.message).toMatch(/^D4 shows #NAME\?/);
  });

  it('falls back to showing what the cell says', () => {
    const outcome = attempt(profit, 'D4', '=B4*2');
    expect(outcome).toMatchObject({ status: 'fail', code: 'wrong-value' });
    expect(outcome.status === 'fail' && outcome.message).toMatch(/^D4 shows 280/);
  });

  it('keeps every message short enough for two lines on a phone', () => {
    const tries: [Check[], string, string][] = [
      [total, 'B7', '625'],
      [total, 'B7', '600'],
      [total, 'B7', 'SUM(B2:B6)'],
      [total, 'B7', '=625'],
      [total, 'B7', '=B2+B3+B4+B5+160'],
      [total, 'B7', '=SUM(B2:B5)'],
      [total, 'B7', '=SUM(C2:C6)'],
      [total, 'B7', '=SUM(B3:B5)'],
      [profit, 'D4', '=B3-C3'],
      [profit, 'D4', '=C4-B4'],
      [profit, 'D4', '=B4+C4'],
      [profit, 'D4', '=B4*2'],
      [profit, 'D4', '=D4'],
    ];
    for (const [checks, cell, typed] of tries) {
      const outcome = attempt(checks, cell, typed);
      expect(outcome.status).toBe('fail');
      if (outcome.status === 'fail') expect(outcome.message.length).toBeLessThanOrEqual(96);
    }
  });
});

describe('other checks', () => {
  it('cellValue compares what the cell shows', () => {
    const checks: Check[] = [{ type: 'cellValue', cell: 'B2', equals: 200 }];
    expect(attempt(checks, 'B2', '200')).toEqual({ status: 'pass' });
    expect(attempt(checks, 'B2', '=100*2')).toEqual({ status: 'pass' });
    expect(attempt(checks, 'B2', '150')).toMatchObject({ status: 'fail', code: 'wrong-value' });
  });

  it('cellIsFormula needs a formula', () => {
    const checks: Check[] = [{ type: 'cellIsFormula', cell: 'B7' }];
    expect(attempt(checks, 'B7', '=1')).toEqual({ status: 'pass' });
    expect(attempt(checks, 'B7', '1')).toMatchObject({ status: 'fail', code: 'not-a-formula' });
  });
});

describe('helpers', () => {
  it('compares values the forgiving way', () => {
    expect(valuesEqual(0.1 + 0.2, 0.3)).toBe(true);
    expect(valuesEqual('north', ' North ')).toBe(true);
    expect(valuesEqual(1, '1')).toBe(false);
    expect(valuesEqual(null, 0)).toBe(false);
  });

  it('swaps every typed number but leaves formulas, text and the target alone', () => {
    const sheet = Sheet.fromSpec(spec);
    sheet.setRaw(a1('D2'), '=B2-C2');
    sheet.setRaw(a1('B7'), '625');
    const other = withOtherNumbers(sheet, a1('B7'), 1);
    expect(other.getValue(a1('B2'))).not.toBe(120);
    expect(other.getRaw(a1('D2'))).toBe('=B2-C2');
    expect(other.getValue(a1('A2'))).toBe('Mon');
    expect(other.getRaw(a1('B7'))).toBe('625');
    expect(sheet.getValue(a1('B2'))).toBe(120);
  });

  it('normalises formulas before comparing them', () => {
    expect(canonical('= sum( $b$6 : b2 )')).toBe('=SUM(B2:B6)');
    expect(sameFormula('=b2 - c2', '=B2-C2')).toBe(true);
    expect(sameFormula('=$B$2-C2', '=B2-C2')).toBe(true);
    expect(sameFormula('=$B$2-C2', '=B2-C2', { keepAbsolute: true })).toBe(false);
    expect(sameFormula('=C2-B2', '=B2-C2')).toBe(false);
    expect(canonical('B2-C2')).toBeNull();
    expect(canonical('=B2-')).toBeNull();
  });
});
