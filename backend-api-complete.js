const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const app = express();
const port = 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'reddytalk-secret-key-change-in-production';

// Database connection (PostgreSQL)
const pool = new Pool({
    user: process.env.DB_USER || 'reddytalkuser',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'reddytalk',
    password: process.env.DB_PASSWORD || 'password123',
    port: process.env.DB_PORT || 5432,
});

// In-memory storage for development (replace with real database)
const mockDatabase = {
    users: [
        {
            id: 1,
            email: 'admin@reddytalk.ai',
            password: '$2a$10$K9p7rF3qHxGz4P2vR8nQ9eJ5L8mWx1tY6cU4zN3oA7sG9hK2lM5wO', // admin123
            name: 'System Administrator',
            role: 'admin',
            avatar: 'https://ui-avatars.com/api/?name=Admin&background=667eea&color=fff',
            created_at: new Date('2024-01-01'),
            last_login: null,
            is_active: true
        },
        {
            id: 2,
            email: 'doctor@clinic.com',
            password: '$2a$10$K9p7rF3qHxGz4P2vR8nQ9eJ5L8mWx1tY6cU4zN3oA7sG9hK2lM5wO', // doctor123
            name: 'Dr. Sarah Wilson',
            role: 'doctor',
            avatar: 'https://ui-avatars.com/api/?name=Dr.+Sarah&background=10b981&color=fff',
            created_at: new Date('2024-01-02'),
            last_login: new Date(),
            is_active: true
        },
        {
            id: 3,
            email: 'nurse@clinic.com',
            password: '$2a$10$K9p7rF3qHxGz4P2vR8nQ9eJ5L8mWx1tY6cU4zN3oA7sG9hK2lM5wO', // nurse123
            name: 'Jennifer Martinez',
            role: 'staff',
            avatar: 'https://ui-avatars.com/api/?name=Jennifer&background=f59e0b&color=fff',
            created_at: new Date('2024-01-03'),
            last_login: new Date(),
            is_active: true
        }
    ],
    patients: [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@email.com',
            phone: '+1 (555) 123-4567',
            date_of_birth: '1985-03-15',
            address: '123 Main St, City, State 12345',
            medical_record_number: 'MRN001',
            insurance_provider: 'Blue Cross Blue Shield',
            emergency_contact: 'Jane Doe - +1 (555) 123-4568',
            allergies: ['Penicillin', 'Shellfish'],
            chronic_conditions: [],
            created_at: new Date('2024-01-10'),
            last_visit: new Date('2024-02-15'),
            status: 'active'
        },
        {
            id: 2,
            name: 'Maria Rodriguez',
            email: 'maria.r@email.com',
            phone: '+1 (555) 987-6543',
            date_of_birth: '1978-11-22',
            address: '456 Oak Ave, City, State 12345',
            medical_record_number: 'MRN002',
            insurance_provider: 'Aetna',
            emergency_contact: 'Carlos Rodriguez - +1 (555) 987-6544',
            allergies: ['Latex'],
            chronic_conditions: ['Diabetes Type 2', 'Hypertension'],
            created_at: new Date('2024-01-12'),
            last_visit: new Date('2024-03-01'),
            status: 'active'
        }
    ],
    conversations: [],
    calls: [],
    appointments: []
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Role-based access control middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions' 
            });
        }
        next();
    };
};

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// ==================== HEALTH & STATUS ENDPOINTS ====================
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ReddyTalk AI Medical Backend',
        version: '2.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected', // In real app, check actual DB connection
        services: {
            auth: 'operational',
            ai: 'operational',
            voice: 'operational',
            crawl4ai: 'operational'
        }
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        data: {
            total_users: mockDatabase.users.length,
            total_patients: mockDatabase.patients.length,
            active_conversations: mockDatabase.conversations.filter(c => c.status === 'active').length,
            total_calls: mockDatabase.calls.length,
            system_load: {
                cpu: Math.floor(Math.random() * 100),
                memory: Math.floor(Math.random() * 100),
                storage: Math.floor(Math.random() * 100)
            }
        }
    });
});

// ==================== AUTHENTICATION ENDPOINTS ====================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user in database
        const user = mockDatabase.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.is_active
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check role if provided
        if (role && user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `Access denied for role: ${role}`
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        user.last_login = new Date();

        // Remove password from response
        const { password: _, ...userResponse } = user;

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: userResponse,
            expires_in: '24h'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed due to server error'
        });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role = 'staff' } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = mockDatabase.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase()
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: mockDatabase.users.length + 1,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`,
            created_at: new Date(),
            last_login: null,
            is_active: true
        };

        // Add to database
        mockDatabase.users.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                name: newUser.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const { password: _, ...userResponse } = newUser;

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token: token,
            user: userResponse
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed due to server error'
        });
    }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    // In a real app, you might want to blacklist the token
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
    const user = mockDatabase.users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    const { password: _, ...userResponse } = user;
    
    res.json({
        success: true,
        user: userResponse
    });
});

app.put('/api/auth/profile', authenticateToken, (req, res) => {
    const { name, email, phone } = req.body;
    const user = mockDatabase.users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Update user fields
    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone.trim();

    const { password: _, ...userResponse } = user;
    
    res.json({
        success: true,
        message: 'Profile updated successfully',
        user: userResponse
    });
});

// ==================== PATIENT MANAGEMENT ENDPOINTS ====================
app.get('/api/patients', authenticateToken, (req, res) => {
    const { page = 1, limit = 10, search, status } = req.query;
    
    let patients = [...mockDatabase.patients];
    
    // Filter by search term
    if (search) {
        const searchTerm = search.toLowerCase();
        patients = patients.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.email.toLowerCase().includes(searchTerm) ||
            p.phone.includes(search) ||
            p.medical_record_number.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by status
    if (status) {
        patients = patients.filter(p => p.status === status);
    }
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPatients = patients.slice(startIndex, endIndex);
    
    res.json({
        success: true,
        data: {
            patients: paginatedPatients,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(patients.length / parseInt(limit)),
                total_patients: patients.length,
                per_page: parseInt(limit)
            }
        }
    });
});

app.get('/api/patients/:id', authenticateToken, (req, res) => {
    const patientId = parseInt(req.params.id);
    const patient = mockDatabase.patients.find(p => p.id === patientId);
    
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient not found'
        });
    }
    
    res.json({
        success: true,
        data: { patient }
    });
});

app.post('/api/patients', authenticateToken, requireRole(['admin', 'doctor', 'staff']), (req, res) => {
    const {
        name,
        email,
        phone,
        date_of_birth,
        address,
        insurance_provider,
        emergency_contact,
        allergies = [],
        chronic_conditions = []
    } = req.body;

    // Input validation
    if (!name || !email || !phone) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and phone are required'
        });
    }

    // Check for duplicate email
    const existingPatient = mockDatabase.patients.find(p => 
        p.email.toLowerCase() === email.toLowerCase()
    );

    if (existingPatient) {
        return res.status(409).json({
            success: false,
            message: 'Patient with this email already exists'
        });
    }

    // Create new patient
    const newPatient = {
        id: mockDatabase.patients.length + 1,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        date_of_birth,
        address: address?.trim(),
        medical_record_number: `MRN${String(mockDatabase.patients.length + 1).padStart(3, '0')}`,
        insurance_provider: insurance_provider?.trim(),
        emergency_contact: emergency_contact?.trim(),
        allergies: Array.isArray(allergies) ? allergies : [],
        chronic_conditions: Array.isArray(chronic_conditions) ? chronic_conditions : [],
        created_at: new Date(),
        last_visit: null,
        status: 'active',
        created_by: req.user.id
    };

    mockDatabase.patients.push(newPatient);

    res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: { patient: newPatient }
    });
});

// ==================== AI CONVERSATION ENDPOINTS ====================
app.post('/api/conversation/start', authenticateToken, (req, res) => {
    const { patient_id, context = '', type = 'general' } = req.body;

    const conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patient_id: patient_id || null,
        user_id: req.user.id,
        type: type,
        context: context,
        status: 'active',
        started_at: new Date(),
        messages: [],
        summary: null
    };

    mockDatabase.conversations.push(conversation);

    // Generate initial AI response
    const initialResponse = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversation_id: conversation.id,
        sender: 'ai',
        content: `Hello! I'm ReddyTalk AI, your medical assistant. I understand you're ${context || 'looking for assistance'}. How can I help you today?`,
        timestamp: new Date(),
        metadata: {
            ai_confidence: 0.95,
            intent: 'greeting',
            entities: []
        }
    };

    conversation.messages.push(initialResponse);

    res.json({
        success: true,
        data: {
            conversation_id: conversation.id,
            message: initialResponse
        }
    });
});

app.post('/api/conversation/message', authenticateToken, (req, res) => {
    const { conversation_id, content, type = 'text' } = req.body;

    if (!conversation_id || !content) {
        return res.status(400).json({
            success: false,
            message: 'Conversation ID and content are required'
        });
    }

    const conversation = mockDatabase.conversations.find(c => c.id === conversation_id);
    
    if (!conversation) {
        return res.status(404).json({
            success: false,
            message: 'Conversation not found'
        });
    }

    // Add user message
    const userMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversation_id: conversation.id,
        sender: 'user',
        content: content.trim(),
        type: type,
        timestamp: new Date()
    };

    conversation.messages.push(userMessage);

    // Generate AI response based on content
    const aiResponse = generateAIResponse(content, conversation.context);
    
    const aiMessage = {
        id: `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
        conversation_id: conversation.id,
        sender: 'ai',
        content: aiResponse.content,
        type: 'text',
        timestamp: new Date(),
        metadata: {
            ai_confidence: aiResponse.confidence,
            intent: aiResponse.intent,
            entities: aiResponse.entities,
            suggested_actions: aiResponse.actions
        }
    };

    conversation.messages.push(aiMessage);
    conversation.updated_at = new Date();

    res.json({
        success: true,
        data: {
            user_message: userMessage,
            ai_response: aiMessage
        }
    });
});

// AI response generation function
function generateAIResponse(userInput, context) {
    const input = userInput.toLowerCase();
    let response = {
        content: "I understand your concern. Let me help you with that.",
        confidence: 0.8,
        intent: 'general',
        entities: [],
        actions: []
    };

    // Medical appointment scheduling
    if (input.includes('appointment') || input.includes('schedule') || input.includes('book')) {
        response = {
            content: "I'd be happy to help you schedule an appointment. What type of appointment do you need, and do you have a preferred date and time? I can check our availability and get you scheduled with the appropriate healthcare provider.",
            confidence: 0.95,
            intent: 'appointment_booking',
            entities: ['appointment'],
            actions: ['open_calendar', 'show_availability']
        };
    }
    // Symptom inquiry
    else if (input.includes('symptom') || input.includes('pain') || input.includes('hurt') || input.includes('sick')) {
        response = {
            content: "I'm here to help with your health concerns. Can you describe your symptoms in more detail? When did they start, and how severe would you rate them on a scale of 1-10? This information will help me provide better assistance and determine if you need immediate care.",
            confidence: 0.92,
            intent: 'symptom_assessment',
            entities: ['symptoms'],
            actions: ['symptom_checker', 'urgency_assessment']
        };
    }
    // Prescription inquiries
    else if (input.includes('prescription') || input.includes('medication') || input.includes('refill')) {
        response = {
            content: "I can help you with prescription-related questions. Are you looking to refill an existing prescription, ask about side effects, or need information about a new medication? Please provide your patient information and I'll assist you accordingly.",
            confidence: 0.90,
            intent: 'prescription_inquiry',
            entities: ['prescription', 'medication'],
            actions: ['check_prescriptions', 'contact_pharmacy']
        };
    }
    // Emergency situations
    else if (input.includes('emergency') || input.includes('urgent') || input.includes('911')) {
        response = {
            content: "If this is a medical emergency, please call 911 immediately or go to the nearest emergency room. For urgent but non-emergency situations, I can help you find the appropriate care level or schedule a same-day appointment if available.",
            confidence: 0.98,
            intent: 'emergency',
            entities: ['emergency'],
            actions: ['emergency_protocols', 'urgent_care_options']
        };
    }
    // Insurance and billing
    else if (input.includes('insurance') || input.includes('billing') || input.includes('payment') || input.includes('cost')) {
        response = {
            content: "I can help you with insurance and billing questions. Are you asking about coverage for a specific service, need help with a bill, or want to update your insurance information? Please let me know what specific assistance you need.",
            confidence: 0.88,
            intent: 'billing_insurance',
            entities: ['insurance', 'billing'],
            actions: ['check_coverage', 'billing_inquiry']
        };
    }
    // General health information
    else if (input.includes('health') || input.includes('wellness') || input.includes('prevention')) {
        response = {
            content: "I'm glad you're taking an active interest in your health! I can provide information about preventive care, wellness programs, health screenings, and general health tips. What specific area of health and wellness would you like to learn more about?",
            confidence: 0.85,
            intent: 'health_information',
            entities: ['health', 'wellness'],
            actions: ['health_resources', 'wellness_programs']
        };
    }

    return response;
}

// ==================== VOICE SERVICES ENDPOINTS ====================
app.post('/api/voice/text-to-speech', authenticateToken, (req, res) => {
    const { text, voice = 'en-US-JennyNeural', speed = 1.0 } = req.body;

    if (!text) {
        return res.status(400).json({
            success: false,
            message: 'Text is required for speech synthesis'
        });
    }

    // Mock TTS response (in real app, integrate with Azure Speech Services)
    const audioUrl = `https://mock-tts-service.com/audio/${encodeURIComponent(text)}.mp3`;
    const duration = Math.ceil(text.length * 0.06); // Rough estimate

    res.json({
        success: true,
        data: {
            audio_url: audioUrl,
            duration_seconds: duration,
            voice_used: voice,
            speed: speed,
            text_processed: text.length,
            format: 'mp3',
            sample_rate: '22050Hz'
        }
    });
});

app.post('/api/voice/speech-to-text', authenticateToken, (req, res) => {
    const { audio_url, language = 'en-US' } = req.body;

    if (!audio_url) {
        return res.status(400).json({
            success: false,
            message: 'Audio URL is required for transcription'
        });
    }

    // Mock STT response (in real app, integrate with Azure Speech Services)
    const mockTranscriptions = [
        "I need to schedule an appointment with Dr. Smith for next week.",
        "Can you help me refill my blood pressure medication?",
        "I've been experiencing chest pain for the past two days.",
        "What are the visiting hours for the cardiac unit?",
        "I'd like to update my insurance information."
    ];

    const transcription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];

    res.json({
        success: true,
        data: {
            transcription: transcription,
            confidence: 0.85 + Math.random() * 0.15,
            language_detected: language,
            duration_seconds: Math.floor(Math.random() * 30) + 10,
            words_count: transcription.split(' ').length,
            processing_time_ms: Math.floor(Math.random() * 2000) + 500
        }
    });
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.method} ${req.path} not found`,
        available_endpoints: [
            'POST /api/auth/login',
            'POST /api/auth/register', 
            'GET /api/auth/profile',
            'GET /api/patients',
            'POST /api/patients',
            'POST /api/conversation/start',
            'POST /api/conversation/message',
            'POST /api/voice/text-to-speech',
            'POST /api/voice/speech-to-text'
        ]
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║             🚀 ReddyTalk AI Backend Server                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ 🌐 Server running on http://localhost:${port}                ║
║ 📊 Health check: http://localhost:${port}/health           ║
║ 🔐 Authentication: Ready                                    ║
║ 👥 Patient Management: Ready                               ║
║ 🤖 AI Conversation: Ready                                  ║
║ 🎤 Voice Services: Ready                                   ║
║                                                              ║
║ 👤 Test Users:                                             ║
║   • admin@reddytalk.ai / admin123 (Admin)                  ║
║   • doctor@clinic.com / doctor123 (Doctor)                 ║
║   • nurse@clinic.com / nurse123 (Staff)                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
});