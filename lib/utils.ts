/** Joins conditional Tailwind class names, dropping anything falsy. */
export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}
