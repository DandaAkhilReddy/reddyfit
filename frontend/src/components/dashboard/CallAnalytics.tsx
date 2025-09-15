'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import {
  Calendar,
  Phone,
  Clock,
  TrendingUp,
  Users,
  PhoneCall,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

// Sample data - replace with real data from your API
const callVolumeData = [
  { time: '00:00', calls: 12, appointments: 8 },
  { time: '01:00', calls: 8, appointments: 5 },
  { time: '02:00', calls: 6, appointments: 4 },
  { time: '03:00', calls: 4, appointments: 2 },
  { time: '04:00', calls: 3, appointments: 1 },
  { time: '05:00', calls: 5, appointments: 3 },
  { time: '06:00', calls: 15, appointments: 12 },
  { time: '07:00', calls: 28, appointments: 22 },
  { time: '08:00', calls: 45, appointments: 35 },
  { time: '09:00', calls: 52, appointments: 38 },
  { time: '10:00', calls: 48, appointments: 35 },
  { time: '11:00', calls: 44, appointments: 32 },
  { time: '12:00', calls: 38, appointments: 28 },
  { time: '13:00', calls: 42, appointments: 31 },
  { time: '14:00', calls: 47, appointments: 34 },
  { time: '15:00', calls: 51, appointments: 37 },
  { time: '16:00', calls: 46, appointments: 33 },
  { time: '17:00', calls: 35, appointments: 25 },
  { time: '18:00', calls: 22, appointments: 16 },
  { time: '19:00', calls: 18, appointments: 12 },
  { time: '20:00', calls: 15, appointments: 10 },
  { time: '21:00', calls: 12, appointments: 8 },
  { time: '22:00', calls: 10, appointments: 6 },
  { time: '23:00', calls: 8, appointments: 5 }
]

const intentData = [
  { name: 'Appointment Booking', value: 45, color: '#3b82f6' },
  { name: 'Rescheduling', value: 25, color: '#8b5cf6' },
  { name: 'General Inquiry', value: 15, color: '#10b981' },
  { name: 'Prescription Refill', value: 10, color: '#f59e0b' },
  { name: 'Emergency', value: 5, color: '#ef4444' }
]

const performanceData = [
  { metric: 'Call Answer Rate', value: 99.8, change: +0.2, target: 99.5 },
  { metric: 'Appointment Conversion', value: 76.4, change: +2.1, target: 75.0 },
  { metric: 'Avg Call Duration', value: 3.2, change: -0.3, target: 3.5 },
  { metric: 'Customer Satisfaction', value: 4.7, change: +0.1, target: 4.5 },
  { metric: 'Transfer to Human', value: 12.3, change: -1.2, target: 15.0 },
  { metric: 'First Call Resolution', value: 87.6, change: +3.4, target: 85.0 }
]

export function CallAnalytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('today')

  const formatValue = (value: number, metric: string) => {
    if (metric.includes('Rate') || metric.includes('Conversion') || metric.includes('Resolution') || metric.includes('Transfer')) {
      return `${value}%`
    }
    if (metric.includes('Duration')) {
      return `${value}m`
    }
    if (metric.includes('Satisfaction')) {
      return `${value}/5`
    }
    return value.toString()
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-3 w-3 text-green-500" />
    if (change < 0) return <ArrowDownRight className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-500" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Call Analytics</h2>
        <div className="flex space-x-2">
          {['today', '7days', '30days'].map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range === 'today' ? 'Today' : range === '7days' ? '7 Days' : '30 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {performanceData.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.metric}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-2xl font-bold">{formatValue(item.value, item.metric)}</p>
                    <div className={`flex items-center space-x-1 ${getChangeColor(item.change)}`}>
                      {getChangeIcon(item.change)}
                      <span className="text-sm font-medium">
                        {Math.abs(item.change)}{item.metric.includes('Duration') ? 'm' : item.metric.includes('Satisfaction') ? '' : '%'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: {formatValue(item.target, item.metric)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      item.value >= item.target ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ 
                      width: `${Math.min((item.value / (item.target * 1.2)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Volume & Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={callVolumeData}>
                <defs>
                  <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="appointmentsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px' 
                  }} 
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="#3b82f6"
                  fill="url(#callsGradient)"
                  name="Total Calls"
                />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  stroke="#10b981"
                  fill="url(#appointmentsGradient)"
                  name="Appointments Booked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Intent Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Call Intent Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={intentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-1 gap-2 mt-4">
              {intentData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hourly" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hourly">Hourly Trends</TabsTrigger>
              <TabsTrigger value="outcomes">Call Outcomes</TabsTrigger>
              <TabsTrigger value="latency">Performance</TabsTrigger>
              <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            </TabsList>
            
            <TabsContent value="hourly" className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={callVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="calls" fill="#3b82f6" name="Total Calls" />
                  <Bar dataKey="appointments" fill="#10b981" name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="outcomes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">76.4%</p>
                  <p className="text-sm text-green-600">Successful Resolution</p>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-lg">
                  <PhoneCall className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-700">12.3%</p>
                  <p className="text-sm text-yellow-600">Transferred to Human</p>
                </div>
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700">2.1%</p>
                  <p className="text-sm text-red-600">Call Dropped</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="latency" className="space-y-4">
              {/* Performance metrics will be rendered here */}
              <div className="text-center py-8 text-muted-foreground">
                Performance analytics dashboard coming soon
              </div>
            </TabsContent>
            
            <TabsContent value="satisfaction" className="space-y-4">
              {/* Satisfaction metrics will be rendered here */}
              <div className="text-center py-8 text-muted-foreground">
                Customer satisfaction analytics coming soon
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}