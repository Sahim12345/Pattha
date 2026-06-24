import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

import { SwipeableItem } from '@/components/SwipeableItem';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, STORES } from '@/data/items';
import { useColors } from '@/hooks/useColors';

const WEEK_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const WEEK_COLORS = ['#00B4D8', '#7C3AED', '#10B981', '#F59E0B'];

function ScalePressable({
  children, onPress, style,
}: { children: React.ReactNode; onPress: () => void; style?: any }) {
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

export default function ShoppingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    data, weeklyBudget, getWeekSpent, getAllItems,
    tickItem, setItemPrice, setItemName, setItemStore,
    addCustomItem, removeItem, checkAllWeek, uncheckAllWeek, resetWeek,
    getEffectiveWeeklyBudget,
  } = useApp();

  const [week, setWeek] = useState(1);
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [priceModal, setPriceModal] = useState<{ id: string; name: string } | null>(null);
  const [nameModal, setNameModal] = useState<{ id: string; name: string; storeKey: string } | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [nameStoreInput, setNameStoreInput] = useState('a');
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addCat, setAddCat] = useState(CATEGORIES[7]);
  const [addStore, setAddStore] = useState('a');

  const spent = getWeekSpent(week);
  const effectiveBudget = getEffectiveWeeklyBudget(week);
  const rolloverAmount = effectiveBudget - weeklyBudget;
  const wkPct = Math.min(100, (spent / effectiveBudget) * 100);
  const wkLeft = Math.max(0, effectiveBudget - spent);
  const allItems = getAllItems(week);

  const filteredCats = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase();
    return allItems
      .map((cat) => ({ ...cat, items: cat.items.filter((i) => i.name.toLowerCase().includes(q)) }))
      .filter((c) => c.items.length > 0);
  }, [allItems, search]);

  const tickedCount = allItems.flatMap((c) => c.items).filter((i) => data.checks[i.id]).length;
  const totalCount = allItems.flatMap((c) => c.items).length;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const weekColor = WEEK_COLORS[week - 1];
  const progressColor = wkPct >= 100 ? '#FF4757' : wkPct >= 80 ? '#FFD60A' : weekColor;

  const handleAdd = () => {
    if (!addName.trim()) return;
    addCustomItem(week, {
      name: addName.trim(),
      defaultPrice: parseFloat(addPrice) || 1.99,
      storeKey: addStore,
      category: addCat,
    });
    setAddName(''); setAddPrice('');
    setAddModal(false);
    Keyboard.dismiss();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePriceSave = () => {
    if (!priceModal) return;
    const v = parseFloat(priceInput);
    if (!isNaN(v) && v >= 0) setItemPrice(priceModal.id, v);
    setPriceModal(null);
    Keyboard.dismiss();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNameSave = () => {
    if (!nameModal || !nameInput.trim()) return;
    setItemName(nameModal.id, nameInput.trim());
    setItemStore(nameModal.id, nameStoreInput);
    setNameModal(null);
    Keyboard.dismiss();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const kavSheet = [s.sheet, { backgroundColor: colors.surface, borderColor: colors.border2 }];
  const sheetContent = { padding: 22, paddingBottom: Math.max(botPad, 20) + 24 };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={[s.header, { paddingTop: topPad + 8, backgroundColor: colors.navBg, borderBottomColor: colors.border }]}>
          <View style={s.headerTop}>
            <View>
              <Text style={[s.headerTitle, { color: colors.text }]}>Shopping</Text>
              <Text style={[s.headerSub, { color: colors.muted }]}>
                {tickedCount}/{totalCount} ticked · €{spent.toFixed(2)} of €{effectiveBudget.toFixed(0)}
              </Text>
            </View>
            <ScalePressable
              onPress={() => setAddModal(true)}
              style={[s.addBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="plus" size={18} color={colors.primaryForeground} />
            </ScalePressable>
          </View>

          {/* Progress bar */}
          <View style={[s.progressTrack, { backgroundColor: colors.input }]}>
            <View style={[s.progressFill, { width: `${wkPct}%` as any, backgroundColor: progressColor }]} />
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
                  style={({ pressed }) => [
                    s.weekPill,
                    {
                      backgroundColor: active ? col + '22' : colors.input,
                      borderColor: active ? col : colors.border,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                >
                  <Text style={[s.weekPillText, { color: active ? col : colors.muted }]}>{lbl}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => {
                Alert.alert('Week options', undefined, [
                  { text: 'Check all', onPress: () => checkAllWeek(week) },
                  { text: 'Uncheck all', onPress: () => uncheckAllWeek(week) },
                  { text: 'Reset week', style: 'destructive', onPress: () => resetWeek(week) },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
              style={[s.weekPill, { backgroundColor: colors.input, borderColor: colors.border }]}
            >
              <Feather name="more-horizontal" size={14} color={colors.muted} />
            </Pressable>
          </ScrollView>

          {/* Search */}
          <View style={[s.searchBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Feather name="search" size={14} color={colors.muted} />
            <TextInput
              style={[s.searchInput, { color: colors.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search items..."
              placeholderTextColor={colors.muted}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Feather name="x" size={14} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {/* Budget chips */}
          <View style={s.budgetChips}>
            <View style={[s.budgetChip, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '30' }]}>
              <Text style={[s.budgetChipLabel, { color: colors.muted }]}>Left</Text>
              <Text style={[s.budgetChipVal, { color: colors.primary }]}>€{wkLeft.toFixed(2)}</Text>
            </View>
            {rolloverAmount > 0 && (
              <View style={[s.budgetChip, { backgroundColor: colors.purpleDim, borderColor: colors.purple + '30' }]}>
                <Text style={[s.budgetChipLabel, { color: colors.muted }]}>Rollover</Text>
                <Text style={[s.budgetChipVal, { color: colors.purple }]}>+€{rolloverAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={[s.budgetChip, { backgroundColor: colors.redDim, borderColor: colors.red + '30' }]}>
              <Text style={[s.budgetChipLabel, { color: colors.muted }]}>Spent</Text>
              <Text style={[s.budgetChipVal, { color: colors.red }]}>€{spent.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.list, { paddingBottom: botPad + 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          {filteredCats.length === 0 ? (
            <View style={s.emptyState}>
              <Feather name="search" size={36} color={colors.muted} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>No items found</Text>
              <Text style={[s.emptySub, { color: colors.muted }]}>Try a different search term</Text>
            </View>
          ) : (
            filteredCats.map((cat) => (
              <View key={cat.cat} style={s.catSection}>
                <Text style={[s.catTitle, { color: colors.muted }]}>{cat.cat}</Text>
                {cat.items.map((item) => (
                  <SwipeableItem
                    key={item.id}
                    id={item.id}
                    name={data.names[item.id] ?? item.name}
                    defaultPrice={item.defaultPrice}
                    storeKey={data.stores[item.id] ?? item.storeKey}
                    checked={!!data.checks[item.id]}
                    actualPrice={data.prices[item.id]}
                    onTick={() => {
                      tickItem(item.id);
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    onDelete={() => {
                      Alert.alert('Remove item?', item.name, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => removeItem(week, item.id) },
                      ]);
                    }}
                    onPressPrice={() => {
                      setPriceInput(String(data.prices[item.id] ?? item.defaultPrice));
                      setPriceModal({ id: item.id, name: data.names[item.id] ?? item.name });
                    }}
                    onPressName={() => {
                      const curStore = data.stores[item.id] ?? item.storeKey;
                      setNameInput(data.names[item.id] ?? item.name);
                      setNameStoreInput(curStore);
                      setNameModal({ id: item.id, name: data.names[item.id] ?? item.name, storeKey: curStore });
                    }}
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* ── Add Item Modal ── */}
      <Modal visible={addModal} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kavWrap}>
          <Pressable style={s.kavOverlay} onPress={() => { setAddModal(false); Keyboard.dismiss(); }} />
          <ScrollView
            style={kavSheet}
            contentContainerStyle={sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[s.sheetTitle, { color: colors.text }]}>Add Item</Text>

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Name</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={addName}
              onChangeText={setAddName}
              placeholder="Item name"
              placeholderTextColor={colors.muted}
              autoFocus
              returnKeyType="next"
            />

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Price (€)</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={addPrice}
              onChangeText={setAddPrice}
              keyboardType="decimal-pad"
              placeholder="1.99"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setAddCat(c)}
                  style={[
                    s.catChip,
                    {
                      backgroundColor: addCat === c ? colors.primaryDim : colors.input,
                      borderColor: addCat === c ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[s.catChipText, { color: addCat === c ? colors.primary : colors.muted }]}>
                    {c.split(' ').slice(0, 2).join(' ')}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Store</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
              {Object.entries(STORES).filter(([k]) => k !== 'c').map(([key, store]) => (
                <Pressable
                  key={key}
                  onPress={() => setAddStore(key)}
                  style={[
                    s.catChip,
                    {
                      backgroundColor: addStore === key ? store.bg : colors.input,
                      borderColor: addStore === key ? store.color : colors.border,
                    },
                  ]}
                >
                  <Text style={[s.catChipText, { color: addStore === key ? store.color : colors.muted }]}>
                    {store.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={s.btnRow}>
              <Pressable onPress={() => { setAddModal(false); Keyboard.dismiss(); }} style={[s.cancelBtn, { backgroundColor: colors.input }]}>
                <Text style={[s.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAdd} style={[s.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={[s.saveBtnText, { color: colors.primaryForeground }]}>Add Item</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Price Modal ── */}
      <Modal visible={!!priceModal} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kavWrap}>
          <Pressable style={s.kavOverlay} onPress={() => { setPriceModal(null); Keyboard.dismiss(); }} />
          <ScrollView
            style={kavSheet}
            contentContainerStyle={sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[s.sheetTitle, { color: colors.text }]}>Edit Price</Text>
            <Text style={[s.sheetSub, { color: colors.muted }]}>{priceModal?.name}</Text>
            <TextInput
              style={[s.input, s.bigInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={priceInput}
              onChangeText={setPriceInput}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={handlePriceSave}
            />
            <View style={s.btnRow}>
              <Pressable onPress={() => { setPriceModal(null); Keyboard.dismiss(); }} style={[s.cancelBtn, { backgroundColor: colors.input }]}>
                <Text style={[s.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handlePriceSave} style={[s.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={[s.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Item Modal (name + store) ── */}
      <Modal visible={!!nameModal} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kavWrap}>
          <Pressable style={s.kavOverlay} onPress={() => { setNameModal(null); Keyboard.dismiss(); }} />
          <ScrollView
            style={kavSheet}
            contentContainerStyle={sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[s.sheetTitle, { color: colors.text }]}>Edit Item</Text>
            <Text style={[s.sheetSub, { color: colors.muted }]}>Long-press to edit name and store</Text>

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Item name</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              selectTextOnFocus
              placeholder="Item name"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Store</Text>
            <View style={s.storeGrid}>
              {Object.entries(STORES).map(([key, store]) => {
                const active = nameStoreInput === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setNameStoreInput(key)}
                    style={({ pressed }) => [
                      s.storeGridBtn,
                      {
                        backgroundColor: active ? store.bg : colors.input,
                        borderColor: active ? store.color : colors.border,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                  >
                    <Text style={[s.storeGridLabel, { color: active ? store.color : colors.muted }]}>
                      {store.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.btnRow}>
              <Pressable onPress={() => { setNameModal(null); Keyboard.dismiss(); }} style={[s.cancelBtn, { backgroundColor: colors.input }]}>
                <Text style={[s.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleNameSave} style={[s.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={[s.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.6 },
  headerSub: { fontSize: 12, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 4, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 3 },
  weekRow: { marginBottom: 10 },
  weekPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5,
    marginRight: 8, alignItems: 'center', justifyContent: 'center', minWidth: 44,
  },
  weekPillText: { fontSize: 12, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  budgetChips: { flexDirection: 'row', gap: 8 },
  budgetChip: { flex: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, alignItems: 'center' },
  budgetChipLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  budgetChipVal: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  list: { paddingHorizontal: 16, paddingTop: 14 },
  catSection: { marginBottom: 16 },
  catTitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13 },
  kavWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' },
  kavOverlay: { flex: 1 },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, maxHeight: '92%' },
  sheetTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  sheetSub: { fontSize: 13, marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  input: { borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1.5, marginBottom: 14 },
  bigInput: { fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700' },
  saveBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '800' },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  catChipText: { fontSize: 11, fontWeight: '600' },
  storeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  storeGridBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, minWidth: 80, alignItems: 'center' },
  storeGridLabel: { fontSize: 12, fontWeight: '700' },
});
