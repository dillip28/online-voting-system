import { z } from 'zod';

const electionTypeEnum = z.enum([
  'presidential',
  'parliamentary',
  'student',
  'organizational',
  'custom',
]);

const electionStatusEnum = z.enum([
  'draft',
  'scheduled',
  'open',
  'closed',
  'counting',
  'results_published',
  'archived',
]);

export const createElectionSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    type: electionTypeEnum,
    startTime: z.string().datetime('Invalid start time format'),
    endTime: z.string().datetime('Invalid end time format'),
    settings: z
      .object({
        allowNOTA: z.boolean().default(true),
        resultVisibility: z
          .enum(['hidden', 'admin_only', 'live', 'after_close', 'manual'])
          .default('after_close'),
        requireStudentId: z.boolean().default(true),
      })
      .optional(),
    positions: z
      .array(
        z.object({
          title: z.string().min(1, 'Position title is required').max(100),
          description: z.string().max(500).optional(),
          displayOrder: z.number().int().min(0),
          maxSelections: z.number().int().min(1).default(1),
        })
      )
      .min(1, 'At least one position is required'),
  }),
});

export const updateElectionSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    type: electionTypeEnum.optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    settings: z
      .object({
        allowNOTA: z.boolean().optional(),
        resultVisibility: z
          .enum(['hidden', 'admin_only', 'live', 'after_close', 'manual'])
          .optional(),
        requireStudentId: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const listElectionsSchema = z.object({
  query: z.object({
    status: electionStatusEnum.optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z
      .enum(['title', 'start_time', 'end_time', 'created_at'])
      .default('start_time'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const electionIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid election ID'),
  }),
});

export type CreateElectionInput = z.infer<typeof createElectionSchema>['body'];
export type UpdateElectionInput = z.infer<typeof updateElectionSchema>['body'];
export type ListElectionsQuery = z.infer<typeof listElectionsSchema>['query'];
