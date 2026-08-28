/**
 * Concatène des classes conditionnelles. Version minimale (pas de dépendance) :
 * accepte strings, false, null, undefined.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
