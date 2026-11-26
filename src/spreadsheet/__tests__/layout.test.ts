import { columnAt, COL_HEADER_H, layoutSheet, MAX_ROW_H, MIN_COL_W, MIN_ROW_H, ROW_HEADER_W, rowAt } from '../layout';

const stock = [
  ['Product', 'Carrots', 'Potatoes', 'Tomatoes'],
  ['Stock (kg)', '100', '200', '50'],
  ['Price per kg', '$2.50', '$3.00', '$6.00'],
];

describe('layoutSheet', () => {
  it('sizes columns to what they hold', () => {
    const layout = layoutSheet(343, 400, stock, 4);
    // "Price per kg" is longer than any stock figure, so its column is wider.
    expect(layout.colW[2]).toBeGreaterThan(layout.colW[1]);
    for (const w of layout.colW.slice(0, 3)) expect(w).toBeGreaterThanOrEqual(MIN_COL_W * 0.5);
  });

  it('fills spare width with empty columns after the data, and spare height with empty rows', () => {
    const layout = layoutSheet(700, 500, stock, 4);
    expect(layout.colW.length).toBeGreaterThan(3);
    expect(layout.dataCols).toBe(3);
    const right = layout.colX[layout.colW.length - 1] + layout.colW[layout.colW.length - 1];
    expect(right).toBeGreaterThanOrEqual(700 - ROW_HEADER_W - 1);
    expect(layout.rows).toBeGreaterThan(4);
    expect(layout.rows * layout.rowH).toBeGreaterThanOrEqual(500 - COL_HEADER_H);
  });

  it('shrinks the data columns to fit a narrow screen', () => {
    const layout = layoutSheet(200, 300, stock, 4);
    const sum = layout.colW.reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThanOrEqual(200 - ROW_HEADER_W + 0.01);
    expect(layout.colW.length).toBe(3);
  });

  it('keeps rows between the smallest comfortable size and 44 pt', () => {
    expect(layoutSheet(343, 2000, stock, 4).rowH).toBe(MAX_ROW_H);
    expect(layoutSheet(343, 100, stock, 7).rowH).toBe(MIN_ROW_H);
  });

  it('turns a touch position into a data cell, never an empty one', () => {
    const layout = layoutSheet(700, 500, stock, 4);
    expect(columnAt(layout, 0)).toBe(0);
    expect(columnAt(layout, layout.colX[1] + 1)).toBe(1);
    expect(columnAt(layout, 10_000)).toBe(2);
    expect(rowAt(layout, layout.rowH * 2 + 1)).toBe(2);
    expect(rowAt(layout, 10_000)).toBe(3);
    expect(rowAt(layout, -5)).toBe(0);
  });
});
