import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type VercelConfig = {
  buildCommand?: string;
  builds?: unknown;
  routes?: unknown;
};

const vercelConfig = JSON.parse(
  readFileSync(join(__dirname, '../../vercel.json'), 'utf8'),
) as VercelConfig;
const apiEntrypoint = readFileSync(join(__dirname, '../../api/[...path].ts'), 'utf8');

describe('Vercel API deployment configuration', () => {
  it('generates Prisma Client before the automatic API function is built', () => {
    expect(vercelConfig.buildCommand).toBe('bun run db:generate');
    expect(vercelConfig).not.toHaveProperty('builds');
    expect(vercelConfig).not.toHaveProperty('routes');
    expect(apiEntrypoint).toContain("export { default } from '../src/main';");
  });
});
