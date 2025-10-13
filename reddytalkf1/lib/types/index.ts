// Core Types for ReddyTalk.ai

// User Roles
export type UserRole =
  | 'super_admin'
  | 'clinic_admin'
  | 'front_desk'
  | 'doctor'
  | 'franchise_admin';

// Permission Types
export type Permission =
  | 'all_tenants'
  | 'view_internal_costs'
  | 'model_config'
  | 'rbac_admin'
  | 'view_analytics'
  | 'manage_staff'
  | 'configure_hours'
  | 'view_all_calls'
  | 'live_monitor'
  | 'takeover_call'
  | 'edit_appointments'
  | 'create_notes'
  | 'manage_waitlist'
  | 'view_my_appointments'
  | 'view_my_call_summaries'
  | 'aggregate_read_only';

// Database Models
export interface Clinic {
  id: string;
  name: string;
  timezone: string;
  owner_user_id: string;
  subscription_tier: 'starter' | 'pro' | 'enterprise';
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  clinic_id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface Call {
  id: string;
  clinic_id: string;
  started_at: Date;
  ended_at?: Date;
  caller_number: string;
  intent?: string;
  outcome?: 'booked' | 'rescheduled' | 'cancelled' | 'info_only' | 'escalated';
  duration_sec?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence?: number;
  transcript_url?: string;
  redacted_transcript_url?: string;
  audio_url?: string;
  agent_name?: string;
  takeover_by_user_id?: string;
  status: 'active' | 'completed' | 'failed';
}

export interface CallNote {
  id: string;
  call_id: string;
  user_id: string;
  note: string;
  created_at: Date;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_name: string;
  patient_phone: string;
  doctor_id?: string;
  start_time: Date;
  end_time: Date;
  type: string;
  source: 'ai' | 'manual' | 'ready_agent';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  external_ref?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Waitlist {
  id: string;
  clinic_id: string;
  patient_name: string;
  patient_phone: string;
  preferred_windows: string; // JSON string
  priority_index: number;
  created_at: Date;
  status: 'queued' | 'called' | 'booked' | 'skipped';
}

export interface Cancellation {
  id: string;
  clinic_id: string;
  appointment_id: string;
  created_at: Date;
  reason?: string;
}

export interface BillingMetrics {
  id: string;
  clinic_id: string;
  month: string;
  call_minutes: number;
  call_count: number;
  cost_wapi: number;
  cost_azure: number;
  cost_make: number;
  notes?: string;
}

export interface Alert {
  id: string;
  clinic_id: string;
  call_id?: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  created_at: Date;
  acknowledged: boolean;
}

export interface Settings {
  id: string;
  clinic_id: string;
  business_hours: string; // JSON string
  escalation_rules: string; // JSON string
  redaction_policy: string; // JSON string
  backfill_policy: string; // JSON string
}

// API Response Types
export interface KPIData {
  calls_today: number;
  fcr_percentage: number;
  average_handle_time: string;
  csat_score: number;
}

export interface CallVolumeData {
  timestamp: string;
  count: number;
}

export interface OutcomeData {
  outcome: string;
  count: number;
  percentage: number;
}

// Real-time WebSocket Types
export interface TranscriptMessage {
  call_id: string;
  timestamp: string;
  speaker: 'patient' | 'ai';
  text: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence?: number;
}

export interface LiveCallUpdate {
  call_id: string;
  status: Call['status'];
  duration_sec: number;
  intent?: string;
  sentiment?: Call['sentiment'];
  confidence?: number;
}
