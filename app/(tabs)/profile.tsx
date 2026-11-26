import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { useWorld } from '@/world/store';

/** Profile lives on the world's right. This link opens the world there. */
export default function ProfileLink() {
  const go = useWorld((s) => s.go);
  useEffect(() => go(1), [go]);
  return <Redirect href="/" />;
}
