import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useMemo, useState } from 'react';
import {
  Alert,
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

import { CATEGORIES } from '@/data/items';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { checkImpulseControl } from '@/services/islamicFinance';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

const WEEK_CHIP_COLORS = ['#00B4D8', '#7C3AED', '#10B981', '#F59E0B'];
const CAT_COLORS = ['#00B4D8', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#F97316', '#06B6D4'];

const BILL_ICONS = ['🏠', '📱', '💡', '🎵', '🚌', '📺', '🌐', '💊', '📚', '🏋️', '🎮', '☕'];

function AnimatedPressable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    data, weeklyBudget, getWeekSpent, setMonthlyBudget, setGoal,
    getCategorySpending, addQuickExpense, effectiveWeekBudgets,
    addRecurringExpense, removeRecurringExpense, toggleRecurringPaid,
  } = useApp();

  const [budgetModal, setBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [goalModal, setGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🕌');
  const [goalTarget, setGoalTarget] = useState('');
  const [quickModal, setQuickModal] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCat, setQuickCat] = useState(CATEGORIES[7]);

  // Recurring Expenses modal state
  const [billModal, setBillModal] = useState(false);
  const [billName, setBillName] = useState('');
  const [billIcon, setBillIcon] = useState('🏠');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDay, setBillDueDay] = useState('1');

  const weekSpent = useMemo(() => [1, 2, 3, 4].map((w) => getWeekSpent(w)), [getWeekSpent]);
  const monthSpent = weekSpent.reduce((a, b) => a + b, 0);
  const monthLeft = Math.max(0, data.monthlyBudget - monthSpent);
  const monthPct = Math.min(100, (monthSpent / data.monthlyBudget) * 100);

  const goalSaved = weekSpent.reduce((acc, s) => {
    const wkLeft = weeklyBudget - s;
    return acc + (wkLeft > 0 ? wkLeft : 0);
  }, 0);
  const goalPct = data.goal ? Math.min(100, (goalSaved / data.goal.target) * 100) : 0;

  const catSpending = getCategorySpending();
  const maxCatSpend = Math.max(...catSpending.map((c) => c.amount), 1);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Current month key for recurring paid tracking
  const currentMonthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const recurringExpenses = data.recurringExpenses ?? [];
  const totalBillsMonthly = recurringExpenses.reduce((a, b) => a + b.amount, 0);
  const billsPaid = recurringExpenses.filter((b) => b.paid?.[currentMonthKey]).length;

  const saveBudget = () => {
    const v = parseFloat(budgetInput);
    if (isNaN(v) || v < 20) { Alert.alert('Invalid budget', 'Please enter at least €20'); return; }
    setMonthlyBudget(v);
    setBudgetModal(false);
    Keyboard.dismiss();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveGoal = () => {
    if (!goalName.trim() || !goalTarget) return;
    setGoal({ name: goalName.trim(), emoji: goalEmoji, target: parseFloat(goalTarget) });
    setGoalModal(false);
    Keyboard.dismiss();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveQuick = () => {
    const amt = parseFloat(quickAmount);
    if (!quickName.trim() || isNaN(amt) || amt <= 0) return;

    const impulse = checkImpulseControl(amt);
    if (impulse.triggered) {
      Alert.alert(
        'Impulse Check',
        impulse.message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Anyway',
            style: 'destructive',
            onPress: () => {
              addQuickExpense(quickName.trim(), amt, quickCat);
              setQuickModal(false);
              setQuickName(''); setQuickAmount('');
              Keyboard.dismiss();
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ],
      );
      return;
    }

    addQuickExpense(quickName.trim(), amt, quickCat);
    setQuickModal(false);
    setQuickName(''); setQuickAmount('');
    Keyboard.dismiss();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveBill = () => {
    const amt = parseFloat(billAmount);
    const day = parseInt(billDueDay);
    if (!billName.trim() || isNaN(amt) || amt <= 0 || isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Invalid bill', 'Please enter a name, amount, and due day (1–31).');
      return;
    }
    addRecurringExpense({
      name: billName.trim(),
      icon: billIcon,
      amount: amt,
      dueDay: day,
      category: '💸 Bills',
    });
    setBillModal(false);
    setBillName(''); setBillAmount(''); setBillDueDay('1'); setBillIcon('🏠');
    Keyboard.dismiss();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteBill = (id: string, name: string) => {
    Alert.alert(`Remove "${name}"?`, 'This recurring bill will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeRecurringExpense(id);
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  const recentTx = data.transactions.slice(0, 4);
  const progressBarColor = monthPct >= 100 ? '#FF4757' : monthPct >= 75 ? '#FFD60A' : '#fff';

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Revolut hero card ── */}
        <LinearGradient
          colors={['#0077B6', '#00B4D8', '#5E72E4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.heroCard, { paddingTop: topPad + 16 }]}
        >
          <View style={s.shineOverlay} />
          <View style={s.shineOverlay2} />

          {/* Top row */}
          <View style={s.cardTopRow}>
            <View style={s.cardChip}>
              <Text style={s.cardChipLetter}>P</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.cardBrand}>Pattha</Text>
              <Text style={s.cardSub}>
                {new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <Pressable
              onPress={() => { setBudgetInput(String(data.monthlyBudget)); setBudgetModal(true); }}
              style={({ pressed }) => [s.editCardBtn, { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] }]}
            >
              <Feather name="edit-2" size={13} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>

          {/* Balance */}
          <View style={s.balanceRow}>
            <Text style={s.balanceLabel}>BUDGET REMAINING</Text>
            <Text style={s.balanceAmount}>€{monthLeft.toFixed(2)}</Text>
            <Text style={s.balanceSub}>
              of €{data.monthlyBudget} · €{monthSpent.toFixed(2)} spent · {Math.round(monthPct)}%
            </Text>
          </View>

          {/* Progress bar */}
          <View style={s.heroProgress}>
            <Animated.View
              style={[
                s.heroProgressFill,
                {
                  width: `${monthPct}%` as any,
                  backgroundColor: progressBarColor,
                },
              ]}
            />
          </View>

          {/* Action row */}
          <View style={s.actionRow}>
            {[
              { label: '+ Add', icon: 'plus', onPress: () => setQuickModal(true) },
              { label: 'Budget', icon: 'sliders', onPress: () => { setBudgetInput(String(data.monthlyBudget)); setBudgetModal(true); } },
              { label: 'Goal', icon: 'target', onPress: () => setGoalModal(true) },
            ].map((btn) => (
              <AnimatedPressable key={btn.label} onPress={btn.onPress} style={s.actionBtn}>
                <View style={s.actionBtnIcon}>
                  <Feather name={btn.icon as any} size={16} color="#fff" />
                </View>
                <Text style={s.actionBtnLabel}>{btn.label}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </LinearGradient>

        <View style={[s.content, { paddingBottom: botPad + 100 }]}>

          {/* ── Week chips ── */}
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Weeks this month</Text>
            <Text style={[s.sectionSub, { color: colors.muted }]}>€{monthSpent.toFixed(2)} spent</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.weekScroll}>
            {[1, 2, 3, 4].map((w) => {
              const spent = weekSpent[w - 1];
              const effBudget = effectiveWeekBudgets[w - 1];
              const pct = Math.min(100, (spent / effBudget) * 100);
              const col = WEEK_CHIP_COLORS[w - 1];
              const left = Math.max(0, effBudget - spent);
              return (
                <AnimatedPressable
                  key={w}
                  onPress={() => router.push('/shopping')}
                  style={[
                    s.weekChip,
                    { backgroundColor: colors.card, borderColor: col + '40' },
                  ]}
                >
                  <View style={[s.weekChipDot, { backgroundColor: col }]} />
                  <Text style={[s.weekChipLabel, { color: colors.muted }]}>Wk {w}</Text>
                  <Text style={[s.weekChipAmount, { color: colors.text }]}>€{spent.toFixed(2)}</Text>
                  <Text style={[s.weekChipSub, { color: col }]}>
                    {pct >= 100 ? 'Over limit' : `€${left.toFixed(0)} left`}
                  </Text>
                  <View style={[s.weekChipTrack, { backgroundColor: colors.input }]}>
                    <View style={[s.weekChipFill, { width: `${pct}%` as any, backgroundColor: col }]} />
                  </View>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          {/* ── Spending by Category ── */}
          {catSpending.length > 0 && (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.cardHeaderRow}>
                <Text style={[s.cardTitle, { color: colors.text }]}>Spending</Text>
                <Text style={[s.cardSeeAll, { color: colors.primary }]}>{catSpending.length} categories</Text>
              </View>
              {catSpending.slice(0, 6).map((cat, i) => {
                const pct = (cat.amount / maxCatSpend) * 100;
                const col = CAT_COLORS[i % CAT_COLORS.length];
                const icon = cat.category.split(' ')[0];
                const label = cat.category.replace(/^[^\s]+\s/, '');
                return (
                  <View key={cat.category} style={s.spendRow}>
                    <View style={[s.spendIcon, { backgroundColor: col + '22' }]}>
                      <Text style={{ fontSize: 16 }}>{icon}</Text>
                    </View>
                    <View style={s.spendMid}>
                      <Text style={[s.spendName, { color: colors.text }]} numberOfLines={1}>
                        {label.length > 20 ? label.slice(0, 20) + '…' : label}
                      </Text>
                      <View style={[s.spendTrack, { backgroundColor: colors.input }]}>
                        <View style={[s.spendFill, { width: `${pct}%` as any, backgroundColor: col }]} />
                      </View>
                    </View>
                    <Text style={[s.spendAmt, { color: col }]}>€{cat.amount.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Recurring Bills ── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[s.cardTitle, { color: colors.text }]}>Monthly Bills</Text>
                {recurringExpenses.length > 0 && (
                  <View style={[s.billBadge, {
                    backgroundColor: billsPaid === recurringExpenses.length ? colors.primaryDim : colors.goldDim,
                    borderColor: billsPaid === recurringExpenses.length ? colors.primary + '40' : colors.gold + '40',
                  }]}>
                    <Text style={[s.billBadgeText, {
                      color: billsPaid === recurringExpenses.length ? colors.primary : colors.gold,
                    }]}>
                      {billsPaid}/{recurringExpenses.length} paid
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => setBillModal(true)}
                style={({ pressed }) => [s.billAddBtn, { backgroundColor: colors.primaryDim, opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="plus" size={14} color={colors.primary} />
              </Pressable>
            </View>

            {recurringExpenses.length === 0 ? (
              <View style={s.billEmpty}>
                <Text style={{ fontSize: 32, marginBottom: 6 }}>🏠</Text>
                <Text style={[s.billEmptyTitle, { color: colors.text }]}>No recurring bills yet</Text>
                <Text style={[s.billEmptySub, { color: colors.muted }]}>
                  Add rent, subscriptions, phone bills, and more to track monthly expenses
                </Text>
                <AnimatedPressable onPress={() => setBillModal(true)} style={[s.goalBtn, { backgroundColor: colors.primary, marginTop: 8 }]}>
                  <Text style={[s.goalBtnText, { color: colors.primaryForeground }]}>Add Bill</Text>
                </AnimatedPressable>
              </View>
            ) : (
              <View style={{ gap: 0 }}>
                {recurringExpenses.map((bill, idx) => {
                  const isPaid = !!bill.paid?.[currentMonthKey];
                  const today = new Date().getDate();
                  const isOverdue = !isPaid && today > bill.dueDay;
                  const isDueSoon = !isPaid && !isOverdue && (bill.dueDay - today) <= 3;
                  return (
                    <View
                      key={bill.id}
                      style={[
                        s.billRow,
                        idx < recurringExpenses.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                        isPaid && { opacity: 0.55 },
                      ]}
                    >
                      <Pressable
                        onPress={() => { toggleRecurringPaid(bill.id, currentMonthKey); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[s.billCheck, {
                          backgroundColor: isPaid ? colors.primary : colors.input,
                          borderColor: isPaid ? colors.primary : colors.border,
                        }]}
                      >
                        {isPaid && <Feather name="check" size={11} color="#fff" />}
                      </Pressable>
                      <View style={[s.billIconBox, { backgroundColor: colors.input }]}>
                        <Text style={{ fontSize: 18 }}>{bill.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.billName, { color: isPaid ? colors.muted : colors.text }]}
                          numberOfLines={1}>{bill.name}</Text>
                        <Text style={[s.billDue, {
                          color: isOverdue ? colors.red : isDueSoon ? colors.gold : colors.muted,
                        }]}>
                          {isOverdue ? '⚠️ Overdue' : isDueSoon ? `Due in ${bill.dueDay - today}d` : `Due on ${bill.dueDay}${bill.dueDay === 1 ? 'st' : bill.dueDay === 2 ? 'nd' : bill.dueDay === 3 ? 'rd' : 'th'}`}
                        </Text>
                      </View>
                      <Text style={[s.billAmt, { color: isPaid ? colors.muted : colors.red }]}>
                        €{bill.amount.toFixed(2)}
                      </Text>
                      <Pressable
                        onPress={() => deleteBill(bill.id, bill.name)}
                        style={({ pressed }) => [s.billDel, { opacity: pressed ? 0.5 : 1 }]}
                        hitSlop={8}
                      >
                        <Feather name="x" size={14} color={colors.muted} />
                      </Pressable>
                    </View>
                  );
                })}

                {/* Total row */}
                <View style={[s.billTotalRow, { borderTopColor: colors.border2 }]}>
                  <Text style={[s.billTotalLabel, { color: colors.muted }]}>Monthly total</Text>
                  <Text style={[s.billTotalAmt, { color: colors.text }]}>€{totalBillsMonthly.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Savings Goal ── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeaderRow}>
              <Text style={[s.cardTitle, { color: colors.text }]}>Savings Goal</Text>
              {data.goal && (
                <Pressable onPress={() => setGoalModal(true)}>
                  <Feather name="edit-2" size={14} color={colors.muted} />
                </Pressable>
              )}
            </View>
            {!data.goal ? (
              <View style={s.goalEmpty}>
                <Text style={{ fontSize: 36 }}>🕌</Text>
                <Text style={[s.goalEmptyTitle, { color: colors.text }]}>Set a savings goal</Text>
                <Text style={[s.goalEmptySub, { color: colors.muted }]}>
                  Track what you save from your budget each month
                </Text>
                <AnimatedPressable onPress={() => setGoalModal(true)} style={[s.goalBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[s.goalBtnText, { color: colors.primaryForeground }]}>Set Goal</Text>
                </AnimatedPressable>
              </View>
            ) : (
              <View style={s.goalActive}>
                <View style={s.goalRow}>
                  <Text style={{ fontSize: 24, marginRight: 8 }}>{data.goal.emoji}</Text>
                  <Text style={[s.goalName, { color: colors.text }]}>{data.goal.name}</Text>
                  <Text style={[s.goalPct, { color: colors.primary }]}>{Math.round(goalPct)}%</Text>
                </View>
                <View style={[s.goalTrack, { backgroundColor: colors.input }]}>
                  <LinearGradient
                    colors={['#0077B6', '#00B4D8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[s.goalFill, { width: `${goalPct}%` as any }]}
                  />
                </View>
                <View style={s.goalStats}>
                  <Text style={[s.goalStat, { color: colors.muted }]}>
                    Saved: <Text style={{ color: colors.primary, fontWeight: '700' }}>€{goalSaved.toFixed(2)}</Text>
                  </Text>
                  <Text style={[s.goalStat, { color: colors.muted }]}>
                    Target: <Text style={{ color: colors.text, fontWeight: '700' }}>€{data.goal.target.toFixed(0)}</Text>
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Recent transactions ── */}
          {recentTx.length > 0 && (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.cardHeaderRow}>
                <Text style={[s.cardTitle, { color: colors.text }]}>Recent</Text>
                <Text style={[s.cardSeeAll, { color: colors.primary }]}>Transactions</Text>
              </View>
              {recentTx.map((tx, i) => (
                <View
                  key={tx.id}
                  style={[s.txRow, { borderBottomColor: i < recentTx.length - 1 ? colors.border : 'transparent' }]}
                >
                  <View style={[s.txIcon, { backgroundColor: colors.input }]}>
                    <Text style={{ fontSize: 14 }}>{tx.category.split(' ')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.txName, { color: colors.text }]} numberOfLines={1}>{tx.name}</Text>
                    <Text style={[s.txDate, { color: colors.muted }]}>
                      {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={[s.txAmt, { color: colors.red }]}>-€{tx.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Budget Modal ── */}
      <Modal visible={budgetModal} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kavWrap}
        >
          <Pressable style={s.kavOverlay} onPress={() => { setBudgetModal(false); Keyboard.dismiss(); }} />
          <ScrollView
            style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border2 }]}
            contentContainerStyle={{ padding: 22, paddingBottom: Math.max(botPad, 20) + 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[s.sheetTitle, { color: colors.text }]}>Monthly Budget</Text>
            <Text style={[s.sheetSub, { color: colors.muted }]}>Set your total budget for the month</Text>
            <Text style={[s.fieldLabel, { color: colors.muted }]}>Amount (€)</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="decimal-pad"
              placeholder="100"
              placeholderTextColor={colors.muted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveBudget}
            />
            <View style={s.btnRow}>
              <Pressable onPress={() => { setBudgetModal(false); Keyboard.dismiss(); }} style={[s.cancelBtn, { backgroundColor: colors.input }]}>
                <Text style={[s.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveBudget} style={[s.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={[s.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Goal Modal ── */}
      <Modal visible={goalModal} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kavWrap}
        >
          <Pressable style={s.kavOverlay} onPress={() => { setGoalModal(false); Keyboard.dismiss(); }} />
          <ScrollView
            style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border2 }]}
            contentContainerStyle={{ padding: 22, paddingBottom: Math.max(botPad, 20) + 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[s.sheetTitle, { color: colors.text }]}>Savings Goal</Text>
            <Text style={[s.sheetSub, { color: colors.muted }]}>What are you saving for?</Text>

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Pick an emoji</Text>
            <View style={s.emojiRow}>
              {['🕌', '🎯', '✈️', '📱', '👟', '🎮', '📚', '💍', '🏋️', '🚗'].map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setGoalEmoji(e)}
                  style={[
                    s.emojiBtn,
                    goalEmoji === e && [s.emojiBtnActive, { backgroundColor: colors.primaryDim, borderColor: colors.primary }],
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Goal name</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={goalName}
              onChangeText={setGoalName}
              placeholder="Hajj Fund, iPhone, etc."
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />
            <Text style={[s.fieldLabel, { color: colors.muted }]}>Target amount (€)</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={goalTarget}
              onChangeText={setGoalTarget}
              keyboardType="decimal-pad"
              placeholder="3000"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={saveGoal}
            />
            <View style={s.btnRow}>
              <Pressable onPress={() => { setGoalModal(false); Keyboard.dismiss(); }} style={[s.cancelBtn, { backgroundColor: colors.input }]}>
                <Text style={[s.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveGoal} style={[s.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={[s.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Quick Expense Modal ── */}
      <Modal visible={quickModal} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kavWrap}
        >
          <Pressable style={s.kavOverlay} onPress={() => { setQuickModal(false); Keyboard.dismiss(); }} />
          <ScrollView
            style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border2 }]}
            contentContainerStyle={{ padding: 22, paddingBottom: Math.max(botPad, 20) + 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[s.sheetTitle, { color: colors.text }]}>Quick Expense</Text>
            <Text style={[s.sheetSub, { color: colors.muted }]}>Log a spend outside your shopping list</Text>

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Description</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={quickName}
              onChangeText={setQuickName}
              placeholder="Coffee, bus ticket, etc."
              placeholderTextColor={colors.muted}
              autoFocus
              returnKeyType="next"
            />
            <Text style={[s.fieldLabel, { color: colors.muted }]}>Amount (€)</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={quickAmount}
              onChangeText={setQuickAmount}
              keyboardType="decimal-pad"
              placeholder="3.50"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={saveQuick}
            />
            <Text style={[s.fieldLabel, { color: colors.muted }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
              {CATEGORIES.slice(0, 7).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setQuickCat(c)}
                  style={[
                    s.catChip,
                    {
                      backgroundColor: quickCat === c ? colors.primaryDim : colors.input,
                      borderColor: quickCat === c ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[s.catChipText, { color: quickCat === c ? colors.primary : colors.muted }]}>
                    {c.split(' ').slice(0, 2).join(' ')}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={s.btnRow}>
              <Pressable onPress={() => { setQuickModal(false); Keyboard.dismiss(); }} style={[s.cancelBtn, { backgroundColor: colors.input }]}>
                <Text style={[s.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveQuick} style={[s.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={[s.saveBtnText, { color: colors.primaryForeground }]}>Add</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Bill Modal ── */}
      <Modal visible={billModal} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kavWrap}
        >
          <Pressable style={s.kavOverlay} onPress={() => { setBillModal(false); Keyboard.dismiss(); }} />
          <ScrollView
            style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border2 }]}
            contentContainerStyle={{ padding: 22, paddingBottom: Math.max(botPad, 20) + 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[s.sheetTitle, { color: colors.text }]}>Add Recurring Bill</Text>
            <Text style={[s.sheetSub, { color: colors.muted }]}>Track rent, subscriptions, and monthly expenses</Text>

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Pick an icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {BILL_ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  onPress={() => setBillIcon(icon)}
                  style={[
                    s.emojiBtn,
                    billIcon === icon && [s.emojiBtnActive, { backgroundColor: colors.primaryDim, borderColor: colors.primary }],
                    { marginRight: 8 },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{icon}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Bill name</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={billName}
              onChangeText={setBillName}
              placeholder="Rent, Spotify, phone plan…"
              placeholderTextColor={colors.muted}
              autoFocus
              returnKeyType="next"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1.5 }}>
                <Text style={[s.fieldLabel, { color: colors.muted }]}>Amount (€)</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                  value={billAmount}
                  onChangeText={setBillAmount}
                  keyboardType="decimal-pad"
                  placeholder="350.00"
                  placeholderTextColor={colors.muted}
                  returnKeyType="next"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { color: colors.muted }]}>Due day</Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                  value={billDueDay}
                  onChangeText={setBillDueDay}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  onSubmitEditing={saveBill}
                />
              </View>
            </View>

            <View style={s.btnRow}>
              <Pressable onPress={() => { setBillModal(false); Keyboard.dismiss(); }} style={[s.cancelBtn, { backgroundColor: colors.input }]}>
                <Text style={[s.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveBill} style={[s.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={[s.saveBtnText, { color: colors.primaryForeground }]}>Add Bill</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  heroCard: {
    paddingHorizontal: 22,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  shineOverlay: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  shineOverlay2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  cardChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardChipLetter: { fontSize: 18, fontWeight: '900', color: '#fff' },
  cardBrand: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  cardSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  editCardBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  balanceRow: { marginBottom: 20 },
  balanceLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '700',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: -2, lineHeight: 52,
  },
  balanceSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  heroProgress: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3,
    overflow: 'hidden', marginBottom: 24,
  },
  heroProgressFill: { height: '100%', borderRadius: 3 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6 },
  actionBtnIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  actionBtnLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.2 },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, fontWeight: '600' },
  weekScroll: { marginBottom: 20 },
  weekChip: { width: 130, borderRadius: 18, padding: 14, marginRight: 10, borderWidth: 1, gap: 2 },
  weekChipDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  weekChipLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  weekChipAmount: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 },
  weekChipSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  weekChipTrack: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 10 },
  weekChipFill: { height: '100%', borderRadius: 2 },
  card: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 14 },
  cardHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  cardSeeAll: { fontSize: 12, fontWeight: '600' },
  spendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  spendIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  spendMid: { flex: 1, gap: 6 },
  spendName: { fontSize: 13, fontWeight: '600' },
  spendTrack: { height: 4, borderRadius: 3, overflow: 'hidden' },
  spendFill: { height: '100%', borderRadius: 3 },
  spendAmt: { fontSize: 13, fontWeight: '800', minWidth: 52, textAlign: 'right' },
  // Bills
  billBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  billBadgeText: { fontSize: 10, fontWeight: '800' },
  billAddBtn: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  billEmpty: { alignItems: 'center', paddingVertical: 8, gap: 6 },
  billEmptyTitle: { fontSize: 15, fontWeight: '800' },
  billEmptySub: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
  billRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  billCheck: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  billIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  billName: { fontSize: 13, fontWeight: '700' },
  billDue: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  billAmt: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  billDel: { padding: 4 },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  billTotalLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  billTotalAmt: { fontSize: 16, fontWeight: '900', letterSpacing: -0.4 },
  // Goal
  goalEmpty: { alignItems: 'center', paddingVertical: 8, gap: 8 },
  goalEmptyTitle: { fontSize: 15, fontWeight: '800' },
  goalEmptySub: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
  goalBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  goalBtnText: { fontSize: 13, fontWeight: '800' },
  goalActive: { gap: 12 },
  goalRow: { flexDirection: 'row', alignItems: 'center' },
  goalName: { fontSize: 15, fontWeight: '800', flex: 1 },
  goalPct: { fontSize: 14, fontWeight: '800' },
  goalTrack: { height: 6, borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 4 },
  goalStats: { flexDirection: 'row', justifyContent: 'space-between' },
  goalStat: { fontSize: 12 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  txIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txName: { fontSize: 13, fontWeight: '600' },
  txDate: { fontSize: 10, marginTop: 2 },
  txAmt: { fontSize: 13, fontWeight: '800' },
  // Modal / KAV
  kavWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'flex-end',
  },
  kavOverlay: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    maxHeight: '90%',
  },
  sheetTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  sheetSub: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  fieldLabel: {
    fontSize: 10, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 6,
  },
  input: {
    borderRadius: 14, padding: 14, fontSize: 16,
    borderWidth: 1.5, marginBottom: 14,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700' },
  saveBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '800' },
  emojiRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  emojiBtn: { padding: 6, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  emojiBtnActive: { borderRadius: 8, borderWidth: 1 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  catChipText: { fontSize: 11, fontWeight: '600' },
});
