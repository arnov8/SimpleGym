import Anthropic from '@anthropic-ai/sdk';
import type { GeneratedWorkout } from './types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un coach sportif expert en musculation en salle. Tu génères des séances de sport structurées et adaptées.
Réponds TOUJOURS en JSON pur, sans markdown, sans code fence.
Le JSON doit respecter exactement ce schéma :
{
  "session_name": string,
  "muscles_targeted": string[],
  "estimated_duration": number (en minutes),
  "exercises": [
    {
      "name": string (nom de l'exercice en français),
      "name_en": string (nom de l'exercice en anglais, standard gym terminology, ex: "Bench Press", "Lat Pulldown", "Squat"),
      "muscle_group": string,
      "sets": number,
      "reps": string (ex: "8-10" ou "12" ou "jusqu'à l'échec"),
      "rest_seconds": number,
      "notes": string (conseil technique court, 1 phrase max)
    }
  ]
}

Règles :
- 4 à 8 exercices maximum par séance
- Adapte l'intensité au niveau indiqué
- Ordonne les exercices logiquement (composés en premier)
- name_en doit être le nom anglais standard utilisé dans les bases de données d'exercices`;

export async function generateWorkout(
  prompt: string,
  fitnessLevel: string,
  equipmentNotes: string
): Promise<GeneratedWorkout> {
  const userMessage = `Niveau : ${fitnessLevel}
Équipement disponible : ${equipmentNotes || 'Salle complète standard'}
Demande : ${prompt}`;

  const makeRequest = async (model: string) => {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });
    const text = (msg.content[0] as { type: string; text: string }).text.trim();
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned) as GeneratedWorkout;
  };

  try {
    return await makeRequest('claude-sonnet-4-6');
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 529) return await makeRequest('claude-haiku-4-5-20251001');
    throw err;
  }
}

export async function fetchExerciseImage(nameEn: string): Promise<string> {
  try {
    // Step 1: search by name to get the exercise base_id
    const searchRes = await fetch(
      `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(nameEn)}&language=english&format=json`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'SimpleGym/1.0' } }
    );
    if (!searchRes.ok) return '';
    const searchData = await searchRes.json();
    const baseId = searchData.suggestions?.[0]?.data?.base_id;
    if (!baseId) return '';

    // Step 2: get images for this exercise base
    const imgRes = await fetch(
      `https://wger.de/api/v2/exerciseimage/?format=json&exercise_base=${baseId}&is_main=True`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!imgRes.ok) return '';
    const imgData = await imgRes.json();
    return imgData.results?.[0]?.image ?? '';
  } catch {
    return '';
  }
}
