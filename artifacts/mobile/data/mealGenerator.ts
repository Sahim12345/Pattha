export type MealEntry = {
  key: string;
  label: string;
  name: string;
  description: string;
  tags: string[];
};

export type DayPlan = {
  dayName: string;
  colorIndex: number;
  meals: MealEntry[];
};

function has(ingredients: string[], keywords: string[]): boolean {
  const lower = ingredients.map((i) => i.toLowerCase());
  return keywords.some((kw) => lower.some((i) => i.includes(kw)));
}

export function generateMealPlan(week: number, tickedItemNames: string[]): DayPlan[] {
  const ing = tickedItemNames;

  const hC = has(ing, ['chicken', 'hühner']);
  const hM = has(ing, ['mince', 'hack', 'keema', 'minced']);
  const hT = has(ing, ['tuna', 'thunfisch']);
  const hE = has(ing, ['egg', 'eier', 'eggs']);
  const hL = has(ing, ['lentil', 'linsen', 'dal', 'red lentil', 'green lentil']);
  const hCh = has(ing, ['chickpea', 'kichererbsen', 'chana']);
  const hR = has(ing, ['rice', 'reis', 'basmati']);
  const hBr = has(ing, ['bread', 'brot']);
  const hPa = has(ing, ['pasta', 'nudel', 'couscous', 'bulgur']);
  const hO = has(ing, ['oat', 'haferflocken', 'oats']);
  const hMi = has(ing, ['milk', 'milch']);
  const hY = has(ing, ['yoghurt', 'joghurt', 'yogurt', 'greek yoghurt']);
  const hBn = has(ing, ['banana', 'banane']);
  const hAp = has(ing, ['apple', 'apfel', 'pear']);
  const hTo = has(ing, ['tomato', 'tomate']);
  const hOn = has(ing, ['onion', 'zwiebel']);
  const hGa = has(ing, ['garlic', 'knoblauch']);
  const hCa = has(ing, ['carrot', 'karotte', 'sweet potato']);
  const hSp = has(ing, ['spinach', 'spinat', 'broccoli', 'zucchini', 'peas', 'cauliflower']);
  const hW = has(ing, ['walnut', 'walnuss', 'almond', 'nut', 'pumpkin seed']);
  const hCo = has(ing, ['chocolate', 'schokolade', 'dark chocolate']);
  const hPb = has(ing, ['peanut', 'erdnuss', 'tahini']);
  const hSc = has(ing, ['garam', 'masala', 'cumin', 'turmeric', 'paprika', 'coriander', 'chili']);
  const hLe = has(ing, ['lemon', 'zitrone']);
  const hCoc = has(ing, ['coconut']);

  const w = week;

  const m = (
    slot: number,
    dayIndex: number,
    label: string,
    name: string,
    desc: string,
    tags: string[],
  ): MealEntry => ({
    key: `w${w}_${dayIndex}_${slot}`,
    label,
    name,
    description: desc,
    tags,
  });

  const days: DayPlan[] = [
    {
      dayName: 'Monday',
      colorIndex: 0,
      meals: [
        m(0, 0, 'Breakfast',
          hO && hMi ? 'Masala Oats' + (hBn ? ' + Banana' : '') : hE && hBr ? 'Spiced Egg Toast' : 'Bread & Tea',
          hO ? `Oats + milk${hBn ? ' + banana' : ''} + cardamom` : hE ? 'Eggs + spices + bread' : 'Bread + tea',
          ['Energy', 'Brain']),
        m(1, 0, 'Lunch',
          hL && hR ? 'Dal Tadka + Rice' : hCh && hR ? 'Chana Masala + Rice' : 'Grain Bowl',
          hL ? `Lentils + ${hOn ? 'onions + ' : ''}${hSc ? 'Garam Masala' : 'spices'}${hR ? ' + rice' : ''}` : `Chickpeas${hTo ? ' + tomatoes' : ''}${hR ? ' + rice' : ''}`,
          ['Protein', 'Energy', 'Halal ✓']),
        m(2, 0, 'Dinner',
          hC ? 'Chicken Karahi' : hM ? 'Keema + Rice' : hE && hTo ? 'Egg Bhurji + Bread' : 'Lentil Soup',
          hC ? `Chicken + ${hTo ? 'tomatoes + ' : ''}${hSc ? 'spices' : 'salt'}${hR ? ' + rice' : ''}` : hM ? `Mince + ${hOn ? 'onions + ' : ''}${hSc ? 'masala' : 'spices'}${hR ? ' + rice' : ''}` : `Eggs + ${hTo ? 'tomatoes + ' : ''}spices`,
          ['Protein', 'Fiber']),
        m(3, 0, 'Snack',
          hAp && hW ? 'Apple + Nuts' : hBn && hPb ? 'Banana + Peanut Butter' : hCo ? 'Dark Chocolate' : 'Fruit',
          hAp ? `Apple + ${hW ? 'walnuts' : 'tea'}` : hBn ? `Banana${hPb ? ' + peanut butter' : ''}` : 'Seasonal fruit',
          ['Brain', 'Energy']),
      ],
    },
    {
      dayName: 'Tuesday',
      colorIndex: 1,
      meals: [
        m(0, 1, 'Breakfast',
          hE ? 'Scrambled Eggs' + (hBr ? ' on Toast' : '') : hO ? 'Porridge' : 'Yoghurt Bowl',
          hE ? `Eggs${hBr ? ' + toast' : ''}${hTo ? ' + tomatoes' : ''}` : hO ? `Oats${hMi ? ' + milk' : ''}${hBn ? ' + banana' : ''}` : `Yoghurt${hBn ? ' + banana' : ''}`,
          ['Protein', 'Energy']),
        m(1, 1, 'Lunch',
          hC && hPa ? 'Chicken Pasta' : hT && hR ? 'Tuna Rice Bowl' : hL ? 'Lentil Soup + Bread' : 'Rice Bowl',
          hC ? `Chicken${hPa ? ' + pasta' : ' + rice'}${hSp ? ' + veg' : ''}` : hT ? `Tuna${hR ? ' + rice' : ''}${hLe ? ' + lemon' : ''}` : `Lentils${hBr ? ' + bread' : ''}`,
          ['Protein', 'Fiber', 'Halal ✓']),
        m(2, 1, 'Dinner',
          hM && hR ? 'Keema Pilaf' : hCh ? 'Chana Dal' : hC ? 'Chicken Curry + Rice' : 'Veggie Stir-Fry',
          hM ? `Mince${hOn ? ' + onions' : ''}${hSc ? ' + spices' : ''}${hR ? ' + rice' : ''}` : hCh ? `Chickpeas${hSp ? ' + spinach' : ''}${hSc ? ' + masala' : ''}` : `Vegetables${hR ? ' + rice' : ''}`,
          ['Protein', 'Energy']),
        m(3, 1, 'Snack',
          hY ? 'Greek Yoghurt' + (hBn ? ' + Banana' : '') : hCo ? 'Dark Chocolate + Tea' : 'Nuts',
          hY ? `Yoghurt${hBn ? ' + banana' : ''}` : `${hW ? 'Walnuts' : 'Mixed nuts'} + tea`,
          ['Brain', 'Mood']),
      ],
    },
    {
      dayName: 'Wednesday',
      colorIndex: 2,
      meals: [
        m(0, 2, 'Breakfast',
          hO ? 'Overnight Oats' : hE && hBr ? 'French Toast' : 'Yoghurt & Fruit',
          hO ? `Oats${hMi ? ' + milk' : ''}${hY ? ' + yoghurt' : ''}${hBn ? ' + banana' : ''}` : hE ? `Eggs${hBr ? ' + bread' : ''}${hMi ? ' + milk' : ''}` : `Yoghurt + seasonal fruit`,
          ['Energy', 'Fiber']),
        m(1, 2, 'Lunch',
          hC && hR ? 'Chicken Biryani' : hL && hBr ? 'Dal + Bread' : hT ? 'Tuna Salad' : 'Chickpea Curry',
          hC ? `Chicken + basmati + spices${hSc ? ' + garam masala' : ''}` : hL ? `Lentils${hGa ? ' + garlic' : ''}${hSc ? ' + cumin' : ''}${hBr ? ' + bread' : ''}` : `Tuna${hTo ? ' + tomatoes' : ''}${hLe ? ' + lemon' : ''}`,
          ['Protein', 'Iron', 'Halal ✓']),
        m(2, 2, 'Dinner',
          hM ? 'Shepherd\'s Pie (Halal)' : hE ? 'Egg Curry + Rice' : 'Vegetable Soup',
          hM ? `Mince${hCa ? ' + carrots' : ''}${hOn ? ' + onions' : ''}${hR ? ' + rice topping' : ''}` : hE ? `Eggs${hSc ? ' + spices' : ''}${hR ? ' + rice' : ''}` : `Mixed veg${hBr ? ' + bread' : ''}`,
          ['Protein', 'Fiber']),
        m(3, 2, 'Snack',
          hPb && hBn ? 'Peanut Butter Banana' : hW ? 'Walnut & Dark Chocolate' : 'Fresh Fruit',
          hPb ? `Peanut butter + banana${hBr ? ' on bread' : ''}` : `${hW ? 'Walnuts' : 'Nuts'} + ${hCo ? 'dark chocolate' : 'fruit'}`,
          ['Brain', 'Omega-3']),
      ],
    },
    {
      dayName: 'Thursday',
      colorIndex: 3,
      meals: [
        m(0, 3, 'Breakfast',
          hE && hOn ? 'Omelette' : hO ? 'Masala Porridge' : 'Toast & Peanut Butter',
          hE ? `Eggs${hOn ? ' + onions' : ''}${hTo ? ' + tomatoes' : ''}${hSp ? ' + spinach' : ''}` : hO ? `Oats${hSc ? ' + cardamom' : ''}${hMi ? ' + milk' : ''}` : `Toast${hPb ? ' + peanut butter' : ''}`,
          ['Protein', 'Energy']),
        m(1, 3, 'Lunch',
          hCh && hR ? 'Chana Masala + Rice' : hC ? 'Chicken Wrap' : hL ? 'Red Lentil Soup' : 'Pasta Bowl',
          hCh ? `Chickpeas${hTo ? ' + tomatoes' : ''}${hSc ? ' + spices' : ''}${hR ? ' + rice' : ''}` : hC ? `Chicken${hBr ? ' in bread' : ''}${hSp ? ' + veg' : ''}` : `Lentils${hLe ? ' + lemon' : ''}`,
          ['Protein', 'Fiber', 'Halal ✓']),
        m(2, 3, 'Dinner',
          hC && hCoc ? 'Coconut Chicken Curry' : hM ? 'Bolognese (Halal)' : hT ? 'Tuna Pasta' : 'Dal + Rice',
          hC ? `Chicken${hCoc ? ' + coconut milk' : ''}${hSc ? ' + curry spices' : ''}` : hM ? `Mince${hTo ? ' + tomatoes' : ''}${hPa ? ' + pasta' : ''}` : `Lentils${hR ? ' + rice' : ''}`,
          ['Protein', 'Gut Health']),
        m(3, 3, 'Snack',
          hY && hBn ? 'Yoghurt Parfait' : hCo ? 'Dark Chocolate' : 'Fruit Bowl',
          hY ? `Yoghurt${hBn ? ' + banana' : ''}${hW ? ' + walnuts' : ''}` : `${hCo ? 'Dark chocolate' : 'Fresh fruit'} + tea`,
          ['Mood', 'Energy']),
      ],
    },
    {
      dayName: 'Friday',
      colorIndex: 4,
      meals: [
        m(0, 4, 'Breakfast',
          hO && hBn ? 'Banana Porridge' : hE ? 'Spiced Omelette' : 'Bread & Honey',
          hO ? `Oats + banana${hMi ? ' + milk' : ''}${hW ? ' + walnuts' : ''}` : hE ? `Eggs${hSc ? ' + turmeric + cumin' : ''}${hBr ? ' + bread' : ''}` : 'Wholegrain bread + honey + tea',
          ['Energy', 'Brain']),
        m(1, 4, 'Lunch',
          'Jumu\'ah Special',
          hC && hR ? `Chicken biryani${hSc ? ' + raita' : ''}` : hM ? `Keema + naan` : `Lentil soup + bread`,
          ['Halal ✓', 'Protein', 'Energy']),
        m(2, 4, 'Dinner',
          hC ? 'Chicken BBQ + Rice' : hM ? 'Kofta + Rice' : hL ? 'Dahl Makhani' : 'Veggie Pilaf',
          hC ? `Chicken${hSc ? ' + spices' : ''}${hR ? ' + rice' : ''}${hSp ? ' + salad' : ''}` : hM ? `Meatballs${hSc ? ' + spices' : ''}${hR ? ' + rice' : ''}` : `Lentils${hSc ? ' + ghee + spices' : ''}`,
          ['Protein', 'Iron', 'Halal ✓']),
        m(3, 4, 'Snack',
          hCo && hW ? 'Dark Chocolate + Walnuts' : hBn && hPb ? 'Banana & PB' : 'Dates & Nuts',
          `${hCo ? 'Dark chocolate' : 'Dates'}${hW ? ' + walnuts' : hPb ? ' + peanut butter' : ''}`,
          ['Brain', 'Omega-3']),
      ],
    },
    {
      dayName: 'Saturday',
      colorIndex: 5,
      meals: [
        m(0, 5, 'Breakfast',
          hE ? 'Full Halal Fry-Up' : hO ? 'Weekend Porridge' : 'Pancakes',
          hE ? `Eggs${hTo ? ' + tomatoes' : ''}${hBr ? ' + toast' : ''}` : hO ? `Oats${hBn ? ' + banana' : ''}${hMi ? ' + milk' : ''}${hY ? ' + yoghurt' : ''}` : `Oats${hE ? ' + eggs' : ''}${hBn ? ' + banana' : ''}`,
          ['Protein', 'Energy']),
        m(1, 5, 'Lunch',
          hC ? 'Chicken Sandwich' : hM ? 'Meat Wrap' : hT ? 'Tuna Melt' : 'Veggie Wrap',
          hC ? `Chicken${hBr ? ' + bread' : ''}${hSp ? ' + salad' : ''}` : hT ? `Tuna${hBr ? ' + toast' : ''}${hTo ? ' + tomatoes' : ''}` : `Chickpeas${hBr ? ' + wrap' : ''}${hSp ? ' + veg' : ''}`,
          ['Protein', 'Fiber']),
        m(2, 5, 'Dinner',
          hC && hCoc ? 'Coconut Chicken' : hM ? 'Mince Curry + Naan' : hCh ? 'Chana Aloo' : 'Pasta Primavera (Halal)',
          hC ? `Chicken${hCoc ? ' + coconut milk' : ''}${hR ? ' + rice' : ''}` : hM ? `Mince${hSc ? ' + masala' : ''}${hR ? ' + rice' : ''}` : `Chickpeas${hCa ? ' + potatoes' : ''}${hSc ? ' + spices' : ''}`,
          ['Protein', 'Gut Health', 'Halal ✓']),
        m(3, 5, 'Snack',
          'Movie Night Snack',
          hCo ? 'Dark chocolate + nuts' : hPb ? 'Peanut butter + apple' : 'Popcorn + tea',
          ['Mood', 'Brain']),
      ],
    },
    {
      dayName: 'Sunday',
      colorIndex: 6,
      meals: [
        m(0, 6, 'Breakfast',
          hE && hO ? 'Protein Pancakes' : hO ? 'Banana Oat Smoothie' : 'Continental Breakfast',
          hE && hO ? `Eggs + oats${hBn ? ' + banana' : ''}${hMi ? ' + milk' : ''}` : hO ? `Oats + banana${hMi ? ' + milk' : ''}${hPb ? ' + peanut butter' : ''}` : `Bread + ${hY ? 'yoghurt' : 'cheese'} + fruit`,
          ['Protein', 'Energy', 'Fiber']),
        m(1, 6, 'Lunch',
          'Meal Prep Sunday',
          hC && hR ? `Bulk chicken + rice${hSp ? ' + roasted veg' : ''}` : hL ? `Big pot dal${hR ? ' + rice' : ''}${hBr ? ' + bread' : ''}` : `Grain salad${hCh ? ' + chickpeas' : ''}${hSp ? ' + veg' : ''}`,
          ['Protein', 'Fiber', 'Energy']),
        m(2, 6, 'Dinner',
          hC ? 'Sunday Roast Chicken' : hM ? 'Biryani' : hCh ? 'Chana Saag' : 'Lentil Dahl',
          hC ? `Whole chicken${hCa ? ' + carrots' : ''}${hSp ? ' + spinach' : ''}` : hM ? `Mince biryani${hSc ? ' + fried onions + spices' : ''}${hR ? ' + basmati' : ''}` : `Dal${hSp ? ' + greens' : ''}${hR ? ' + rice' : ''}`,
          ['Protein', 'Iron', 'Halal ✓']),
        m(3, 6, 'Snack',
          'Prep for the week',
          hW && hCo ? 'Walnuts + dark chocolate' : hY && hBn ? 'Yoghurt + banana + honey' : 'Fruit + nuts',
          ['Brain', 'Omega-3', 'Mood']),
      ],
    },
  ];

  return days;
}
