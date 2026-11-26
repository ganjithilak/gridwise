import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export type TabIconName = 'games' | 'farm' | 'roots' | 'profile';

/** Small line icons for the world's four places, drawn to sit with the gold interface. */
export function TabIcon({ name, colour, size = 24 }: { name: TabIconName; colour: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G stroke={colour} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {name === 'games' ? (
          <>
            <Path d="M7,8 h10 a4,4 0 0 1 4,4 v1 a3.5,3.5 0 0 1 -6.2,2.2 L14,14 h-4 l-0.8,1.2 A3.5,3.5 0 0 1 3,13 v-1 a4,4 0 0 1 4,-4 z" />
            <Path d="M7.5,10.5 v3 M6,12 h3" />
            <Circle cx={15.5} cy={11.2} r={0.6} fill={colour} />
            <Circle cx={17.3} cy={13} r={0.6} fill={colour} />
          </>
        ) : null}
        {name === 'farm' ? (
          <>
            <Path d="M3.5,10 L12,4 L20.5,10 V20 H3.5 Z" />
            <Rect x={9} y={13} width={6} height={7} />
            <Path d="M9,13 l6,7 M15,13 l-6,7" />
            <Path d="M10,8.5 h4" />
          </>
        ) : null}
        {name === 'roots' ? (
          <>
            <Path d="M12,11 C12,7 9,5 6,5 C6,8 8,10.5 12,11 Z" />
            <Path d="M12,11 C12,7.5 14.5,5.5 18,6 C17.5,9 15.5,11 12,11 Z" />
            <Path d="M3,13 H21" />
            <Path d="M12,11 V21 M12,15 C10,16 8,16 7,18 M12,16 C14,17 16,17 17,19 M12,18.5 l-2,2" />
          </>
        ) : null}
        {name === 'profile' ? (
          <>
            <Circle cx={12} cy={8.5} r={3.8} />
            <Path d="M4.5,20.5 c0.8,-4 4,-6 7.5,-6 s6.7,2 7.5,6" />
          </>
        ) : null}
      </G>
    </Svg>
  );
}
