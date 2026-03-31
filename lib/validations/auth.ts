import { z } from 'zod';

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Email is required.')
      .email('Enter a valid email address.')
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(1, 'Password is required.')
      .refine((value) => value.trim().length > 0, {
        message: 'Password is required.',
      }),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
