import { StyleSheet, Text, View } from 'react-native';

import { levelFor } from '@/progress/level';
import { radius, space, useTheme } from '@/theme';

interface Props {
  /** What the learner is called. Empty if they have not said. */
  name: string;
  xp: number;
}

/**
 * Who is learning and how far along they are: a level in a ring, their name, and a bar
 * of XP towards the next level. It heads the Learn screen.
 */
export function LevelBar({ name, xp }: Props) {
  const c = useTheme();
  const { level, into, needed } = levelFor(xp);
  return (
    <View style={styles.row} testID="level-bar" accessibilityLabel={`Level ${level}. ${into} of ${needed} XP to the next level.`}>
      <View style={[styles.ring, { borderColor: c.accent, backgroundColor: c.surface }]}>
        <Text style={[styles.level, { color: c.ink }]}>Lv. {level}</Text>
      </View>
      <View style={styles.words}>
        <Text style={[styles.name, { color: c.ink }]} numberOfLines={1}>
          {name || 'Gridwise'}
        </Text>
        <Text style={[styles.role, { color: c.inkSoft }]}>Excel learner</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.track, { backgroundColor: c.sunken, borderColor: c.line }]}>
          <View style={[styles.fill, { backgroundColor: c.accent, width: `${Math.round((into / needed) * 100)}%` }]} />
        </View>
        <Text style={[styles.count, { color: c.inkSoft }]} testID="level-xp">
          {into} / {needed} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  ring: { width: 46, height: 46, borderRadius: 23, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  level: { fontSize: 12, fontWeight: '800' },
  words: { flexShrink: 1, gap: 1 },
  name: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  role: { fontSize: 12, fontWeight: '600' },
  bar: { flex: 1, minWidth: 90, gap: 3 },
  track: { height: 10, borderRadius: radius.pill, borderWidth: 1, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  count: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
});
