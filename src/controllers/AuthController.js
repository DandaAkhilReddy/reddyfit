// Authentication Controller for ReddyTalk.ai API
// Handles user registration, login, password management, and session control

const AuthService = require('../services/auth/AuthService');
const { body, validationResult } = require('express-validator');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  async initialize() {
    await this.authService.initialize();
    console.log('🎮 AuthController initialized');
  }

  // =============================================
  // VALIDATION RULES
  // =============================================

  getRegistrationValidation() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
      
      body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
      
      body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .isAlpha('en-US', { ignore: ' -' })
        .withMessage('First name must be 2-50 characters, letters only'),
      
      body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .isAlpha('en-US', { ignore: ' -' })
        .withMessage('Last name must be 2-50 characters, letters only'),
      
      body('role')
        .optional()
        .isIn(['admin', 'doctor', 'nurse', 'receptionist', 'analyst'])
        .withMessage('Invalid role'),
      
      body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Valid phone number required')
    ];
  }

  getLoginValidation() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
      
      body('password')
        .notEmpty()
        .withMessage('Password is required')
    ];
  }

  // =============================================
  // REGISTRATION ENDPOINTS
  // =============================================

  /**
   * Register new user
   * POST /auth/register
   */
  register = async (req, res) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password, firstName, lastName, role, phone } = req.body;
      
      // Register user
      const result = await this.authService.registerUser({
        email,
        password,
        firstName,
        lastName,
        role: role || 'receptionist',
        phone
      });

      // Remove sensitive data from response
      delete result.verificationToken; // Don't send token in response (send via email instead)

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result.user
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'REGISTRATION_FAILED'
      });
    }
  };

  /**
   * Verify email address
   * POST /auth/verify-email
   */
  verifyEmail = async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Verification token is required'
        });
      }

      const result = await this.authService.verifyEmail(token);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      console.error('Email verification error:', error);
      
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'EMAIL_VERIFICATION_FAILED'
      });
    }
  };

  // =============================================
  // LOGIN ENDPOINTS
  // =============================================

  /**
   * User login
   * POST /auth/login
   */
  login = async (req, res) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      // Attempt login
      const result = await this.authService.loginUser(
        email,
        password,
        ipAddress,
        userAgent
      );

      // Set secure HTTP-only cookie for session
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      
      res.status(401).json({
        success: false,
        error: error.message,
        code: 'LOGIN_FAILED'
      });
    }
  };

  /**
   * User logout
   * POST /auth/logout
   */
  logout = async (req, res) => {
    try {
      const sessionId = req.cookies.sessionId;
      
      if (sessionId) {
        await this.authService.revokeSession(sessionId);
      }

      // Clear session cookie
      res.clearCookie('sessionId');

      // Log logout
      if (req.user) {
        await this.authService.logAuditEvent(
          req.user.id,
          'USER_LOGOUT',
          'users',
          req.user.id,
          {
            ip_address: req.ip
          }
        );
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        code: 'LOGOUT_FAILED'
      });
    }
  };

  /**
   * Logout from all devices
   * POST /auth/logout-all
   */
  logoutAll = async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      await this.authService.revokeAllUserSessions(req.user.id);

      // Log logout all
      await this.authService.logAuditEvent(
        req.user.id,
        'USER_LOGOUT_ALL',
        'users',
        req.user.id,
        {
          ip_address: req.ip
        }
      );

      res.json({
        success: true,
        message: 'Logged out from all devices'
      });

    } catch (error) {
      console.error('Logout all error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Logout all failed',
        code: 'LOGOUT_ALL_FAILED'
      });
    }
  };

  // =============================================
  // PASSWORD MANAGEMENT
  // =============================================

  /**
   * Request password reset
   * POST /auth/forgot-password
   */
  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const result = await this.authService.requestPasswordReset(email);

      // Always return success (don't reveal if email exists)
      res.json({
        success: true,
        message: 'If email exists, password reset instructions have been sent'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Password reset request failed',
        code: 'FORGOT_PASSWORD_FAILED'
      });
    }
  };

  /**
   * Reset password with token
   * POST /auth/reset-password
   */
  resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Token and new password are required'
        });
      }

      const result = await this.authService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: 'Password reset successful'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'PASSWORD_RESET_FAILED'
      });
    }
  };

  /**
   * Change password (authenticated user)
   * POST /auth/change-password
   */
  changePassword = async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current and new passwords are required'
        });
      }

      // Verify current password
      const user = await this.authService.getUserByEmail(req.user.email);
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Generate reset token and use reset password method
      const resetResult = await this.authService.requestPasswordReset(req.user.email);
      await this.authService.resetPassword(resetResult.resetToken, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'CHANGE_PASSWORD_FAILED'
      });
    }
  };

  // =============================================
  // USER PROFILE
  // =============================================

  /**
   * Get current user profile
   * GET /auth/profile
   */
  getProfile = async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get full user details
      const user = await this.authService.getUserById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Return safe user data
      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role_name,
          permissions: user.permissions,
          phone: user.phone,
          isVerified: user.is_verified,
          lastLoginAt: user.last_login_at,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
        code: 'GET_PROFILE_FAILED'
      });
    }
  };

  /**
   * Update user profile
   * PUT /auth/profile
   */
  updateProfile = async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { firstName, lastName, phone } = req.body;
      const allowedUpdates = {};

      // Only allow certain fields to be updated
      if (firstName !== undefined) allowedUpdates.first_name = firstName;
      if (lastName !== undefined) allowedUpdates.last_name = lastName;
      if (phone !== undefined) allowedUpdates.phone = phone;

      if (Object.keys(allowedUpdates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      // Build update query
      const updateFields = Object.keys(allowedUpdates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [req.user.id, ...Object.values(allowedUpdates)];

      const query = `
        UPDATE users 
        SET ${updateFields}, updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, first_name, last_name, phone, updated_at
      `;

      const result = await this.authService.db.query(query, values);
      const updatedUser = result.rows[0];

      // Log profile update
      await this.authService.logAuditEvent(
        req.user.id,
        'PROFILE_UPDATED',
        'users',
        req.user.id,
        { updated_fields: Object.keys(allowedUpdates) }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          phone: updatedUser.phone,
          updatedAt: updatedUser.updated_at
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        code: 'UPDATE_PROFILE_FAILED'
      });
    }
  };

  // =============================================
  // SESSION MANAGEMENT
  // =============================================

  /**
   * Get active sessions
   * GET /auth/sessions
   */
  getSessions = async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await this.authService.db.query(`
        SELECT 
          id,
          session_token,
          ip_address,
          user_agent,
          created_at,
          expires_at
        FROM user_sessions
        WHERE user_id = $1 AND expires_at > NOW()
        ORDER BY created_at DESC
      `, [req.user.id]);

      const sessions = result.rows.map(session => ({
        id: session.id,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        isCurrent: session.session_token === req.cookies.sessionId
      }));

      res.json({
        success: true,
        data: sessions
      });

    } catch (error) {
      console.error('Get sessions error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get sessions',
        code: 'GET_SESSIONS_FAILED'
      });
    }
  };

  /**
   * Revoke specific session
   * DELETE /auth/sessions/:sessionId
   */
  revokeSession = async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { sessionId } = req.params;

      // Only allow users to revoke their own sessions
      const result = await this.authService.db.query(
        'DELETE FROM user_sessions WHERE id = $1 AND user_id = $2',
        [sessionId, req.user.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Log session revocation
      await this.authService.logAuditEvent(
        req.user.id,
        'SESSION_REVOKED',
        'user_sessions',
        sessionId
      );

      res.json({
        success: true,
        message: 'Session revoked successfully'
      });

    } catch (error) {
      console.error('Revoke session error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to revoke session',
        code: 'REVOKE_SESSION_FAILED'
      });
    }
  };

  // =============================================
  // UTILITY ENDPOINTS
  // =============================================

  /**
   * Validate token
   * POST /auth/validate-token
   */
  validateToken = async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required'
        });
      }

      const decoded = this.authService.verifyJWT(token);
      const user = await this.authService.getUserById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      res.json({
        success: true,
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role_name
        }
      });

    } catch (error) {
      res.json({
        success: true,
        valid: false,
        error: error.message
      });
    }
  };

  /**
   * Health check
   * GET /auth/health
   */
  healthCheck = async (req, res) => {
    try {
      const health = await this.authService.healthCheck();
      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  // =============================================
  // ADMIN ENDPOINTS
  // =============================================

  /**
   * Get all users (admin only)
   * GET /auth/admin/users
   */
  getUsers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await this.authService.db.query(`
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.phone,
          u.is_active, u.is_verified, u.created_at, u.last_login_at,
          ur.name as role_name
        FROM users u
        JOIN user_roles ur ON u.role_id = ur.id
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      const countResult = await this.authService.db.query('SELECT COUNT(*) FROM users');
      const totalUsers = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          users: result.rows,
          pagination: {
            page,
            limit,
            total: totalUsers,
            pages: Math.ceil(totalUsers / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get users',
        code: 'GET_USERS_FAILED'
      });
    }
  };
}

module.exports = AuthController;