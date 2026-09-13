import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type VercelConfig = {
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
  it('routes requests through Nest and generates Prisma Client during install', () => {
    expect(vercelConfig.builds).toEqual([{ src: 'src/main.ts', use: '@vercel/node' }]);
    expect(vercelConfig.routes).toEqual([{ src: '/(.*)', dest: 'src/main.ts' }]);
    expect(packageConfig.scripts?.postinstall).toBe('prisma generate');
  });
});
