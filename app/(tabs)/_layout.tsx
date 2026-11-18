import { Slot, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Plant } from '@/components/Plant';
import { dayKey } from '@/lib/clock';
import { dueSkills } from '@/progress/srs';
import { useProgress } from '@/progress/store';
import { radius, space, useTheme } from '@/theme';

const TABS = [
  { path: '/', label: 'Learn', side: 'Home' },
  { path: '/practice', label: 'Practice', side: 'Practice' },
  { path: '/profile', label: 'Profile', side: 'Profile' },
] as const;

/** A screen at least this wide, and wider than it is tall, gets the menu down its left side. */
const SIDE_MENU_FROM = 640;

/**
 * Learn, Practice and Profile. On a phone held upright there is a plain bar along the
 * bottom to move between them. On its side, or on a computer, the same three sit in a
 * menu down the left, under the app's name.
 */
export default function TabsLayout() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  const skills = useProgress((s) => s.skills);
  // A small dot on Practice when something is waiting there.
  const waiting = dueSkills(skills, dayKey()).length > 0;
  const sideMenu = width > height && width >= SIDE_MENU_FROM;
  const go = (path: (typeof TABS)[number]['path'], active: boolean) => {
    if (!active) router.replace(path);
  };

  if (sideMenu) {
    // Short screens (a phone on its side) drop the picture and the motto to fit the three links.
    const roomy = height >= 520;
    return (
      <View style={[styles.screen, styles.sideways, { backgroundColor: c.bg }]}>
        <View
          accessibilityRole="tablist"
          style={[
            styles.side,
            { backgroundColor: c.sunken, borderColor: c.line, paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md, paddingLeft: insets.left + space.md },
          ]}
        >
          <View style={styles.brand}>
            {roomy ? <Plant only="roots" size={64} /> : null}
            <Text style={[styles.name, { color: c.ink }]}>Gridwise</Text>
            <Text style={[styles.motto, { color: c.inkSoft }]}>LEARN · PRACTICE · MASTER</Text>
          </View>
          {TABS.map((tab) => {
            const active = pathname === tab.path;
            return (
              <Pressable
                key={tab.path}
                testID={`tab-${tab.label.toLowerCase()}`}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: active }}
                aria-selected={active}
                onPress={() => go(tab.path, active)}
                style={[styles.link, { backgroundColor: active ? c.accentSoft : 'transparent', borderColor: active ? c.accent : 'transparent' }]}
              >
                <Text style={[styles.linkText, { color: active ? c.ink : c.inkSoft, fontWeight: active ? '800' : '600' }]}>{tab.side}</Text>
                {tab.path === '/practice' && waiting ? <View testID="practice-dot" style={[styles.dot, { backgroundColor: c.spark }]} /> : null}
              </Pressable>
            );
          })}
          {roomy ? <Text style={[styles.motto, styles.foot, { color: c.inkFaint }]}>BUILD SKILLS.{'\n'}GROW POTENTIAL.</Text> : null}
        </View>
        <View style={styles.page}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.page}>
        <Slot />
      </View>
      <View
        accessibilityRole="tablist"
        style={[styles.bar, { backgroundColor: c.surface, borderColor: c.line, paddingBottom: Math.max(insets.bottom, 6) }]}
      >
        {TABS.map((tab) => {
          const active = pathname === tab.path;
          return (
            <Pressable
              key={tab.path}
              testID={`tab-${tab.label.toLowerCase()}`}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              aria-selected={active}
              onPress={() => go(tab.path, active)}
              style={styles.tab}
            >
              <View style={[styles.mark, { backgroundColor: active ? c.accent : 'transparent' }]} />
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: active ? c.accent : c.inkSoft, fontWeight: active ? '800' : '600' }]}>{tab.label}</Text>
                {tab.path === '/practice' && waiting ? <View testID="practice-dot" style={[styles.dot, { backgroundColor: c.spark }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  sideways: { flexDirection: 'row' },
  page: { flex: 1 },
  side: { width: 196, borderRightWidth: 1, paddingRight: space.md, gap: 6 },
  brand: { alignItems: 'center', gap: 2, paddingBottom: space.md },
  name: { fontSize: 26, fontWeight: '800', fontStyle: 'italic' },
  motto: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textAlign: 'center' },
  foot: { marginTop: 'auto', lineHeight: 16 },
  link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: 1, userSelect: 'none' },
  linkText: { fontSize: 15 },
  bar: { flexDirection: 'row', borderTopWidth: 1 },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4, userSelect: 'none' },
  mark: { position: 'absolute', top: 0, width: 36, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontSize: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
