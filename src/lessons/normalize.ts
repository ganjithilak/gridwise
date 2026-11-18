import {
  FormulaSyntaxError,
  isFormulaText,
  nodeRange,
  parseFormula,
  printNode,
  walk,
  type Node,
  type PrintOptions,
  type RangeAddr,
} from '@/engine';

/** The parsed formula, or null if the text isn't a formula that can be read. */
export function astOf(raw: string): Node | null {
  if (!isFormulaText(raw)) return null;
  try {
    return parseFormula(raw);
  } catch (e) {
    if (e instanceof FormulaSyntaxError) return null;
    throw e;
  }
}

/**
 * A formula in one standard spelling, so differences that don't matter disappear:
 * case, spaces, needless brackets, the direction of a range, and (unless the exercise
 * is about them) `$` signs.
 */
export function canonical(raw: string, opts: PrintOptions = {}): string | null {
  const ast = astOf(raw);
  return ast ? `=${printNode(ast, opts)}` : null;
}

export function sameFormula(a: string, b: string, opts: PrintOptions = {}): boolean {
  const x = canonical(a, opts);
  return x !== null && x === canonical(b, opts);
}

export function usesFunction(ast: Node, fn: string): boolean {
  const wanted = fn.toUpperCase();
  let found = false;
  walk(ast, (node) => {
    if (node.type === 'call' && node.name === wanted) found = true;
  });
  return found;
}

/** Every cell and range the formula mentions, in the order written. */
export function refsOf(ast: Node): RangeAddr[] {
  const out: RangeAddr[] = [];
  walk(ast, (node) => {
    if (node.type === 'ref' || node.type === 'range') out.push(nodeRange(node));
  });
  return out;
}

/** True if a number is typed straight into the formula, e.g. the 160 in =B2+160. */
export function hasNumberLiteral(ast: Node): boolean {
  let found = false;
  walk(ast, (node) => {
    if (node.type === 'num') found = true;
  });
  return found;
}
