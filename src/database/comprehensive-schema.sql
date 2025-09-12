-- ReddyTalk.ai Comprehensive Database Schema
-- HIPAA-Compliant Medical AI Platform Database
-- Created: 2025-01-25

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable encryption for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- USERS & AUTHENTICATION SYSTEM
-- =============================================

-- User roles and permissions
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO user_roles (name, description, permissions) VALUES
('admin', 'System Administrator', '{"all": true}'),
('doctor', 'Medical Doctor', '{"patients": "read_write", "calls": "read_write", "reports": "read"}'),
('nurse', 'Registered Nurse', '{"patients": "read", "calls": "read", "appointments": "read_write"}'),
('receptionist', 'Medical Receptionist', '{"appointments": "read_write", "patients": "read", "calls": "read"}'),
('analyst', 'Data Analyst', '{"analytics": "read", "reports": "read", "training_data": "read"}');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id UUID REFERENCES user_roles(id),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PATIENT MANAGEMENT SYSTEM (HIPAA COMPLIANT)
-- =============================================

-- Patients table with encryption for PII
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(20) UNIQUE NOT NULL, -- Public patient ID (non-PII)
    
    -- Encrypted PII fields
    first_name_encrypted BYTEA NOT NULL,
    last_name_encrypted BYTEA NOT NULL,
    email_encrypted BYTEA,
    phone_encrypted BYTEA,
    ssn_encrypted BYTEA,
    
    -- Non-encrypted demographic data
    date_of_birth DATE,
    gender VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'en',
    
    -- Medical information
    blood_type VARCHAR(5),
    allergies JSONB DEFAULT '[]',
    chronic_conditions JSONB DEFAULT '[]',
    current_medications JSONB DEFAULT '[]',
    emergency_contact JSONB,
    
    -- Insurance information
    insurance_provider VARCHAR(100),
    insurance_policy_number_encrypted BYTEA,
    insurance_group_number VARCHAR(50),
    
    -- AI preferences
    ai_interaction_preferences JSONB DEFAULT '{}',
    communication_preferences JSONB DEFAULT '{}',
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact_at TIMESTAMP WITH TIME ZONE
);

-- Patient medical history
CREATE TABLE patient_medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    diagnosis JSONB,
    treatment JSONB,
    medications JSONB,
    notes_encrypted BYTEA,
    doctor_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- APPOINTMENTS SYSTEM
-- =============================================

CREATE TABLE appointment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    requires_preparation BOOLEAN DEFAULT false,
    preparation_instructions TEXT,
    cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES users(id),
    appointment_type_id UUID REFERENCES appointment_types(id),
    
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_at TIMESTAMP WITH TIME ZONE,
    actual_end_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show
    cancellation_reason TEXT,
    
    notes TEXT,
    chief_complaint TEXT,
    
    -- AI assistant data
    ai_pre_screening JSONB,
    ai_summary JSONB,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- VOICE CALLS & TRANSCRIPTION SYSTEM
-- =============================================

CREATE TABLE call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id VARCHAR(50) UNIQUE NOT NULL, -- Twilio/External call ID
    
    -- Call participants
    patient_id UUID REFERENCES patients(id),
    user_id UUID REFERENCES users(id), -- If human involved
    
    -- Call details
    phone_number_from VARCHAR(20),
    phone_number_to VARCHAR(20),
    direction VARCHAR(10), -- 'inbound', 'outbound'
    
    -- Call timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Call status
    status VARCHAR(20) DEFAULT 'active', -- active, completed, failed, transferred
    
    -- AI processing
    ai_agent_version VARCHAR(20),
    conversation_summary JSONB,
    sentiment_analysis JSONB,
    intent_classification JSONB,
    confidence_scores JSONB,
    
    -- Quality metrics
    audio_quality_score DECIMAL(3,2),
    ai_performance_score DECIMAL(3,2),
    patient_satisfaction_score DECIMAL(3,2),
    
    -- Media and recordings
    recording_url TEXT,
    recording_duration INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live transcription data
CREATE TABLE call_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE,
    
    -- Transcript segment
    sequence_number INTEGER NOT NULL,
    speaker VARCHAR(20) NOT NULL, -- 'patient', 'ai', 'human'
    
    -- Timing
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER NOT NULL,
    
    -- Content
    text_content TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    
    -- Language processing
    language VARCHAR(10) DEFAULT 'en',
    is_final BOOLEAN DEFAULT false,
    
    -- Medical NLP analysis
    medical_entities JSONB,
    symptoms_detected JSONB,
    urgency_level VARCHAR(10), -- low, medium, high, critical
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call actions and outcomes
CREATE TABLE call_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE,
    
    action_type VARCHAR(50) NOT NULL, -- appointment_scheduled, prescription_refill, etc.
    action_data JSONB NOT NULL,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AI TRAINING DATA MANAGEMENT
-- =============================================

-- Training conversations
CREATE TABLE training_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Source information
    source_type VARCHAR(20) NOT NULL, -- 'live_call', 'synthetic', 'manual'
    source_call_id UUID REFERENCES call_sessions(id),
    
    -- Conversation data
    conversation_data JSONB NOT NULL,
    participant_count INTEGER DEFAULT 2,
    turn_count INTEGER,
    
    -- Quality and labels
    quality_score DECIMAL(3,2),
    human_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES users(id),
    
    -- Training metadata
    use_for_training BOOLEAN DEFAULT true,
    training_tags JSONB DEFAULT '[]',
    medical_specialty VARCHAR(50),
    complexity_level VARCHAR(10), -- basic, intermediate, advanced
    
    -- Privacy and compliance
    pii_removed BOOLEAN DEFAULT false,
    hipaa_compliant BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training datasets
CREATE TABLE training_datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL,
    
    -- Dataset composition
    conversation_count INTEGER DEFAULT 0,
    total_turns INTEGER DEFAULT 0,
    
    -- Training configuration
    training_config JSONB,
    model_type VARCHAR(50), -- 'conversation', 'classification', 'ner'
    
    -- Status
    status VARCHAR(20) DEFAULT 'building', -- building, ready, training, completed
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training jobs
CREATE TABLE training_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(100) UNIQUE NOT NULL,
    dataset_id UUID REFERENCES training_datasets(id),
    
    -- Job configuration
    model_config JSONB NOT NULL,
    hyperparameters JSONB,
    
    -- Status and progress
    status VARCHAR(20) DEFAULT 'queued', -- queued, running, completed, failed
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Results
    final_model_path TEXT,
    training_metrics JSONB,
    validation_metrics JSONB,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model versions
CREATE TABLE model_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    
    -- Model metadata
    model_type VARCHAR(50),
    training_job_id UUID REFERENCES training_jobs(id),
    model_file_path TEXT,
    
    -- Performance metrics
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    
    -- Deployment status
    is_active BOOLEAN DEFAULT false,
    deployed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS & REPORTING
-- =============================================

-- Daily metrics
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    
    -- Call metrics
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    average_call_duration DECIMAL(8,2),
    
    -- AI performance
    ai_accuracy_score DECIMAL(3,2),
    ai_response_time_ms INTEGER,
    
    -- Patient metrics
    new_patients INTEGER DEFAULT 0,
    appointments_scheduled INTEGER DEFAULT 0,
    appointments_completed INTEGER DEFAULT 0,
    
    -- System metrics
    uptime_percentage DECIMAL(5,2),
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(metric_date)
);

-- Real-time system status
CREATE TABLE system_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- healthy, warning, error, maintenance
    
    last_check_at TIMESTAMP WITH TIME ZONE NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    
    metadata JSONB DEFAULT '{}',
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(component_name)
);

-- =============================================
-- CONFIGURATION & SETTINGS
-- =============================================

CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    
    -- Permissions
    requires_admin BOOLEAN DEFAULT true,
    is_sensitive BOOLEAN DEFAULT false,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configurations
INSERT INTO system_config (config_key, config_value, description) VALUES
('ai_model_settings', '{"temperature": 0.7, "max_tokens": 150, "model": "gpt-4"}', 'AI model configuration'),
('voice_settings', '{"provider": "elevenlabs", "voice_id": "EXAVITQu4vr4xnSDxMaL", "stability": 0.85}', 'Voice synthesis settings'),
('clinic_hours', '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}}', 'Clinic operating hours'),
('emergency_contacts', '{"911": "Emergency Services", "nurse_line": "+1-555-0199"}', 'Emergency contact numbers');

-- =============================================
-- AUDIT LOG (HIPAA COMPLIANCE)
-- =============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    
    -- What
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    
    -- When & Where
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Details
    details JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users and authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Patients
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_created_at ON patients(created_at);

-- Appointments
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Calls and transcripts
CREATE INDEX idx_call_sessions_patient_id ON call_sessions(patient_id);
CREATE INDEX idx_call_sessions_started_at ON call_sessions(started_at);
CREATE INDEX idx_call_transcripts_call_session_id ON call_transcripts(call_session_id);
CREATE INDEX idx_call_transcripts_sequence ON call_transcripts(sequence_number);

-- Training data
CREATE INDEX idx_training_conversations_source_type ON training_conversations(source_type);
CREATE INDEX idx_training_conversations_quality ON training_conversations(quality_score);
CREATE INDEX idx_training_jobs_status ON training_jobs(status);

-- Analytics
CREATE INDEX idx_daily_metrics_date ON daily_metrics(metric_date);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- =============================================
-- FUNCTIONS FOR ENCRYPTION/DECRYPTION
-- =============================================

-- Function to encrypt PII
CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT, key TEXT DEFAULT 'reddytalk_encryption_key_2025')
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, key);
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt PII
CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_data BYTEA, key TEXT DEFAULT 'reddytalk_encryption_key_2025')
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, key);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS FOR AUDIT LOGGING
-- =============================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        current_setting('app.current_user_id', true)::UUID,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        row_to_json(COALESCE(NEW, OLD))
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER patients_audit AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER appointments_audit AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER call_sessions_audit AFTER INSERT OR UPDATE OR DELETE ON call_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Active patients with decrypted info (for authorized access)
CREATE VIEW active_patients_view AS
SELECT 
    id,
    patient_id,
    decrypt_pii(first_name_encrypted) AS first_name,
    decrypt_pii(last_name_encrypted) AS last_name,
    decrypt_pii(email_encrypted) AS email,
    decrypt_pii(phone_encrypted) AS phone,
    date_of_birth,
    gender,
    preferred_language,
    created_at,
    last_contact_at
FROM patients
WHERE is_active = true;

-- Today's appointments with patient info
CREATE VIEW todays_appointments_view AS
SELECT 
    a.id,
    a.appointment_number,
    a.scheduled_at,
    a.status,
    p.patient_id,
    decrypt_pii(p.first_name_encrypted) AS patient_first_name,
    decrypt_pii(p.last_name_encrypted) AS patient_last_name,
    u.first_name AS doctor_first_name,
    u.last_name AS doctor_last_name,
    at.name AS appointment_type
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users u ON a.doctor_id = u.id
JOIN appointment_types at ON a.appointment_type_id = at.id
WHERE DATE(a.scheduled_at) = CURRENT_DATE;

-- Call analytics summary
CREATE VIEW call_analytics_view AS
SELECT 
    DATE(started_at) as call_date,
    COUNT(*) as total_calls,
    AVG(duration_seconds) as avg_duration,
    AVG(ai_performance_score) as avg_ai_score,
    AVG(patient_satisfaction_score) as avg_satisfaction
FROM call_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY call_date DESC;

-- =============================================
-- SEED DATA FOR DEVELOPMENT
-- =============================================

-- Create default admin user (password: admin123 - CHANGE IN PRODUCTION!)
INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_verified) VALUES
(
    'admin@reddytalk.ai',
    crypt('admin123', gen_salt('bf')),
    'System',
    'Administrator',
    (SELECT id FROM user_roles WHERE name = 'admin'),
    true
);

-- Create default appointment types
INSERT INTO appointment_types (name, duration_minutes, description, cost) VALUES
('General Checkup', 30, 'Routine health examination', 150.00),
('Specialist Consultation', 45, 'Consultation with medical specialist', 250.00),
('Follow-up Visit', 15, 'Follow-up appointment', 75.00),
('Urgent Care', 20, 'Urgent medical care', 200.00),
('Telehealth', 20, 'Virtual consultation', 100.00);

-- Success message
SELECT 'ReddyTalk.ai comprehensive database schema created successfully!' as status;