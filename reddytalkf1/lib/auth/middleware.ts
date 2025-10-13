import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole, Permission } from '@/lib/types';

// JWT verification (simplified - replace with proper JWT library in production)
function verifyToken(token: string): { userId: string; role: UserRole } | null {
  // TODO: Implement proper JWT verification with jsonwebtoken or jose
  // This is a placeholder
  try {
    // In production, verify JWT signature and expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

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

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

// Protected route patterns
const PROTECTED_ROUTES = [
  '/dashboard',
  '/calls',
  '/appointments',
  '/analytics',
  '/settings',
  '/api',
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Get auth token from cookie or header
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    // Redirect to login for browser requests
    if (!pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Return 401 for API requests
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify token
  const user = verifyToken(token);
  if (!user) {
    if (!pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Check specific route permissions
  // Internal cost dashboard - super_admin only
  if (
    pathname.includes('/analytics/costs') &&
    !hasPermission(user.role, 'view_internal_costs')
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Settings management - admin roles only
  if (
    pathname.includes('/settings') &&
    !hasPermission(user.role, 'configure_hours')
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.userId);
  requestHeaders.set('x-user-role', user.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
