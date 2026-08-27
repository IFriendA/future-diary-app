import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import type { PersonaNodes } from './types';

type NodeKey = keyof PersonaNodes;

const NODE_LAYOUT: {
  key: NodeKey;
  deg: number;
  style: 'tl' | 'tr' | 'bl' | 'br';
}[] = [
  { key: 'mbti', deg: -135, style: 'tl' },
  { key: 'behavior', deg: -45, style: 'tr' },
  { key: 'gap', deg: 135, style: 'bl' },
  { key: 'support', deg: 45, style: 'br' },
];

function Connector({ deg, active }: { deg: number; active: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.connector, { transform: [{ rotate: `${deg}deg` }] }, active && styles.connectorOn]}
    >
      {Array.from({ length: 9 }).map((_, index) => (
        <View key={index} style={[styles.connectorDot, active && styles.connectorDotOn]} />
      ))}
    </View>
  );
}

function RadarNode({ label, align }: { label?: string; align: 'tl' | 'tr' | 'bl' | 'br' }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.86)).current;
  const visible = Boolean(label);

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.86);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 520, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [visible, label, opacity, scale]);

  return (
    <View style={[styles.nodeWrap, styles[align]]}>
      {visible ? (
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <View style={styles.nodeChip}>
            <View style={styles.nodePip} />
            <Text style={styles.nodeLabel}>{label}</Text>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.nodeIdle} />
      )}
    </View>
  );
}

export function FormationDisc({ nodes }: { nodes: Partial<PersonaNodes> }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true }),
    );
    pulseLoop.start();
    spinLoop.start();
    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.55] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.radar} accessibilityLabel="未来人格正在形成">
      <Animated.View style={[styles.halo, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      <View style={[styles.ring, styles.ringOuter]} />
      <View style={[styles.ring, styles.ringMid]} />
      <View style={[styles.ring, styles.ringInner]} />
      <Animated.View style={[styles.spinRing, { transform: [{ rotate }] }]} />
      {NODE_LAYOUT.map((item) => (
        <Connector key={item.key} deg={item.deg} active={Boolean(nodes[item.key])} />
      ))}
      <View style={styles.core}>
        <View style={styles.coreInner}>
          <Text style={styles.sparkMain}>✦</Text>
          <Text style={styles.sparkLeft}>✦</Text>
          <Text style={styles.sparkRight}>✦</Text>
        </View>
      </View>
      {NODE_LAYOUT.map((item) => (
        <RadarNode key={item.key} align={item.style} label={nodes[item.key]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  radar: {
    height: 300,
    marginTop: 4,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#C4B5FD',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
  },
  ringOuter: { width: 236, height: 236, borderColor: '#DBEAFE' },
  ringMid: { width: 168, height: 168, borderColor: '#BFDBFE' },
  ringInner: { width: 98, height: 98, backgroundColor: 'rgba(239, 246, 255, 0.7)' },
  spinRing: {
    position: 'absolute',
    width: 204,
    height: 204,
    borderRadius: 102,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  connector: {
    position: 'absolute',
    width: 86,
    left: '50%',
    top: '50%',
    marginTop: -2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    transformOrigin: 'left center',
    opacity: 0.4,
  },
  connectorOn: { opacity: 1 },
  connectorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BFDBFE',
  },
  connectorDotOn: { backgroundColor: '#60A5FA' },
  core: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#818CF8',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  coreInner: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sparkMain: { color: '#8B5CF6', fontSize: 18 },
  sparkLeft: { position: 'absolute', left: 2, top: 8, color: '#A78BFA', fontSize: 9 },
  sparkRight: { position: 'absolute', right: 2, bottom: 8, color: '#60A5FA', fontSize: 9 },
  nodeWrap: { position: 'absolute', maxWidth: 118 },
  tl: { top: 10, left: 0, alignItems: 'flex-start' },
  tr: { top: 10, right: 0, alignItems: 'flex-end' },
  bl: { bottom: 18, left: 0, alignItems: 'flex-start' },
  br: { bottom: 18, right: 0, alignItems: 'flex-end' },
  nodeIdle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DBEAFE',
  },
  nodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#93C5FD',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  nodePip: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' },
  nodeLabel: { color: '#1E293B', fontSize: 13, fontWeight: '700' },
});
