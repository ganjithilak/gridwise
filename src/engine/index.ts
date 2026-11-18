import { FormulaSyntaxError } from './errors';
import { arityProblem } from './functions';
import { walk, type Node } from './parser';
import { isFormulaText, parseFormula } from './sheet';

export * from './context';
export * from './errors';
export * from './format';
export * from './functions';
export * from './parser';
export * from './refs';
export * from './sheet';
export * from './tokenizer';
export * from './values';
export { evaluate } from './evaluator';

export type FormulaCheck = { ok: true; ast: Node } | { ok: false; message: string; pos: number };

/**
 * Decides whether a formula can be entered at all. Excel refuses to accept a formula
 * with unbalanced brackets or the wrong number of inputs; so do we, with a message
 * the learner can act on. A misspelt function name is accepted and shows #NAME?.
 */
export function checkFormula(raw: string): FormulaCheck {
  if (!isFormulaText(raw)) return { ok: false, message: 'A formula starts with =.', pos: 0 };
  let ast: Node;
  try {
    ast = parseFormula(raw);
  } catch (e) {
    if (e instanceof FormulaSyntaxError) return { ok: false, message: e.message, pos: e.pos + 1 };
    throw e;
  }
  let arity: string | null = null;
  walk(ast, (node) => {
    if (!arity && node.type === 'call') arity = arityProblem(node.name, node.args.length);
  });
  if (arity) return { ok: false, message: arity, pos: 0 };
  return { ok: true, ast };
}

/** Adds any closing brackets left off the end, as Excel does when you press Enter. */
export function closeBrackets(raw: string): string {
  if (!isFormulaText(raw)) return raw;
  let open = 0;
  let inString = false;
  for (const ch of raw) {
    if (ch === '"') inString = !inString;
    else if (!inString && ch === '(') open++;
    else if (!inString && ch === ')') open = Math.max(0, open - 1);
  }
  return inString ? raw : raw + ')'.repeat(open);
}
