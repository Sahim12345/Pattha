---
name: Pattha app structure
description: Muslim student companion app for Seelow, Germany — halal grocery/meal/health tracker with Revolut-style dark UI
---

## Key paths
- Context: `@/context/AppContext` (NOT `@/contexts/AppContext` — wrong path was deleted)
- Storage key: `pattha_data_v3`
- Data: `@/data/items.ts`, `@/data/halalChecker.ts`, `@/data/mealGenerator.ts`, `@/data/supplements.ts`
- Services: `@/services/notifications.ts` (uses expo-notifications — not installed, only used if screens import it)

## Tabs
index (Home), shopping (Shop), meals (Meals), health (Health), more (More)

## Theme
Deep ocean blue: `background: '#050d1a'`, `primary: '#00B4D8'`, `purple: '#7C3AED'`
`useColors()` always returns `colors.dark` palette (not light)

## Currency
EUR (€), German context (Seelow, Germany)

**Why:** App is specifically for Muslim students studying in Seelow, Germany. Halal grocery lists, meal generator, supplement tracker, hydration, BMI, mood, halal checker, prayer times, currency converter.
