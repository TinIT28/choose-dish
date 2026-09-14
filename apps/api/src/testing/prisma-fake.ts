import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * An in-memory adapter at the Prisma seam.
 *
 * Two adapters justify the seam: the generated client in production, this store
 * in specs. Specs seed rows and assert on behaviour, so a service is free to
 * change the shape of its `where` clause without breaking them.
 *
 * It implements the query surface this application actually uses — scalar,
 * `null`, `in`, comparison, `NOT` and `OR` filters, `some`/`none` relation
 * filters, `select`, `include`, `orderBy`, compound unique keys and interactive
 * transactions. Anything outside that surface throws rather than silently
 * returning the wrong rows.
 */

type Row = Record<string, unknown>;
type Where = Record<string, unknown>;

type ModelName = 'user' | 'session' | 'dish' | 'personalExclusion' | 'selection';

interface RelationDescriptor {
  model: ModelName;
  /** Field on the related model pointing back at this row's `localKey`. */
  foreignKey: string;
  localKey: string;
  list: boolean;
}

interface ModelDescriptor {
  uniqueKeys: string[];
  compoundKeys: Record<string, string[]>;
  relations: Record<string, RelationDescriptor>;
  /** Whether the schema gives this model an `updatedAt` column. */
  tracksUpdates: boolean;
  defaults: () => Row;
}

const models: Record<ModelName, ModelDescriptor> = {
  user: {
    tracksUpdates: true,
    uniqueKeys: ['id', 'email'],
    compoundKeys: {},
    relations: {
      dishes: { model: 'dish', foreignKey: 'ownerId', localKey: 'id', list: true },
      sessions: { model: 'session', foreignKey: 'userId', localKey: 'id', list: true },
      selections: { model: 'selection', foreignKey: 'userId', localKey: 'id', list: true },
      exclusions: { model: 'personalExclusion', foreignKey: 'userId', localKey: 'id', list: true },
    },
    defaults: () => ({
      email: null,
      passwordHash: 'hash',
      role: 'USER',
      timezone: 'Asia/Ho_Chi_Minh',
      historyRetentionDays: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  session: {
    tracksUpdates: false,
    uniqueKeys: ['id'],
    compoundKeys: {},
    relations: {
      user: { model: 'user', foreignKey: 'id', localKey: 'userId', list: false },
    },
    defaults: () => ({
      refreshTokenHash: 'hash',
      userAgent: null,
      ipAddress: null,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      createdAt: new Date(),
    }),
  },
  dish: {
    tracksUpdates: true,
    uniqueKeys: ['id'],
    compoundKeys: {},
    relations: {
      exclusions: { model: 'personalExclusion', foreignKey: 'dishId', localKey: 'id', list: true },
      selections: { model: 'selection', foreignKey: 'dishId', localKey: 'id', list: true },
      owner: { model: 'user', foreignKey: 'id', localKey: 'ownerId', list: false },
    },
    defaults: () => ({
      scope: 'PRIVATE',
      ownerId: null,
      name: 'Món ăn',
      shortDescription: 'Mô tả',
      imageUrl: 'https://res.cloudinary.com/choose-dish/image/upload/v1/a.jpg',
      cloudinaryPublicId: 'a',
      isActive: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  personalExclusion: {
    tracksUpdates: false,
    uniqueKeys: ['id'],
    compoundKeys: { userId_dishId: ['userId', 'dishId'] },
    relations: {
      user: { model: 'user', foreignKey: 'id', localKey: 'userId', list: false },
      dish: { model: 'dish', foreignKey: 'id', localKey: 'dishId', list: false },
    },
    defaults: () => ({ createdAt: new Date() }),
  },
  selection: {
    tracksUpdates: true,
    uniqueKeys: ['id'],
    compoundKeys: { userId_localDate_mealPeriod: ['userId', 'localDate', 'mealPeriod'] },
    relations: {
      user: { model: 'user', foreignKey: 'id', localKey: 'userId', list: false },
      dish: { model: 'dish', foreignKey: 'id', localKey: 'dishId', list: false },
    },
    defaults: () => ({
      localDate: '2026-09-13',
      mealPeriod: 'LUNCH',
      dishId: 'dish-1',
      dishNameSnapshot: 'Món ăn',
      selectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
};

export interface PrismaFakeSeed {
  users?: Row[];
  sessions?: Row[];
  dishes?: Row[];
  personalExclusions?: Row[];
  selections?: Row[];
}

const seedKeyToModel: Record<keyof PrismaFakeSeed, ModelName> = {
  users: 'user',
  sessions: 'session',
  dishes: 'dish',
  personalExclusions: 'personalExclusion',
  selections: 'selection',
};

type Store = Record<ModelName, Row[]>;

function comparable(value: unknown) {
  return value instanceof Date ? value.getTime() : value;
}

function compare(left: unknown, right: unknown) {
  const a = comparable(left);
  const b = comparable(right);
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  return (a as number | string) < (b as number | string) ? -1 : 1;
}

function matchesFilter(value: unknown, filter: unknown): boolean {
  if (filter === null) return value === null || value === undefined;
  if (filter instanceof Date) return comparable(value) === comparable(filter);
  if (typeof filter !== 'object') return value === filter;

  return Object.entries(filter as Record<string, unknown>).every(([operator, operand]) => {
    switch (operator) {
      case 'equals':
        return matchesFilter(value, operand);
      case 'not':
        return !matchesFilter(value, operand);
      case 'in':
        return (operand as unknown[]).some((candidate) => comparable(candidate) === comparable(value));
      case 'lt':
        return compare(value, operand) < 0;
      case 'lte':
        return compare(value, operand) <= 0;
      case 'gt':
        return compare(value, operand) > 0;
      case 'gte':
        return compare(value, operand) >= 0;
      default:
        throw new Error(`prisma-fake does not implement the filter operator "${operator}"`);
    }
  });
}

class PrismaFake {
  readonly store: Store = { user: [], session: [], dish: [], personalExclusion: [], selection: [] };
  private sequence = 0;

  constructor(seed: PrismaFakeSeed = {}) {
    for (const [seedKey, rows] of Object.entries(seed) as [keyof PrismaFakeSeed, Row[]][]) {
      const model = seedKeyToModel[seedKey];
      for (const row of rows ?? []) {
        this.store[model].push({ ...models[model].defaults(), id: this.nextId(model), ...row });
      }
    }
  }

  private nextId(model: ModelName) {
    this.sequence += 1;
    return `${model}-${this.sequence}`;
  }

  matches(model: ModelName, row: Row, where: Where = {}): boolean {
    return Object.entries(where).every(([field, condition]) => {
      if (field === 'AND') return (condition as Where[]).every((clause) => this.matches(model, row, clause));
      if (field === 'OR') return (condition as Where[]).some((clause) => this.matches(model, row, clause));
      if (field === 'NOT') return !this.matches(model, row, condition as Where);

      const relation = models[model].relations[field];
      if (relation) return this.matchesRelation(relation, row, condition as Where);

      return matchesFilter(row[field], condition);
    });
  }

  private matchesRelation(relation: RelationDescriptor, row: Row, condition: Where) {
    const related = this.relatedRows(relation, row);
    return Object.entries(condition).every(([operator, clause]) => {
      const filter = clause as Where;
      switch (operator) {
        case 'none':
          return !related.some((candidate) => this.matches(relation.model, candidate, filter));
        case 'some':
          return related.some((candidate) => this.matches(relation.model, candidate, filter));
        default:
          throw new Error(`prisma-fake does not implement the relation filter "${operator}"`);
      }
    });
  }

  private relatedRows(relation: RelationDescriptor, row: Row) {
    return this.store[relation.model].filter((candidate) => candidate[relation.foreignKey] === row[relation.localKey]);
  }

  project(model: ModelName, row: Row, args: { select?: Record<string, unknown>; include?: Record<string, unknown> } = {}): Row {
    const { select, include } = args;
    const projected: Row = select ? {} : { ...row };

    if (select) {
      for (const [field, value] of Object.entries(select)) {
        if (!value) continue;
        const relation = models[model].relations[field];
        projected[field] = relation ? this.resolveRelation(relation, row, value) : row[field];
      }
    }

    if (include) {
      for (const [field, value] of Object.entries(include)) {
        if (!value) continue;
        const relation = models[model].relations[field];
        if (!relation) throw new Error(`prisma-fake does not know the relation "${field}"`);
        projected[field] = this.resolveRelation(relation, row, value);
      }
    }

    return projected;
  }

  private resolveRelation(relation: RelationDescriptor, row: Row, options: unknown) {
    const args = (typeof options === 'object' && options !== null ? options : {}) as {
      where?: Where;
      select?: Record<string, unknown>;
      include?: Record<string, unknown>;
      orderBy?: unknown;
    };
    let related = this.relatedRows(relation, row).filter((candidate) => this.matches(relation.model, candidate, args.where));
    related = sortRows(related, args.orderBy);
    const projected = related.map((candidate) => this.project(relation.model, candidate, args));
    return relation.list ? projected : (projected[0] ?? null);
  }

  findUnique(model: ModelName, where: Where) {
    const descriptor = models[model];
    for (const [field, value] of Object.entries(where)) {
      const compound = descriptor.compoundKeys[field];
      if (compound) {
        const key = value as Row;
        return this.store[model].find((row) => compound.every((part) => row[part] === key[part])) ?? null;
      }
      if (descriptor.uniqueKeys.includes(field)) {
        return this.store[model].find((row) => row[field] === value) ?? null;
      }
    }
    throw new Error(`prisma-fake needs a unique key to look up a ${model}`);
  }

  create(model: ModelName, data: Row) {
    const row = { ...models[model].defaults(), id: this.nextId(model), ...data };
    this.assertUnique(model, row);
    this.store[model].push(row);
    return row;
  }

  /** Mirrors the schema's unique constraints so a spec cannot insert a row Postgres would reject. */
  private assertUnique(model: ModelName, row: Row) {
    const descriptor = models[model];
    const keySets = [
      ...descriptor.uniqueKeys.map((field) => [field]),
      ...Object.values(descriptor.compoundKeys),
    ];

    for (const fields of keySets) {
      // Postgres treats NULLs as distinct, so a partially empty key never collides.
      if (fields.some((field) => row[field] === null || row[field] === undefined)) continue;
      const clash = this.store[model].some((candidate) => fields.every((field) => candidate[field] === row[field]));
      if (clash) {
        throw new Prisma.PrismaClientKnownRequestError(`Unique constraint failed on ${model}.${fields.join('_')}`, {
          code: 'P2002',
          clientVersion: 'prisma-fake',
          meta: { target: fields },
        });
      }
    }
  }
}

function applyUpdate(model: ModelName, row: Row, data: Row = {}) {
  Object.assign(row, data, models[model].tracksUpdates ? { updatedAt: new Date() } : {});
}

function sortRows(rows: Row[], orderBy: unknown) {
  if (!orderBy) return rows;
  const clauses = (Array.isArray(orderBy) ? orderBy : [orderBy]) as Record<string, 'asc' | 'desc'>[];
  return [...rows].sort((left, right) => {
    for (const clause of clauses) {
      for (const [field, direction] of Object.entries(clause)) {
        const result = compare(left[field], right[field]) * (direction === 'desc' ? -1 : 1);
        if (result !== 0) return result;
      }
    }
    return 0;
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function delegate(fake: PrismaFake, model: ModelName) {
  const rows = () => fake.store[model];

  return {
    findMany: async (args: any = {}) => {
      const matched = rows().filter((row) => fake.matches(model, row, args.where));
      return sortRows(matched, args.orderBy).map((row) => fake.project(model, row, args));
    },
    findUnique: async (args: any) => {
      const row = fake.findUnique(model, args.where);
      return row ? fake.project(model, row, args) : null;
    },
    count: async (args: any = {}) => rows().filter((row) => fake.matches(model, row, args.where)).length,
    create: async (args: any) => fake.project(model, fake.create(model, args.data), args),
    update: async (args: any) => {
      const row = fake.findUnique(model, args.where);
      if (!row) throw new Error(`prisma-fake: no ${model} matches ${JSON.stringify(args.where)}`);
      applyUpdate(model, row, args.data);
      return fake.project(model, row, args);
    },
    updateMany: async (args: any) => {
      const matched = rows().filter((row) => fake.matches(model, row, args.where));
      for (const row of matched) applyUpdate(model, row, args.data);
      return { count: matched.length };
    },
    upsert: async (args: any) => {
      const existing = fake.findUnique(model, args.where);
      if (existing) {
        applyUpdate(model, existing, args.update);
        return fake.project(model, existing, args);
      }
      return fake.project(model, fake.create(model, args.create), args);
    },
    delete: async (args: any) => {
      const row = fake.findUnique(model, args.where);
      if (!row) throw new Error(`prisma-fake: no ${model} matches ${JSON.stringify(args.where)}`);
      fake.store[model] = rows().filter((candidate) => candidate !== row);
      return fake.project(model, row, args);
    },
    deleteMany: async (args: any = {}) => {
      const matched = rows().filter((row) => fake.matches(model, row, args.where));
      fake.store[model] = rows().filter((row) => !matched.includes(row));
      return { count: matched.length };
    },
  };
}

export type PrismaFakeClient = PrismaService & { store: Store };

/** Builds a seeded in-memory Prisma client that a service can be constructed with. */
export function createPrismaFake(seed: PrismaFakeSeed = {}): PrismaFakeClient {
  const fake = new PrismaFake(seed);
  const client: Record<string, unknown> = {
    store: fake.store,
    $connect: async () => undefined,
    $disconnect: async () => undefined,
  };

  for (const model of Object.keys(models) as ModelName[]) {
    client[model] = delegate(fake, model);
  }

  // The second argument carries Prisma's transaction options (isolation level); the
  // in-memory store has no isolation to configure, so it is accepted and ignored.
  client.$transaction = async (operations: any) =>
    typeof operations === 'function' ? operations(client) : Promise.all(operations);

  return client as unknown as PrismaFakeClient;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
