// Comprehensive Dashboard for ReddyTalk.ai
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Phone, Users, Activity, Brain, Headphones, FileText,
  AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown,
  PlayCircle, PauseCircle, Volume2, Shield, Database,
  MessageSquare, BarChart3, Settings, Calendar, UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';

interface DashboardStats {
  calls: {
    total_calls: number;
    active_calls: number;
    completed_calls: number;
    avg_duration: number;
    avg_ai_score: number;
    avg_satisfaction: number;
  };
  patients: {
    total_patients: number;
    new_patients: number;
    active_patients: number;
  };
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    nodeVersion: string;
  };
  timeframe: string;
  generatedAt: string;
}

interface ActiveCall {
  id: string;
  call_id: string;
  phone_number_from: string;
  phone_number_to: string;
  direction: 'inbound' | 'outbound';
  started_at: string;
  patient_id?: string;
  duration: number;
  isRecording: boolean;
}

interface LiveTranscript {
  callSessionId: string;
  text: string;
  speaker: 'patient' | 'ai';
  timestamp: number;
  confidence?: number;
  type: 'partial' | 'final';
}

export default function Dashboard() {
  const { user, hasRole, hasPermission } = useContext(AuthContext);
  
  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [liveTranscripts, setLiveTranscripts] = useState<Map<string, LiveTranscript[]>>(new Map());
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  
  // UI state
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [showTranscripts, setShowTranscripts] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    initializeDashboard();
    setupWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedTimeframe) {
      fetchDashboardStats();
    }
  }, [selectedTimeframe]);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchActiveCalls()
      ]);
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
    const newSocket = io(wsUrl, {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('🌐 Connected to ReddyTalk WebSocket');
      newSocket.emit('subscribe-dashboard');
      newSocket.emit('join-user-room', user?.id);
    });

    // Live call updates
    newSocket.on('call-started', (data: any) => {
      toast.success(`New ${data.direction} call started`);
      fetchActiveCalls();
    });

    newSocket.on('call-ended', (data: any) => {
      toast.info(`Call completed (${formatDuration(data.duration)})`);
      fetchActiveCalls();
      fetchDashboardStats();
    });

    // Live transcript updates
    newSocket.on('transcript-partial', (data: LiveTranscript) => {
      updateLiveTranscript(data);
    });

    newSocket.on('transcript-final', (data: LiveTranscript) => {
      updateLiveTranscript(data);
    });

    // Recording updates
    newSocket.on('call-recording-started', (data: any) => {
      toast.success('Call recording started');
      updateCallRecordingStatus(data.callSessionId, true);
    });

    newSocket.on('call-recording-completed', (data: any) => {
      toast.success('Call recording completed');
      updateCallRecordingStatus(data.callSessionId, false);
    });

    // Urgent content alerts
    newSocket.on('urgent-content-detected', (data: any) => {
      toast.error(`Urgent content detected in call: ${data.urgencyLevel}`);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket');
    });

    setSocket(newSocket);
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`/api/analytics/dashboard?timeframe=${selectedTimeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        throw new Error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const fetchActiveCalls = async () => {
    try {
      const response = await fetch('/api/calls/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActiveCalls(data.data.activeCalls);
      }
    } catch (error) {
      console.error('Error fetching active calls:', error);
    }
  };

  const updateLiveTranscript = (transcript: LiveTranscript) => {
    setLiveTranscripts(prev => {
      const callTranscripts = prev.get(transcript.callSessionId) || [];
      
      if (transcript.type === 'partial') {
        // Replace last partial transcript or add new one
        const lastIndex = callTranscripts.length - 1;
        if (lastIndex >= 0 && callTranscripts[lastIndex].type === 'partial') {
          callTranscripts[lastIndex] = transcript;
        } else {
          callTranscripts.push(transcript);
        }
      } else {
        // Add final transcript
        callTranscripts.push(transcript);
      }
      
      // Keep only last 50 transcripts per call
      const newTranscripts = new Map(prev);
      newTranscripts.set(transcript.callSessionId, callTranscripts.slice(-50));
      return newTranscripts;
    });
  };

  const updateCallRecordingStatus = (callSessionId: string, isRecording: boolean) => {
    setActiveCalls(prev => prev.map(call => 
      call.id === callSessionId 
        ? { ...call, isRecording }
        : call
    ));
  };

  const startRecording = async (callSessionId: string) => {
    try {
      const response = await fetch(`/api/calls/${callSessionId}/recording/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start recording');
      }

      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = async (callSessionId: string) => {
    try {
      const response = await fetch(`/api/calls/${callSessionId}/recording/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to stop recording');
      }

      toast.success('Recording stopped');
    } catch (error) {
      toast.error('Failed to stop recording');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getCallStatusColor = (call: ActiveCall) => {
    const duration = call.duration;
    if (duration < 60) return 'text-green-600';
    if (duration < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ReddyTalk Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ReddyTalk.ai Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.firstName}! {hasRole('admin') ? '(Administrator)' : ''}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timeframe Selector */}
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              <Button
                onClick={fetchDashboardStats}
                className="text-sm"
              >
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Calls Stats */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Calls</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.calls.total_calls}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.calls.active_calls} active
                  </p>
                </div>
                <Phone className="h-12 w-12 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Performance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(stats.calls.avg_ai_score * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-green-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Excellent
                  </p>
                </div>
                <Brain className="h-12 w-12 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Patients</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.patients.total_patients}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.patients.new_patients} new
                  </p>
                </div>
                <Users className="h-12 w-12 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-3xl font-bold text-green-600">Healthy</p>
                  <p className="text-sm text-gray-500">
                    {formatUptime(stats.system.uptime)} uptime
                  </p>
                </div>
                <Shield className="h-12 w-12 text-green-500" />
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Calls */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Active Calls</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    Live
                  </div>
                  <span className="text-gray-500">({activeCalls.length})</span>
                </div>
              </div>

              {activeCalls.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No active calls</p>
                  <p className="text-sm">Calls will appear here when they start</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeCalls.map((call) => (
                    <div
                      key={call.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedCall === call.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedCall(selectedCall === call.id ? null : call.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            call.direction === 'inbound' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            <Phone className={`h-4 w-4 ${
                              call.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">
                              {call.direction === 'inbound' ? 'Incoming' : 'Outgoing'} Call
                            </p>
                            <p className="text-sm text-gray-500">
                              {call.direction === 'inbound' ? call.phone_number_from : call.phone_number_to}
                            </p>
                            {call.patient_id && (
                              <p className="text-sm text-gray-500">
                                Patient: {call.patient_id}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className={`text-sm font-medium ${getCallStatusColor(call)}`}>
                              {formatDuration(call.duration)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(call.started_at).toLocaleTimeString()}
                            </p>
                          </div>

                          {/* Recording Controls */}
                          {hasPermission('calls', 'write') && (
                            <div className="flex space-x-2">
                              {call.isRecording ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    stopRecording(call.id);
                                  }}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <PauseCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startRecording(call.id);
                                  }}
                                >
                                  <PlayCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}

                          {call.isRecording && (
                            <div className="flex items-center text-red-600">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                              <Headphones className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Live Transcripts */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Live Transcripts</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTranscripts(!showTranscripts)}
                >
                  {showTranscripts ? <Volume2 className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </Button>
              </div>

              {showTranscripts && selectedCall ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {liveTranscripts.get(selectedCall)?.map((transcript, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        transcript.speaker === 'ai' 
                          ? 'bg-blue-50 border-l-4 border-blue-400'
                          : 'bg-green-50 border-l-4 border-green-400'
                      } ${transcript.type === 'partial' ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {transcript.speaker === 'ai' ? '🤖 AI Assistant' : '👤 Patient'}
                        </span>
                        <div className="flex items-center space-x-2">
                          {transcript.confidence && (
                            <span className="text-xs text-gray-500">
                              {Math.round(transcript.confidence * 100)}%
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(transcript.timestamp).toLocaleTimeString()}
                          </span>
                          {transcript.type === 'partial' && (
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-800">{transcript.text}</p>
                    </div>
                  )) || (
                    <p className="text-center text-gray-500 py-8">
                      Select a call to view live transcripts
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No active transcripts</p>
                  <p className="text-sm">Transcripts will appear for active calls</p>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            {hasRole(['admin', 'doctor', 'nurse']) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Patient Management
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  {hasRole('admin') && (
                    <Button className="w-full justify-start" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      System Settings
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* System Status */}
        {hasRole(['admin', 'analyst']) && (
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-gray-500">Connected</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Voice Services</p>
                  <p className="text-xs text-gray-500">Operational</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm font-medium">AI Models</p>
                  <p className="text-xs text-gray-500">Ready</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Storage</p>
                  <p className="text-xs text-gray-500">Available</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}