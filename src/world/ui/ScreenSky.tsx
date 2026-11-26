import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
  Circle,
} from "react-native-svg";

import { useTheme } from "@/theme";

import { SkyDome } from "../env/SkyDome";
import { usePrefs } from "../prefs";

interface Props {
  /**
   * `open`: the dome fills the upper screen (welcome, results, Games, Profile).
   * `quiet`: a faint band of grid at the very top only, so working screens stay clean.
   */
  variant?: "open" | "quiet";
}

/**
 * Gridwise's signature: every screen sits under the same spreadsheet-shaped sky as the
 * world. A dusk sky (the app palette's own colours) with the dome grid curving overhead,
 * adapted per screen. Purely decorative and drawn once; it never takes touches.
 *
 * Only on the Refined theme: Classic Farm keeps its plain screens.
 */
export function ScreenSky({ variant = "open" }: Props) {
  const c = useTheme();
  const theme = usePrefs((s) => s.theme);
  const [size, setSize] = useState({ w: 0, h: 0 });
  if (theme === "classic") return null;
  const light = c.bg.toUpperCase() === "#F6F4EF";
  const top = light ? "#D7E6F3" : "#1F3D5A";
  const quiet = variant === "quiet";
  const { w, h } = size;
  // The horizon sits lower for open screens; quiet ones only show the top of the dome.
  const horizon = quiet ? h * 0.22 : h * 0.62;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) =>
        setSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Defs>
            <LinearGradient id={`ss-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={top} />
              <Stop offset={quiet ? "0.3" : "0.7"} stopColor={c.bg} />
              <Stop offset="1" stopColor={c.bg} />
            </LinearGradient>
            <RadialGradient id={`ss-glow-${variant}`} cx="50%" cy="50%" r="50%">
              <Stop
                offset="0"
                stopColor="#F2C14E"
                stopOpacity={light ? 0.18 : 0.12}
              />
              <Stop offset="1" stopColor="#F2C14E" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={w} height={h} fill={`url(#ss-${variant})`} />
          {!quiet ? (
            <Circle
              cx={w * 0.5}
              cy={horizon}
              r={Math.max(w, h) * 0.5}
              fill={`url(#ss-glow-${variant})`}
            />
          ) : null}
          <SkyDome
            id={`ss-dome-${variant}`}
            width={w}
            horizon={horizon}
            zenith={quiet ? -h * 0.35 : -h * 0.2}
            labelsAt={quiet ? h * 0.06 : h * 0.16}
            strength={light ? 0.4 : quiet ? 0.4 : 0.5}
            tint={light ? "#5B7FA6" : "#FFFFFF"}
            labels={false}
          />
        </Svg>
      ) : null}
    </View>
  );
}
