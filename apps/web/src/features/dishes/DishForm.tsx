import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  createDish,
  requestUploadSignature,
  updateDish,
  uploadImageToCloudinary,
  type CreateDishInput,
  type Dish,
} from "./api";

interface DishFormProps {
  onSaved: (dish: Dish) => void;
  initialDish?: Dish;
  saveDish?: (input: CreateDishInput) => Promise<Dish>;
  title?: string;
}

export function DishForm({ onSaved, initialDish, saveDish, title = 'Thêm món riêng' }: DishFormProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const formSchema = z.object({
    name: z.string().trim().min(1, "Hãy nhập tên món").max(120, "Tên món tối đa 120 ký tự"),
    shortDescription: z.string().trim().min(1, "Hãy thêm mô tả ngắn").max(500, "Mô tả tối đa 500 ký tự"),
    image: z.any().superRefine((files: FileList | undefined, context) => {
      if (!files?.length && !initialDish) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Hãy chọn một ảnh món ăn' });
      if (files?.length && files.length !== 1) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Chỉ được chọn một ảnh' });
      if (files?.[0] && files[0].size > 5 * 1024 * 1024) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Ảnh tối đa 5 MB' });
      if (files?.[0] && !['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Chỉ hỗ trợ JPG, PNG hoặc WebP' });
    }),
  });
  type FormValues = z.infer<typeof formSchema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: initialDish?.name ?? '', shortDescription: initialDish?.shortDescription ?? '' },
  });

  async function onSubmit(values: FormValues) {
    const file = values.image?.[0] as File | undefined;

    setServerError(null);
    setUploadProgress(file ? 0 : null);
    try {
      const upload = file
        ? await uploadImageToCloudinary(await requestUploadSignature(), file, setUploadProgress)
        : null;
      const input = {
        name: values.name,
        shortDescription: values.shortDescription,
        imageUrl: upload?.secure_url ?? initialDish?.imageUrl ?? '',
        cloudinaryPublicId: upload?.public_id ?? initialDish?.cloudinaryPublicId ?? '',
      };
      const save = saveDish ?? ((nextInput: CreateDishInput) => (initialDish ? updateDish(initialDish.id, nextInput) : createDish(nextInput)));
      const dish = await save(input);
      onSaved(dish);
      reset(initialDish ? { name: dish.name, shortDescription: dish.shortDescription } : undefined);
      setUploadProgress(null);
    } catch (error) {
      setUploadProgress(null);
      setServerError(
        error instanceof Error ? error.message : "Không thể lưu món ăn.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Mỗi món cần một ảnh để dễ nhận ra khi chọn ngẫu nhiên.
        </p>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="dish-name">Tên món</Label>
            <Input
              id="dish-name"
              placeholder="Ví dụ: Cơm tấm sườn"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-700">
                {errors.name.message as string}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dish-description">Mô tả ngắn</Label>
            <textarea
              id="dish-description"
              className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Một chút mô tả về món ăn"
              aria-invalid={Boolean(errors.shortDescription)}
              {...register("shortDescription")}
            />
            {errors.shortDescription && (
              <p className="text-sm text-red-700">
                {errors.shortDescription.message as string}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dish-image">Ảnh món ăn</Label>
            <Input
              id="dish-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-invalid={Boolean(errors.image)}
              {...register("image")}
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG hoặc WebP · tối đa 5 MB
            </p>
            {errors.image && (
              <p className="text-sm text-red-700">
                {errors.image.message as string}
              </p>
            )}
          </div>
          {uploadProgress !== null && (
            <div aria-live="polite" className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Đang tải ảnh lên…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          {serverError && (
            <p role="alert" className="text-sm text-red-700">
              {serverError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu…" : "Lưu món ăn"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
