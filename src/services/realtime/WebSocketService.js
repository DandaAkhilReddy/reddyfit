// WebSocketService.js - Enterprise Real-time Communication Service
// Principal System Architect level implementation for live transcription and dashboard

const WebSocket = require('ws');
const EventEmitter = require('events');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class WebSocketService extends EventEmitter {
  constructor(server, options = {}) {
    super();
    this.server = server;
    this.options = {
      port: options.port || process.env.WEBSOCKET_PORT || 8081,
      path: options.path || '/ws',
      maxConnections: options.maxConnections || 1000,
      heartbeatInterval: options.heartbeatInterval || 30000,
      ...options
    };
    
    this.wss = null;
    this.connections = new Map(); // connectionId -> connection info
    this.rooms = new Map(); // roomId -> Set of connectionIds
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      messagesPerSecond: 0,
      avgLatency: 0,
      errors: 0
    };
    
    this.messageQueue = new Map(); // For handling high-throughput scenarios
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Enterprise WebSocket Service...');
      
      // Create WebSocket server with advanced configuration
      this.wss = new WebSocket.Server({
        server: this.server,
        path: this.options.path,
        maxPayload: 1024 * 1024, // 1MB max payload
        perMessageDeflate: {
          threshold: 1024,
          concurrencyLimit: 10,
          memLevel: 8
        },
        clientTracking: true
      });
      
      this.setupConnectionHandling();
      this.setupHeartbeat();
      this.setupMetricsCollection();
      
      this.isInitialized = true;
      console.log(`✅ WebSocket Service initialized on ${this.options.path}`);
      this.emit('initialized');
      
      return true;
    } catch (error) {
      console.error('❌ WebSocket Service initialization failed:', error);
      throw error;
    }
  }

  setupConnectionHandling() {
    this.wss.on('connection', (ws, request) => {
      const connectionId = uuidv4();
      const clientIP = request.socket.remoteAddress;
      
      console.log(`🔗 New WebSocket connection: ${connectionId} from ${clientIP}`);
      
      // Initialize connection metadata
      const connectionInfo = {
        id: connectionId,
        ws: ws,
        ip: clientIP,
        connectedAt: new Date(),
        lastPing: new Date(),
        isAlive: true,
        subscriptions: new Set(),
        userAgent: request.headers['user-agent'],
        userId: null,
        role: null,
        rooms: new Set()
      };
      
      this.connections.set(connectionId, connectionInfo);
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;
      
      // Set up message handling
      ws.on('message', (data) => {
        this.handleMessage(connectionId, data);
      });
      
      // Handle connection close
      ws.on('close', (code, reason) => {
        console.log(`🔌 Connection closed: ${connectionId}, Code: ${code}`);
        this.handleDisconnection(connectionId);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${connectionId}:`, error);
        this.metrics.errors++;
        this.handleDisconnection(connectionId);
      });
      
      // Set up ping/pong for connection health
      ws.on('pong', () => {
        if (this.connections.has(connectionId)) {
          this.connections.get(connectionId).isAlive = true;
          this.connections.get(connectionId).lastPing = new Date();
        }
      });
      
      // Send welcome message
      this.sendToConnection(connectionId, {
        type: 'welcome',
        connectionId: connectionId,
        timestamp: new Date().toISOString(),
        serverTime: new Date().toISOString()
      });
      
      this.emit('connection', { connectionId, connectionInfo });
    });
  }

  setupHeartbeat() {
    const interval = setInterval(() => {
      const now = Date.now();
      
      this.connections.forEach((conn, connectionId) => {
        if (!conn.isAlive) {
          console.log(`💀 Terminating dead connection: ${connectionId}`);
          conn.ws.terminate();
          this.handleDisconnection(connectionId);
          return;
        }
        
        conn.isAlive = false;
        conn.ws.ping();
        
        // Check for stale connections (no activity for 5 minutes)
        if (now - conn.lastPing.getTime() > 300000) {
          console.log(`⏰ Closing stale connection: ${connectionId}`);
          conn.ws.close(1000, 'Connection timeout');
        }
      });
    }, this.options.heartbeatInterval);
    
    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  setupMetricsCollection() {
    // Collect metrics every 10 seconds
    setInterval(() => {
      this.metrics.activeConnections = this.connections.size;
      
      // Calculate messages per second
      const currentTime = Date.now();
      this.metrics.messagesPerSecond = this.messageCount || 0;
      this.messageCount = 0;
      
      // Emit metrics for monitoring
      this.emit('metrics', this.metrics);
    }, 10000);
  }

  async handleMessage(connectionId, data) {
    try {
      this.messageCount = (this.messageCount || 0) + 1;
      const connection = this.connections.get(connectionId);
      
      if (!connection) {
        console.warn(`⚠️ Message from unknown connection: ${connectionId}`);
        return;
      }
      
      let message;
      try {
        message = JSON.parse(data.toString());
      } catch (error) {
        this.sendError(connectionId, 'Invalid JSON message');
        return;
      }
      
      // Handle different message types
      switch (message.type) {
        case 'authenticate':
          await this.handleAuthentication(connectionId, message);
          break;
          
        case 'subscribe':
          await this.handleSubscription(connectionId, message);
          break;
          
        case 'unsubscribe':
          await this.handleUnsubscription(connectionId, message);
          break;
          
        case 'join_room':
          await this.handleJoinRoom(connectionId, message);
          break;
          
        case 'leave_room':
          await this.handleLeaveRoom(connectionId, message);
          break;
          
        case 'live_transcription':
          await this.handleLiveTranscription(connectionId, message);
          break;
          
        case 'dashboard_request':
          await this.handleDashboardRequest(connectionId, message);
          break;
          
        case 'ping':
          this.sendToConnection(connectionId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        default:
          this.sendError(connectionId, `Unknown message type: ${message.type}`);
      }
      
      this.emit('message', { connectionId, message, connection });
      
    } catch (error) {
      console.error(`❌ Error handling message from ${connectionId}:`, error);
      this.sendError(connectionId, 'Internal server error');
      this.metrics.errors++;
    }
  }

  async handleAuthentication(connectionId, message) {
    try {
      const { token } = message;
      
      // Verify JWT token (simplified for demo)
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'reddytalk-secret');
      } catch (error) {
        this.sendError(connectionId, 'Invalid authentication token');
        return;
      }
      
      const connection = this.connections.get(connectionId);
      connection.userId = decoded.userId;
      connection.role = decoded.role;
      
      this.sendToConnection(connectionId, {
        type: 'authenticated',
        userId: decoded.userId,
        role: decoded.role,
        permissions: this.getPermissions(decoded.role)
      });
      
      console.log(`🔐 Connection ${connectionId} authenticated as ${decoded.role}`);
      
    } catch (error) {
      this.sendError(connectionId, 'Authentication failed');
    }
  }

  async handleSubscription(connectionId, message) {
    const { channels } = message;
    const connection = this.connections.get(connectionId);
    
    if (!connection) return;
    
    channels.forEach(channel => {
      connection.subscriptions.add(channel);
      console.log(`📡 Connection ${connectionId} subscribed to ${channel}`);
    });
    
    this.sendToConnection(connectionId, {
      type: 'subscribed',
      channels: Array.from(connection.subscriptions)
    });
  }

  async handleJoinRoom(connectionId, message) {
    const { roomId } = message;
    const connection = this.connections.get(connectionId);
    
    if (!connection) return;
    
    // Add connection to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(connectionId);
    connection.rooms.add(roomId);
    
    this.sendToConnection(connectionId, {
      type: 'room_joined',
      roomId: roomId,
      memberCount: this.rooms.get(roomId).size
    });
    
    console.log(`🏠 Connection ${connectionId} joined room ${roomId}`);
  }

  async handleLiveTranscription(connectionId, message) {
    const { sessionId, transcriptionData } = message;
    
    // Broadcast live transcription to all dashboard connections
    this.broadcastToSubscribers('live_transcription', {
      sessionId: sessionId,
      transcription: transcriptionData.text,
      confidence: transcriptionData.confidence,
      timestamp: new Date().toISOString(),
      isFinal: transcriptionData.isFinal || false
    });
    
    // Also send to specific conversation room
    this.broadcastToRoom(`conversation_${sessionId}`, {
      type: 'live_transcription_update',
      data: transcriptionData
    });
  }

  async handleDashboardRequest(connectionId, message) {
    const { requestType, params } = message;
    
    // Handle different dashboard data requests
    switch (requestType) {
      case 'active_conversations':
        // This would typically fetch from database
        this.sendToConnection(connectionId, {
          type: 'dashboard_data',
          requestType: 'active_conversations',
          data: await this.getActiveConversationsData()
        });
        break;
        
      case 'real_time_metrics':
        this.sendToConnection(connectionId, {
          type: 'dashboard_data',
          requestType: 'real_time_metrics',
          data: this.getRealTimeMetrics()
        });
        break;
        
      case 'system_health':
        this.sendToConnection(connectionId, {
          type: 'dashboard_data',
          requestType: 'system_health',
          data: await this.getSystemHealth()
        });
        break;
    }
  }

  handleDisconnection(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      // Remove from all rooms
      connection.rooms.forEach(roomId => {
        const room = this.rooms.get(roomId);
        if (room) {
          room.delete(connectionId);
          if (room.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      });
      
      this.connections.delete(connectionId);
      this.metrics.activeConnections--;
      
      this.emit('disconnection', { connectionId, connection });
    }
  }

  // ============ BROADCASTING METHODS ============

  broadcastToAll(message) {
    const messageStr = JSON.stringify(message);
    
    this.connections.forEach((connection, connectionId) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(messageStr);
        } catch (error) {
          console.error(`❌ Error broadcasting to ${connectionId}:`, error);
        }
      }
    });
  }

  broadcastToSubscribers(channel, message) {
    const messageObj = {
      type: 'broadcast',
      channel: channel,
      data: message,
      timestamp: new Date().toISOString()
    };
    
    const messageStr = JSON.stringify(messageObj);
    
    this.connections.forEach((connection, connectionId) => {
      if (connection.subscriptions.has(channel) && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(messageStr);
        } catch (error) {
          console.error(`❌ Error broadcasting to subscriber ${connectionId}:`, error);
        }
      }
    });
  }

  broadcastToRoom(roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const messageObj = {
      type: 'room_broadcast',
      roomId: roomId,
      data: message,
      timestamp: new Date().toISOString()
    };
    
    const messageStr = JSON.stringify(messageObj);
    
    room.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(messageStr);
        } catch (error) {
          console.error(`❌ Error broadcasting to room member ${connectionId}:`, error);
        }
      }
    });
  }

  sendToConnection(connectionId, message) {
    const connection = this.connections.get(connectionId);
    
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify({
          ...message,
          timestamp: message.timestamp || new Date().toISOString()
        });
        
        connection.ws.send(messageStr);
        return true;
      } catch (error) {
        console.error(`❌ Error sending to ${connectionId}:`, error);
        return false;
      }
    }
    
    return false;
  }

  sendError(connectionId, errorMessage) {
    this.sendToConnection(connectionId, {
      type: 'error',
      message: errorMessage
    });
  }

  // ============ LIVE TRANSCRIPTION SPECIFIC METHODS ============

  streamTranscriptionToConnections(sessionId, transcriptionChunk) {
    // Send to dashboard subscribers
    this.broadcastToSubscribers('live_transcription', {
      sessionId: sessionId,
      text: transcriptionChunk.text,
      confidence: transcriptionChunk.confidence,
      isFinal: transcriptionChunk.isFinal,
      timestamp: new Date().toISOString()
    });
    
    // Send to conversation-specific room
    this.broadcastToRoom(`conversation_${sessionId}`, {
      type: 'transcription_chunk',
      text: transcriptionChunk.text,
      confidence: transcriptionChunk.confidence,
      isFinal: transcriptionChunk.isFinal
    });
  }

  streamConversationUpdate(sessionId, updateData) {
    this.broadcastToSubscribers('conversation_updates', {
      sessionId: sessionId,
      ...updateData
    });
  }

  // ============ UTILITY METHODS ============

  getPermissions(role) {
    const permissions = {
      admin: ['view_all', 'manage_system', 'export_data', 'view_recordings'],
      operator: ['view_active', 'manage_calls', 'basic_reports'],
      viewer: ['view_dashboard', 'view_metrics']
    };
    
    return permissions[role] || permissions.viewer;
  }

  async getActiveConversationsData() {
    // This would integrate with DatabaseService
    return {
      totalActive: this.rooms.size,
      conversations: Array.from(this.rooms.keys()).map(roomId => ({
        roomId,
        memberCount: this.rooms.get(roomId).size,
        lastActivity: new Date().toISOString()
      }))
    };
  }

  getRealTimeMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      roomCount: this.rooms.size,
      totalSubscriptions: Array.from(this.connections.values())
        .reduce((sum, conn) => sum + conn.subscriptions.size, 0)
    };
  }

  async getSystemHealth() {
    return {
      websocket: {
        status: 'healthy',
        activeConnections: this.metrics.activeConnections,
        totalConnections: this.metrics.totalConnections,
        uptime: Date.now() - (this.initTime || Date.now())
      },
      timestamp: new Date().toISOString()
    };
  }

  getConnectionInfo(connectionId) {
    return this.connections.get(connectionId);
  }

  getStats() {
    return {
      connections: this.metrics.activeConnections,
      rooms: this.rooms.size,
      metrics: this.metrics,
      uptime: Date.now() - (this.initTime || Date.now())
    };
  }

  async shutdown() {
    console.log('🔌 Shutting down WebSocket Service...');
    
    // Notify all connections
    this.broadcastToAll({
      type: 'server_shutdown',
      message: 'Server is shutting down'
    });
    
    // Close all connections gracefully
    this.connections.forEach((connection, connectionId) => {
      connection.ws.close(1001, 'Server shutdown');
    });
    
    // Close server
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('✅ WebSocket Service shut down complete');
  }
}

module.exports = WebSocketService;