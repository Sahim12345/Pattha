import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { DayPlan } from '@/data/mealGenerator';
import { useColors } from '@/hooks/useColors';

const WEEK_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const WEEK_COLORS = ['#00B4D8', '#7C3AED', '#10B981', '#F59E0B'];
const DAY_COLORS = ['#00B4D8', '#F59E0B', '#4895EF', '#FF4757', '#7C3AED', '#06B6D4', '#F97316'];

const TAG_COLORS: Record<string, string> = {
  'Protein': '#FF4757',
  'Energy': '#4895EF',
  'Fiber': '#00B4D8',
  'Brain': '#7C3AED',
  'Omega-3': '#4895EF',
  'Halal ✓': '#10B981',
  'Iron': '#F59E0B',
  'Mood': '#EC4899',
  'Gut Health': '#00B4D8',
  'Vitamin A': '#F59E0B',
};

function MealCard({ day, plan, onToggle, cooked }: {
  day: DayPlan;
  plan: DayPlan['meals'];
  onToggle: (key: string) => void;
  cooked: Record<string, boolean>;
}) {
  const colors = useColors();
  const dayColor = DAY_COLORS[day.colorIndex];
  const cookedCount = plan.filter((m) => cooked[m.key]).length;

  return (
    <View style={[s.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[s.dayHeader, { borderBottomColor: colors.border }]}>
        <View style={[s.dayDot, { backgroundColor: dayColor }]} />
        <Text style={[s.dayName, { color: colors.text }]}>{day.dayName}</Text>
        <Text style={[s.dayCount, { color: colors.muted }]}>{cookedCount}/{plan.length} cooked</Text>
      </View>
      {plan.map((meal) => {
        const isCooked = !!cooked[meal.key];
        return (
          <Pressable
            key={meal.key}
            onPress={() => onToggle(meal.key)}
            style={({ pressed }) => [
              s.mealRow,
              { borderBottomColor: colors.border, opacity: pressed ? 0.7 : isCooked ? 0.5 : 1 },
            ]}
          >
            <View style={[s.mealCheck, {
              backgroundColor: isCooked ? colors.primary : 'transparent',
              borderColor: isCooked ? colors.primary : colors.border2,
            }]}>
              {isCooked && <Feather name="check" size={11} color={colors.primaryForeground} />}
            </View>
            <View style={s.mealContent}>
              <Text style={[s.mealSlot, { color: dayColor }]}>{meal.label}</Text>
              <Text style={[s.mealName, { color: colors.text, textDecorationLine: isCooked ? 'line-through' : 'none' }]}>
                {meal.name}
              </Text>
              <Text style={[s.mealDesc, { color: colors.muted }]} numberOfLines={1}>{meal.description}</Text>
              <View style={s.tagRow}>
                {meal.tags.map((tag) => (
                  <View key={tag} style={[s.tag, { backgroundColor: (TAG_COLORS[tag] ?? '#00B4D8') + '18' }]}>
                    <Text style={[s.tagText, { color: TAG_COLORS[tag] ?? '#00B4D8' }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MealsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, generateMeals, toggleMealCooked, getAllItems } = useApp();
  const [week, setWeek] = useState(1);

  const plan: DayPlan[] | undefined = data.generatedMeals[String(week)];
  const tickedItems = getAllItems(week).flatMap((c) => c.items).filter((i) => data.checks[i.id]);
  const cookedCount = plan ? plan.flatMap((d) => d.meals).filter((m) => data.mealCooked[m.key]).length : 0;
  const totalMeals = plan ? plan.reduce((a, d) => a + d.meals.length, 0) : 0;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const weekColor = WEEK_COLORS[week - 1];

  const handleGenerate = () => {
    if (tickedItems.length === 0) return;
    generateMeals(week);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleToggle = (key: string) => {
    toggleMealCooked(key);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 8, backgroundColor: colors.navBg, borderBottomColor: colors.border }]}>
        <View style={s.headerTop}>
          <View>
            <Text style={[s.headerTitle, { color: colors.text }]}>Meal Plan</Text>
            {plan && (
              <Text style={[s.headerSub, { color: colors.muted }]}>
                {cookedCount}/{totalMeals} meals cooked
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleGenerate}
            style={({ pressed }) => [
              s.genBtn,
              {
                backgroundColor: colors.purple,
                opacity: tickedItems.length === 0 ? 0.4 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="zap" size={14} color="#fff" />
            <Text style={s.genBtnText}>Generate</Text>
          </Pressable>
        </View>

        {/* Week pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.weekRow}>
          {WEEK_LABELS.map((lbl, i) => {
            const w = i + 1;
            const col = WEEK_COLORS[i];
            const active = week === w;
            return (
              <Pressable
                key={w}
                onPress={() => setWeek(w)}
                style={[
                  s.weekPill,
                  {
                    backgroundColor: active ? col + '22' : colors.input,
                    borderColor: active ? col : colors.border,
                  },
                ]}
              >
                <Text style={[s.weekPillText, { color: active ? col : colors.muted }]}>{lbl}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={[s.list, { paddingBottom: botPad + 90 }]}>
        {!plan ? (
          <View style={s.emptyState}>
            <Feather name="book-open" size={48} color={colors.muted} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No meal plan yet</Text>
            <Text style={[s.emptySub, { color: colors.muted }]}>
              {tickedItems.length === 0
                ? 'First tick some items in your shopping list, then generate a meal plan'
                : 'Tap Generate to create a personalised halal meal plan from your groceries'}
            </Text>
            {tickedItems.length > 0 && (
              <Pressable onPress={handleGenerate} style={[s.generateBigBtn, { backgroundColor: colors.purple }]}>
                <Feather name="zap" size={16} color="#fff" />
                <Text style={s.generateBigBtnText}>Generate Meal Plan</Text>
              </Pressable>
            )}
          </View>
        ) : (
          plan.map((day) => (
            <MealCard
              key={day.dayName}
              day={day}
              plan={day.meals}
              onToggle={handleToggle}
              cooked={data.mealCooked}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  genBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  weekPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  dayCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dayCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    paddingLeft: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  mealCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  mealContent: {
    flex: 1,
    gap: 3,
  },
  mealSlot: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mealName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  mealDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  generateBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  generateBigBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
