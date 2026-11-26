import { growthFrom, type UnitSummary } from '../growth';

const unit = (stage: UnitSummary['stage'], passed: number, of: number, optional = false): UnitSummary => ({
  stage,
  optional,
  passed,
  complete: passed >= of,
});

const course = (roots: number, trunk: number, branches: number, fruit: number, side = 0) => [
  unit('roots', roots, 5),
  unit('trunk', trunk, 6),
  unit('branches', branches, 5),
  unit('branches', side, 4, true),
  unit('fruit', fruit, 2),
];

describe('growthFrom', () => {
  it('is a seed before anything is learned', () => {
    expect(growthFrom(course(0, 0, 0, 0))).toEqual({ stage: 0, ripe: false });
  });

  it('germinates on the first lesson and roots when the first unit is done', () => {
    expect(growthFrom(course(1, 0, 0, 0)).stage).toBe(1);
    expect(growthFrom(course(5, 0, 0, 0)).stage).toBe(2);
  });

  it('grows a seedling, then a trunk, through the formulas unit', () => {
    expect(growthFrom(course(5, 1, 0, 0)).stage).toBe(2);
    expect(growthFrom(course(5, 2, 0, 0)).stage).toBe(3);
    expect(growthFrom(course(5, 6, 0, 0)).stage).toBe(4);
  });

  it('branches, flowers and fruits', () => {
    expect(growthFrom(course(5, 6, 2, 0)).stage).toBe(5);
    expect(growthFrom(course(5, 6, 5, 0)).stage).toBe(6);
    expect(growthFrom(course(5, 6, 5, 1))).toEqual({ stage: 7, ripe: false });
    expect(growthFrom(course(5, 6, 5, 2))).toEqual({ stage: 7, ripe: true });
  });

  it('is not held back or pushed on by the side unit', () => {
    expect(growthFrom(course(5, 6, 5, 0, 0)).stage).toBe(6);
    expect(growthFrom(course(0, 0, 0, 0, 4)).stage).toBe(0);
  });

  it('needs the stages in order: work further on does not skip a missing milestone', () => {
    // Passing the roots unit's test skips it (complete), so later progress counts.
    expect(growthFrom(course(0, 2, 0, 0)).stage).toBe(1);
  });
});
