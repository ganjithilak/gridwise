/** @jest-environment node */
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

import { FUNCTIONS, isError, parseLiteral, Sheet, toA1, type Scalar } from '../index';

/**
 * Excel is the answer key. Every formula in column J of test/fixtures/excel-parity.xlsx
 * is run through the engine and compared with the result Excel saved in the file.
 */
const FILE = path.join(__dirname, '../../../test/fixtures/excel-parity.xlsx');
const DATA_COLS = 6;
const FORMULA_COL = 9; // J

const EXCEL_ERRORS: Record<number, string> = {
  0: '#NULL!',
  7: '#DIV/0!',
  15: '#VALUE!',
  23: '#REF!',
  29: '#NAME?',
  36: '#NUM!',
  42: '#N/A',
};

interface ParityCase {
  cell: string;
  formula: string;
  note: string;
  expected: number | string | boolean;
  sheet: Sheet;
  /** Set when the Excel that built the workbook doesn't have a function the formula uses. */
  unverifiable?: string;
}

/** Functions the Excel that built the workbook doesn't know. It can't be the answer key for those. */
const missingInExcel = new Set<string>();

function loadCases(): Record<string, ParityCase[]> {
  const wb = XLSX.read(fs.readFileSync(FILE), { type: 'buffer' });
  const out: Record<string, ParityCase[]> = {};
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const bounds = XLSX.utils.decode_range(ws['!ref'] as string);
    const sheet = new Sheet(FORMULA_COL + 1, bounds.e.r + 1);

    for (let row = 0; row <= bounds.e.r; row++) {
      for (let col = 0; col < DATA_COLS; col++) {
        const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })] as XLSX.CellObject | undefined;
        if (!cell) continue;
        if (cell.f) sheet.setRaw({ col, row }, `=${cell.f}`);
        else if (cell.t === 'n') sheet.setRaw({ col, row }, String(cell.v));
        else if (cell.t === 'b') sheet.setRaw({ col, row }, cell.v ? 'TRUE' : 'FALSE');
        else if (cell.t === 's') {
          const text = String(cell.v);
          // Text that looks like a number must stay text, as it is in the workbook.
          const staysText = parseLiteral(text).value === text;
          sheet.setRaw({ col, row }, staysText ? text : `'${text}`);
        }
      }
    }

    const cases: ParityCase[] = [];
    for (let row = 0; row <= bounds.e.r; row++) {
      const addr = { r: row, c: FORMULA_COL };
      const cell = ws[XLSX.utils.encode_cell(addr)] as XLSX.CellObject | undefined;
      if (!cell?.f) continue;
      // A function we have that Excel answers #NAME? to is one this Excel is too old to know.
      const outer = /^(?:_xlfn\.)?([A-Z][A-Z0-9.]*)\(/.exec(cell.f);
      if (outer && outer[1] in FUNCTIONS && cell.t === 'e' && cell.v === 29) missingInExcel.add(outer[1]);
      const formula = `=${cell.f.replace(/_xlfn\.|_xlws\./g, '')}`;
      const noteCell = ws[XLSX.utils.encode_cell({ r: row, c: 7 })] as XLSX.CellObject | undefined;
      const expected =
        cell.t === 'e' ? (EXCEL_ERRORS[cell.v as number] ?? `error ${String(cell.v)}`) : (cell.v as number | string | boolean);
      sheet.setRaw({ col: FORMULA_COL, row }, formula);
      cases.push({ cell: toA1({ col: FORMULA_COL, row }), formula, note: String(noteCell?.v ?? ''), expected, sheet });
    }
    out[name] = cases;
  }
  for (const cases of Object.values(out)) {
    for (const c of cases) {
      const missing = [...missingInExcel].find((fn) => c.formula.includes(`${fn}(`));
      if (missing) c.unverifiable = missing;
    }
  }
  return out;
}

const describeValue = (v: Scalar): number | string | boolean | null => (isError(v) ? v.code : v);

const bySheet = loadCases();

describe('Excel parity', () => {
  it('has cases to check', () => {
    const total = Object.values(bySheet).reduce((n, cases) => n + cases.length, 0);
    expect(total).toBeGreaterThan(50);
  });

  it('only leaves out functions that Excel itself could not answer', () => {
    // XLOOKUP needs Excel 2021 or Microsoft 365. If the workbook is rebuilt on a newer
    // Excel this set empties and those rows are checked like any other.
    expect([...missingInExcel].filter((fn) => fn !== 'XLOOKUP')).toEqual([]);
  });

  for (const [name, all] of Object.entries(bySheet)) {
    const cases = all.filter((c) => !c.unverifiable);
    const skipped = all.filter((c) => c.unverifiable);
    describe(name, () => {
      if (skipped.length > 0) {
        it.skip.each(skipped.map((c) => [c.formula, c.unverifiable] as const))('%s  (this Excel has no %s)', () => {});
      }
      if (cases.length === 0) return;
      it.each(cases.map((c) => [c.formula, c.note, c] as const))('%s  (%s)', (_formula, _note, c) => {
        const row = Number(c.cell.slice(1)) - 1;
        const actual = describeValue(c.sheet.getValue({ col: FORMULA_COL, row }));
        if (typeof c.expected === 'number') {
          expect(typeof actual).toBe('number');
          const tolerance = 1e-9 * Math.max(1, Math.abs(c.expected));
          expect(Math.abs((actual as number) - c.expected)).toBeLessThanOrEqual(tolerance);
        } else {
          expect(actual).toBe(c.expected);
        }
      });
    });
  }
});
