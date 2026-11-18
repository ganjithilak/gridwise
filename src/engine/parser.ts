import { FormulaSyntaxError, type ErrorCode } from './errors';
import { normalizeRange, parseRef, refToString, type CellRef, type RangeAddr } from './refs';
import { tokenize, type Token } from './tokenizer';

export type BinaryOp = '+' | '-' | '*' | '/' | '^' | '&' | '=' | '<>' | '<' | '>' | '<=' | '>=';

export type Node =
  | { type: 'num'; value: number }
  | { type: 'str'; value: string }
  | { type: 'bool'; value: boolean }
  | { type: 'err'; code: ErrorCode }
  /** A bare word that isn't TRUE/FALSE or a function call. Evaluates to #NAME?. */
  | { type: 'name'; name: string }
  | { type: 'ref'; ref: CellRef }
  | { type: 'range'; start: CellRef; end: CellRef }
  | { type: 'unary'; op: '-' | '+'; arg: Node }
  | { type: 'percent'; arg: Node }
  | { type: 'binary'; op: BinaryOp; left: Node; right: Node }
  | { type: 'call'; name: string; args: Node[] };

/**
 * Binding powers, weakest first. This is Excel's order:
 * comparisons, &, + -, * /, ^, %, unary minus. Two things differ from ordinary maths:
 * unary minus binds tighter than ^ (so =-2^2 is 4), and ^ runs left to right (so =2^3^2 is 64).
 */
const BINARY_BP: Record<string, number> = {
  '=': 10,
  '<>': 10,
  '<': 10,
  '>': 10,
  '<=': 10,
  '>=': 10,
  '&': 20,
  '+': 30,
  '-': 30,
  '*': 40,
  '/': 40,
  '^': 50,
};
const PERCENT_BP = 60;
const UNARY_BP = 70;

class Parser {
  private i = 0;

  constructor(
    private readonly toks: Token[],
    private readonly srcLen: number,
  ) {}

  parse(): Node {
    if (this.toks.length === 0) throw new FormulaSyntaxError('Add something after the = sign.', 0);
    const node = this.expr(0);
    const extra = this.peek();
    if (extra) {
      if (extra.type === 'rparen') {
        throw new FormulaSyntaxError('There is a closing bracket ) without an opening bracket.', extra.start);
      }
      if (extra.type === 'comma') {
        throw new FormulaSyntaxError('A comma , only belongs inside a function, like SUM(A1, B1).', extra.start);
      }
      if (extra.type === 'colon') {
        throw new FormulaSyntaxError('A range needs a cell on both sides of the colon, like B2:B6.', extra.start);
      }
      throw new FormulaSyntaxError(
        `Something is missing before "${extra.text}". Maybe an operator like + or *.`,
        extra.start,
      );
    }
    return node;
  }

  private peek(): Token | undefined {
    return this.toks[this.i];
  }

  private expr(minBp: number): Node {
    let left = this.prefix();
    for (;;) {
      const t = this.peek();
      if (!t || t.type !== 'op') break;
      if (t.text === '%') {
        if (PERCENT_BP < minBp) break;
        this.i++;
        left = { type: 'percent', arg: left };
        continue;
      }
      const bp = BINARY_BP[t.text];
      if (bp === undefined || bp < minBp) break;
      this.i++;
      const right = this.expr(bp + 1);
      left = { type: 'binary', op: t.text as BinaryOp, left, right };
    }
    return left;
  }

  private prefix(): Node {
    const t = this.peek();
    if (!t) {
      throw new FormulaSyntaxError('The formula stops too soon. Something is missing at the end.', this.srcLen);
    }
    this.i++;
    switch (t.type) {
      case 'num':
        return { type: 'num', value: Number(t.text) };
      case 'str':
        return { type: 'str', value: t.text.slice(1, -1).replace(/""/g, '"') };
      case 'err':
        return { type: 'err', code: t.text.toUpperCase() as ErrorCode };
      case 'ref': {
        const start = parseRef(t.text) as CellRef;
        const colon = this.peek();
        if (colon?.type !== 'colon') return { type: 'ref', ref: start };
        this.i++;
        const endTok = this.peek();
        if (endTok?.type !== 'ref') {
          throw new FormulaSyntaxError('A range needs a cell on both sides of the colon, like B2:B6.', colon.start);
        }
        this.i++;
        return { type: 'range', start, end: parseRef(endTok.text) as CellRef };
      }
      case 'ident': {
        const name = t.text.toUpperCase();
        if (this.peek()?.type === 'lparen') {
          this.i++;
          return { type: 'call', name, args: this.args(name) };
        }
        if (name === 'TRUE') return { type: 'bool', value: true };
        if (name === 'FALSE') return { type: 'bool', value: false };
        return { type: 'name', name };
      }
      case 'lparen': {
        const inner = this.expr(0);
        const close = this.peek();
        if (close?.type !== 'rparen') {
          throw new FormulaSyntaxError('A bracket ( is missing its closing bracket ).', close?.start ?? this.srcLen);
        }
        this.i++;
        return inner;
      }
      case 'op':
        if (t.text === '-' || t.text === '+') {
          return { type: 'unary', op: t.text, arg: this.expr(UNARY_BP) };
        }
        throw new FormulaSyntaxError(`"${t.text}" needs a value in front of it.`, t.start);
      case 'rparen':
        throw new FormulaSyntaxError('There is a closing bracket ) where a value should be.', t.start);
      case 'comma':
        throw new FormulaSyntaxError('There is a comma , where a value should be.', t.start);
      case 'colon':
        throw new FormulaSyntaxError('A range needs a cell on both sides of the colon, like B2:B6.', t.start);
    }
  }

  private args(name: string): Node[] {
    const out: Node[] = [];
    if (this.peek()?.type === 'rparen') {
      this.i++;
      return out;
    }
    for (;;) {
      const first = this.peek();
      if (first && (first.type === 'comma' || first.type === 'rparen')) {
        throw new FormulaSyntaxError(`${name}( ) has an empty spot next to a comma.`, first.start);
      }
      out.push(this.expr(0));
      const sep = this.peek();
      if (!sep) throw new FormulaSyntaxError(`${name}( is missing its closing bracket ).`, this.srcLen);
      this.i++;
      if (sep.type === 'comma') continue;
      if (sep.type === 'rparen') return out;
      throw new FormulaSyntaxError(`Something is missing before "${sep.text}" inside ${name}( ).`, sep.start);
    }
  }
}

/** Parses a formula body (the text after `=`). Throws FormulaSyntaxError with a learner-friendly message. */
export function parseBody(body: string): Node {
  return new Parser(tokenize(body), body.length).parse();
}

export function walk(node: Node, visit: (n: Node) => void): void {
  visit(node);
  switch (node.type) {
    case 'unary':
    case 'percent':
      walk(node.arg, visit);
      break;
    case 'binary':
      walk(node.left, visit);
      walk(node.right, visit);
      break;
    case 'call':
      for (const arg of node.args) walk(arg, visit);
      break;
    default:
      break;
  }
}

/** The rectangle a ref or range node covers, in normal order (B6:B2 becomes B2:B6). */
export function nodeRange(node: Extract<Node, { type: 'ref' | 'range' }>): RangeAddr {
  return node.type === 'ref' ? normalizeRange(node.ref, node.ref) : normalizeRange(node.start, node.end);
}

export interface PrintOptions {
  /** Keep `$` signs. Off by default: most comparisons don't care about them. */
  keepAbsolute?: boolean;
}

/**
 * Writes an AST back out as canonical text: upper case, no spaces, ranges in order,
 * brackets only where the structure needs them. Two formulas that differ only in
 * spelling come out identical.
 */
export function printNode(node: Node, opts: PrintOptions = {}): string {
  const ref = (r: CellRef) => refToString(opts.keepAbsolute ? r : { ...r, absCol: false, absRow: false });
  const bpOf = (n: Node): number => {
    if (n.type === 'binary') return BINARY_BP[n.op];
    if (n.type === 'percent') return PERCENT_BP;
    if (n.type === 'unary') return UNARY_BP;
    return 100;
  };
  const wrap = (child: Node, minBp: number): string => {
    const text = print(child);
    return bpOf(child) < minBp ? `(${text})` : text;
  };
  const print = (n: Node): string => {
    switch (n.type) {
      case 'num':
        return String(n.value);
      case 'str':
        return `"${n.value.replace(/"/g, '""')}"`;
      case 'bool':
        return n.value ? 'TRUE' : 'FALSE';
      case 'err':
        return n.code;
      case 'name':
        return n.name;
      case 'ref':
        return ref(n.ref);
      case 'range': {
        if (opts.keepAbsolute) return `${ref(n.start)}:${ref(n.end)}`;
        const r = nodeRange(n);
        return `${ref({ ...r.start, absCol: false, absRow: false })}:${ref({ ...r.end, absCol: false, absRow: false })}`;
      }
      case 'unary':
        return `${n.op}${wrap(n.arg, UNARY_BP)}`;
      case 'percent':
        return `${wrap(n.arg, PERCENT_BP)}%`;
      case 'binary': {
        const bp = BINARY_BP[n.op];
        return `${wrap(n.left, bp)}${n.op}${wrap(n.right, bp + 1)}`;
      }
      case 'call':
        return `${n.name}(${n.args.map(print).join(',')})`;
    }
  };
  return print(node);
}
