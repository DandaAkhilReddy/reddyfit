// Authentication Service for ReddyTalk.ai
// HIPAA-compliant user authentication with JWT tokens

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const DatabaseService = require('../database/DatabaseService');

class AuthService {
  constructor() {
    this.db = new DatabaseService();
    this.jwtSecret = process.env.JWT_SECRET || 'reddytalk_jwt_secret_2025_change_in_production';
    this.tokenExpiry = process.env.JWT_EXPIRY || '24h';
    this.maxFailedAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30 minutes
  }

  async initialize() {
    await this.db.initialize();
    console.log('🔐 AuthService initialized');
  }

  // =============================================
  // USER REGISTRATION
  // =============================================

  async registerUser(userData) {
    try {
      const { email, password, firstName, lastName, role = 'receptionist', phone } = userData;

      // Validate input
      this.validateUserInput({ email, password, firstName, lastName });

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Get role ID
      const roleResult = await this.db.query(
        'SELECT id FROM user_roles WHERE name = $1',
        [role]
      );
      
      if (roleResult.rows.length === 0) {
        throw new Error(`Invalid role: ${role}`);
      }

      const roleId = roleResult.rows[0].id;

      // Create user
      const result = await this.db.query(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, 
          role_id, phone, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, first_name, last_name, created_at
      `, [email, passwordHash, firstName, lastName, roleId, phone, false]);

      const user = result.rows[0];

      // Create verification token
      const verificationToken = await this.createVerificationToken(user.id);

      // Log registration
      await this.logAuditEvent(user.id, 'USER_REGISTERED', 'users', user.id, {
        email: email,
        role: role
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        },
        verificationToken,
        message: 'User registered successfully. Please verify your email.'
      };

    } catch (error) {
      console.error('❌ User registration failed:', error);
      throw error;
    }
  }

  // =============================================
  // USER LOGIN
  // =============================================

  async loginUser(email, password, ipAddress, userAgent) {
    try {
      // Get user with role information
      const result = await this.db.query(`
        SELECT u.*, ur.name as role_name, ur.permissions
        FROM users u
        JOIN user_roles ur ON u.role_id = ur.id
        WHERE u.email = $1 AND u.is_active = true
      `, [email]);

      if (result.rows.length === 0) {
        await this.logFailedLogin(email, 'USER_NOT_FOUND', ipAddress);
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      // Check if account is locked
      if (user.locked_until && new Date() < new Date(user.locked_until)) {
        const unlockTime = new Date(user.locked_until).toLocaleString();
        throw new Error(`Account locked until ${unlockTime}`);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        await this.handleFailedLogin(user.id, user.email, ipAddress);
        throw new Error('Invalid credentials');
      }

      // Reset failed attempts on successful login
      await this.resetFailedAttempts(user.id);

      // Update last login
      await this.db.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = this.generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role_name,
        permissions: user.permissions
      });

      // Create session
      const session = await this.createSession(user.id, token, ipAddress, userAgent);

      // Log successful login
      await this.logAuditEvent(user.id, 'USER_LOGIN', 'users', user.id, {
        ip_address: ipAddress,
        user_agent: userAgent
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role_name,
          permissions: user.permissions,
          isVerified: user.is_verified
        },
        token,
        sessionId: session.id,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  // =============================================
  // SESSION MANAGEMENT
  // =============================================

  async createSession(userId, token, ipAddress, userAgent) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await this.db.query(`
      INSERT INTO user_sessions (
        user_id, session_token, expires_at, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, session_token, expires_at
    `, [userId, sessionToken, expiresAt, ipAddress, userAgent]);

    return result.rows[0];
  }

  async validateSession(sessionToken) {
    const result = await this.db.query(`
      SELECT us.*, u.email, u.first_name, u.last_name, ur.name as role_name, ur.permissions
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      JOIN user_roles ur ON u.role_id = ur.id
      WHERE us.session_token = $1 AND us.expires_at > NOW() AND u.is_active = true
    `, [sessionToken]);

    return result.rows[0] || null;
  }

  async revokeSession(sessionToken) {
    await this.db.query(
      'DELETE FROM user_sessions WHERE session_token = $1',
      [sessionToken]
    );
  }

  async revokeAllUserSessions(userId) {
    await this.db.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [userId]
    );
  }

  // =============================================
  // TOKEN MANAGEMENT
  // =============================================

  generateJWT(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.tokenExpiry,
      issuer: 'reddytalk.ai',
      audience: 'reddytalk-users'
    });
  }

  verifyJWT(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'reddytalk.ai',
        audience: 'reddytalk-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async createVerificationToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.db.query(`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `, [userId, token, expiresAt]);

    return token;
  }

  // =============================================
  // PASSWORD MANAGEMENT
  // =============================================

  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async requestPasswordReset(email) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return { success: true, message: 'If email exists, reset instructions sent' };
    }

    // Delete any existing reset tokens
    await this.db.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user.id]
    );

    // Create new reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.db.query(`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `, [user.id, resetToken, expiresAt]);

    // Log password reset request
    await this.logAuditEvent(user.id, 'PASSWORD_RESET_REQUESTED', 'users', user.id);

    return {
      success: true,
      resetToken,
      message: 'Password reset instructions sent'
    };
  }

  async resetPassword(resetToken, newPassword) {
    // Validate token
    const result = await this.db.query(`
      SELECT prt.*, u.email
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = $1 AND prt.expires_at > NOW() AND prt.used_at IS NULL
    `, [resetToken]);

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const resetData = result.rows[0];

    // Validate new password
    this.validatePassword(newPassword);

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password and mark token as used
    await this.db.query('BEGIN');
    
    try {
      await this.db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, resetData.user_id]
      );

      await this.db.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
        [resetData.id]
      );

      await this.db.query('COMMIT');

      // Revoke all existing sessions
      await this.revokeAllUserSessions(resetData.user_id);

      // Log password reset
      await this.logAuditEvent(resetData.user_id, 'PASSWORD_RESET', 'users', resetData.user_id);

      return { success: true, message: 'Password reset successful' };

    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }

  // =============================================
  // ACCOUNT SECURITY
  // =============================================

  async handleFailedLogin(userId, email, ipAddress) {
    // Increment failed attempts
    const result = await this.db.query(`
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE 
            WHEN failed_login_attempts + 1 >= $1 
            THEN NOW() + INTERVAL '${this.lockoutDuration} milliseconds'
            ELSE locked_until
          END
      WHERE id = $2
      RETURNING failed_login_attempts, locked_until
    `, [this.maxFailedAttempts, userId]);

    const user = result.rows[0];

    await this.logFailedLogin(email, 'INVALID_PASSWORD', ipAddress, {
      failed_attempts: user.failed_login_attempts,
      locked: !!user.locked_until
    });
  }

  async resetFailedAttempts(userId) {
    await this.db.query(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL 
      WHERE id = $1
    `, [userId]);
  }

  async logFailedLogin(email, reason, ipAddress, details = {}) {
    await this.logAuditEvent(null, 'LOGIN_FAILED', 'auth', null, {
      email,
      reason,
      ip_address: ipAddress,
      ...details
    });
  }

  // =============================================
  // USER MANAGEMENT
  // =============================================

  async getUserByEmail(email) {
    const result = await this.db.query(`
      SELECT u.*, ur.name as role_name, ur.permissions
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      WHERE u.email = $1
    `, [email]);

    return result.rows[0] || null;
  }

  async getUserById(userId) {
    const result = await this.db.query(`
      SELECT u.*, ur.name as role_name, ur.permissions
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      WHERE u.id = $1 AND u.is_active = true
    `, [userId]);

    return result.rows[0] || null;
  }

  async verifyEmail(token) {
    const result = await this.db.query(`
      UPDATE users 
      SET is_verified = true 
      WHERE id = (
        SELECT user_id FROM password_reset_tokens 
        WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL
      )
      RETURNING id, email
    `, [token]);

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired verification token');
    }

    const user = result.rows[0];

    // Mark token as used
    await this.db.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
      [token]
    );

    await this.logAuditEvent(user.id, 'EMAIL_VERIFIED', 'users', user.id);

    return { success: true, message: 'Email verified successfully' };
  }

  // =============================================
  // VALIDATION & UTILITIES
  // =============================================

  validateUserInput({ email, password, firstName, lastName }) {
    if (!email || !this.isValidEmail(email)) {
      throw new Error('Valid email is required');
    }

    if (!password) {
      throw new Error('Password is required');
    }

    this.validatePassword(password);

    if (!firstName || firstName.trim().length < 2) {
      throw new Error('First name must be at least 2 characters');
    }

    if (!lastName || lastName.trim().length < 2) {
      throw new Error('Last name must be at least 2 characters');
    }
  }

  validatePassword(password) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error('Password must contain uppercase, lowercase, and number');
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // =============================================
  // AUDIT LOGGING
  // =============================================

  async logAuditEvent(userId, action, resourceType, resourceId, details = {}) {
    try {
      await this.db.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, details, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(details),
        details.ip_address || null
      ]);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  // =============================================
  // PERMISSIONS & AUTHORIZATION
  // =============================================

  hasPermission(userPermissions, resource, action) {
    if (!userPermissions || typeof userPermissions !== 'object') {
      return false;
    }

    // Admin has all permissions
    if (userPermissions.all === true) {
      return true;
    }

    // Check specific resource permission
    const resourcePermission = userPermissions[resource];
    if (!resourcePermission) {
      return false;
    }

    // Check if action is allowed
    return resourcePermission === 'read_write' || 
           (resourcePermission === 'read' && action === 'read');
  }

  async checkPermission(userId, resource, action) {
    const user = await this.getUserById(userId);
    if (!user) {
      return false;
    }

    return this.hasPermission(user.permissions, resource, action);
  }

  // =============================================
  // CLEANUP UTILITIES
  // =============================================

  async cleanupExpiredSessions() {
    const result = await this.db.query(
      'DELETE FROM user_sessions WHERE expires_at < NOW() RETURNING COUNT(*)'
    );
    
    console.log(`🧹 Cleaned up ${result.rows[0].count} expired sessions`);
    return result.rows[0].count;
  }

  async cleanupExpiredTokens() {
    const result = await this.db.query(
      'DELETE FROM password_reset_tokens WHERE expires_at < NOW() RETURNING COUNT(*)'
    );
    
    console.log(`🧹 Cleaned up ${result.rows[0].count} expired tokens`);
    return result.rows[0].count;
  }

  // =============================================
  // HEALTH CHECK
  // =============================================

  async healthCheck() {
    try {
      await this.db.query('SELECT 1');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

module.exports = AuthService;