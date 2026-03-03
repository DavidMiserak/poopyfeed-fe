/**
 * Fuss Bus content data: symptom types, checklist items, soothing toolkit,
 * doctor/self-care/colic copy, and developmental context. No Angular deps.
 */

export const FUSS_BUS_SYMPTOM_IDS = [
  'crying',
  'refusing_food',
  'wont_sleep',
  'general_fussiness',
] as const;
export type FussBusSymptomId = (typeof FUSS_BUS_SYMPTOM_IDS)[number];

export interface SymptomType {
  id: FussBusSymptomId;
  label: string;
  description: string;
  /** Contextual emoji shown as a visual anchor in the symptom card. */
  icon: string;
  /** Minimum age in months to show this option (e.g. 12 for Refusing food). */
  minAgeMonths?: number;
}

export const SYMPTOM_TYPES: SymptomType[] = [
  { id: 'crying', label: 'Crying', description: 'General distress, inconsolable', icon: '😢' },
  { id: 'refusing_food', label: 'Refusing food', description: 'Fussy eating, not interested', icon: '🍼', minAgeMonths: 12 },
  { id: 'wont_sleep', label: "Won't sleep", description: 'Fighting naps, restless', icon: '😴' },
  { id: 'general_fussiness', label: 'General fussiness', description: 'Irritable, clingy, unsettled', icon: '😣' },
];

/** Auto-check item keys used to derive state from API data. */
export const AUTO_CHECK_IDS = ['fed', 'diaper', 'nap'] as const;
export type AutoCheckId = (typeof AUTO_CHECK_IDS)[number];

export interface AgeRange {
  minMonths?: number;
  maxMonths?: number;
}

/** Manual checklist item definition; filtered by symptom and age. */
export interface ChecklistItemDef {
  id: string;
  label: string;
  /** Which symptoms show this item (empty = all). */
  symptomIds: FussBusSymptomId[];
  ageRange?: AgeRange;
}

/** Manual items common to all symptom types. */
const COMMON_MANUAL_ITEMS: ChecklistItemDef[] = [
  { id: 'comfortable_temperature', label: 'Comfortable temperature (not too hot/cold)', symptomIds: [] },
  { id: 'not_overstimulated', label: 'Not overstimulated (calm environment)', symptomIds: [] },
  { id: 'held_comforted', label: 'Held/comforted recently', symptomIds: [] },
];

/** Age-filtered manual items (symptomIds empty = all). */
const AGE_FILTERED_ITEMS: ChecklistItemDef[] = [
  { id: 'no_teething', label: 'No teething signs', symptomIds: [], ageRange: { minMonths: 4, maxMonths: 24 } },
  { id: 'no_illness', label: 'No illness symptoms (fever, rash, vomiting)', symptomIds: [] },
  { id: 'not_growth_spurt', label: 'Not in a growth spurt (common at 2–3 weeks, 6 weeks, 3 months)', symptomIds: [] },
  { id: 'no_separation_anxiety', label: 'Not experiencing separation anxiety', symptomIds: [], ageRange: { minMonths: 6 } },
];

/** Symptom-specific manual items. */
const SYMPTOM_SPECIFIC_ITEMS: ChecklistItemDef[] = [
  { id: 'gas_burping', label: 'Gas/burping needed', symptomIds: ['crying'] },
  { id: 'witching_hour', label: 'Witching hour (late afternoon, 0–4 months)', symptomIds: ['crying'], ageRange: { maxMonths: 4 } },
  { id: 'offering_variety', label: 'Offering variety without pressure', symptomIds: ['refusing_food'] },
  { id: 'mealtime_relaxed', label: 'Mealtime is relaxed', symptomIds: ['refusing_food'] },
  { id: 'milk_intake', label: 'Milk intake under 400ml/day (12+ months)', symptomIds: ['refusing_food'], ageRange: { minMonths: 12 } },
  { id: 'sleep_routine', label: 'Consistent sleep routine', symptomIds: ['wont_sleep'] },
  { id: 'dark_quiet_room', label: 'Dark/quiet room', symptomIds: ['wont_sleep'] },
  { id: 'not_overtired', label: 'Not overtired (missed sleep window)', symptomIds: ['wont_sleep'] },
];

/** All manual checklist definitions (order preserved for display). */
export const MANUAL_CHECKLIST_DEFS: ChecklistItemDef[] = [
  ...COMMON_MANUAL_ITEMS,
  ...AGE_FILTERED_ITEMS,
  ...SYMPTOM_SPECIFIC_ITEMS,
];

export interface SoothingCategory {
  title: string;
  items: string[];
}

export const SOOTHING_TOOLKIT: SoothingCategory[] = [
  { title: 'Comforting Touch', items: ['Rock', 'Cuddle', 'Massage', 'Baby carrier', 'Colic hold'] },
  { title: 'Calming Sounds', items: ['White noise', 'Soft music', 'Singing'] },
  { title: 'Rhythmic Motion', items: ['Stroller walk', 'Car ride', 'Gentle bouncing'] },
  { title: 'Other', items: ['Warm bath', 'Swaddling', 'Pacifier'] },
];

export const WHEN_TO_CALL_DOCTOR_BULLETS: string[] = [
  'Fever (temperature thresholds by age)',
  'Persistent vomiting or diarrhea',
  'Rash or unusual skin changes',
  'Crying that sounds different from normal',
  'Lethargy or unresponsiveness',
  'Refusing fluids for extended period',
];

export const SELF_CARE_ITEMS: string[] = [
  'Never shake a baby. Shaking can cause severe brain damage or death. If you feel overwhelmed, put the baby in a safe place and step away.',
  'Take a break: put the baby in a safe place (e.g. crib) and go to another room for 10–15 minutes. Take deep breaths, listen to music, or call a friend.',
  'Ask for and accept help — let your partner, family, or friends help with baby care, chores, or errands so you can rest.',
  'Trust your instincts — you know your child best. If crying seems different or you see signs of illness, contact your pediatrician.',
];

export const COLIC_SECTION = {
  title: 'About colic',
  body: 'Colic is often described by the 3-3-3 rule: crying more than 3 hours per day, more than 3 days per week, for 3 or more weeks. It often peaks around 6 weeks and usually resolves by 3–4 months. Talk to your pediatrician for support and to rule out other causes; use soothing techniques and prioritize your own self-care.',
};

export interface DevelopmentalContext {
  ageRange: AgeRange;
  text: string;
}

export const DEVELOPMENTAL_CONTEXTS: DevelopmentalContext[] = [
  { ageRange: { maxMonths: 4 }, text: 'Witching hour (late afternoon fussiness) is normal and temporary.' },
  { ageRange: { minMonths: 0, maxMonths: 1 }, text: 'Growth spurts cause increased hunger and fussiness — increase feeding frequency.' },
  { ageRange: { minMonths: 1.5, maxMonths: 2 }, text: 'Growth spurts cause increased hunger and fussiness — increase feeding frequency.' },
  { ageRange: { minMonths: 2.5, maxMonths: 4 }, text: 'Growth spurts cause increased hunger and fussiness — increase feeding frequency.' },
  { ageRange: { minMonths: 4, maxMonths: 24 }, text: 'Teething can cause discomfort — offer a chilled teething ring.' },
  { ageRange: { minMonths: 6 }, text: 'Separation anxiety is normal — offer reassurance and consistent routines.' },
  { ageRange: { minMonths: 12 }, text: 'Appetite naturally decreases after the first year — don\'t force feed.' },
];

/** Step labels for the progress indicator. */
export const STEP_LABELS: Record<1 | 2 | 3, string> = {
  1: "What's happening?",
  2: 'Quick checklist',
  3: 'Suggestions & support',
};

/** Optional song with lyrics for glossary entries (e.g. Singing). */
export interface GlossarySong {
  title: string;
  lyrics: string;
}

/** Single glossary entry for a term (title + short explanation). */
export interface GlossaryEntry {
  title: string;
  body: string;
  /** Optional list of songs with lyrics, shown as expandable sections in the overlay. */
  songs?: GlossarySong[];
}

/** Glossary of terms used in Fuss Bus; key = exact label shown in UI. */
export const FUSS_BUS_GLOSSARY: Record<string, GlossaryEntry> = {
  'Colic hold': {
    title: 'Colic hold',
    body: 'Hold your baby tummy-down along your forearm, with their head near your elbow. The gentle pressure and position can help relieve gas and soothe fussiness.',
  },
  Swaddling: {
    title: 'Swaddling',
    body: 'Wrap your baby snugly in a thin blanket with arms at their sides. It can mimic the womb and help calm. Stop once baby can roll.',
  },
  'White noise': {
    title: 'White noise',
    body: 'Steady, soothing sound like a fan, vacuum, or dedicated machine. It can help babies settle by masking sudden noises and reminding them of sounds in the womb.',
  },
  'Baby carrier': {
    title: 'Baby carrier',
    body: 'A sling or carrier lets you hold your baby close hands-free. The contact and motion often soothe fussiness and can help with bonding.',
  },
  'Witching hour': {
    title: 'Witching hour',
    body: 'A regular fussy period in the late afternoon or evening in the first few months, often linked to development and overstimulation. It\'s normal and temporary; soothing techniques and taking shifts with a partner can help.',
  },
  Teething: {
    title: 'Teething',
    body: 'Sore, swollen gums can cause discomfort. Offer a chilled (not frozen) teething ring or gently massage the gums. Ask your doctor about pain relief if needed.',
  },
  'Growth spurts': {
    title: 'Growth spurts',
    body: 'Babies often have growth spurts around 2–3 weeks, 6 weeks, and 3 months, with increased hunger and fussiness. Increase feeding frequency; behavior usually normalizes as supply and demand adjust.',
  },
  Colic: {
    title: 'Colic',
    body: 'Intense, inconsolable crying for more than 3 hours per day, more than 3 days per week, for 3 or more weeks. It often peaks around 6 weeks and usually resolves by 3–4 months. Talk to your pediatrician to rule out other causes and to get support; parent self-care is important.',
  },
  'Separation anxiety': {
    title: 'Separation anxiety',
    body: 'Around 6–8 months, babies may cry when a caregiver leaves. This is normal. Offer reassurance, practice short separations, and keep routines consistent.',
  },
  Rock: {
    title: 'Rocking',
    body: 'Gentle rocking in your arms or a chair can calm a fussy baby by providing motion and closeness.',
  },
  Cuddle: {
    title: 'Cuddling',
    body: 'Holding your baby close helps them feel secure. You cannot spoil a baby by responding to their need for comfort.',
  },
  Massage: {
    title: 'Baby massage',
    body: 'Gentle tummy massage or "bicycle legs" (moving baby\'s legs in a pedaling motion) can help relieve gas. Use a light touch and a calm environment.',
  },
  Pacifier: {
    title: 'Pacifier',
    body: 'Non-nutritive sucking can help babies self-soothe. Use a pacifier if your baby finds it comforting; follow safe sleep guidelines.',
  },
  Singing: {
    title: 'Singing',
    body: 'Your voice is one of the most soothing sounds for your baby. Try these classic public-domain lullabies — simple, repetitive tunes many babies find calming.',
    songs: [
      {
        title: 'Twinkle, Twinkle, Little Star',
        lyrics: `Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.
Twinkle, twinkle, little star,
How I wonder what you are!`,
      },
      {
        title: 'Rock-a-bye Baby',
        lyrics: `Rock-a-bye baby, on the treetop,
When the wind blows, the cradle will rock,
When the bough breaks, the cradle will fall,
And down will come baby, cradle and all.`,
      },
      {
        title: 'Mary Had a Little Lamb',
        lyrics: `Mary had a little lamb,
Little lamb, little lamb,
Mary had a little lamb,
Its fleece was white as snow.

And everywhere that Mary went,
Mary went, Mary went,
Everywhere that Mary went,
The lamb was sure to go.`,
      },
      {
        title: 'Row, Row, Row Your Boat',
        lyrics: `Row, row, row your boat
Gently down the stream.
Merrily, merrily, merrily, merrily,
Life is but a dream.`,
      },
      {
        title: 'The Itsy Bitsy Spider',
        lyrics: `The itsy bitsy spider climbed up the waterspout.
Down came the rain and washed the spider out.
Out came the sun and dried up all the rain,
And the itsy bitsy spider climbed up the spout again.`,
      },
      {
        title: 'London Bridge Is Falling Down',
        lyrics: `London Bridge is falling down,
Falling down, falling down.
London Bridge is falling down,
My fair lady.`,
      },
      {
        title: 'Hickory Dickory Dock',
        lyrics: `Hickory dickory dock,
The mouse ran up the clock.
The clock struck one,
The mouse ran down,
Hickory dickory dock.`,
      },
      {
        title: 'Baa, Baa, Black Sheep',
        lyrics: `Baa, baa, black sheep,
Have you any wool?
Yes sir, yes sir,
Three bags full.
One for the master,
One for the dame,
And one for the little boy who lives down the lane.`,
      },
      {
        title: 'Humpty Dumpty',
        lyrics: `Humpty Dumpty sat on a wall,
Humpty Dumpty had a great fall.
All the king's horses and all the king's men
Couldn't put Humpty together again.`,
      },
      {
        title: 'Ring Around the Rosie',
        lyrics: `Ring around the rosie,
A pocket full of posies.
Ashes, ashes,
We all fall down.`,
      },
    ],
  },
};
