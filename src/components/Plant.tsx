import { View } from 'react-native';

import { STAGES, type Stage } from '@/lessons/types';
import { useTheme } from '@/theme';

interface Props {
  /**
   * How far the plant has grown: the stages reached so far are in colour, the rest are a
   * grey outline of what is still to come. 0 is bare ground; 4 is a plant in fruit.
   */
  grown?: number;
  /** Shows one stage in colour and the rest in grey, to mark which part a unit belongs to. */
  only?: Stage;
  /** The fruit is ripe: the last stage is finished. */
  ripe?: boolean;
  size?: number;
}

/** Soil brown and leaf green: the two colours here that are not the app's own. */
const BROWN = '#9A6B3F';
const GREEN = '#2F9E6E';

const NAMES: Record<Stage, string> = { roots: 'roots', trunk: 'trunk', branches: 'branches', fruit: 'fruit' };

/**
 * The course as a plant: roots under the ground, a trunk, branches in leaf, and fruit.
 * Drawn from plain shapes, like Cell, so there is no artwork to load and it is sharp at
 * any size.
 */
export function Plant({ grown = 0, only, ripe = false, size = 72 }: Props) {
  const c = useTheme();
  const u = size / 72;
  const lit = (stage: Stage): boolean => (only ? only === stage : STAGES.indexOf(stage) < grown);
  // What is still to come is a faint outline of itself, so the part in colour is what the eye lands on.
  const grey = c.line;

  /** A shape placed by its centre, so the drawing reads as coordinates. */
  const part = (key: string, cx: number, cy: number, w: number, h: number, colour: string, extra: object = {}) => (
    <View
      key={key}
      style={{
        position: 'absolute',
        left: (cx - w / 2) * u,
        top: (cy - h / 2) * u,
        width: w * u,
        height: h * u,
        borderRadius: (Math.min(w, h) / 2) * u,
        backgroundColor: colour,
        ...extra,
      }}
    />
  );

  const roots = lit('roots') ? BROWN : grey;
  const trunk = lit('trunk') ? BROWN : grey;
  const leaves = lit('branches') ? GREEN : grey;
  const fruitOn = lit('fruit');
  // Fruit only appears once the plant has got that far: empty rings on the leaves read as eyes.
  const fruit = (key: string, cx: number, cy: number) =>
    fruitOn ? part(key, cx, cy, 10, 10, ripe || only ? c.spark : c.sparkSoft, { borderWidth: 1.5 * u, borderColor: c.spark }) : null;

  const described = only
    ? `The ${NAMES[only]} of the plant`
    : grown <= 0
      ? 'A plant still to grow'
      : `A plant grown as far as its ${NAMES[STAGES[Math.min(grown, STAGES.length) - 1]]}`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={described} style={{ width: size, height: (80 / 72) * size }}>
      {/* Under the ground. */}
      {part('root-l', 29, 63, 4, 17, roots, { transform: [{ rotate: '38deg' }] })}
      {part('root-m', 36, 65, 4, 19, roots)}
      {part('root-r', 43, 63, 4, 17, roots, { transform: [{ rotate: '-38deg' }] })}
      {/* The ground itself. */}
      {part('soil', 36, 54.5, 62, 2.5, c.outline)}
      {/* Above it. */}
      {part('trunk', 36, 40, 8, 30, trunk)}
      {part('branch-l', 27, 26, 5, 20, lit('branches') ? BROWN : grey, { transform: [{ rotate: '-42deg' }] })}
      {part('branch-r', 45, 26, 5, 20, lit('branches') ? BROWN : grey, { transform: [{ rotate: '42deg' }] })}
      {part('leaf-l', 20, 17, 22, 22, leaves)}
      {part('leaf-r', 52, 17, 22, 22, leaves)}
      {part('leaf-m', 36, 11, 24, 24, leaves)}
      {fruit('fruit-l', 19, 21)}
      {fruit('fruit-m', 38, 8)}
      {fruit('fruit-r', 53, 20)}
    </View>
  );
}
