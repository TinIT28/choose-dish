/**
 * The shapes the API sends and the web reads.
 *
 * Both apps used to transcribe these by hand, and two of them had already
 * drifted: `selectedAt` was a `Date` on one side and a `string` on the other,
 * and the web derived its create-dish input as `Omit<Dish, 'id' | 'isActive'>`,
 * which still carried the server-computed `isExcluded` the API never accepts.
 *
 * Everything here describes JSON after serialization — timestamps are ISO
 * strings, never `Date`. The package exports types only, so importing it costs
 * nothing at runtime and neither Vercel project needs a new build step.
 */

/** An ISO-8601 timestamp, e.g. `2026-09-13T05:00:00.000Z`. */
export type IsoDateTime = string;

/** A calendar date in the user's timezone, as `YYYY-MM-DD`. */
export type LocalDate = string;

export type Role = 'USER' | 'ADMIN';
export type MealPeriod = 'BREAKFAST' | 'LUNCH' | 'DINNER';
export type DishScope = 'PRIVATE' | 'SHARED';

export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  timezone: string;
  historyRetentionDays: number;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface DishView {
  id: string;
  name: string;
  shortDescription: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  isActive: boolean;
}

/** A shared dish as one user sees it, carrying that user's personal exclusion. */
export interface SharedDishView extends DishView {
  isExcluded: boolean;
}

export interface CreateDishInput {
  name: string;
  shortDescription: string;
  imageUrl: string;
  cloudinaryPublicId: string;
}

export type UpdateDishInput = Partial<CreateDishInput>;

export interface SelectionView {
  id: string;
  localDate: LocalDate;
  mealPeriod: MealPeriod;
  dishId: string;
  dishNameSnapshot: string;
  selectedAt: IsoDateTime;
}

/** History keeps the snapshot, not the dish: a removed dish still reads back. */
export interface HistorySelectionView {
  id: string;
  localDate: LocalDate;
  mealPeriod: MealPeriod;
  dishNameSnapshot: string;
  selectedAt: IsoDateTime;
}

export interface HistoryGroupView {
  localDate: LocalDate;
  selections: HistorySelectionView[];
}

export interface UserSessionView {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: IsoDateTime;
  expiresAt: IsoDateTime;
  createdAt: IsoDateTime;
}

export interface AdminUserView {
  id: string;
  email: string;
  role: Role;
}

export interface UserSettingsInput {
  timezone: string;
  historyRetentionDays: number;
}

/**
 * What a direct signed upload is allowed to do. The limits travel with the
 * signature so the browser enforces the policy the API signed, rather than
 * repeating its own copy of it.
 */
export interface UploadPolicy {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  /** Comma-separated extensions, e.g. `jpg,png,webp`. */
  allowedFormats: string;
  maxFileSize: number;
  signature: string;
}

export interface OkResponse {
  ok: true;
}

/** The body every failed request carries. */
export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: string[];
}
