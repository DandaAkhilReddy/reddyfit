import type { LeadershipMember } from '../types';

export const leadershipHierarchy: Omit<LeadershipMember, 'id'>[] = [
  {
    name: 'Dr. Vishnu Reddy',
    title: 'Principal & Chief Mentor',
    emoji: '🏏',
    bio: 'Leading sponsor and mentor guiding the Islanders to success.',
    order: 1,
  },
  {
    name: 'Sai Swaroop Naidu',
    title: 'Manager & Cofounder',
    emoji: '🧔🏻‍♂️',
    bio: 'Co-founder and team manager, handling operations and logistics.',
    order: 2,
  },
  {
    name: 'Rajasekhar Reddy',
    title: 'Director & Mentor',
    emoji: '🎯',
    bio: 'Providing strategic direction and mentorship to the team.',
    order: 3,
  },
  {
    name: 'Akhil Reddy Danda',
    title: 'Captain',
    emoji: '🏆',
    bio: 'Team Captain leading from the front with passion and dedication.',
    order: 4,
  },
  {
    name: 'Faizan Mohammad',
    title: 'Vice Captain',
    emoji: '💪',
    bio: 'Vice Captain providing crucial support to team leadership.',
    order: 5,
  },
  {
    name: 'Nitish',
    title: 'Associate Vice Captain',
    emoji: '🤝',
    bio: 'Associate Vice Captain ensuring team coordination.',
    order: 6,
  },
  {
    name: 'Harshith',
    title: 'Quality Director',
    emoji: '⚙️',
    bio: 'Quality Director ensuring high standards in all team activities.',
    order: 7,
  },
  {
    name: 'Dinesh Reddy',
    title: 'Quality Director',
    emoji: '⚙️',
    bio: 'Quality Director maintaining excellence across the board.',
    order: 8,
  },
];
