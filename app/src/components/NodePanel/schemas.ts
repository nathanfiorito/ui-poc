import { z } from 'zod';

const baseSchema = z.object({
  label: z.string().min(1, 'Nome obrigatório'),
  loopOver: z.string().nullable().optional(),
  allowFailOnLoopOver: z.boolean().nullable().optional(),
});

export const databaseFormSchema = baseSchema.extend({
  tableName: z.string().min(1, 'Obrigatório'),
  PK: z.string().min(1, 'Obrigatório'),
  SK: z.string().nullable().optional(),
  columns: z.string().optional(),
  resultPath: z.string().min(1, 'Obrigatório'),
  fullScan: z.boolean().optional(),
});

const conditionSchema = z.object({
  expression: z.string().min(1, 'Obrigatório'),
  next: z.string().min(1, 'Obrigatório'),
  resultPath: z.string().nullable().optional(),
});

export const taskFormSchema = baseSchema.extend({
  conditions: z.array(conditionSchema),
});

const kvSchema = z.object({ key: z.string(), value: z.string() });

export const apiFormSchema = baseSchema.extend({
  route: z.string().min(1, 'Obrigatório'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.array(kvSchema),
  body: z.string().optional(),
  responsePath: z.string().min(1, 'Obrigatório'),
  authentication: z.string().optional(),
});

export const responseFormSchema = z.object({
  label: z.string().min(1, 'Nome obrigatório'),
  responseBody: z.array(kvSchema),
  resultPath: z.string().optional(),
});

export type DatabaseFormValues = z.infer<typeof databaseFormSchema>;
export type TaskFormValues = z.infer<typeof taskFormSchema>;
export type ApiFormValues = z.infer<typeof apiFormSchema>;
export type ResponseFormValues = z.infer<typeof responseFormSchema>;
