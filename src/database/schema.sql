-- ReddyTalk.ai Comprehensive Database Schema
-- Principal Engineer Level Architecture for Production System

-- Core conversations table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    caller_phone VARCHAR(20),
    caller_name VARCHAR(255),
    caller_dob DATE,
    caller_insurance VARCHAR(255),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, transferred, dropped
    summary TEXT,
    intent VARCHAR(100), -- appointment_scheduling, information_query, emergency, etc
    assigned_doctor_id INTEGER,
    appointment_scheduled BOOLEAN DEFAULT FALSE,
    appointment_date TIMESTAMP,
    priority_level VARCHAR(10) DEFAULT 'normal', -- urgent, high, normal, low
    satisfaction_score INTEGER, -- 1-5 rating
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Live transcription messages
CREATE TABLE conversation_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    confidence_score FLOAT, -- STT confidence for user messages
    timestamp_offset INTEGER, -- milliseconds from conversation start
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- AI Processing metadata
    intent VARCHAR(100),
    entities JSONB, -- extracted entities (dates, doctor names, etc)
    sentiment VARCHAR(20), -- positive, negative, neutral
    emotion VARCHAR(20), -- angry, frustrated, happy, calm
    
    INDEX(conversation_id, processed_at)
);

-- Audio recordings and processing
CREATE TABLE audio_recordings (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    recording_type VARCHAR(20) NOT NULL, -- 'full_call', 'segment', 'voicemail'
    file_path VARCHAR(500),
    azure_blob_url VARCHAR(500),
    duration_seconds FLOAT,
    file_size_bytes BIGINT,
    audio_format VARCHAR(10), -- wav, mp3, etc
    sample_rate INTEGER,
    channels INTEGER,
    transcription_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    transcription_confidence FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX(conversation_id, transcription_status)
);

-- Doctors and staff information
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    languages TEXT[], -- array of languages
    availability_schedule JSONB, -- schedule data
    phone_extension VARCHAR(10),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments scheduled through the system
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    doctor_id INTEGER REFERENCES doctors(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20),
    patient_dob DATE,
    patient_insurance VARCHAR(255),
    appointment_date TIMESTAMP NOT NULL,
    appointment_type VARCHAR(100), -- checkup, consultation, follow_up, etc
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, cancelled, completed, no_show
    notes TEXT,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX(appointment_date, doctor_id),
    INDEX(patient_phone, appointment_date)
);

-- System analytics and metrics
CREATE TABLE daily_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_calls INTEGER DEFAULT 0,
    successful_appointments INTEGER DEFAULT 0,
    average_call_duration FLOAT DEFAULT 0,
    total_call_duration INTEGER DEFAULT 0, -- seconds
    peak_hour INTEGER, -- 0-23
    most_common_intent VARCHAR(100),
    average_satisfaction FLOAT,
    system_uptime_percentage FLOAT,
    ai_response_avg_latency FLOAT, -- milliseconds
    transcription_accuracy FLOAT,
    
    -- Business metrics
    missed_calls INTEGER DEFAULT 0,
    transferred_calls INTEGER DEFAULT 0,
    emergency_calls INTEGER DEFAULT 0,
    
    UNIQUE(metric_date),
    INDEX(metric_date)
);

-- Real-time system status
CREATE TABLE system_status (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL, -- 'azure_speech', 'azure_openai', 'voip', 'database'
    status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'down'
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    last_error_message TEXT,
    uptime_percentage FLOAT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX(service_name, checked_at)
);

-- Conversation analysis and insights
CREATE TABLE conversation_insights (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Language analysis
    primary_language VARCHAR(10),
    speech_clarity_score FLOAT, -- 0-1
    speaking_pace VARCHAR(20), -- slow, normal, fast
    emotion_journey JSONB, -- emotion changes throughout call
    
    -- Business insights
    pain_points TEXT[],
    satisfaction_indicators TEXT[],
    resolution_status VARCHAR(50), -- resolved, partially_resolved, unresolved, escalated
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    
    -- AI Performance
    ai_helpfulness_score INTEGER, -- 1-5
    response_relevance_score FLOAT, -- 0-1
    task_completion_rate FLOAT, -- 0-1
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User feedback and ratings
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    feedback_type VARCHAR(50), -- 'general', 'technical', 'service', 'suggestion'
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX(conversation_id, rating)
);

-- System configuration and feature flags
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20), -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Insert initial configuration
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('max_call_duration_minutes', '30', 'number', 'Maximum call duration before timeout'),
('enable_call_recording', 'true', 'boolean', 'Enable/disable call recording'),
('transcription_language', 'en-US', 'string', 'Primary language for transcription'),
('ai_response_timeout_ms', '5000', 'number', 'Timeout for AI responses'),
('enable_sentiment_analysis', 'true', 'boolean', 'Enable real-time sentiment analysis'),
('business_hours_start', '08:00', 'string', 'Business hours start time'),
('business_hours_end', '18:00', 'string', 'Business hours end time'),
('emergency_keywords', '["emergency", "urgent", "chest pain", "difficulty breathing", "accident"]', 'json', 'Keywords that trigger emergency protocols');

-- Insert sample doctors
INSERT INTO doctors (name, specialty, languages, availability_schedule) VALUES
('Dr. Sarah Johnson', 'Family Medicine', ARRAY['English', 'Spanish'], '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}}'),
('Dr. Michael Chen', 'Internal Medicine', ARRAY['English', 'Mandarin'], '{"monday": {"start": "08:00", "end": "16:00"}, "wednesday": {"start": "08:00", "end": "16:00"}}'),
('Dr. Emily Rodriguez', 'Pediatrics', ARRAY['English', 'Spanish'], '{"tuesday": {"start": "10:00", "end": "18:00"}, "thursday": {"start": "10:00", "end": "18:00"}}'),
('Dr. James Wilson', 'Cardiology', ARRAY['English'], '{"monday": {"start": "07:00", "end": "15:00"}, "friday": {"start": "07:00", "end": "15:00"}}'),
('Dr. Lisa Park', 'Dermatology', ARRAY['English', 'Korean'], '{"wednesday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}');

-- Create indexes for performance
CREATE INDEX idx_conversations_status_time ON conversations(status, start_time);
CREATE INDEX idx_conversations_caller_phone ON conversations(caller_phone);
CREATE INDEX idx_messages_conversation_time ON conversation_messages(conversation_id, processed_at);
CREATE INDEX idx_appointments_date_doctor ON appointments(appointment_date, doctor_id);
CREATE INDEX idx_audio_status_time ON audio_recordings(transcription_status, created_at);

-- Create views for common queries
CREATE VIEW active_conversations AS
SELECT 
    c.*,
    d.name as assigned_doctor_name,
    COUNT(cm.id) as message_count,
    MAX(cm.processed_at) as last_message_time
FROM conversations c
LEFT JOIN doctors d ON c.assigned_doctor_id = d.id
LEFT JOIN conversation_messages cm ON c.id = cm.conversation_id
WHERE c.status = 'active'
GROUP BY c.id, d.name;

CREATE VIEW daily_call_stats AS
SELECT 
    DATE(start_time) as call_date,
    COUNT(*) as total_calls,
    AVG(duration_seconds) as avg_duration,
    COUNT(CASE WHEN appointment_scheduled = true THEN 1 END) as appointments_booked,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls
FROM conversations
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(start_time)
ORDER BY call_date DESC;

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_conversation_summary(conv_id INTEGER)
RETURNS TABLE(
    session_id VARCHAR(255),
    caller_info JSONB,
    duration_seconds INTEGER,
    message_count BIGINT,
    intent VARCHAR(100),
    summary TEXT,
    scheduled_appointment BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.session_id,
        jsonb_build_object(
            'phone', c.caller_phone,
            'name', c.caller_name,
            'insurance', c.caller_insurance
        ) as caller_info,
        c.duration_seconds,
        COUNT(cm.id) as message_count,
        c.intent,
        c.summary,
        c.appointment_scheduled
    FROM conversations c
    LEFT JOIN conversation_messages cm ON c.id = cm.conversation_id
    WHERE c.id = conv_id
    GROUP BY c.id, c.session_id, c.caller_phone, c.caller_name, c.caller_insurance, 
             c.duration_seconds, c.intent, c.summary, c.appointment_scheduled;
END;
$$ LANGUAGE plpgsql;