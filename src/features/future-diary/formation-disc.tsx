import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import type { PersonaNodes } from './types';

type NodeKey = keyof PersonaNodes;

const WIDTH = 360;
const HEIGHT = 276;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const OUTER_R = 102;

type Callout = {
  key: NodeKey;
  ringDeg: number;
  elbow: { dx: number; dy: number };
  horiz: number;
};

const CALLOUTS: Callout[] = [
  { key: 'mbti', ringDeg: -142, elbow: { dx: -20, dy: -18 }, horiz: -26 },
  { key: 'behavior', ringDeg: -38, elbow: { dx: 20, dy: -18 }, horiz: 26 },
  { key: 'gap', ringDeg: 142, elbow: { dx: -20, dy: 18 }, horiz: -26 },
  { key: 'support', ringDeg: 38, elbow: { dx: 20, dy: 18 }, horiz: 26 },
];

function xy(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  };
}

function dashPoints(from: { x: number; y: number }, to: { x: number; y: number }, step = 5) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const count = Math.max(2, Math.round(length / step));
  return Array.from({ length: count + 1 }, (_, index) => ({
    x: from.x + (dx * index) / count,
    y: from.y + (dy * index) / count,
  }));
}

function CalloutLine({
  callout,
  label,
}: {
  callout: Callout;
  label?: string;
}) {
  const [opacity] = useState(() => new Animated.Value(0));
  const visible = Boolean(label);
  const origin = xy(callout.ringDeg, OUTER_R);
  const elbow = { x: origin.x + callout.elbow.dx, y: origin.y + callout.elbow.dy };
  const labelDot = { x: elbow.x + callout.horiz, y: elbow.y };
  const leftSide = callout.horiz < 0;
  const dashes = [
    ...dashPoints(origin, elbow),
    ...dashPoints(elbow, labelDot).slice(1),
  ];

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 480 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, label, opacity]);

  return (
    <View pointerEvents="none">
      <View style={[styles.ringAnchor, { left: origin.x - 3, top: origin.y - 3 }]} />
      <Animated.View style={{ opacity }}>
        {dashes.map((point, index) => (
          <View key={index} style={[styles.dash, { left: point.x - 1, top: point.y - 1 }]} />
        ))}
        <View style={[styles.labelDot, { left: labelDot.x - 3, top: labelDot.y - 3 }]} />
        {visible ? (
          <Text
            numberOfLines={2}
            style={[
              styles.label,
              leftSide
                ? { right: WIDTH - labelDot.x + 8, top: labelDot.y - 9, textAlign: 'right' }
                : { left: labelDot.x + 8, top: labelDot.y - 9, textAlign: 'left' },
            ]}
          >
            {label}
          </Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

export function FormationDisc({ nodes }: { nodes: Partial<PersonaNodes> }) {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.55] });

  return (
    <View style={styles.radar} accessibilityLabel="未来人格正在形成">
      <Animated.View style={[styles.halo, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      <View style={[styles.ring, { width: 86, height: 86, left: CX - 43, top: CY - 43 }]} />
      <View style={[styles.ring, { width: 132, height: 132, left: CX - 66, top: CY - 66 }]} />
      <View style={[styles.ring, { width: 176, height: 176, left: CX - 88, top: CY - 88 }]} />
      <View style={[styles.ring, styles.outerRing]} />
      <View style={styles.core}>
        <Text style={styles.sparkMain}>✦</Text>
        <Text style={styles.sparkA}>✦</Text>
        <Text style={styles.sparkB}>✦</Text>
      </View>
      {CALLOUTS.map((callout) => (
        <CalloutLine key={callout.key} callout={callout} label={nodes[callout.key]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  radar: {
    width: WIDTH,
    height: HEIGHT,
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  halo: {
    position: 'absolute',
    left: CX - 40,
    top: CY - 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#BFDBFE',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 999,
  },
  outerRing: {
    width: OUTER_R * 2,
    height: OUTER_R * 2,
    left: CX - OUTER_R,
    top: CY - OUTER_R,
    borderColor: '#93C5FD',
  },
  core: {
    position: 'absolute',
    left: CX - 26,
    top: CY - 26,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkMain: { color: '#FFFFFF', fontSize: 16, textShadowColor: '#A78BFA', textShadowRadius: 6 },
  sparkA: { position: 'absolute', left: 8, top: 10, color: '#C4B5FD', fontSize: 8 },
  sparkB: { position: 'absolute', right: 8, bottom: 10, color: '#93C5FD', fontSize: 8 },
  ringAnchor: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#93C5FD',
  },
  dash: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#94A3B8',
  },
  labelDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  label: {
    position: 'absolute',
    maxWidth: 108,
    color: '#1E293B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
