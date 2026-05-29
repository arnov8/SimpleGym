// Static mapping: English exercise name keywords → free-exercise-db image path
// Source: https://github.com/yuhonas/free-exercise-db (public domain)

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

const MAP: Array<[string[], string]> = [
  // Chest / Pectoraux
  [['incline bench press', 'développé incliné'],         `${BASE}/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg`],
  [['decline bench press', 'développé décliné'],         `${BASE}/Barbell_Decline_Bench_Press/0.jpg`],
  [['bench press', 'développé couché barre'],            `${BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`],
  [['dumbbell press', 'développé couché haltères', 'développé haltères'], `${BASE}/Dumbbell_Bench_Press/0.jpg`],
  [['chest fly', 'écarté', 'fly'],                       `${BASE}/Dumbbell_Flyes/0.jpg`],
  [['cable fly', 'écarté poulie', 'croisé poulie'],      `${BASE}/Cable_Crossover/0.jpg`],
  [['pec deck', 'butterfly', 'machine pectoraux'],       `${BASE}/Pec_Deck_Fly/0.jpg`],
  [['push-up', 'pompe', 'pushup'],                       `${BASE}/Push-up/0.jpg`],
  [['dip', 'trempette'],                                 `${BASE}/Dip/0.jpg`],

  // Back / Dos
  [['deadlift', 'soulevé de terre'],                     `${BASE}/Barbell_Deadlift/0.jpg`],
  [['romanian deadlift', 'soulevé de terre jambes tendues', 'rdl'], `${BASE}/Barbell_Romanian_Deadlift/0.jpg`],
  [['pull-up', 'traction', 'chin-up'],                   `${BASE}/Pull-up/0.jpg`],
  [['lat pulldown', 'tirage poulie haute', 'tirage vertical'], `${BASE}/Wide-Grip_Lat_Pulldown/0.jpg`],
  [['seated row', 'rowing assis', 'tirage horizontal', 'tirage barre'],  `${BASE}/Cable_Seated_Row/0.jpg`],
  [['bent over row', 'rowing barre', 'rowing haltère'],  `${BASE}/Barbell_Bent_Over_Row/0.jpg`],
  [['t-bar row', 'rowing t-barre'],                      `${BASE}/T-Bar_Row_with_Handle/0.jpg`],
  [['good morning', 'good-morning'],                     `${BASE}/Good_Morning/0.jpg`],

  // Shoulders / Épaules
  [['overhead press', 'military press', 'développé militaire', 'développé épaules barre'], `${BASE}/Barbell_Military_Press/0.jpg`],
  [['dumbbell shoulder press', 'développé militaire haltères', 'développé épaules haltères'], `${BASE}/Dumbbell_Shoulder_Press/0.jpg`],
  [['lateral raise', 'élévation latérale', 'oiseau'],   `${BASE}/Dumbbell_Lateral_Raise/0.jpg`],
  [['front raise', 'élévation frontale'],                `${BASE}/Dumbbell_Front_Raise/0.jpg`],
  [['face pull', 'tirage visage'],                       `${BASE}/Face_Pull/0.jpg`],
  [['upright row', 'rowing menton'],                     `${BASE}/Barbell_Upright_Row/0.jpg`],
  [['arnold press'],                                     `${BASE}/Arnold_Dumbbell_Press/0.jpg`],

  // Arms / Bras
  [['barbell curl', 'curl barre'],                       `${BASE}/Barbell_Curl/0.jpg`],
  [['dumbbell curl', 'curl haltère', 'bicep curl'],      `${BASE}/Dumbbell_Alternate_Bicep_Curl/0.jpg`],
  [['hammer curl', 'curl marteau'],                      `${BASE}/Hammer_Curls_with_Bands/0.jpg`],
  [['concentration curl', 'curl concentré'],             `${BASE}/Concentration_Curls/0.jpg`],
  [['ez bar curl', 'curl barre ez'],                     `${BASE}/EZ-Bar_Curl/0.jpg`],
  [['preacher curl', 'curl pupitre'],                    `${BASE}/Preacher_Curl/0.jpg`],
  [['cable curl'],                                       `${BASE}/Low_Cable_Curl/0.jpg`],
  [['skull crusher', 'barre au front'],                  `${BASE}/Lying_Triceps_Press/0.jpg`],
  [['tricep pushdown', 'extension triceps poulie', 'pushdown'], `${BASE}/Triceps_Pushdown/0.jpg`],
  [['overhead tricep', 'extension triceps'],             `${BASE}/Dumbbell_Tricep_Kickback/0.jpg`],
  [['close grip bench', 'développé serré'],              `${BASE}/Barbell_Close-Grip_Bench_Press/0.jpg`],
  [['tricep dip', 'dip triceps'],                        `${BASE}/Dip/0.jpg`],

  // Legs / Jambes
  [['squat', 'squat barre'],                             `${BASE}/Barbell_Full_Squat/0.jpg`],
  [['goblet squat', 'squat gobelet'],                    `${BASE}/Dumbbell_Goblet_Squat/0.jpg`],
  [['leg press', 'presse jambes'],                       `${BASE}/Leg_Press/0.jpg`],
  [['leg extension', 'extension jambes'],                `${BASE}/Leg_Extensions/0.jpg`],
  [['leg curl', 'curl jambes', 'flexion jambes'],        `${BASE}/Lying_Leg_Curl/0.jpg`],
  [['lunge', 'fente'],                                   `${BASE}/Barbell_Lunge/0.jpg`],
  [['hip thrust', 'poussée hanche'],                     `${BASE}/Barbell_Hip_Thrust/0.jpg`],
  [['glute bridge', 'pont fessier'],                     `${BASE}/Glute_Bridge/0.jpg`],
  [['calf raise', 'mollets', 'extension mollets'],       `${BASE}/Standing_Calf_Raises/0.jpg`],
  [['sumo deadlift', 'soulevé sumo'],                    `${BASE}/Sumo_Deadlift/0.jpg`],
  [['hack squat', 'squat hack'],                         `${BASE}/Hack_Squat/0.jpg`],
  [['step-up', 'step up', 'montée de step'],             `${BASE}/Dumbbell_Step_Ups/0.jpg`],

  // Core / Abdominaux
  [['plank', 'gainage'],                                 `${BASE}/Plank/0.jpg`],
  [['crunch', 'abdominaux'],                             `${BASE}/Crunch/0.jpg`],
  [['sit-up', 'sit up'],                                 `${BASE}/Sit-up/0.jpg`],
  [['leg raise', 'relevé de jambe'],                     `${BASE}/Flat_Bench_Lying_Leg_Raise/0.jpg`],
  [['cable crunch', 'crunch poulie'],                    `${BASE}/Cable_Crunch/0.jpg`],
  [['russian twist'],                                    `${BASE}/Russian_Twist/0.jpg`],
];

export function getExerciseImage(nameEn: string): string {
  const lower = nameEn.toLowerCase().trim();
  for (const [keywords, url] of MAP) {
    if (keywords.some(kw => lower.includes(kw) || kw.includes(lower))) {
      return url;
    }
  }
  // Fuzzy fallback: match first significant word
  const firstWord = lower.split(' ')[0];
  if (firstWord.length > 3) {
    for (const [keywords, url] of MAP) {
      if (keywords.some(kw => kw.includes(firstWord))) return url;
    }
  }
  return '';
}
