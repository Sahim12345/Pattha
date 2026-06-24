import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { STORES } from '@/data/items';
import { useColors } from '@/hooks/useColors';

type Props = {
  id: string;
  name: string;
  defaultPrice: number;
  storeKey: string;
  checked: boolean;
  actualPrice?: number;
  onTick: () => void;
  onDelete: () => void;
  onPressPrice: () => void;
  onPressName: () => void;
};

export function SwipeableItem({
  id,
  name,
  defaultPrice,
  storeKey,
  checked,
  actualPrice,
  onTick,
  onDelete,
  onPressPrice,
  onPressName,
}: Props) {
  const colors = useColors();
  const pan = useRef(new Animated.Value(0)).current;
  const triggered = useRef(false);
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 10,
      onPanResponderGrant: () => {
        triggered.current = false;
      },
      onPanResponderMove: (_, gs) => {
        // Only allow left swipe (delete), no right swipe
        const clamped = Math.max(-110, Math.min(0, gs.dx));
        pan.setValue(clamped);
        if (!triggered.current && gs.dx < -60) {
          triggered.current = true;
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -80) {
          Animated.timing(pan, { toValue: -400, useNativeDriver: true, duration: 180 }).start(() => {
            onDelete();
            pan.setValue(0);
          });
        } else {
          Animated.spring(pan, { toValue: 0, useNativeDriver: true, friction: 7, tension: 60 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
      },
    })
  ).current;

  const store = STORES[storeKey] ?? STORES.any;
  const price = actualPrice ?? defaultPrice;

  const deleteOpacity = pan.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start();

  return (
    <View style={s.wrap}>
      {/* Delete background — revealed on left swipe */}
      <Animated.View style={[s.bgDel, { opacity: deleteOpacity }]}>
        <Feather name="trash-2" size={18} color="#fff" />
        <Text style={s.bgDelText}>Delete</Text>
      </Animated.View>

      {/* Swipeable row */}
      <Animated.View
        style={{ transform: [{ translateX: pan }, { scale }] }}
        {...panResponder.panHandlers}
      >
        {/* 
          Single Pressable = tap anywhere to tick, long-press to rename.
          Price pill uses stopPropagation so it can intercept its own tap.
        */}
        <Pressable
          onPress={onTick}
          onLongPress={onPressName}
          onPressIn={pressIn}
          onPressOut={pressOut}
          delayLongPress={400}
          style={[
            s.row,
            {
              backgroundColor: checked ? colors.primaryDim : colors.card,
              borderColor: checked ? colors.primary + '50' : colors.border,
            },
          ]}
        >
          {/* Checkbox */}
          <View
            style={[
              s.check,
              {
                backgroundColor: checked ? colors.primary : 'transparent',
                borderColor: checked ? colors.primary : colors.border2,
              },
            ]}
          >
            {checked && <Feather name="check" size={12} color={colors.primaryForeground} />}
          </View>

          {/* Name + store pill */}
          <View style={s.nameWrap}>
            <Text
              style={[
                s.name,
                {
                  color: checked ? colors.muted : colors.text,
                  textDecorationLine: checked ? 'line-through' : 'none',
                  fontWeight: checked ? '400' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <View style={[s.storePill, { backgroundColor: store.bg }]}>
              <Text style={[s.storeLabel, { color: store.color }]}>{store.label}</Text>
            </View>
          </View>

          {/* Price — tap to edit price only */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onPressPrice();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={({ pressed }) => [
              s.pricePill,
              {
                backgroundColor: pressed ? colors.primaryDim : colors.input,
                borderColor: pressed ? colors.primary : 'transparent',
              },
            ]}
          >
            <Text style={[s.priceText, { color: checked ? colors.muted : colors.primary }]}>
              €{price.toFixed(2)}
            </Text>
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'relative',
    marginBottom: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bgDel: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    backgroundColor: '#FF4757',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 20,
    flexDirection: 'row',
    gap: 6,
  },
  bgDelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameWrap: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
  storePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  storeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pricePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 54,
    alignItems: 'center',
    flexShrink: 0,
    borderWidth: 1,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
