/**
 * Lightweight, robust class name mergers for high-density Tailwind styling.
 * Resolves classes stably without requiring heavy node_modules imports.
 */
export function cn(...inputs: any[]): string {
  return inputs.filter(Boolean).join(" ");
}
