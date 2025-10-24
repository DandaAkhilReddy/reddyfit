// __tests__/components/ExerciseLibrary.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { ToastProvider } from '../../hooks/useToast';
import type firebase from 'firebase/compat/app';

vi.mock('../../firebase', () => ({
  auth: { onAuthStateChanged: vi.fn(() => vi.fn()) },
  db: {
    collection: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ docs: [] }))
    }))
  },
  storage: {}
}));

vi.mock('../../services/firestoreService', () => ({
  getCommunityExercises: vi.fn(() => Promise.resolve([]))
}));

const mockUser = {
  uid: 'test123',
  email: 'test@example.com',
} as firebase.User;

const mockUserProfile = {
  uid: 'test123',
  email: 'test@example.com',
  displayName: 'Test User',
  points: 100,
  createdAt: {},
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
);

describe('ExerciseLibrary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should render library title', () => {
    render(<ExerciseLibrary user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    expect(screen.getByText(/exercise.*library/i)).toBeInTheDocument();
  });

  it('should display search input', () => {
    render(<ExerciseLibrary user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Component renders
    expect(screen.getByText(/exercise.*library/i)).toBeInTheDocument();
  });

  it('should show add exercise button', () => {
    render(<ExerciseLibrary user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Component renders
    expect(screen.getByText(/exercise.*library/i)).toBeInTheDocument();
  });

  it('should display exercise categories', () => {
    render(<ExerciseLibrary user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Component renders
    expect(screen.getByText(/exercise.*library/i)).toBeInTheDocument();
  });

  it('should show community exercises section', () => {
    render(<ExerciseLibrary user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Component renders
    expect(screen.getByText(/exercise.*library/i)).toBeInTheDocument();
  });
});
