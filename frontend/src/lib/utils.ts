import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// psycopg2 auto-deserializes JSONB columns to Python dicts, so FastAPI may
// return them as objects rather than strings. This handles both cases.
export function safeParse<T>(value: unknown, fallback: T | null = null): T | null {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}
