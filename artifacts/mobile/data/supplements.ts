export type Supplement = {
  id: string;
  name: string;
  dose: string;
  timing: 'morning' | 'afternoon' | 'evening';
  icon: string;
  priority: 'high' | 'medium' | 'low';
  why: string;
  tip: string;
  price: string;
  store: string;
};

export const SUPPLEMENTS: Supplement[] = [
  {
    id: 'vitd',
    name: 'Vitamin D3',
    dose: '2000 IU (50 mcg)',
    timing: 'morning',
    icon: 'sun',
    priority: 'high',
    why: 'Germany gets very little sun. 80%+ of students are deficient. Critical for immunity, mood and bones.',
    tip: 'Take with breakfast — it is fat-soluble, so food helps absorption.',
    price: '~€4/3 months at Aldi',
    store: 'Aldi / Lidl / DM',
  },
  {
    id: 'b12',
    name: 'Vitamin B12',
    dose: '500–1000 mcg',
    timing: 'morning',
    icon: 'zap',
    priority: 'high',
    why: 'Essential for energy, nerve function and brain health. Often low if you eat little meat or dairy.',
    tip: 'Take in the morning — can cause energy boost if taken at night.',
    price: '~€5/3 months at DM',
    store: 'DM / Rossmann',
  },
  {
    id: 'omega3',
    name: 'Omega-3 Fish Oil',
    dose: '1000 mg (EPA+DHA)',
    timing: 'morning',
    icon: 'droplet',
    priority: 'high',
    why: 'Brain function, focus, anti-inflammation. Students studying intensively need omega-3 most.',
    tip: 'Take with a fatty meal. Freeze to reduce fishy burps.',
    price: '~€6/2 months at Aldi',
    store: 'Aldi / Kaufland',
  },
  {
    id: 'zinc',
    name: 'Zinc',
    dose: '15 mg',
    timing: 'evening',
    icon: 'shield',
    priority: 'medium',
    why: 'Immunity, testosterone, wound healing. Student diets are often zinc-poor.',
    tip: 'Do NOT take on an empty stomach — can cause nausea. Take with dinner.',
    price: '~€3/2 months at DM',
    store: 'DM / Aldi',
  },
  {
    id: 'magnesium',
    name: 'Magnesium',
    dose: '200–400 mg',
    timing: 'evening',
    icon: 'moon',
    priority: 'medium',
    why: 'Sleep quality, muscle relaxation, stress management. Perfect for exam stress.',
    tip: 'Take 30 min before bed. Magnesium citrate is best absorbed.',
    price: '~€4/2 months at Rossmann',
    store: 'Rossmann / DM',
  },
  {
    id: 'iron',
    name: 'Iron',
    dose: '14–18 mg',
    timing: 'morning',
    icon: 'activity',
    priority: 'low',
    why: 'If feeling constantly tired or cold — common in students who eat little red meat.',
    tip: 'Take with Vitamin C (lemon juice) for 3× better absorption. Do NOT take with tea.',
    price: '~€4/month at DM',
    store: 'DM / Rossmann',
  },
];
