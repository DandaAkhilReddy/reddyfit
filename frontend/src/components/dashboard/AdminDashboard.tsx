'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Phone, 
  Calendar,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  PhoneForwarded,
  Mic,
  MicOff,
  Activity,
  Eye,
  Settings,
  Download
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from '@/hooks/useWebSocket'
import { ActiveCallCard } from './ActiveCallCard'
import { RealTimeMetrics } from './RealTimeMetrics'
import { CallAnalytics } from './CallAnalytics'
import { VoicePerformance } from './VoicePerformance'
import { ClinicSettings } from './ClinicSettings'

interface Call {
  id: string
  phoneNumber: string
  callerName?: string
  duration: string
  intent: string
  sentiment: 'positive' | 'neutral' | 'negative'
  status: 'active' | 'transferring' | 'ended'
  latency: number
  startTime: Date
}

interface DashboardMetrics {
  activeCalls: number
  todaysCalls: number
  appointmentsBooked: number
  avgLatency: number
  avgCallDuration: number
  satisfactionScore: number
  missedCalls: number
  transferRate: number
  systemStatus: 'operational' | 'degraded' | 'down'
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeCalls: 0,
    todaysCalls: 0,
    appointmentsBooked: 0,
    avgLatency: 0,
    avgCallDuration: 0,
    satisfactionScore: 0,
    missedCalls: 0,
    transferRate: 0,
    systemStatus: 'operational'
  })

  const [activeCalls, setActiveCalls] = useState<Call[]>([])
  const [realtimeData, setRealtimeData] = useState<any[]>([])
  const [selectedTab, setSelectedTab] = useState('dashboard')

  // WebSocket connection for real-time updates
  const { lastMessage, sendMessage } = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL}/ws/dashboard`
  )

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data)
      
      switch (data.type) {
        case 'call_started':
          handleNewCall(data.call)
          break
        case 'call_ended':
          handleCallEnded(data.callId)
          break
        case 'metrics_update':
          setMetrics(prev => ({ ...prev, ...data.metrics }))
          break
        case 'realtime_latency':
          setRealtimeData(prev => [...prev.slice(-50), data])
          break
      }
    }
  }, [lastMessage])

  const handleNewCall = (call: Call) => {
    setActiveCalls(prev => [...prev, call])
    setMetrics(prev => ({
      ...prev,
      activeCalls: prev.activeCalls + 1,
      todaysCalls: prev.todaysCalls + 1
    }))
  }

  const handleCallEnded = (callId: string) => {
    setActiveCalls(prev => prev.filter(c => c.id !== callId))
    setMetrics(prev => ({
      ...prev,
      activeCalls: Math.max(0, prev.activeCalls - 1)
    }))
  }

  const handleTransferCall = async (callId: string) => {
    try {
      await fetch(`/api/calls/${callId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferTo: 'human_agent' })
      })
      
      setActiveCalls(prev => 
        prev.map(call => 
          call.id === callId 
            ? { ...call, status: 'transferring' }
            : call
        )
      )
    } catch (error) {
      console.error('Transfer failed:', error)
    }
  }

  const getStatusColor = (status: DashboardMetrics['systemStatus']) => {
    switch (status) {
      case 'operational': return 'success'
      case 'degraded': return 'warning'
      case 'down': return 'error'
      default: return 'gray'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
                    ReddyTalk.ai
                  </h1>
                  <p className="text-sm text-muted-foreground">Riverside Medical Center</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge 
                variant="outline" 
                className={`px-3 py-1 status-${getStatusColor(metrics.systemStatus)}`}
              >
                <span className={`flex items-center gap-2`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    metrics.systemStatus === 'operational' ? 'bg-success-500' : 
                    metrics.systemStatus === 'degraded' ? 'bg-warning-500' : 'bg-error-500'
                  }`} />
                  {metrics.systemStatus === 'operational' ? 'System Operational' : 
                   metrics.systemStatus === 'degraded' ? 'Performance Degraded' : 'System Down'}
                </span>
              </Badge>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Active Calls"
            value={metrics.activeCalls}
            change="+12%"
            icon={Phone}
            color="blue"
            realtime
          />
          
          <MetricCard
            title="Today's Calls"
            value={metrics.todaysCalls}
            change="+23%"
            icon={Activity}
            color="green"
          />
          
          <MetricCard
            title="Appointments Booked"
            value={metrics.appointmentsBooked}
            change="+18%"
            icon={Calendar}
            color="purple"
          />
          
          <MetricCard
            title="Avg Latency"
            value={`${metrics.avgLatency}ms`}
            change="-5ms"
            icon={Clock}
            color="orange"
            target="<500ms"
          />
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit">
            <TabsTrigger value="dashboard">Active Calls</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="voice">Voice Quality</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Active Calls */}
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Currently Active Calls
                    <Badge variant="secondary">{activeCalls.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                    <AnimatePresence>
                      {activeCalls.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No active calls at the moment
                        </motion.div>
                      ) : (
                        activeCalls.map(call => (
                          <motion.div
                            key={call.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                          >
                            <ActiveCallCard
                              call={call}
                              onTransfer={() => handleTransferCall(call.id)}
                              onListen={() => {/* Implement listening */}}
                            />
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Metrics */}
              <RealTimeMetrics data={realtimeData} />
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <CallAnalytics />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <VoicePerformance metrics={metrics} />
          </TabsContent>
          
          <TabsContent value="voice" className="space-y-6">
            {/* Voice Quality Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Voice Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Voice quality charts will go here */}
                  <div className="text-center py-8 text-muted-foreground">
                    Voice quality monitoring dashboard coming soon
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <ClinicSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ComponentType<any>
  color: 'blue' | 'green' | 'purple' | 'orange'
  realtime?: boolean
  target?: string
}

function MetricCard({ title, value, change, icon: Icon, color, realtime, target }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold">{value}</p>
              {target && (
                <span className="text-xs text-muted-foreground">/ {target}</span>
              )}
            </div>
            {change && (
              <p className={`text-xs ${
                change.startsWith('+') ? 'text-green-600' : 
                change.startsWith('-') && !change.includes('ms') ? 'text-red-600' : 'text-green-600'
              }`}>
                {change} from last hour
              </p>
            )}
          </div>
          
          <div className={`p-3 rounded-full bg-gradient-to-br ${colorClasses[color]} text-white relative`}>
            <Icon className="h-6 w-6" />
            {realtime && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { MetricCard }