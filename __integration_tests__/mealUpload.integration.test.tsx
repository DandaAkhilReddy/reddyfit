import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Dashboard } from '../components/Dashboard';
import * as geminiService from '../services/geminiService';
import * as firestoreService from '../services/firestoreService';
import { ToastProvider } from '../hooks/useToast';
import { UserPreferencesProvider } from '../hooks/useUserPreferences';

// Mock services
vi.mock('../services/geminiService');
vi.mock('../services/firestoreService');
vi.mock('../firebase');

describe('Meal Upload Integration Tests', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
  } as any;

  const mockUserProfile = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    points: 10,
    createdAt: {} as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Firestore calls
    vi.mocked(firestoreService.getTodaysMealLogs).mockResolvedValue([]);
    vi.mocked(firestoreService.saveMealLog).mockResolvedValue(undefined);
  });

  const renderDashboard = () => {
    return render(
      <ToastProvider>
        <UserPreferencesProvider>
          <Dashboard user={mockUser} userProfile={mockUserProfile} />
        </UserPreferencesProvider>
      </ToastProvider>
    );
  };

  it('should successfully upload and analyze a meal image', async () => {
    // Mock successful AI analysis
    const mockFoodItems = ['grilled chicken', 'brown rice', 'broccoli'];
    const mockNutrition = {
      calories: 450,
      macronutrients: {
        protein: 45,
        carbohydrates: 40,
        fat: 12,
      },
      vitamins: [{ name: 'Vitamin C', amount: '90mg' }],
      minerals: [{ name: 'Iron', amount: '8mg' }],
    };

    vi.mocked(geminiService.analyzeFoodImage).mockResolvedValue(mockFoodItems);
    vi.mocked(geminiService.getNutritionalAnalysis).mockResolvedValue(mockNutrition);

    const { container } = renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Log Your Meal')).toBeInTheDocument();
    });

    // Find the file input (hidden input)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Create a mock file
    const file = new File(['fake-image-data'], 'meal.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    // Trigger file change
    fireEvent.change(fileInput);

    // Wait for all processing steps
    await waitFor(() => {
      expect(geminiService.analyzeFoodImage).toHaveBeenCalledWith(
        expect.any(String),
        'image/jpeg'
      );
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(geminiService.getNutritionalAnalysis).toHaveBeenCalledWith(mockFoodItems);
    });

    await waitFor(() => {
      expect(firestoreService.saveMealLog).toHaveBeenCalledWith(
        'test-user-123',
        {
          foodItems: mockFoodItems,
          nutrition: mockNutrition,
        }
      );
    });

    // Verify no image upload happened
    expect(firestoreService.uploadImage).not.toHaveBeenCalled();
  });

  it('should display error when no food is detected', async () => {
    // Mock empty food items
    vi.mocked(geminiService.analyzeFoodImage).mockResolvedValue([]);

    const { container } = renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Log Your Meal')).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-image-data'], 'meal.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/could not identify any food/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Should not proceed to nutrition analysis
    expect(geminiService.getNutritionalAnalysis).not.toHaveBeenCalled();
    expect(firestoreService.saveMealLog).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API failure
    vi.mocked(geminiService.analyzeFoodImage).mockRejectedValue(
      new Error('API key not valid')
    );

    const { container } = renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Log Your Meal')).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-image-data'], 'meal.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/API key not valid/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(firestoreService.saveMealLog).not.toHaveBeenCalled();
  });

  it('should reject non-image files', async () => {
    const { container } = renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Log Your Meal')).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-text-data'], 'document.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Should show error immediately without processing
    await waitFor(() => {
      expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument();
    });

    expect(geminiService.analyzeFoodImage).not.toHaveBeenCalled();
  });

  it('should handle multiple meals in one day', async () => {
    // Mock existing meals
    const existingMeals = [
      {
        id: 'meal1',
        userId: 'test-user-123',
        createdAt: {} as any,
        foodItems: ['oatmeal', 'banana'],
        nutrition: {
          calories: 300,
          macronutrients: { protein: 10, carbohydrates: 50, fat: 8 },
          vitamins: [],
          minerals: [],
        },
      },
    ];

    vi.mocked(firestoreService.getTodaysMealLogs).mockResolvedValue(existingMeals);

    const mockFoodItems = ['sandwich', 'apple'];
    const mockNutrition = {
      calories: 400,
      macronutrients: { protein: 20, carbohydrates: 45, fat: 15 },
      vitamins: [],
      minerals: [],
    };

    vi.mocked(geminiService.analyzeFoodImage).mockResolvedValue(mockFoodItems);
    vi.mocked(geminiService.getNutritionalAnalysis).mockResolvedValue(mockNutrition);

    const { container } = renderDashboard();

    await waitFor(() => {
      // Should show existing meal's calories
      expect(screen.getByText('300')).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-image-data'], 'meal.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(firestoreService.saveMealLog).toHaveBeenCalled();
    }, { timeout: 5000 });

    // Should refetch meals after logging
    expect(firestoreService.getTodaysMealLogs).toHaveBeenCalledTimes(2);
  });

  it('should validate nutrition data before saving', async () => {
    const mockFoodItems = ['pizza'];
    const invalidNutrition = {
      calories: 0, // Invalid
      macronutrients: { protein: 0, carbohydrates: 0, fat: 0 },
      vitamins: [],
      minerals: [],
    };

    vi.mocked(geminiService.analyzeFoodImage).mockResolvedValue(mockFoodItems);
    vi.mocked(geminiService.getNutritionalAnalysis).mockResolvedValue(invalidNutrition);
    vi.mocked(firestoreService.saveMealLog).mockRejectedValue(
      new Error('Nutrition information is required')
    );

    const { container } = renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Log Your Meal')).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-image-data'], 'meal.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/nutrition information is required/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should show loading states during processing', async () => {
    const mockFoodItems = ['steak', 'potatoes'];
    const mockNutrition = {
      calories: 600,
      macronutrients: { protein: 50, carbohydrates: 40, fat: 25 },
      vitamins: [],
      minerals: [],
    };

    // Add delay to observe loading states
    vi.mocked(geminiService.analyzeFoodImage).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockFoodItems), 100))
    );
    vi.mocked(geminiService.getNutritionalAnalysis).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockNutrition), 100))
    );

    const { container } = renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Log Your Meal')).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-image-data'], 'meal.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Should show analyzing message
    await waitFor(() => {
      expect(screen.getByText(/analyzing your meal/i)).toBeInTheDocument();
    });

    // Should transition to calculating message
    await waitFor(() => {
      expect(screen.getByText(/calculating nutrition/i)).toBeInTheDocument();
    });

    // Should transition to saving message
    await waitFor(() => {
      expect(screen.getByText(/saving your log/i)).toBeInTheDocument();
    });

    // Finally should show success
    await waitFor(() => {
      expect(firestoreService.saveMealLog).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('should reset file input after successful upload', async () => {
    const mockFoodItems = ['salad'];
    const mockNutrition = {
      calories: 200,
      macronutrients: { protein: 10, carbohydrates: 25, fat: 8 },
      vitamins: [],
      minerals: [],
    };

    vi.mocked(geminiService.analyzeFoodImage).mockResolvedValue(mockFoodItems);
    vi.mocked(geminiService.getNutritionalAnalysis).mockResolvedValue(mockNutrition);

    const { container } = renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Log Your Meal')).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-image-data'], 'meal.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(firestoreService.saveMealLog).toHaveBeenCalled();
    }, { timeout: 5000 });

    // File input should be reset (value is cleared in the finally block)
    expect(fileInput.value).toBe('');
  });
});
