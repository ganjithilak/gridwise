export type ErrorCode =
  | '#DIV/0!'
  | '#REF!'
  | '#NAME?'
  | '#VALUE!'
  | '#N/A'
  | '#NUM!'
  | '#ERROR!';

export const ERROR_CODES: readonly ErrorCode[] = [
  '#DIV/0!',
  '#REF!',
  '#NAME?',
  '#VALUE!',
  '#N/A',
  '#NUM!',
  '#ERROR!',
];

/** Errors are ordinary values that flow through formulas, as they do in Excel. */
export interface CellError {
  readonly kind: 'error';
  readonly code: ErrorCode;
  /** Plain-English reason, shown to the learner. */
  readonly hint?: string;
}

/** What one cell holds once evaluated. `null` means empty. */
export type Scalar = number | string | boolean | null | CellError;

export const err = (code: ErrorCode, hint?: string): CellError => ({ kind: 'error', code, hint });

export const isError = (v: unknown): v is CellError =>
  typeof v === 'object' && v !== null && (v as CellError).kind === 'error';

const GENERIC_HINTS: Record<ErrorCode, string> = {
  '#DIV/0!': 'Something is being divided by zero or by an empty cell.',
  '#REF!': "The formula points at a cell that doesn't exist.",
  '#NAME?': "There's a name in this formula that isn't recognised. Check the spelling.",
  '#VALUE!': 'The formula got the wrong kind of value, like text where a number was needed.',
  '#N/A': "The lookup couldn't find what it was looking for.",
  '#NUM!': 'The result is not a valid number.',
  '#ERROR!': "This formula can't be read. Check the brackets and commas.",
};

/** The most specific explanation available for an error value. */
export const explainError = (e: CellError): string => e.hint ?? GENERIC_HINTS[e.code];

/** Thrown when formula text can't be parsed. `pos` is an index into the formula body. */
export class FormulaSyntaxError extends Error {
  readonly pos: number;

  constructor(message: string, pos: number) {
    super(message);
    this.name = 'FormulaSyntaxError';
    this.pos = pos;
    Object.setPrototypeOf(this, FormulaSyntaxError.prototype);
  }
}
