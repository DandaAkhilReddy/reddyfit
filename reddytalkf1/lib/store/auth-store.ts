import { create } from 'zustand';
import { User, UserRole, Permission } from '@/lib/types';

// Role-Permission Mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'all_tenants',
    'view_internal_costs',
    'model_config',
    'rbac_admin',
    'view_analytics',
    'manage_staff',
    'configure_hours',
    'view_all_calls',
    'live_monitor',
    'takeover_call',
    'edit_appointments',
    'create_notes',
    'manage_waitlist',
  ],
  clinic_admin: [
    'view_analytics',
    'manage_staff',
    'configure_hours',
    'view_all_calls',
    'live_monitor',
    'takeover_call',
    'edit_appointments',
    'create_notes',
    'manage_waitlist',
  ],
  front_desk: [
    'live_monitor',
    'takeover_call',
    'edit_appointments',
    'create_notes',
    'manage_waitlist',
  ],
  doctor: ['view_my_appointments', 'view_my_call_summaries'],
  franchise_admin: ['aggregate_read_only', 'view_analytics'],
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  },

  hasAnyPermission: (permissions) => {
    const { user } = get();
    if (!user) return false;
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.some((p) => userPermissions.includes(p));
  },
}));
