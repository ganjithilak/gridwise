import { useEffect, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { now } from '@/lib/clock';

interface Props {
  /** When counting started (or will end, for a countdown). Null shows the `idle` text. */
  from: number | null;
  /** Up from `from`, or down to it. */
  mode: 'up' | 'down';
  format: (ms: number) => string;
  idle?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

/**
 * A number that changes ten times a second: a clock or a countdown. It redraws only
 * itself, so a game board beside it is not redrawn ten times a second as well, which
 * a phone notices.
 */
export function Ticker({ from, mode, format, idle = '', style, testID }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (from === null) return;
    const timer = setInterval(() => setTick((n) => n + 1), 100);
    return () => clearInterval(timer);
  }, [from]);
  const ms = from === null ? null : mode === 'up' ? now() - from : Math.max(0, from - now());
  return (
    <Text style={style} testID={testID}>
      {ms === null ? idle : format(ms)}
    </Text>
  );
}
