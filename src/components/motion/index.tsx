import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../../constants/theme";
import { styles as screenStyles } from "../../styles/main.styles";

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => mounted && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduce;
}

export function useFloat(reduce: boolean, duration: number) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, reduce, duration]);

  return v;
}

export function useRing(reduce: boolean, duration: number, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, reduce, duration, delay]);

  return v;
}

export function Reveal({
  delay = 0,
  reduce,
  style,
  from = 16,
  scaleFrom = 1,
  children,
}: {
  delay?: number;
  reduce: boolean;
  style?: StyleProp<ViewStyle>;
  from?: number;
  scaleFrom?: number;
  children: React.ReactNode;
}) {
  const a = useRef(new Animated.Value(reduce ? 1 : 0)).current;

  useEffect(() => {
    if (reduce) {
      a.setValue(1);
      return;
    }
    const anim = Animated.timing(a, {
      toValue: 1,
      duration: 560,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [a, delay, reduce]);

  const transform: any[] = [
    {
      translateY: a.interpolate({
        inputRange: [0, 1],
        outputRange: [from, 0],
      }),
    },
  ];
  if (scaleFrom !== 1) {
    transform.push({
      scale: a.interpolate({
        inputRange: [0, 1],
        outputRange: [scaleFrom, 1],
      }),
    });
  }

  return (
    <Animated.View style={[style, { opacity: a, transform }]}>
      {children}
    </Animated.View>
  );
}

export function FloatingCard({
  reduce,
  delay,
  duration,
  amplitude = 4,
  style,
  children,
}: {
  reduce: boolean;
  delay: number;
  duration: number;
  amplitude?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const float = useFloat(reduce, duration);
  return (
    <Reveal
      reduce={reduce}
      delay={delay}
      from={20}
      scaleFrom={0.86}
      style={[screenStyles.cardAnchor, style]}
    >
      <Animated.View
        style={[
          screenStyles.card,
          {
            transform: [
              {
                translateY: float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -amplitude],
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Reveal>
  );
}

export function CallIcon({ reduce }: { reduce: boolean }) {
  const ring = useRing(reduce, 1800);
  return (
    <View style={screenStyles.cardIconWrap}>
      <Animated.View
        style={[
          screenStyles.callRing,
          {
            opacity: ring.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 0],
            }),
            transform: [
              {
                scale: ring.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.9],
                }),
              },
            ],
          },
        ]}
      />
      <View style={[screenStyles.cardIcon, screenStyles.cardIconSuccess]}>
        <Ionicons name="call" size={11} color={palette.success} />
      </View>
    </View>
  );
}

export function ShimmerSweep({
  reduce,
  radius = 16,
}: {
  reduce: boolean;
  radius?: number;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);

  useEffect(() => {
    if (reduce || !w) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2400),
        Animated.timing(x, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [x, reduce, w]);

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  return (
    <View
      pointerEvents="none"
      style={[styles.shimmerClip, { borderRadius: radius }]}
      onLayout={onLayout}
    >
      {!reduce && w > 0 && (
        <Animated.View
          style={[
            styles.shimmerBar,
            {
              transform: [
                {
                  translateX: x.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-90, w + 40],
                  }),
                },
                { skewX: "-20deg" },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.28)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerClip: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  shimmerBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 70,
  },
});
