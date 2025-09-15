const express = require('express');
const cors = require('cors');
const app = express();
const port = 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock services
const mockDatabase = {
  users: [
    { id: 1, email: 'admin@reddytalk.ai', role: 'admin' },
    { id: 2, email: 'doctor@clinic.com', role: 'doctor' }
  ],
  patients: [
    { id: 1, name: 'John Doe', phone: '+1234567890', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', phone: '+0987654321', email: 'jane@example.com' }
  ],
  calls: []
};

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== HEALTH ENDPOINTS ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ReddyTalk Mock Backend',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

app.get('/health/live', (req, res) => {
  res.json({
    status: 'live',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', (req, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: { isHealthy: true, latency: 5 },
      ai: { isHealthy: true, model: 'mock-gpt4' },
      voice: { isHealthy: true, provider: 'mock-elevenlabs' }
    }
  });
});

// ==================== AUTH ENDPOINTS ====================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password: '***' });
  
  const user = mockDatabase.users.find(u => u.email === email);
  if (user) {
    res.json({
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  const newUser = {
    id: mockDatabase.users.length + 1,
    email,
    name,
    role: 'staff'
  };
  mockDatabase.users.push(newUser);
  
  res.json({
    success: true,
    message: 'User registered successfully',
    user: newUser
  });
});

// ==================== PATIENT ENDPOINTS ====================
app.get('/api/patients', (req, res) => {
  res.json({
    success: true,
    patients: mockDatabase.patients,
    total: mockDatabase.patients.length
  });
});

app.get('/api/patients/:id', (req, res) => {
  const patient = mockDatabase.patients.find(p => p.id === parseInt(req.params.id));
  if (patient) {
    res.json({ success: true, patient });
  } else {
    res.status(404).json({ success: false, message: 'Patient not found' });
  }
});

app.post('/api/patients', (req, res) => {
  const { name, phone, email } = req.body;
  const newPatient = {
    id: mockDatabase.patients.length + 1,
    name,
    phone,
    email,
    createdAt: new Date().toISOString()
  };
  mockDatabase.patients.push(newPatient);
  
  res.json({
    success: true,
    message: 'Patient created successfully',
    patient: newPatient
  });
});

// ==================== CALL ENDPOINTS ====================
app.post('/api/calls', (req, res) => {
  const { patientId, type } = req.body;
  const newCall = {
    id: 'call-' + Date.now(),
    patientId,
    type: type || 'outbound',
    status: 'initiated',
    startTime: new Date().toISOString(),
    duration: 0
  };
  mockDatabase.calls.push(newCall);
  
  res.json({
    success: true,
    message: 'Call initiated',
    call: newCall
  });
});

app.get('/api/calls', (req, res) => {
  res.json({
    success: true,
    calls: mockDatabase.calls,
    total: mockDatabase.calls.length
  });
});

app.get('/api/calls/active', (req, res) => {
  const activeCalls = mockDatabase.calls.filter(c => c.status === 'active' || c.status === 'initiated');
  res.json({
    success: true,
    calls: activeCalls,
    total: activeCalls.length
  });
});

app.post('/api/calls/:id/end', (req, res) => {
  const call = mockDatabase.calls.find(c => c.id === req.params.id);
  if (call) {
    call.status = 'completed';
    call.endTime = new Date().toISOString();
    call.duration = Math.floor(Math.random() * 300) + 30; // Random duration 30-330 seconds
    res.json({ success: true, message: 'Call ended', call });
  } else {
    res.status(404).json({ success: false, message: 'Call not found' });
  }
});

// ==================== CONVERSATION/AI ENDPOINTS ====================
app.post('/api/conversation/start', (req, res) => {
  const { patientId, context } = req.body;
  res.json({
    success: true,
    sessionId: 'conv-' + Date.now(),
    message: 'Conversation started',
    aiResponse: 'Hello! I\'m the ReddyTalk AI assistant. How can I help you today?'
  });
});

app.post('/api/conversation/message', (req, res) => {
  const { sessionId, message } = req.body;
  
  // Mock AI responses based on keywords
  let aiResponse = 'I understand. How else can I help you?';
  
  if (message.toLowerCase().includes('appointment')) {
    aiResponse = 'I can help you schedule an appointment. What date and time works best for you?';
  } else if (message.toLowerCase().includes('prescription')) {
    aiResponse = 'I\'ll connect you with the doctor regarding your prescription. Please hold.';
  } else if (message.toLowerCase().includes('emergency')) {
    aiResponse = 'If this is a medical emergency, please call 911 immediately.';
  }
  
  res.json({
    success: true,
    sessionId,
    userMessage: message,
    aiResponse,
    timestamp: new Date().toISOString()
  });
});

// ==================== VOICE ENDPOINTS ====================
app.post('/api/voice/text-to-speech', (req, res) => {
  const { text, voice } = req.body;
  res.json({
    success: true,
    message: 'Text converted to speech',
    audioUrl: 'https://mock-audio-url.com/audio-' + Date.now() + '.mp3',
    duration: text.length * 0.06, // Rough estimate
    voice: voice || 'default'
  });
});

app.post('/api/voice/speech-to-text', (req, res) => {
  const { audioUrl } = req.body;
  res.json({
    success: true,
    message: 'Speech converted to text',
    text: 'This is a mock transcription of the audio',
    confidence: 0.95,
    language: 'en-US'
  });
});

// ==================== TEST ENDPOINTS ====================
app.get('/api/test/simple', (req, res) => {
  res.json({
    success: true,
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test/simple/knowledge', (req, res) => {
  res.json({
    status: 'success',
    message: 'AI knowledge base is accessible',
    capabilities: [
      'Medical terminology understanding',
      'Appointment scheduling',
      'Patient triage',
      'Prescription inquiries'
    ]
  });
});

// ==================== METRICS ENDPOINT ====================
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    totalRequests: Math.floor(Math.random() * 1000),
    activeConnections: Math.floor(Math.random() * 10),
    callsProcessed: mockDatabase.calls.length,
    timestamp: new Date().toISOString()
  });
});

// ==================== XIAOHONGSHU MCP ENDPOINTS ====================
app.post('/api/mcp/xiaohongshu/login', (req, res) => {
  const { username, password } = req.body;
  res.json({
    success: true,
    session: 'mock-xhs-session-' + Date.now(),
    message: 'Xiaohongshu login successful (mock)',
    user: {
      username: username,
      id: 'user-' + Date.now(),
      followers: 1250,
      following: 890
    }
  });
});

app.post('/api/mcp/xiaohongshu/publish', (req, res) => {
  const { title, content, images, tags } = req.body;
  res.json({
    success: true,
    postId: 'post-' + Date.now(),
    url: `https://xiaohongshu.com/explore/post-${Date.now()}`,
    message: 'Content published successfully (mock)',
    engagement: {
      expectedViews: Math.floor(Math.random() * 5000) + 1000,
      estimatedLikes: Math.floor(Math.random() * 500) + 50
    }
  });
});

app.post('/api/mcp/xiaohongshu/search', (req, res) => {
  const { query, type, limit } = req.body;
  
  const mockResults = [
    {
      id: 'result-1',
      title: `医疗AI助手：${query}相关内容`,
      content: `深度解析${query}在医疗行业的应用场景和实践经验分享...`,
      author: 'AI医疗专家',
      authorId: 'expert-001',
      likes: 2450,
      comments: 189,
      shares: 67,
      url: 'https://xiaohongshu.com/explore/result-1',
      images: ['https://mock-image-1.jpg'],
      tags: ['医疗AI', query, 'ReddyTalk', '智能诊疗'],
      publishTime: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'result-2',
      title: `${query}实践指南分享`,
      content: `基于真实案例分享${query}的最佳实践方法和注意事项...`,
      author: '数字医疗先锋',
      authorId: 'pioneer-002',
      likes: 1890,
      comments: 156,
      shares: 45,
      url: 'https://xiaohongshu.com/explore/result-2',
      images: ['https://mock-image-2.jpg', 'https://mock-image-3.jpg'],
      tags: [query, '医疗科技', '实践指南'],
      publishTime: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  res.json({
    success: true,
    query: query,
    results: mockResults.slice(0, limit || 10),
    totalCount: mockResults.length,
    searchTime: Math.random() * 500 + 100
  });
});

app.post('/api/mcp/xiaohongshu/generate', (req, res) => {
  const { prompt, type, style } = req.body;
  
  res.json({
    success: true,
    generated: {
      title: `${prompt}：医疗AI的创新应用`,
      content: `🏥 关于"${prompt}"的深度分析

✨ 核心亮点：
• 基于ReddyTalk AI技术的医疗应用创新
• 提升患者就医体验的智能解决方案
• 医疗机构数字化转型的实践案例

💡 应用场景：
1. 智能预约挂号和患者咨询
2. 症状初筛和就诊建议
3. 医疗知识普及和健康管理

🔬 技术优势：
- 自然语言理解能力强
- 医疗知识库丰富专业
- 响应速度快，可用性高

📈 未来展望：
随着AI技术的不断发展，医疗智能化将成为趋势，ReddyTalk这样的解决方案将为医疗行业带来更多可能性。

#医疗AI #ReddyTalk #智能诊疗 #数字医疗 #AI助手`,
      tags: ['医疗AI', 'ReddyTalk', '智能诊疗', '数字医疗', 'AI助手', prompt],
      images: [
        'https://mock-medical-ai-1.jpg',
        'https://mock-reddytalk-demo.jpg',
        'https://mock-hospital-tech.jpg'
      ],
      estimatedEngagement: {
        expectedViews: Math.floor(Math.random() * 10000) + 2000,
        expectedLikes: Math.floor(Math.random() * 800) + 100,
        expectedComments: Math.floor(Math.random() * 100) + 20
      }
    },
    generationTime: Math.random() * 2000 + 1000
  });
});

app.get('/api/mcp/xiaohongshu/feed', (req, res) => {
  const { type, limit } = req.query;
  
  const mockPosts = [
    {
      id: 'feed-1',
      title: '医疗AI革命：ReddyTalk如何改变就医体验',
      content: '体验了最新的AI医疗助手，真的太惊艳了！',
      author: '科技医疗爱好者',
      authorAvatar: 'https://mock-avatar-1.jpg',
      likes: 3200,
      comments: 245,
      publishTime: new Date().toISOString(),
      images: ['https://mock-post-1.jpg']
    },
    {
      id: 'feed-2',
      title: '智能诊疗系统使用心得分享',
      content: '分享使用智能诊疗系统的真实体验和建议',
      author: '数字健康达人',
      authorAvatar: 'https://mock-avatar-2.jpg',
      likes: 2100,
      comments: 167,
      publishTime: new Date(Date.now() - 3600000).toISOString(),
      images: ['https://mock-post-2.jpg', 'https://mock-post-3.jpg']
    }
  ];

  res.json({
    success: true,
    posts: mockPosts.slice(0, limit || 10),
    hasMore: true,
    feedType: type || 'recommend'
  });
});

app.get('/api/mcp/xiaohongshu/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: {
      postsPublished: Math.floor(Math.random() * 100) + 50,
      totalViews: Math.floor(Math.random() * 50000) + 10000,
      totalLikes: Math.floor(Math.random() * 5000) + 1000,
      totalComments: Math.floor(Math.random() * 1000) + 200,
      followers: Math.floor(Math.random() * 2000) + 500,
      engagementRate: (Math.random() * 5 + 2).toFixed(2) + '%',
      lastActivity: new Date().toISOString()
    }
  });
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health',
      'GET /health/live',
      'GET /health/ready',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/patients',
      'GET /api/patients/:id',
      'POST /api/patients',
      'POST /api/calls',
      'GET /api/calls',
      'GET /api/calls/active',
      'POST /api/calls/:id/end',
      'POST /api/conversation/start',
      'POST /api/conversation/message',
      'POST /api/voice/text-to-speech',
      'POST /api/voice/speech-to-text',
      'GET /api/test/simple',
      'GET /metrics',
      'POST /api/mcp/xiaohongshu/login',
      'POST /api/mcp/xiaohongshu/publish',
      'POST /api/mcp/xiaohongshu/search',
      'POST /api/mcp/xiaohongshu/generate',
      'GET /api/mcp/xiaohongshu/feed',
      'GET /api/mcp/xiaohongshu/metrics'
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log(`
🚀 ReddyTalk Mock Backend Server
================================
✅ Server running on http://localhost:${port}
📊 Health check: http://localhost:${port}/health
📝 API Documentation: See Postman collection
================================

Available endpoints:
- Health: GET /health, /health/live, /health/ready
- Auth: POST /api/auth/login, /api/auth/register
- Patients: GET/POST /api/patients
- Calls: GET/POST /api/calls
- Conversation: POST /api/conversation/start, /api/conversation/message
- Voice: POST /api/voice/text-to-speech, /api/voice/speech-to-text

Test credentials:
- Email: admin@reddytalk.ai
- Email: doctor@clinic.com
  `);
});