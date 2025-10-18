import type { LeadershipMember } from '../types';

export const leadershipHierarchy: Omit<LeadershipMember, 'id'>[] = [
  {
    name: 'Akhil Reddy Danda',
    title: 'Captain',
    emoji: '🏆',
    bio: 'Team Captain leading from the front with passion and dedication.',
    order: 1,
  },
  {
    name: 'Faizan Mohammad',
    title: 'Vice Captain',
    emoji: '💪',
    bio: 'Vice Captain providing crucial support to team leadership.',
    order: 2,
  },
  {
    name: 'Nitish',
    title: 'Associate Vice Captain',
    emoji: '🤝',
    bio: 'Associate Vice Captain ensuring team coordination.',
    order: 3,
  },
  {
    name: 'Harshith',
    title: 'Quality Director',
    emoji: '⚙️',
    bio: 'Quality Director ensuring high standards in all team activities.',
    order: 4,
  },
  {
    name: 'Dinesh Reddy',
    title: 'Quality Director',
    emoji: '⚙️',
    bio: 'Quality Director maintaining excellence across the board.',
    order: 5,
  },
];
