import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type VercelConfig = {
  buildCommand?: string;
  builds?: Array<{ src: string; use: string }>;
  routes?: Array<{ src: string; dest: string }>;
};

const vercelConfig = JSON.parse(
  readFileSync(join(__dirname, '../../vercel.json'), 'utf8'),
) as VercelConfig;
const packageConfig = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8')) as {
  scripts?: { postinstall?: string };
};

describe('Vercel API deployment configuration', () => {
  it('uses an automatic API function and generates Prisma before deployment', () => {
    expect(vercelConfig.buildCommand).toBe('bun run db:generate');
    expect(vercelConfig.builds).toBeUndefined();
    expect(vercelConfig.routes).toBeUndefined();
    expect(existsSync(join(__dirname, '../../api/[...path].ts'))).toBe(true);
    expect(packageConfig.scripts?.postinstall).toBe('prisma generate');
  });
});
