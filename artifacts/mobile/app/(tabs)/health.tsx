import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useMemo, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { SUPPLEMENTS } from '@/data/supplements';
import { useColors } from '@/hooks/useColors';

const MOOD_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Rough', color: '#FF4757' },
  2: { label: 'Meh', color: '#F59E0B' },
  3: { label: 'Okay', color: '#4895EF' },
  4: { label: 'Good', color: '#10B981' },
  5: { label: 'Great', color: '#7C3AED' },
};
const MOOD_EMOJIS = ['😔', '😕', '😐', '🙂', '😄'];

function ScalePressable({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 30, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start()}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function HealthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, takeSupplement, addWater, removeWater, setWeight, setHeight, addMood } = useApp();

  const [tab, setTab] = useState<'supps' | 'hydration' | 'bmi' | 'mood'>('supps');
  const [suppDetail, setSuppDetail] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState(data.weight ? String(data.weight) : '');
  const [heightInput, setHeightInput] = useState(data.height ? String(data.height) : '');
  const [moodModal, setMoodModal] = useState(false);
  const [moodRating, setMoodRating] = useState(3);
  const [moodNote, setMoodNote] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const today = new Date().toISOString().split('T')[0];
  const suppTaken = data.suppDate === today ? data.suppTaken : {};
  const hydrationToday = data.hydration.date === today ? data.hydration.count : 0;
  const takenCount = SUPPLEMENTS.filter((s) => suppTaken[s.id]).length;
  const streak = data.suppStreak ?? 0;

  const bmi = useMemo(() => {
    if (!data.weight || !data.height) return null;
    const h = data.height / 100;
    return data.weight / (h * h);
  }, [data.weight, data.height]);

  const bmiLabel = bmi
    ? bmi < 18.5 ? { label: 'Underweight', color: colors.blue }
    : bmi < 25 ? { label: 'Healthy', color: colors.primary }
    : bmi < 30 ? { label: 'Overweight', color: colors.gold }
    : { label: 'Obese', color: colors.red }
    : null;

  const todayMood = data.moods.find((m) => m.date === today);
  const recentMoods = data.moods.slice(0, 14);
  const moodTrend = useMemo(() => {
    const last7 = data.moods.slice(0, 7);
    if (last7.length === 0) return null;
    return (last7.reduce((a, m) => a + m.rating, 0) / last7.length).toFixed(1);
  }, [data.moods]);

  const activeSuppDetail = suppDetail ? SUPPLEMENTS.find((s) => s.id === suppDetail) : null;

  const TABS = [
    { id: 'supps' as const, label: 'Supps' },
    { id: 'hydration' as const, label: 'Water' },
    { id: 'bmi' as const, label: 'BMI' },
    { id: 'mood' as const, label: 'Mood' },
  ];

  const kavSheet = [s.sheet, { backgroundColor: colors.surface, borderColor: colors.border2 }];
  const sheetContent = { padding: 22, paddingBottom: Math.max(botPad, 20) + 24 };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={[s.header, { paddingTop: topPad + 8, backgroundColor: colors.navBg, borderBottomColor: colors.border }]}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Health</Text>
          <View style={[s.tabs, { backgroundColor: colors.input, borderColor: colors.border }]}>
            {TABS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={({ pressed }) => [
                  s.tabItem,
                  tab === t.id && [s.tabItemActive, { backgroundColor: colors.card }],
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[s.tabText, { color: tab === t.id ? colors.primary : colors.muted }]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Use KeyboardAwareScrollView for inline inputs (BMI tab) */}
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: botPad + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Supplements ── */}
          {tab === 'supps' && (
            <>
              <View style={s.statsRow}>
                {[
                  { label: 'Today', value: `${takenCount}/${SUPPLEMENTS.length}`, color: colors.primary },
                  { label: 'Streak', value: `${streak}d`, color: colors.purple },
                ].map((stat) => (
                  <View key={stat.label} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.statVal, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={[s.statLabel, { color: colors.muted }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {(['morning', 'evening'] as const).map((timing) => {
                const timingSupps = SUPPLEMENTS.filter((s) => s.timing === timing);
                return (
                  <View key={timing} style={s.timingSection}>
                    <Text style={[s.timingTitle, { color: colors.muted }]}>
                      {timing === 'morning' ? '☀️ Morning' : '🌙 Evening'}
                    </Text>
                    {timingSupps.map((supp) => {
                      const taken = !!suppTaken[supp.id];
                      const prioColor = supp.priority === 'high' ? colors.primary : supp.priority === 'medium' ? colors.gold : colors.muted;
                      return (
                        <ScalePressable
                          key={supp.id}
                          onPress={() => {
                            takeSupplement(supp.id);
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          style={[
                            s.suppRow,
                            {
                              backgroundColor: taken ? colors.primaryDim : colors.card,
                              borderColor: taken ? colors.primary + '50' : colors.border,
                            },
                          ]}
                        >
                          <View style={[s.suppCheck, {
                            backgroundColor: taken ? colors.primary : 'transparent',
                            borderColor: taken ? colors.primary : colors.border2,
                          }]}>
                            {taken && <Feather name="check" size={11} color={colors.primaryForeground} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[s.suppName, { color: colors.text }]}>{supp.name}</Text>
                              <View style={[s.prioBadge, { backgroundColor: prioColor + '20' }]}>
                                <Text style={[s.prioText, { color: prioColor }]}>{supp.priority}</Text>
                              </View>
                            </View>
                            <Text style={[s.suppDose, { color: colors.muted }]}>{supp.dose} · {supp.store}</Text>
                          </View>
                          <Pressable onPress={() => setSuppDetail(supp.id)} hitSlop={8}>
                            <Feather name="info" size={14} color={colors.muted} />
                          </Pressable>
                        </ScalePressable>
                      );
                    })}
                  </View>
                );
              })}
            </>
          )}

          {/* ── Hydration ── */}
          {tab === 'hydration' && (
            <View style={s.centeredTab}>
              <Text style={[s.bigNum, { color: colors.primary }]}>{hydrationToday}</Text>
              <Text style={[s.bigLabel, { color: colors.text }]}>glasses today</Text>
              <Text style={[s.bigSub, { color: colors.muted }]}>Goal: 8 · {(hydrationToday * 250) / 1000}L drunk</Text>
              <View style={s.cupsGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <ScalePressable
                    key={i}
                    onPress={() => {
                      if (i < hydrationToday) removeWater();
                      else { addWater(); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
                    }}
                    style={[
                      s.cup,
                      {
                        backgroundColor: i < hydrationToday ? colors.primary : colors.input,
                        borderColor: i < hydrationToday ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Feather name="droplet" size={18} color={i < hydrationToday ? colors.primaryForeground : colors.muted} />
                  </ScalePressable>
                ))}
              </View>
              <View style={s.waterBtns}>
                <ScalePressable
                  onPress={() => { removeWater(); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[s.waterBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Feather name="minus" size={22} color={colors.muted} />
                </ScalePressable>
                <ScalePressable
                  onPress={() => { addWater(); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                  style={[s.waterBtn, s.waterBtnMain, { backgroundColor: colors.primary }]}
                >
                  <Feather name="plus" size={26} color={colors.primaryForeground} />
                </ScalePressable>
                <View style={{ width: 72 }} />
              </View>
            </View>
          )}

          {/* ── BMI ── */}
          {tab === 'bmi' && (
            <View>
              {bmi && bmiLabel && (
                <View style={[s.bmiResult, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.bmiNum, { color: bmiLabel.color }]}>{bmi.toFixed(1)}</Text>
                  <Text style={[s.bmiStatus, { color: bmiLabel.color }]}>{bmiLabel.label}</Text>
                  <Text style={[s.bmiSub, { color: colors.muted }]}>{data.weight}kg · {data.height}cm</Text>
                </View>
              )}
              <View style={[s.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.fieldLabel, { color: colors.muted }]}>Weight (kg)</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  placeholder="70"
                  placeholderTextColor={colors.muted}
                  returnKeyType="next"
                  onBlur={() => setWeight(weightInput ? parseFloat(weightInput) : null)}
                />
                <Text style={[s.fieldLabel, { color: colors.muted }]}>Height (cm)</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                  value={heightInput}
                  onChangeText={setHeightInput}
                  keyboardType="decimal-pad"
                  placeholder="175"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  onBlur={() => setHeight(heightInput ? parseFloat(heightInput) : null)}
                />
                <Text style={[s.bmiScale, { color: colors.muted }]}>
                  {'< 18.5 Underweight · 18.5–25 Healthy · 25–30 Overweight · > 30 Obese'}
                </Text>
              </View>
            </View>
          )}

          {/* ── Mood ── */}
          {tab === 'mood' && (
            <View>
              {moodTrend && (
                <View style={[s.moodTrendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.moodTrendNum, { color: colors.purple }]}>{moodTrend}</Text>
                  <Text style={[s.moodTrendLabel, { color: colors.text }]}>7-day average</Text>
                </View>
              )}
              <ScalePressable onPress={() => setMoodModal(true)} style={[s.logMoodBtn, { backgroundColor: colors.purple }]}>
                <Text style={s.logMoodBtnText}>
                  {todayMood
                    ? `Today: ${MOOD_EMOJIS[todayMood.rating - 1]} ${MOOD_LABELS[todayMood.rating].label} · Update`
                    : "Log today's mood"}
                </Text>
              </ScalePressable>
              {recentMoods.length > 0 && (
                <View style={[s.moodHistory, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.moodHistTitle, { color: colors.text }]}>Recent moods</Text>
                  {recentMoods.map((m) => {
                    const info = MOOD_LABELS[m.rating];
                    return (
                      <View key={m.date} style={[s.moodRow, { borderBottomColor: colors.border }]}>
                        <Text style={{ fontSize: 20 }}>{MOOD_EMOJIS[m.rating - 1]}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.moodDate, { color: colors.muted }]}>
                            {new Date(m.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </Text>
                          {m.note ? <Text style={[s.moodNote, { color: colors.text2 }]} numberOfLines={1}>{m.note}</Text> : null}
                        </View>
                        <Text style={[s.moodLabel, { color: info?.color ?? colors.primary }]}>{info?.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── Supplement Detail Modal ── */}
      <Modal visible={!!suppDetail} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kavWrap}>
          <Pressable style={s.kavOverlay} onPress={() => setSuppDetail(null)} />
          <ScrollView
            style={kavSheet}
            contentContainerStyle={sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {activeSuppDetail && (
              <>
                <Text style={[s.sheetTitle, { color: colors.text }]}>{activeSuppDetail.name}</Text>
                <Text style={[s.sheetSub, { color: colors.primary }]}>{activeSuppDetail.dose}</Text>
                <Text style={[s.detailSection, { color: colors.text }]}>Why take it?</Text>
                <Text style={[s.detailText, { color: colors.muted }]}>{activeSuppDetail.why}</Text>
                <Text style={[s.detailSection, { color: colors.text }]}>Tip</Text>
                <Text style={[s.detailText, { color: colors.muted }]}>{activeSuppDetail.tip}</Text>
                <Text style={[s.detailSection, { color: colors.text }]}>Where to buy</Text>
                <Text style={[s.detailText, { color: colors.muted }]}>{activeSuppDetail.store} · {activeSuppDetail.price}</Text>
                <Pressable onPress={() => setSuppDetail(null)} style={[s.saveBtn, { backgroundColor: colors.primary, marginTop: 20 }]}>
                  <Text style={[s.saveBtnText, { color: colors.primaryForeground }]}>Close</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Mood Modal ── */}
      <Modal visible={moodModal} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kavWrap}>
          <Pressable style={s.kavOverlay} onPress={() => { setMoodModal(false); Keyboard.dismiss(); }} />
          <ScrollView
            style={kavSheet}
            contentContainerStyle={sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[s.sheetTitle, { color: colors.text }]}>How are you feeling?</Text>
            <View style={s.moodPicker}>
              {MOOD_EMOJIS.map((emoji, i) => {
                const rating = i + 1;
                const info = MOOD_LABELS[rating];
                const active = moodRating === rating;
                return (
                  <Pressable
                    key={rating}
                    onPress={() => setMoodRating(rating)}
                    style={[
                      s.moodPickBtn,
                      active && { backgroundColor: info.color + '22', borderRadius: 14, borderWidth: 1.5, borderColor: info.color },
                    ]}
                  >
                    <Text style={{ fontSize: 30 }}>{emoji}</Text>
                    {active && <Text style={[s.moodPickLabel, { color: info.color }]}>{info.label}</Text>}
                  </Pressable>
                );
              })}
            </View>
            <Text style={[s.fieldLabel, { color: colors.muted }]}>Note (optional)</Text>
            <TextInput
              style={[s.input, s.textArea, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={moodNote}
              onChangeText={setMoodNote}
              placeholder="How was your day?"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              returnKeyType="default"
            />
            <View style={s.btnRow}>
              <Pressable onPress={() => { setMoodModal(false); Keyboard.dismiss(); }} style={[s.cancelBtn, { backgroundColor: colors.input }]}>
                <Text style={[s.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  addMood({ date: today, rating: moodRating, note: moodNote });
                  setMoodModal(false);
                  setMoodNote('');
                  Keyboard.dismiss();
                  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                style={[s.saveBtn, { backgroundColor: colors.purple }]}
              >
                <Text style={[s.saveBtnText, { color: '#fff' }]}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.6, marginBottom: 12 },
  tabs: { flexDirection: 'row', borderRadius: 14, padding: 3, gap: 2, borderWidth: 1 },
  tabItem: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: 'center' },
  tabItemActive: {},
  tabText: { fontSize: 12, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1 },
  statVal: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 },
  timingSection: { marginBottom: 16 },
  timingTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  suppRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 16, borderWidth: 1, marginBottom: 8,
  },
  suppCheck: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  suppName: { fontSize: 14, fontWeight: '700' },
  suppDose: { fontSize: 11, marginTop: 2 },
  prioBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  prioText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  centeredTab: { alignItems: 'center', paddingTop: 20, gap: 16 },
  bigNum: { fontSize: 80, fontWeight: '900', letterSpacing: -3, lineHeight: 88 },
  bigLabel: { fontSize: 18, fontWeight: '700' },
  bigSub: { fontSize: 13 },
  cupsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingHorizontal: 20 },
  cup: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  waterBtns: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  waterBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  waterBtnMain: { width: 84, height: 84, borderRadius: 42, borderWidth: 0 },
  bmiResult: { borderRadius: 20, padding: 24, borderWidth: 1, alignItems: 'center', marginBottom: 16 },
  bmiNum: { fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  bmiStatus: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  bmiSub: { fontSize: 12, marginTop: 4 },
  inputCard: { borderRadius: 20, padding: 18, borderWidth: 1 },
  fieldLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  input: { borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1.5, marginBottom: 14 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  bmiScale: { fontSize: 11, lineHeight: 17, textAlign: 'center' },
  moodTrendCard: { borderRadius: 20, padding: 20, borderWidth: 1, alignItems: 'center', marginBottom: 14 },
  moodTrendNum: { fontSize: 44, fontWeight: '900', letterSpacing: -1.5 },
  moodTrendLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  logMoodBtn: { borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 14 },
  logMoodBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  moodHistory: { borderRadius: 20, padding: 16, borderWidth: 1 },
  moodHistTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  moodDate: { fontSize: 11 },
  moodNote: { fontSize: 12, marginTop: 2 },
  moodLabel: { fontSize: 12, fontWeight: '700' },
  moodPicker: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, paddingHorizontal: 4 },
  moodPickBtn: { alignItems: 'center', padding: 10, gap: 4 },
  moodPickLabel: { fontSize: 9, fontWeight: '700' },
  kavWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' },
  kavOverlay: { flex: 1 },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, maxHeight: '90%' },
  sheetTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  sheetSub: { fontSize: 13, marginBottom: 16, fontWeight: '600' },
  detailSection: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 4 },
  detailText: { fontSize: 13, lineHeight: 19 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700' },
  saveBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '800' },
});
