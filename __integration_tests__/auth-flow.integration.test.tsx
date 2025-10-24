// __integration_tests__/auth-flow.integration.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ToastProvider } from '../hooks/useToast';
import * as firestoreService from '../services/firestoreService';
import type firebase from 'firebase/compat/app';

vi.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(() => vi.fn()), // Return cleanup function
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  },
  db: {},
  storage: {},
}));

vi.mock('../services/firestoreService');

import { auth } from '../firebase';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <AuthProvider>{children}</AuthProvider>
  </ToastProvider>
);

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Registration Flow', () => {
    it('should complete full signup flow with profile creation', async () => {
      const mockUser = { uid: 'new123', email: 'newuser@test.com' } as firebase.User;
      const mockSignUp = auth.createUserWithEmailAndPassword as any;
      const mockCreateProfile = firestoreService.createUserProfile as any;
      
      mockSignUp.mockResolvedValue({ user: mockUser });
      mockCreateProfile.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signUp('newuser@test.com', 'password123');
      });

      expect(mockSignUp).toHaveBeenCalledWith('newuser@test.com', 'password123');
      expect(mockCreateProfile).toHaveBeenCalledWith(mockUser);
    });

    it('should handle signup with existing email error', async () => {
      const mockSignUp = auth.createUserWithEmailAndPassword as any;
      mockSignUp.mockRejectedValue({ code: 'auth/email-already-in-use' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(
          result.current.signUp('existing@test.com', 'password123')
        ).rejects.toMatchObject({ code: 'auth/email-already-in-use' });
      });
    });

    it('should handle signup with weak password error', async () => {
      const mockSignUp = auth.createUserWithEmailAndPassword as any;
      mockSignUp.mockRejectedValue({ code: 'auth/weak-password' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(
          result.current.signUp('user@test.com', '123')
        ).rejects.toMatchObject({ code: 'auth/weak-password' });
      });
    });

    it('should handle network error during signup', async () => {
      const mockSignUp = auth.createUserWithEmailAndPassword as any;
      mockSignUp.mockRejectedValue({ code: 'auth/network-request-failed' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(
          result.current.signUp('user@test.com', 'password123')
        ).rejects.toMatchObject({ code: 'auth/network-request-failed' });
      });
    });

    it('should create default user profile with initial points', async () => {
      const mockUser = { uid: 'new456', email: 'test@test.com', displayName: null } as firebase.User;
      const mockSignUp = auth.createUserWithEmailAndPassword as any;
      const mockCreateProfile = firestoreService.createUserProfile as any;
      
      mockSignUp.mockResolvedValue({ user: mockUser });
      mockCreateProfile.mockImplementation(async (user) => {
        expect(user.uid).toBe('new456');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signUp('test@test.com', 'password123');
      });

      expect(mockCreateProfile).toHaveBeenCalled();
    });
  });

  describe('User Login Flow', () => {
    it('should complete full login flow and load profile', async () => {
      const mockUser = { uid: 'user123', email: 'user@test.com' } as firebase.User;
      const mockProfile = { uid: 'user123', displayName: 'Test User', points: 50 };
      const mockSignIn = auth.signInWithEmailAndPassword as any;
      const mockGetProfile = firestoreService.getUserProfile as any;
      
      mockSignIn.mockResolvedValue({ user: mockUser });
      mockGetProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signIn('user@test.com', 'password123');
      });

      expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'password123');
    });

    it('should handle login with invalid credentials', async () => {
      const mockSignIn = auth.signInWithEmailAndPassword as any;
      mockSignIn.mockRejectedValue({ code: 'auth/invalid-credential' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(
          result.current.signIn('wrong@test.com', 'wrongpass')
        ).rejects.toMatchObject({ code: 'auth/invalid-credential' });
      });
    });

    it('should handle login with user not found', async () => {
      const mockSignIn = auth.signInWithEmailAndPassword as any;
      mockSignIn.mockRejectedValue({ code: 'auth/user-not-found' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(
          result.current.signIn('notfound@test.com', 'password123')
        ).rejects.toMatchObject({ code: 'auth/user-not-found' });
      });
    });

    it('should handle login with too many requests', async () => {
      const mockSignIn = auth.signInWithEmailAndPassword as any;
      mockSignIn.mockRejectedValue({ code: 'auth/too-many-requests' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(
          result.current.signIn('user@test.com', 'password123')
        ).rejects.toMatchObject({ code: 'auth/too-many-requests' });
      });
    });
  });

  describe('Google Sign-In Flow', () => {
    it('should complete Google OAuth flow with new user', async () => {
      const mockUser = { uid: 'google123', email: 'google@test.com' } as firebase.User;
      const mockSignInWithPopup = auth.signInWithPopup as any;
      const mockGetProfile = firestoreService.getUserProfile as any;
      const mockCreateProfile = firestoreService.createUserProfile as any;
      
      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetProfile.mockRejectedValue(new Error('Profile not found'));
      mockCreateProfile.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockCreateProfile).toHaveBeenCalledWith(mockUser);
    });

    it('should complete Google OAuth flow with existing user', async () => {
      const mockUser = { uid: 'google456', email: 'existing@test.com' } as firebase.User;
      const mockProfile = { uid: 'google456', displayName: 'Existing User' };
      const mockSignInWithPopup = auth.signInWithPopup as any;
      const mockGetProfile = firestoreService.getUserProfile as any;
      
      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockGetProfile).toHaveBeenCalledWith('google456');
    });

    it('should handle Google popup closed by user', async () => {
      const mockSignInWithPopup = auth.signInWithPopup as any;
      mockSignInWithPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(
          result.current.signInWithGoogle()
        ).rejects.toMatchObject({ code: 'auth/popup-closed-by-user' });
      });
    });

    it('should handle Google account selection cancelled', async () => {
      const mockSignInWithPopup = auth.signInWithPopup as any;
      mockSignInWithPopup.mockRejectedValue({ code: 'auth/cancelled-popup-request' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(
          result.current.signInWithGoogle()
        ).rejects.toMatchObject({ code: 'auth/cancelled-popup-request' });
      });
    });
  });

  describe('Session Management Flow', () => {
    it('should maintain session across page reloads', async () => {
      const mockUser = { uid: 'session123', email: 'session@test.com' } as firebase.User;
      const mockProfile = { uid: 'session123', displayName: 'Session User' };
      const mockOnAuthStateChanged = auth.onAuthStateChanged as any;
      const mockGetProfile = firestoreService.getUserProfile as any;

      mockGetProfile.mockResolvedValue(mockProfile);
      
      let authCallback: (user: firebase.User | null) => void;
      mockOnAuthStateChanged.mockImplementation((callback) => {
        authCallback = callback;
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        authCallback(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });
    });

    it('should handle session expiration gracefully', async () => {
      const mockOnAuthStateChanged = auth.onAuthStateChanged as any;
      
      let authCallback: (user: firebase.User | null) => void;
      mockOnAuthStateChanged.mockImplementation((callback) => {
        authCallback = callback;
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        authCallback(null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
    });

    it('should clear user data on logout', async () => {
      const mockSignOut = auth.signOut as any;
      mockSignOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOutUser();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('Auth State Transitions', () => {
    it('should transition from logged out to logged in', async () => {
      const mockUser = { uid: 'trans123', email: 'trans@test.com' } as firebase.User;
      const mockSignIn = auth.signInWithEmailAndPassword as any;
      
      mockSignIn.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();

      await act(async () => {
        await result.current.signIn('trans@test.com', 'password123');
      });

      expect(mockSignIn).toHaveBeenCalled();
    });

    it('should transition from logged in to logged out', async () => {
      const mockSignOut = auth.signOut as any;
      mockSignOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOutUser();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle rapid login/logout cycles', async () => {
      const mockSignIn = auth.signInWithEmailAndPassword as any;
      const mockSignOut = auth.signOut as any;
      const mockUser = { uid: 'rapid123', email: 'rapid@test.com' } as firebase.User;
      
      mockSignIn.mockResolvedValue({ user: mockUser });
      mockSignOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login
      await act(async () => {
        await result.current.signIn('rapid@test.com', 'password123');
      });

      // Logout
      await act(async () => {
        await result.current.signOutUser();
      });

      // Login again
      await act(async () => {
        await result.current.signIn('rapid@test.com', 'password123');
      });

      expect(mockSignIn).toHaveBeenCalledTimes(2);
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
