import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { useWorld } from '@/world/store';

/** Games and practice live on the world's left. This link (the games' back buttons use it) opens the world there. */
export default function PracticeLink() {
  const go = useWorld((s) => s.go);
  useEffect(() => go(-1), [go]);
  return <Redirect href="/" />;
}
