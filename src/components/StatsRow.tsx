import { StyleSheet, Text, View } from 'react-native';

import { radius, space, useTheme } from '@/theme';

interface Props {
  /** Days in a row, as it stands today. */
  streak: number;
  /** True if nothing has been learned yet today, so the streak still needs today's lesson. */
  atRisk: boolean;
  xp: number;
  /** XP earned today, and the daily aim. */
  todayXp: number;
  goal: number;
}

/** Streak, total XP and today's goal: the three numbers the Learn screen leads with. */
export function StatsRow({ streak, atRisk, xp, todayXp, goal }: Props) {
  const c = useTheme();
  const done = todayXp >= goal;
  const share = Math.min(1, goal > 0 ? todayXp / goal : 0);

  return (
    <View style={styles.row} testID="stats">
      <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
        <View style={styles.valueRow}>
          {/* A small spark, drawn from two rotated squares: no image file, and it is not a flame. */}
          <View style={styles.spark}>
            <View style={[styles.sparkBit, { backgroundColor: streak > 0 ? c.spark : c.outline }]} />
            <View style={[styles.sparkBit, styles.sparkTurned, { backgroundColor: streak > 0 ? c.spark : c.outline }]} />
          </View>
          <Text testID="streak" style={[styles.value, { color: c.ink }]}>{streak}</Text>
        </View>
        <Text style={[styles.caption, { color: c.inkSoft }]}>{streak === 1 ? 'day in a row' : 'days in a row'}</Text>
        {atRisk ? <Text style={[styles.note, { color: c.hint }]}>One lesson keeps it</Text> : null}
      </View>

      <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
        <Text testID="xp-total" style={[styles.value, { color: c.ink }]}>{xp}</Text>
        <Text style={[styles.caption, { color: c.inkSoft }]}>XP in all</Text>
      </View>

      <View style={[styles.box, styles.wide, { backgroundColor: c.surface, borderColor: c.line }]}>
        <Text testID="xp-today" style={[styles.value, { color: done ? c.accent : c.ink }]}>
          {todayXp}
          <Text style={[styles.of, { color: c.inkSoft }]}> / {goal}</Text>
        </Text>
        <View style={[styles.track, { backgroundColor: c.sunken }]}>
          <View style={[styles.fill, { backgroundColor: done ? c.accent : c.spark, width: `${Math.round(share * 100)}%` }]} />
        </View>
        <Text style={[styles.caption, { color: c.inkSoft }]}>{done ? "Today's goal reached" : 'XP today'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  box: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 10, gap: 2 },
  wide: { flex: 1.4 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  of: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '600' },
  note: { fontSize: 11, fontWeight: '700' },
  spark: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  sparkBit: { position: 'absolute', width: 10, height: 10, borderRadius: 2 },
  sparkTurned: { transform: [{ rotate: '45deg' }] },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden', marginVertical: 3 },
  fill: { height: '100%', borderRadius: radius.pill },
});
