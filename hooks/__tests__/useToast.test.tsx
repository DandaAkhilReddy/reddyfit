import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../useToast';

describe('useToast', () => {
  it('should provide toast functions', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    expect(result.current.toasts).toEqual([]);
    expect(typeof result.current.showToast).toBe('function');
    expect(typeof result.current.removeToast).toBe('function');
  });

  it('should add a toast message', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('Test message', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].id).toBeTruthy();
  });

  it('should add multiple toast messages', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('Message 1', 'success');
      result.current.showToast('Message 2', 'error');
      result.current.showToast('Message 3', 'info');
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].message).toBe('Message 1');
    expect(result.current.toasts[1].message).toBe('Message 2');
    expect(result.current.toasts[2].message).toBe('Message 3');
  });

  it('should remove a toast by id', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    let toastId: number;

    act(() => {
      result.current.showToast('Test message', 'success');
    });

    toastId = result.current.toasts[0].id;
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should handle different toast types', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('Success message', 'success');
      result.current.showToast('Error message', 'error');
      result.current.showToast('Info message', 'info');
    });

    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[1].type).toBe('error');
    expect(result.current.toasts[2].type).toBe('info');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within a ToastProvider');
  });
});
