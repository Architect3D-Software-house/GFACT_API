import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  userId: z.string().uuid({ message: "userId inválido" }),
  planId: z.string().uuid({ message: "planId inválido" }),
  paymentMethod: z.string().optional(),
  externalRef: z.string().optional(),
});

export const updateSubscriptionSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING', 'CANCELED', 'EXPIRED']),
  endDate: z.string().datetime().optional(),
  renewsAt: z.string().datetime().optional(),
  canceledAt: z.string().datetime().optional(),
  paymentMethod: z.string().optional(),
  externalRef: z.string().optional(),
});

export const subscriptionIdParamSchema = z.object({
  id: z.string().uuid({ message: "ID inválido" }),
});

// Inferência dos tipos (caso você use TypeScript)
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
