import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type VercelConfig = {
  builds?: Array<{ src: string; use: string }>;
  routes?: Array<{ src: string; dest: string }>;
  buildCommand?: string;
};

const vercelConfig = JSON.parse(
  readFileSync(join(__dirname, '../../vercel.json'), 'utf8'),
) as VercelConfig;

describe('Vercel API deployment configuration', () => {
  it('builds and routes through the source NestJS serverless handler', () => {
    expect(vercelConfig.builds).toEqual([{ src: 'src/main.ts', use: '@vercel/node' }]);
    expect(vercelConfig.routes).toEqual([{ src: '/(.*)', dest: 'src/main.ts' }]);
    expect(vercelConfig).not.toHaveProperty('buildCommand');
  });
});
