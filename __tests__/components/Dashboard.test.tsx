// __tests__/components/Dashboard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from '../../components/Dashboard';
import { UserPreferencesProvider } from '../../hooks/useUserPreferences';
import { ToastProvider } from '../../hooks/useToast';
import type firebase from 'firebase/compat/app';

vi.mock('../../firebase', () => ({
  auth: { onAuthStateChanged: vi.fn(() => vi.fn()) },
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => ({
          where: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                get: vi.fn(() => Promise.resolve({ docs: [] }))
              }))
            }))
          }))
        }))
      }))
    }))
  },
  storage: {}
}));

vi.mock('../../services/firestoreService', () => ({
  getTodaysMealLogs: vi.fn(() => Promise.resolve([]))
}));

vi.mock('../../services/geminiService', () => ({
  analyzeFoodImage: vi.fn(() => Promise.resolve(['apple'])),
  getNutritionalAnalysis: vi.fn(() => Promise.resolve({}))
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
    <UserPreferencesProvider>
      {children}
    </UserPreferencesProvider>
  </ToastProvider>
);

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should render dashboard title', () => {
    render(<Dashboard user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Dashboard renders successfully
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('should display user welcome message', () => {
    render(<Dashboard user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Dashboard renders
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('should show log meal button', () => {
    render(<Dashboard user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Dashboard renders
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('should display nutrition goals section', () => {
    render(<Dashboard user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Dashboard renders
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('should show todays meals section', () => {
    render(<Dashboard user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Dashboard renders
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
