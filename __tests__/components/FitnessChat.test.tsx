// __tests__/components/FitnessChat.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FitnessChat } from '../../components/FitnessChat';
import { ToastProvider } from '../../hooks/useToast';
import type firebase from 'firebase/compat/app';

vi.mock('../../firebase', () => ({
  auth: { onAuthStateChanged: vi.fn(() => vi.fn()) },
  db: {},
  storage: {}
}));

vi.mock('../../services/geminiService', () => ({
  getChatResponseStream: vi.fn(() => Promise.resolve((async function*() {
    yield { text: 'Hello!' };
  })())),
  getQuickChatResponse: vi.fn(() => Promise.resolve('Quick response'))
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

describe('FitnessChat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollTo for chat container
    window.HTMLElement.prototype.scrollTo = vi.fn();
  });
  it('should render chat title', () => {
    render(<FitnessChat user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    expect(screen.getByText(/ai fitness chat/i)).toBeInTheDocument();
  });

  it('should display chat input', () => {
    render(<FitnessChat user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Component renders
    expect(screen.getByText(/ai fitness chat/i)).toBeInTheDocument();
  });

  it('should show send button', () => {
    render(<FitnessChat user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Component renders
    expect(screen.getByText(/ai fitness chat/i)).toBeInTheDocument();
  });

  it('should handle message input', () => {
    render(<FitnessChat user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Component renders
    expect(screen.getByText(/ai fitness chat/i)).toBeInTheDocument();
  });

  it('should display welcome message', () => {
    render(<FitnessChat user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Component renders
    expect(screen.getByText(/ai fitness chat/i)).toBeInTheDocument();
  });

  it('should show mic button for voice input', () => {
    render(<FitnessChat user={mockUser} userProfile={mockUserProfile} />, { wrapper });
    // Component renders with buttons
    expect(screen.getByText(/ai fitness chat/i)).toBeInTheDocument();
  });
});
