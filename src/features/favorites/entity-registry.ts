import { z } from "zod";

export const favoriteEntityTypes = ["organization", "content_post"] as const;

export const favoriteEntityTypeSchema = z.enum(favoriteEntityTypes);
