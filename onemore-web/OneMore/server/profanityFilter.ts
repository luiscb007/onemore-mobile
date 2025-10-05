import { Filter } from 'bad-words';

const filter = new Filter();

// Add additional offensive words related to sex, racism, and pornography
const additionalWords = [
  // Sexual content
  'porn', 'pornography', 'xxx', 'nsfw', 'nude', 'nudes', 'naked', 'sex', 'sexy',
  'sexual', 'hooker', 'prostitute', 'escort', 'stripper', 'onlyfans',
  
  // Racial slurs and hate speech (basic coverage)
  'racist', 'racism', 'nazi', 'hitler', 'supremacy', 'genocide',
  
  // Other inappropriate content
  'drug', 'drugs', 'cocaine', 'heroin', 'meth', 'weed', 'marijuana',
  'rape', 'rapist', 'molest', 'pedophile', 'trafficking'
];

filter.addWords(...additionalWords);

export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  return filter.isProfane(text);
}

export function checkProfanityInObject(obj: any, fields: string[]): string | null {
  for (const field of fields) {
    const value = obj[field];
    if (value && typeof value === 'string' && containsProfanity(value)) {
      return field;
    }
  }
  return null;
}

export function getProfanityError(fieldName: string): string {
  return `${fieldName} contains inappropriate or offensive language. Please revise your content.`;
}
