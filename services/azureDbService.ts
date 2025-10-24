// services/azureDbService.ts
import { CosmosClient } from '@azure/cosmos';

// Azure Cosmos DB configuration
const endpoint = import.meta.env.VITE_AZURE_COSMOS_ENDPOINT || '';
const key = import.meta.env.VITE_AZURE_COSMOS_KEY || '';
const databaseId = 'ReddyFitDB';

let client: CosmosClient | null = null;

// Initialize Cosmos DB client
const getClient = () => {
  if (!client && endpoint && key) {
    client = new CosmosClient({ endpoint, key });
  }
  return client;
};

// Admin credentials (hardcoded for now)
export const ADMIN_CREDENTIALS = {
  email: 'admin@reddyfit.com',
  password: 'ReddyFit@Admin2025!',
  uid: 'admin-001',
  displayName: 'Admin User',
  role: 'admin'
};

// User Profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  fitnessLevel?: string;
  goal?: string;
  points?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Meal Log interface
export interface MealLog {
  id?: string;
  userId: string;
  imageUrl?: string;
  foodItems: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: Date;
}

// Workout Plan interface
export interface WorkoutPlan {
  id?: string;
  userId: string;
  basedOnEquipment: string;
  plan: any[];
  createdAt: Date;
}

// Initialize database and containers
export const initializeDatabase = async () => {
  try {
    const cosmosClient = getClient();
    if (!cosmosClient) {
      console.warn('Azure Cosmos DB not configured');
      return;
    }

    // Create database if it doesn't exist
    const { database } = await cosmosClient.databases.createIfNotExists({
      id: databaseId
    });

    // Create containers
    await database.containers.createIfNotExists({
      id: 'users',
      partitionKey: { paths: ['/uid'] }
    });

    await database.containers.createIfNotExists({
      id: 'mealLogs',
      partitionKey: { paths: ['/userId'] }
    });

    await database.containers.createIfNotExists({
      id: 'workoutPlans',
      partitionKey: { paths: ['/userId'] }
    });

    console.log('Azure Cosmos DB initialized');
  } catch (error) {
    console.error('Failed to initialize Azure Cosmos DB:', error);
  }
};

// User Profile operations
export const createUserProfile = async (user: UserProfile): Promise<void> => {
  try {
    const cosmosClient = getClient();
    if (!cosmosClient) return;

    const database = cosmosClient.database(databaseId);
    const container = database.container('users');

    await container.items.create({
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const cosmosClient = getClient();
    if (!cosmosClient) {
      // Return admin profile if DB not configured
      if (uid === ADMIN_CREDENTIALS.uid) {
        return {
          uid: ADMIN_CREDENTIALS.uid,
          email: ADMIN_CREDENTIALS.email,
          displayName: ADMIN_CREDENTIALS.displayName,
          role: 'admin',
          points: 0,
          fitnessLevel: 'Advanced',
          goal: 'Maintain Fitness'
        };
      }
      return null;
    }

    const database = cosmosClient.database(databaseId);
    const container = database.container('users');

    const { resource } = await container.item(uid, uid).read<UserProfile>();
    return resource || null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const cosmosClient = getClient();
    if (!cosmosClient) return;

    const database = cosmosClient.database(databaseId);
    const container = database.container('users');

    const existing = await container.item(uid, uid).read();
    if (existing.resource) {
      await container.item(uid, uid).replace({
        ...existing.resource,
        ...updates,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Meal Log operations
export const saveMealLog = async (userId: string, mealData: Partial<MealLog>): Promise<void> => {
  try {
    const cosmosClient = getClient();
    if (!cosmosClient) return;

    const database = cosmosClient.database(databaseId);
    const container = database.container('mealLogs');

    await container.items.create({
      ...mealData,
      userId,
      id: `meal-${Date.now()}`,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error saving meal log:', error);
    throw error;
  }
};

export const getTodaysMealLogs = async (userId: string): Promise<MealLog[]> => {
  try {
    const cosmosClient = getClient();
    if (!cosmosClient) return [];

    const database = cosmosClient.database(databaseId);
    const container = database.container('mealLogs');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.createdAt >= @today',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@today', value: today.toISOString() }
      ]
    };

    const { resources } = await container.items.query<MealLog>(query).fetchAll();
    return resources;
  } catch (error) {
    console.error('Error getting meal logs:', error);
    return [];
  }
};

// Workout Plan operations
export const saveWorkoutPlan = async (
  userId: string,
  plan: any[],
  basedOnEquipment: string
): Promise<{ id: string }> => {
  try {
    const cosmosClient = getClient();
    if (!cosmosClient) return { id: 'offline-' + Date.now() };

    const database = cosmosClient.database(databaseId);
    const container = database.container('workoutPlans');

    const id = `plan-${Date.now()}`;
    await container.items.create({
      id,
      userId,
      plan,
      basedOnEquipment,
      createdAt: new Date()
    });

    return { id };
  } catch (error) {
    console.error('Error saving workout plan:', error);
    throw error;
  }
};

// Admin authentication
export const authenticateAdmin = (email: string, password: string): boolean => {
  return (
    email === ADMIN_CREDENTIALS.email &&
    password === ADMIN_CREDENTIALS.password
  );
};

export const getAdminProfile = (): UserProfile => {
  return {
    uid: ADMIN_CREDENTIALS.uid,
    email: ADMIN_CREDENTIALS.email,
    displayName: ADMIN_CREDENTIALS.displayName,
    role: 'admin',
    points: 0,
    fitnessLevel: 'Advanced',
    goal: 'Maintain Fitness'
  };
};
