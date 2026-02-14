import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid integer'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  email: z.email().max(255).lowercase().trim().optional(),
  role: z.enum(['user', 'admin']).optional(),
});
