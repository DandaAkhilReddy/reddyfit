// __tests__/components/LoginPage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../../components/LoginPage';
import { AuthProvider } from '../../hooks/useAuth';
import { ToastProvider } from '../../hooks/useToast';
import * as firestoreService from '../../services/firestoreService';

vi.mock('../../firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn((callback) => {
      callback(null);
      return vi.fn();
    }),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  },
  db: {},
  storage: {},
}));

vi.mock('../../services/firestoreService');

import { auth } from '../../firebase';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <AuthProvider>{children}</AuthProvider>
  </ToastProvider>
);

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockSignIn = auth.signInWithEmailAndPassword as any;
    const mockSignUp = auth.createUserWithEmailAndPassword as any;
    const mockSignInWithPopup = auth.signInWithPopup as any;
    mockSignIn.mockResolvedValue({ user: { uid: 'test123' } });
    mockSignUp.mockResolvedValue({ user: { uid: 'test123' } });
    mockSignInWithPopup.mockResolvedValue({ user: { uid: 'test123' } });
  });

  it('should render login form by default', () => {
    render(<LoginPage />, { wrapper });
    
    expect(screen.getByText('ReddyFit AI Pro')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should toggle to sign up view', () => {
    render(<LoginPage />, { wrapper });
    
    const signUpLink = screen.getByText('Sign Up');
    fireEvent.click(signUpLink);
    
    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should display Google sign-in button', () => {
    render(<LoginPage />, { wrapper });
    
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
  });

  it('should handle email input', () => {
    render(<LoginPage />, { wrapper });
    
    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput.value).toBe('test@example.com');
  });

  it('should handle password input', () => {
    render(<LoginPage />, { wrapper });
    
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(passwordInput.value).toBe('password123');
  });

  it('should require email and password', () => {
    render(<LoginPage />, { wrapper });
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('minLength', '6');
  });

  it('should show loading state when submitting', async () => {
    const mockSignIn = auth.signInWithEmailAndPassword as any;
    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<LoginPage />, { wrapper });
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });

  it('should display contact email for password reset', () => {
    render(<LoginPage />, { wrapper });
    
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByText(/akhilreddydanda3@gmail.com/i)).toBeInTheDocument();
  });
});
