import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { chineseDate } from './dates';

type Props = {
  dateKey: string;
  value: string;
  saved: boolean;
  isLoading: boolean;
  error: string;
  onChange(text: string): void;
  onBack(): void;
  onSubmit(): void;
};

export function WriteScreen({
  dateKey,
  value,
  saved,
  isLoading,
  error,
  onChange,
  onBack,
  onSubmit,
}: Props) {
  const canSubmit = value.trim().length >= 10 && !isLoading;

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="返回" onPress={onBack} style={styles.backHit}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>{chineseDate(dateKey)} · 明天</Text>
        <View style={styles.backHit} />
      </View>

      <TextInput
        accessibilityLabel="写下明天的日记"
        autoFocus
        multiline
        onChangeText={onChange}
        placeholder="把明天写成已经发生的样子。"
        placeholderTextColor="#D1D5DB"
        style={styles.input}
        textAlignVertical="top"
        value={value}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        <Text style={styles.saved}>{saved ? '已保存' : '保存中'}</Text>
        <Pressable disabled={!canSubmit} onPress={onSubmit}>
          {isLoading ? (
            <ActivityIndicator color="#3B82F6" size="small" />
          ) : (
            <Text style={[styles.submit, !canSubmit && styles.submitOff]}>写好了</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backHit: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: '#111827', fontSize: 32, lineHeight: 34, fontWeight: '300' },
  topTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 17,
    lineHeight: 30,
    padding: 0,
  },
  error: { color: '#DC2626', fontSize: 13, lineHeight: 20, marginTop: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 8,
  },
  saved: { color: '#9CA3AF', fontSize: 13 },
  submit: { color: '#3B82F6', fontSize: 16, fontWeight: '800' },
  submitOff: { opacity: 0.35 },
});
