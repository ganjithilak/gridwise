import { err, isError, type Scalar } from './errors';
import { arityProblem, FUNCTIONS } from './functions';
import { nodeRange, type BinaryOp, type Node } from './parser';
import { compareValues, toNumber, toText, type EvalEnv, type RangeValue, type Value } from './values';

const RANGE_NEEDS_FUNCTION = 'A range like B2:B6 needs a function around it, such as SUM(B2:B6).';

function arithmetic(op: '+' | '-' | '*' | '/' | '^', a: Scalar, b: Scalar): Scalar {
  const x = toNumber(a);
  if (isError(x)) return x;
  const y = toNumber(b);
  if (isError(y)) return y;
  switch (op) {
    case '+':
      return x + y;
    case '-':
      return x - y;
    case '*':
      return x * y;
    case '/':
      return y === 0 ? err('#DIV/0!', "You can't divide by zero or by an empty cell.") : x / y;
    case '^': {
      if (x === 0 && y < 0) return err('#DIV/0!', "Zero can't be raised to a negative power.");
      if (x === 0 && y === 0) return err('#NUM!');
      const result = Math.pow(x, y);
      return Number.isFinite(result) ? result : err('#NUM!');
    }
  }
}

function binary(op: BinaryOp, a: Scalar, b: Scalar): Scalar {
  switch (op) {
    case '+':
    case '-':
    case '*':
    case '/':
    case '^':
      return arithmetic(op, a, b);
    case '&':
      if (isError(a)) return a;
      if (isError(b)) return b;
      return toText(a) + toText(b);
    default: {
      if (isError(a)) return a;
      if (isError(b)) return b;
      const c = compareValues(a, b);
      switch (op) {
        case '=':
          return c === 0;
        case '<>':
          return c !== 0;
        case '<':
          return c < 0;
        case '>':
          return c > 0;
        case '<=':
          return c <= 0;
        case '>=':
          return c >= 0;
      }
    }
  }
}

/** Reads the cells a ref or range node covers. Cells outside the sheet are empty. */
function readRange(node: Extract<Node, { type: 'ref' | 'range' }>, env: EvalEnv): RangeValue {
  const addr = nodeRange(node);
  const lastRow = Math.min(addr.end.row, env.rows - 1);
  const lastCol = Math.min(addr.end.col, env.cols - 1);
  const rows: Scalar[][] = [];
  for (let row = addr.start.row; row <= lastRow; row++) {
    const line: Scalar[] = [];
    for (let col = addr.start.col; col <= lastCol; col++) line.push(env.getCell({ col, row }));
    rows.push(line);
  }
  return { kind: 'range', addr, rows };
}

/** A value used directly in a calculation: one cell, never a block. */
function scalarOf(node: Node, env: EvalEnv): Scalar {
  switch (node.type) {
    case 'num':
    case 'str':
    case 'bool':
      return node.value;
    case 'err':
      return err(node.code);
    case 'name':
      return err('#NAME?', `"${node.name}" isn't a cell address or a function name. Check the spelling.`);
    case 'ref':
      return env.getCell({ col: node.ref.col, row: node.ref.row });
    case 'range':
      return err('#VALUE!', RANGE_NEEDS_FUNCTION);
    case 'unary': {
      const n = toNumber(scalarOf(node.arg, env));
      if (isError(n)) return n;
      return node.op === '-' ? -n : n;
    }
    case 'percent': {
      const n = toNumber(scalarOf(node.arg, env));
      return isError(n) ? n : n / 100;
    }
    case 'binary':
      return binary(node.op, scalarOf(node.left, env), scalarOf(node.right, env));
    case 'call': {
      const def = FUNCTIONS[node.name];
      if (!def) return err('#NAME?', `There's no function called ${node.name}. Check the spelling.`);
      const arity = arityProblem(node.name, node.args.length);
      if (arity) return err('#ERROR!', arity);
      // A cell reference stays a reference when passed to a function, so SUM(A1)
      // skips text in A1 the same way SUM(A1:A3) would.
      const args: Value[] = node.args.map((arg) =>
        arg.type === 'ref' || arg.type === 'range' ? readRange(arg, env) : scalarOf(arg, env),
      );
      return def.run(args, env);
    }
  }
}

/** Evaluates a parsed formula to what the cell shows. A formula pointing at an empty cell gives 0. */
export function evaluate(node: Node, env: EvalEnv): Scalar {
  const value = scalarOf(node, env);
  return value === null ? 0 : value;
}
