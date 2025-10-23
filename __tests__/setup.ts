// __tests__/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Firebase
vi.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  },
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        collection: vi.fn(),
      })),
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          get: vi.fn(),
        })),
        get: vi.fn(),
      })),
      add: vi.fn(),
      get: vi.fn(),
    })),
    enablePersistence: vi.fn(() => Promise.resolve()),
  },
  storage: {
    ref: vi.fn(() => ({
      put: vi.fn(() => ({
        ref: {
          getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/image.jpg')),
        },
      })),
    })),
  },
}));

// Mock environment variables
process.env.API_KEY = 'test-api-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock URL APIs
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock navigator.mediaDevices
if (!global.navigator.mediaDevices) {
  (global.navigator as any).mediaDevices = {};
}
(global.navigator.mediaDevices as any).getUserMedia = vi.fn().mockImplementation(() =>
  Promise.resolve({
    getTracks: () => [{ stop: vi.fn() }],
  } as unknown as MediaStream),
);

// Mock MediaRecorder
class MockMediaRecorder {
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    onstart: (() => void) | null = null;
    state: 'inactive' | 'recording' | 'paused' = 'inactive';
    mimeType: string;

    constructor(stream: MediaStream, options?: { mimeType: string }) {
        this.mimeType = options?.mimeType || 'audio/webm';
    }

    start() {
        this.state = 'recording';
        this.onstart?.();
        setTimeout(() => {
            if (this.ondataavailable) {
                const blob = new Blob(['mock audio data'], { type: this.mimeType });
                this.ondataavailable({ data: blob });
            }
        }, 10);
    }

    stop() {
        this.state = 'inactive';
        this.onstop?.();
    }

    static isTypeSupported(type: string) {
        return type.startsWith('audio/');
    }
}

global.MediaRecorder = MockMediaRecorder as any;

// Mock indexedDB
import 'fake-indexeddb/auto';