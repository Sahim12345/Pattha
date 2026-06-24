export type HalalStatus = 'haram' | 'doubtful' | 'halal';

export type IngredientResult = {
  original: string;
  cleaned: string;
  status: HalalStatus;
  reason: string;
};

type CheckEntry = {
  status: HalalStatus;
  reason: string;
};

const HARAM_ENUMBERS: Record<string, CheckEntry> = {
  'e120': { status: 'haram', reason: 'Carmine / Cochineal — made from crushed insects' },
  'e441': { status: 'haram', reason: 'Gelatine — derived from pork/non-Halal animal bones' },
  'e542': { status: 'haram', reason: 'Edible Bone Phosphate — from non-Halal animals' },
  'e904': { status: 'doubtful', reason: 'Shellac — secreted by lac insects' },
  'e471': { status: 'doubtful', reason: 'Mono- and Diglycerides — may be from pork fat' },
  'e472': { status: 'doubtful', reason: 'Acetic/Lactic acid esters — may be animal-derived' },
  'e473': { status: 'doubtful', reason: 'Sucrose esters — may be from animal fat' },
  'e474': { status: 'doubtful', reason: 'Sucroglycerides — may be from animal fat' },
  'e475': { status: 'doubtful', reason: 'Polyglycerol esters — may be from pork fat' },
  'e476': { status: 'doubtful', reason: 'Polyglycerol polyricinoleate — may be animal-derived' },
  'e481': { status: 'doubtful', reason: 'Sodium stearoyl-2-lactylate — may be from animal fat' },
  'e482': { status: 'doubtful', reason: 'Calcium stearoyl-2-lactylate — may be from animal fat' },
  'e570': { status: 'doubtful', reason: 'Fatty acids — may be from animal (incl. pork) fat' },
  'e572': { status: 'doubtful', reason: 'Magnesium salts of fatty acids — may be animal-derived' },
  'e322': { status: 'doubtful', reason: 'Lecithin — usually soy (Halal) but may be animal-derived' },
  'e631': { status: 'doubtful', reason: 'Disodium inosinate — may be derived from pork or non-Halal fish' },
  'e635': { status: 'doubtful', reason: 'Disodium ribonucleotides — may be animal-derived' },
};

const DOUBTFUL_ENUMBERS: Record<string, CheckEntry> = {
  'e101': { status: 'doubtful', reason: 'Riboflavin — may be animal-derived' },
  'e270': { status: 'doubtful', reason: 'Lactic acid — usually synthetic but may be from non-Halal source' },
  'e325': { status: 'doubtful', reason: 'Sodium lactate — may be from non-Halal animal lactate' },
  'e326': { status: 'doubtful', reason: 'Potassium lactate — may be from non-Halal animal lactate' },
};

const HARAM_KEYWORDS: { pattern: RegExp; status: HalalStatus; reason: string }[] = [
  { pattern: /\bpork\b/i, status: 'haram', reason: 'Contains pork — strictly forbidden in Islam' },
  { pattern: /\bpig\b/i, status: 'haram', reason: 'Pig-derived ingredient' },
  { pattern: /\bgelatin[e]?\b/i, status: 'haram', reason: 'Gelatin — derived from pork/non-Halal animal bones unless marked "Halal"' },
  { pattern: /\blard\b/i, status: 'haram', reason: 'Lard — rendered pork fat' },
  { pattern: /\bham\b/i, status: 'haram', reason: 'Ham — pork product' },
  { pattern: /\bbacon\b/i, status: 'haram', reason: 'Bacon — pork product' },
  { pattern: /\bprosciutto\b/i, status: 'haram', reason: 'Prosciutto — cured pork meat' },
  { pattern: /\bsalami\b/i, status: 'doubtful', reason: 'Salami — usually pork, check for Halal certification' },
  { pattern: /\balcohol\b/i, status: 'haram', reason: 'Alcohol — forbidden in Islam' },
  { pattern: /\bwine\b/i, status: 'haram', reason: 'Wine — alcoholic beverage, forbidden in Islam' },
  { pattern: /\bbeer\b/i, status: 'haram', reason: 'Beer — alcoholic beverage, forbidden in Islam' },
  { pattern: /\brum\b/i, status: 'haram', reason: 'Rum — alcoholic beverage, forbidden in Islam' },
  { pattern: /\bwhisky\b/i, status: 'haram', reason: 'Whisky — alcoholic beverage, forbidden in Islam' },
  { pattern: /\bvodka\b/i, status: 'haram', reason: 'Vodka — alcoholic beverage, forbidden in Islam' },
  { pattern: /\bcarmine\b/i, status: 'haram', reason: 'Carmine — made from crushed cochineal insects' },
  { pattern: /\bcochineal\b/i, status: 'haram', reason: 'Cochineal — insect-derived red dye' },
  { pattern: /\brennet\b/i, status: 'doubtful', reason: 'Rennet — may be from non-Halal slaughtered animal, check for microbial/vegetable rennet' },
  { pattern: /\bvanilla extract\b/i, status: 'doubtful', reason: 'Vanilla extract — may contain alcohol' },
  { pattern: /\brum flavou?ring\b/i, status: 'doubtful', reason: 'Rum flavouring — may contain alcohol' },
];

export const HALAL_TIPS = [
  'Look for official Halal certification logos (HMC, ISWA, etc.) on the packaging.',
  'When in doubt about an E-number, avoid the product or contact the manufacturer.',
  'Gelatine in Germany is almost always pork-derived unless explicitly labelled Halal.',
  'Vanilla extract often contains alcohol — opt for vanilla paste or powder.',
  'E471 (mono- and diglycerides) is very common and often pork-derived. Check with manufacturer.',
  'At Kaufland and Edeka, look for dedicated Halal sections with certified products.',
  'Turkish / Arabic supermarkets in Frankfurt/Oder (FfO) stock certified Halal products.',
  '"May contain traces of pork" warnings are generally considered acceptable by most scholars.',
];

function normaliseEnumber(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, '').replace(/^e(\d)/, 'e$1');
}

export function checkIngredients(rawText: string): IngredientResult[] {
  const lines = rawText
    .split(/[,;\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((original) => {
    const cleaned = original.trim();
    const lower = cleaned.toLowerCase();

    // Check E-numbers
    const eMatch = lower.match(/e\s*\d{3,4}[a-z]?/i);
    if (eMatch) {
      const norm = normaliseEnumber(eMatch[0]);
      if (HARAM_ENUMBERS[norm]) return { original, cleaned, ...HARAM_ENUMBERS[norm] };
      if (DOUBTFUL_ENUMBERS[norm]) return { original, cleaned, ...DOUBTFUL_ENUMBERS[norm] };
    }

    // Check keywords
    for (const k of HARAM_KEYWORDS) {
      if (k.pattern.test(cleaned)) {
        return { original, cleaned, status: k.status, reason: k.reason };
      }
    }

    return { original, cleaned, status: 'halal', reason: 'No known haram or doubtful ingredients detected' };
  });
}
