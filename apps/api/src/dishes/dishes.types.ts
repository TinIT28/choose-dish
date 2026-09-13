export interface CreateDishInput {
  name: string;
  shortDescription: string;
  imageUrl: string;
  cloudinaryPublicId: string;
}

export type UpdateDishInput = Partial<CreateDishInput>;
