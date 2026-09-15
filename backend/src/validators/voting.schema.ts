import { z } from 'zod';

export const submitBallotSchema = z.object({
  body: z.object({
    electionId: z.string().uuid('Invalid election ID'),
    choices: z
      .array(
        z.object({
          positionId: z.string().uuid('Invalid position ID'),
          candidateId: z.string().uuid('Invalid candidate ID').nullable(),
        })
      )
      .min(1, 'At least one choice is required'),
  }),
});

export const votingStatusSchema = z.object({
  params: z.object({
    electionId: z.string().uuid('Invalid election ID'),
  }),
});

export const candidateSchema = z.object({
  body: z.object({
    electionId: z.string().uuid('Invalid election ID'),
    positionId: z.string().uuid('Invalid position ID'),
    name: z.string().min(1, 'Candidate name is required').max(100),
    photoUrl: z.string().url().optional(),
    manifesto: z.string().max(2000).optional(),
    party: z.string().max(100).optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
});

export const updateCandidateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid candidate ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    photoUrl: z.string().url().optional(),
    manifesto: z.string().max(2000).optional(),
    party: z.string().max(100).optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
});

export const importVotersSchema = z.object({
  body: z.object({
    voters: z
      .array(
        z.object({
          studentId: z.string().min(1).max(50),
          fullName: z.string().min(1).max(100),
          email: z.string().email(),
          department: z.string().min(1).max(100),
          yearOfStudy: z.number().int().min(1).max(8).optional(),
          phone: z.string().max(20).optional(),
        })
      )
      .min(1, 'At least one voter is required'),
  }),
});

export const updateVoterStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid voter ID'),
  }),
  body: z.object({
    isVerified: z.boolean(),
  }),
});

export type SubmitBallotInput = z.infer<typeof submitBallotSchema>['body'];
export type CandidateInput = z.infer<typeof candidateSchema>['body'];
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>['body'];
export type ImportVotersInput = z.infer<typeof importVotersSchema>['body'];
