// Authentication Middleware for ReddyTalk.ai
// JWT-based route protection with role-based access control

const AuthService = require('../services/auth/AuthService');
const rateLimit = require('express-rate-limit');

class AuthMiddleware {
  constructor() {
    this.authService = new AuthService();
    
    // Rate limiting configurations
    this.loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Max 5 login attempts per IP
      message: 'Too many login attempts, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    });

    this.generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Max 100 requests per IP
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  async initialize() {
    await this.authService.initialize();
    console.log('🛡️ AuthMiddleware initialized');
  }

  // =============================================
  // AUTHENTICATION MIDDLEWARE
  // =============================================

  /**
   * Verify JWT token and attach user to request
   */
  authenticate = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Access token required',
          code: 'MISSING_TOKEN'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify JWT token
      const decoded = this.authService.verifyJWT(token);
      
      // Get full user information
      const user = await this.authService.getUserById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token - user not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name,
        permissions: user.permissions,
        isVerified: user.is_verified
      };

      // Set current user ID for audit logging
      req.currentUserId = user.id;

      next();
      
    } catch (error) {
      console.error('Authentication error:', error);
      
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  };

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  optionalAuthenticate = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Continue without authentication
      }

      // Use regular authenticate middleware
      await this.authenticate(req, res, next);
      
    } catch (error) {
      // Continue without authentication on error
      next();
    }
  };

  // =============================================
  // ROLE-BASED AUTHORIZATION
  // =============================================

  /**
   * Require specific roles
   */
  requireRole = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        // Log unauthorized access attempt
        this.authService.logAuditEvent(
          req.user.id,
          'UNAUTHORIZED_ACCESS',
          'route',
          null,
          {
            route: req.path,
            method: req.method,
            required_roles: allowedRoles,
            user_role: req.user.role
          }
        );

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: allowedRoles,
          current: req.user.role
        });
      }

      next();
    };
  };

  /**
   * Require specific permissions
   */
  requirePermission = (resource, action = 'read') => {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const hasPermission = this.authService.hasPermission(
        req.user.permissions,
        resource,
        action
      );

      if (!hasPermission) {
        // Log permission denied
        await this.authService.logAuditEvent(
          req.user.id,
          'PERMISSION_DENIED',
          'route',
          null,
          {
            route: req.path,
            method: req.method,
            required_resource: resource,
            required_action: action,
            user_permissions: req.user.permissions
          }
        );

        return res.status(403).json({
          success: false,
          error: 'Permission denied',
          code: 'PERMISSION_DENIED',
          required: { resource, action }
        });
      }

      next();
    };
  };

  /**
   * Admin only access
   */
  requireAdmin = this.requireRole('admin');

  /**
   * Medical staff access (doctors, nurses)
   */
  requireMedicalStaff = this.requireRole('admin', 'doctor', 'nurse');

  /**
   * Any staff access (all roles except patients)
   */
  requireStaff = this.requireRole('admin', 'doctor', 'nurse', 'receptionist', 'analyst');

  // =============================================
  // ACCOUNT STATUS CHECKS
  // =============================================

  /**
   * Require verified email
   */
  requireVerified = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  };

  // =============================================
  // RESOURCE OWNERSHIP CHECKS
  // =============================================

  /**
   * Check if user owns the resource or has admin privileges
   */
  requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Check ownership
      const resourceUserId = req.params[resourceUserIdField] || 
                           req.body[resourceUserIdField] || 
                           req.query[resourceUserIdField];

      if (resourceUserId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied - not resource owner',
          code: 'NOT_OWNER'
        });
      }

      next();
    };
  };

  // =============================================
  // HIPAA COMPLIANCE MIDDLEWARE
  // =============================================

  /**
   * Log all access to patient data for HIPAA compliance
   */
  logPatientAccess = async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const patientId = req.params.patientId || 
                     req.body.patientId || 
                     req.query.patientId;

    if (patientId) {
      await this.authService.logAuditEvent(
        req.user.id,
        'PATIENT_DATA_ACCESS',
        'patients',
        patientId,
        {
          route: req.path,
          method: req.method,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      );
    }

    next();
  };

  /**
   * Require patient data access permissions
   */
  requirePatientAccess = (action = 'read') => {
    return this.requirePermission('patients', action);
  };

  // =============================================
  // API KEY AUTHENTICATION (for external integrations)
  // =============================================

  /**
   * Authenticate using API key for external services
   */
  authenticateApiKey = async (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'] || req.query.api_key;
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required',
          code: 'MISSING_API_KEY'
        });
      }

      // Validate API key (implement based on your API key storage)
      const isValidKey = await this.validateApiKey(apiKey);
      
      if (!isValidKey) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key',
          code: 'INVALID_API_KEY'
        });
      }

      // Log API key usage
      await this.authService.logAuditEvent(
        null,
        'API_KEY_ACCESS',
        'api',
        null,
        {
          api_key_hash: this.hashApiKey(apiKey),
          route: req.path,
          method: req.method,
          ip_address: req.ip
        }
      );

      req.isApiKeyAuth = true;
      next();
      
    } catch (error) {
      console.error('API key authentication error:', error);
      
      return res.status(401).json({
        success: false,
        error: 'API key authentication failed',
        code: 'API_KEY_AUTH_FAILED'
      });
    }
  };

  // =============================================
  // UTILITY METHODS
  // =============================================

  async validateApiKey(apiKey) {
    // TODO: Implement API key validation against database
    // For now, check against environment variable
    const validKeys = (process.env.API_KEYS || '').split(',');
    return validKeys.includes(apiKey);
  }

  hashApiKey(apiKey) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 8);
  }

  /**
   * Extract IP address from request
   */
  getClientIP = (req) => {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
  };

  // =============================================
  // SECURITY HEADERS MIDDLEWARE
  // =============================================

  securityHeaders = (req, res, next) => {
    // HIPAA compliance headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    next();
  };

  // =============================================
  // RATE LIMITING
  // =============================================

  /**
   * Rate limiting for login endpoints
   */
  loginRateLimit = this.loginLimiter;

  /**
   * General rate limiting
   */
  generalRateLimit = this.generalLimiter;

  /**
   * Strict rate limiting for sensitive endpoints
   */
  strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 requests per IP
    message: 'Too many requests to sensitive endpoint',
    standardHeaders: true,
    legacyHeaders: false
  });

  // =============================================
  // ERROR HANDLING
  // =============================================

  /**
   * Global error handler for auth-related errors
   */
  errorHandler = (err, req, res, next) => {
    console.error('Auth middleware error:', err);

    // JWT specific errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Default error response
    res.status(500).json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  };
}

module.exports = AuthMiddleware;