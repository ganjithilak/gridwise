/**
 * Anything a formula reads from the outside world. Injected, never read directly,
 * so the same sheet gives the same answer every day and in every test.
 */
export interface EngineContext {
  today: () => Date;
}

/** The date exercises see unless a real clock is injected. */
export const FIXED_TODAY = new Date(2026, 2, 16);

export const fixedContext: EngineContext = {
  today: () => FIXED_TODAY,
};
