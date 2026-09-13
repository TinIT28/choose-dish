export function normalizeCorsOrigin(origin: string | undefined, fallback = 'http://localhost:3000') {
  return (origin ?? fallback).replace(/\/+$/, '');
}
