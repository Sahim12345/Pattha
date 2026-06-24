export type BuiltinItem = {
  id: string;
  name: string;
  defaultPrice: number;
  storeKey: string;
};

export type ItemCategory = {
  cat: string;
  items: BuiltinItem[];
};

export const STORES: Record<string, { label: string; color: string; bg: string }> = {
  a: { label: 'Aldi', color: '#6aaaf5', bg: '#0d1f45' },
  l: { label: 'Lidl', color: '#ffaa40', bg: '#2a1400' },
  k: { label: 'Kaufland', color: '#ff7070', bg: '#2a0c0c' },
  e: { label: 'Edeka', color: '#3ad870', bg: '#081e10' },
  n: { label: 'Netto', color: '#b570f5', bg: '#1e0a2d' },
  f: { label: 'FfO', color: '#50c8e8', bg: '#091e2a' },
  any: { label: 'Any', color: '#9090b8', bg: '#1e1e2e' },
  c: { label: 'Other', color: '#9090d8', bg: '#161628' },
};

export const CATEGORIES = [
  '🥩 Protein (Halal)',
  '🌾 Grains & Carbs',
  '🫘 Legumes',
  '🥦 Vegetables & Fruit',
  '🥛 Dairy',
  '🧂 Pantry',
  '🍫 Brain & Mood',
  '📝 Added Items',
];

export const BUILTIN_ITEMS: Record<number, ItemCategory[]> = {
  1: [
    {
      cat: '🥩 Protein (Halal)',
      items: [
        { id: '1-1', name: 'Halal Chicken Breast 500g', defaultPrice: 3.49, storeKey: 'k' },
        { id: '1-2', name: 'Halal Minced Meat 400g', defaultPrice: 2.99, storeKey: 'k' },
        { id: '1-3', name: 'Eggs 10-pack', defaultPrice: 1.89, storeKey: 'a' },
        { id: '1-4', name: 'Tuna in Water 2×185g', defaultPrice: 1.19, storeKey: 'l' },
      ],
    },
    {
      cat: '🌾 Grains & Carbs',
      items: [
        { id: '1-5', name: 'Basmati Rice 1kg', defaultPrice: 1.49, storeKey: 'k' },
        { id: '1-6', name: 'Oats 500g', defaultPrice: 0.59, storeKey: 'a' },
        { id: '1-7', name: 'Wholegrain Bread 500g', defaultPrice: 1.29, storeKey: 'e' },
        { id: '1-8', name: 'Pasta 500g', defaultPrice: 0.79, storeKey: 'a' },
      ],
    },
    {
      cat: '🫘 Legumes',
      items: [
        { id: '1-9', name: 'Red Lentils 500g', defaultPrice: 0.99, storeKey: 'e' },
        { id: '1-10', name: 'Chickpeas (can) 400g', defaultPrice: 0.79, storeKey: 'l' },
      ],
    },
    {
      cat: '🥦 Vegetables & Fruit',
      items: [
        { id: '1-11', name: 'Bananas 1kg', defaultPrice: 0.79, storeKey: 'a' },
        { id: '1-12', name: 'Apples 1kg', defaultPrice: 1.29, storeKey: 'l' },
        { id: '1-13', name: 'Tomatoes 500g', defaultPrice: 0.99, storeKey: 'n' },
        { id: '1-14', name: 'Onions 1kg', defaultPrice: 0.69, storeKey: 'a' },
        { id: '1-15', name: 'Carrots 1kg', defaultPrice: 0.79, storeKey: 'a' },
        { id: '1-16', name: 'Frozen Spinach 450g', defaultPrice: 0.99, storeKey: 'l' },
        { id: '1-17', name: 'Garlic (bulb)', defaultPrice: 0.49, storeKey: 'a' },
        { id: '1-18', name: 'Lemon 2×', defaultPrice: 0.49, storeKey: 'n' },
      ],
    },
    {
      cat: '🥛 Dairy',
      items: [
        { id: '1-19', name: 'Full-fat Milk 1L', defaultPrice: 0.95, storeKey: 'a' },
        { id: '1-20', name: 'Yoghurt 500g', defaultPrice: 0.79, storeKey: 'a' },
      ],
    },
    {
      cat: '🧂 Pantry (lasts all month!)',
      items: [
        { id: '1-21', name: 'Sunflower Oil 750ml', defaultPrice: 1.49, storeKey: 'a' },
        { id: '1-22', name: 'Peanut Butter 250g', defaultPrice: 1.49, storeKey: 'k' },
        { id: '1-23', name: 'Garam Masala', defaultPrice: 1.29, storeKey: 'f' },
        { id: '1-24', name: 'Cumin Seeds', defaultPrice: 0.99, storeKey: 'f' },
        { id: '1-25', name: 'Turmeric Powder', defaultPrice: 0.89, storeKey: 'f' },
        { id: '1-26', name: 'Salt 1kg', defaultPrice: 0.29, storeKey: 'a' },
      ],
    },
    {
      cat: '🍫 Brain & Mood',
      items: [
        { id: '1-27', name: 'Dark Chocolate 70% 100g', defaultPrice: 0.89, storeKey: 'l' },
        { id: '1-28', name: 'Walnuts 200g', defaultPrice: 1.99, storeKey: 'a' },
      ],
    },
  ],
  2: [
    {
      cat: '🥩 Protein (Halal)',
      items: [
        { id: '2-1', name: 'Halal Chicken Thighs 600g', defaultPrice: 3.79, storeKey: 'k' },
        { id: '2-2', name: 'Halal Beef Strips 300g', defaultPrice: 3.49, storeKey: 'k' },
        { id: '2-3', name: 'Eggs 10-pack', defaultPrice: 1.89, storeKey: 'a' },
        { id: '2-4', name: 'Sardines in Tomato Sauce 2×', defaultPrice: 1.09, storeKey: 'l' },
      ],
    },
    {
      cat: '🌾 Grains & Carbs',
      items: [
        { id: '2-5', name: 'Basmati Rice 1kg', defaultPrice: 1.49, storeKey: 'k' },
        { id: '2-6', name: 'Oats 500g', defaultPrice: 0.59, storeKey: 'a' },
        { id: '2-7', name: 'Wholegrain Bread 500g', defaultPrice: 1.29, storeKey: 'e' },
        { id: '2-8', name: 'Bulgur Wheat 500g', defaultPrice: 0.99, storeKey: 'f' },
      ],
    },
    {
      cat: '🫘 Legumes',
      items: [
        { id: '2-9', name: 'Green Lentils 500g', defaultPrice: 0.99, storeKey: 'e' },
        { id: '2-10', name: 'Black Beans (can) 400g', defaultPrice: 0.79, storeKey: 'l' },
      ],
    },
    {
      cat: '🥦 Vegetables & Fruit',
      items: [
        { id: '2-11', name: 'Bananas 1kg', defaultPrice: 0.79, storeKey: 'a' },
        { id: '2-12', name: 'Oranges 1kg', defaultPrice: 1.19, storeKey: 'l' },
        { id: '2-13', name: 'Bell Peppers 3×', defaultPrice: 1.49, storeKey: 'n' },
        { id: '2-14', name: 'Onions 1kg', defaultPrice: 0.69, storeKey: 'a' },
        { id: '2-15', name: 'Broccoli 400g', defaultPrice: 0.99, storeKey: 'a' },
        { id: '2-16', name: 'Frozen Peas 450g', defaultPrice: 0.89, storeKey: 'l' },
        { id: '2-17', name: 'Garlic (bulb)', defaultPrice: 0.49, storeKey: 'a' },
        { id: '2-18', name: 'Cucumber', defaultPrice: 0.59, storeKey: 'n' },
      ],
    },
    {
      cat: '🥛 Dairy',
      items: [
        { id: '2-19', name: 'Full-fat Milk 1L', defaultPrice: 0.95, storeKey: 'a' },
        { id: '2-20', name: 'Cream Cheese 200g', defaultPrice: 0.99, storeKey: 'a' },
      ],
    },
    {
      cat: '🧂 Pantry',
      items: [
        { id: '2-21', name: 'Tomato Passata 700g', defaultPrice: 0.89, storeKey: 'a' },
        { id: '2-22', name: 'Soy Sauce 150ml', defaultPrice: 0.99, storeKey: 'e' },
        { id: '2-23', name: 'Paprika Powder', defaultPrice: 0.89, storeKey: 'f' },
        { id: '2-24', name: 'Olive Oil 500ml', defaultPrice: 2.99, storeKey: 'l' },
      ],
    },
    {
      cat: '🍫 Brain & Mood',
      items: [
        { id: '2-25', name: 'Dark Chocolate 70% 100g', defaultPrice: 0.89, storeKey: 'l' },
        { id: '2-26', name: 'Mixed Nuts 200g', defaultPrice: 2.49, storeKey: 'a' },
      ],
    },
  ],
  3: [
    {
      cat: '🥩 Protein (Halal)',
      items: [
        { id: '3-1', name: 'Halal Chicken Drumsticks 800g', defaultPrice: 3.29, storeKey: 'k' },
        { id: '3-2', name: 'Halal Lamb Mince 400g', defaultPrice: 4.49, storeKey: 'k' },
        { id: '3-3', name: 'Eggs 10-pack', defaultPrice: 1.89, storeKey: 'a' },
        { id: '3-4', name: 'Tuna in Olive Oil 2×', defaultPrice: 1.39, storeKey: 'l' },
      ],
    },
    {
      cat: '🌾 Grains & Carbs',
      items: [
        { id: '3-5', name: 'Basmati Rice 1kg', defaultPrice: 1.49, storeKey: 'k' },
        { id: '3-6', name: 'Oats 500g', defaultPrice: 0.59, storeKey: 'a' },
        { id: '3-7', name: 'Rye Bread 500g', defaultPrice: 1.49, storeKey: 'e' },
        { id: '3-8', name: 'Couscous 500g', defaultPrice: 0.99, storeKey: 'f' },
      ],
    },
    {
      cat: '🫘 Legumes',
      items: [
        { id: '3-9', name: 'Red Lentils 500g', defaultPrice: 0.99, storeKey: 'e' },
        { id: '3-10', name: 'Kidney Beans (can) 400g', defaultPrice: 0.79, storeKey: 'l' },
      ],
    },
    {
      cat: '🥦 Vegetables & Fruit',
      items: [
        { id: '3-11', name: 'Bananas 1kg', defaultPrice: 0.79, storeKey: 'a' },
        { id: '3-12', name: 'Pears 1kg', defaultPrice: 1.29, storeKey: 'l' },
        { id: '3-13', name: 'Tomatoes 500g', defaultPrice: 0.99, storeKey: 'n' },
        { id: '3-14', name: 'Sweet Potatoes 1kg', defaultPrice: 1.29, storeKey: 'a' },
        { id: '3-15', name: 'Zucchini 2×', defaultPrice: 0.89, storeKey: 'a' },
        { id: '3-16', name: 'Frozen Mixed Veg 450g', defaultPrice: 0.99, storeKey: 'l' },
        { id: '3-17', name: 'Garlic (bulb)', defaultPrice: 0.49, storeKey: 'a' },
        { id: '3-18', name: 'Fresh Ginger', defaultPrice: 0.59, storeKey: 'n' },
      ],
    },
    {
      cat: '🥛 Dairy',
      items: [
        { id: '3-19', name: 'Full-fat Milk 1L', defaultPrice: 0.95, storeKey: 'a' },
        { id: '3-20', name: 'Greek Yoghurt 500g', defaultPrice: 1.29, storeKey: 'a' },
      ],
    },
    {
      cat: '🧂 Pantry',
      items: [
        { id: '3-21', name: 'Coconut Milk (can)', defaultPrice: 0.99, storeKey: 'e' },
        { id: '3-22', name: 'Honey 250g', defaultPrice: 1.99, storeKey: 'k' },
        { id: '3-23', name: 'Coriander Powder', defaultPrice: 0.89, storeKey: 'f' },
        { id: '3-24', name: 'Chili Flakes', defaultPrice: 0.79, storeKey: 'f' },
      ],
    },
    {
      cat: '🍫 Brain & Mood',
      items: [
        { id: '3-25', name: 'Dark Chocolate 85% 100g', defaultPrice: 1.19, storeKey: 'l' },
        { id: '3-26', name: 'Pumpkin Seeds 150g', defaultPrice: 1.49, storeKey: 'a' },
      ],
    },
  ],
  4: [
    {
      cat: '🥩 Protein (Halal)',
      items: [
        { id: '4-1', name: 'Halal Chicken Whole 1.2kg', defaultPrice: 4.99, storeKey: 'k' },
        { id: '4-2', name: 'Halal Minced Meat 400g', defaultPrice: 2.99, storeKey: 'k' },
        { id: '4-3', name: 'Eggs 10-pack', defaultPrice: 1.89, storeKey: 'a' },
        { id: '4-4', name: 'Mackerel (can) 2×', defaultPrice: 1.09, storeKey: 'l' },
      ],
    },
    {
      cat: '🌾 Grains & Carbs',
      items: [
        { id: '4-5', name: 'Basmati Rice 1kg', defaultPrice: 1.49, storeKey: 'k' },
        { id: '4-6', name: 'Oats 500g', defaultPrice: 0.59, storeKey: 'a' },
        { id: '4-7', name: 'Wholegrain Bread 500g', defaultPrice: 1.29, storeKey: 'e' },
        { id: '4-8', name: 'Pasta 500g', defaultPrice: 0.79, storeKey: 'a' },
      ],
    },
    {
      cat: '🫘 Legumes',
      items: [
        { id: '4-9', name: 'Red Lentils 500g', defaultPrice: 0.99, storeKey: 'e' },
        { id: '4-10', name: 'Chickpeas (can) 400g', defaultPrice: 0.79, storeKey: 'l' },
      ],
    },
    {
      cat: '🥦 Vegetables & Fruit',
      items: [
        { id: '4-11', name: 'Bananas 1kg', defaultPrice: 0.79, storeKey: 'a' },
        { id: '4-12', name: 'Apples 1kg', defaultPrice: 1.29, storeKey: 'l' },
        { id: '4-13', name: 'Cherry Tomatoes 250g', defaultPrice: 0.99, storeKey: 'n' },
        { id: '4-14', name: 'Onions 1kg', defaultPrice: 0.69, storeKey: 'a' },
        { id: '4-15', name: 'Cauliflower', defaultPrice: 1.19, storeKey: 'a' },
        { id: '4-16', name: 'Frozen Spinach 450g', defaultPrice: 0.99, storeKey: 'l' },
        { id: '4-17', name: 'Garlic (bulb)', defaultPrice: 0.49, storeKey: 'a' },
        { id: '4-18', name: 'Lemon 2×', defaultPrice: 0.49, storeKey: 'n' },
      ],
    },
    {
      cat: '🥛 Dairy',
      items: [
        { id: '4-19', name: 'Full-fat Milk 1L', defaultPrice: 0.95, storeKey: 'a' },
        { id: '4-20', name: 'Yoghurt 500g', defaultPrice: 0.79, storeKey: 'a' },
      ],
    },
    {
      cat: '🧂 Pantry',
      items: [
        { id: '4-21', name: 'Sunflower Oil 750ml', defaultPrice: 1.49, storeKey: 'a' },
        { id: '4-22', name: 'Tahini 250g', defaultPrice: 1.99, storeKey: 'f' },
        { id: '4-23', name: 'Cumin Powder', defaultPrice: 0.89, storeKey: 'f' },
        { id: '4-24', name: 'Tomato Paste 200g', defaultPrice: 0.49, storeKey: 'a' },
      ],
    },
    {
      cat: '🍫 Brain & Mood',
      items: [
        { id: '4-25', name: 'Dark Chocolate 70% 100g', defaultPrice: 0.89, storeKey: 'l' },
        { id: '4-26', name: 'Almonds 150g', defaultPrice: 1.99, storeKey: 'a' },
      ],
    },
  ],
};
