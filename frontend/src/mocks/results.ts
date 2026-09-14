import type { Result } from '@/types';

export const mockResults: Result[] = [
  {
    electionId: 'el-004',
    positionId: 'pos-010',
    position: 'Club Secretary',
    candidates: [
      {
        candidateId: 'cand-s01',
        name: 'Laura Bennett',
        photo: 'https://api.dicebear.com/7.x/initials/svg?seed=LauraBennett',
        party: undefined,
        votes: 45,
        percentage: 45.92,
        rank: 1,
        isWinner: true,
      },
      {
        candidateId: 'cand-s02',
        name: 'Tom Harris',
        photo: 'https://api.dicebear.com/7.x/initials/svg?seed=TomHarris',
        party: undefined,
        votes: 32,
        percentage: 32.65,
        rank: 2,
        isWinner: false,
      },
      {
        candidateId: 'cand-s03',
        name: 'Priya Sharma',
        photo: 'https://api.dicebear.com/7.x/initials/svg?seed=PriyaSharma',
        party: undefined,
        votes: 21,
        percentage: 21.43,
        rank: 3,
        isWinner: false,
      },
    ],
    totalVotes: 98,
    notaVotes: 0,
  },
];
