'use client';

import { Phone, CheckCircle, Clock, Star } from 'lucide-react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

// Mock data - replace with actual API calls
const callVolumeData = [
  { time: '00:00', calls: 2 },
  { time: '04:00', calls: 1 },
  { time: '08:00', calls: 15 },
  { time: '12:00', calls: 28 },
  { time: '16:00', calls: 22 },
  { time: '20:00', calls: 8 },
  { time: '23:59', calls: 3 },
];

const recentAppointments = [
  {
    time: '2:30 PM',
    patient: 'John Doe',
    type: 'NEW BOOKING',
    status: 'success',
  },
  {
    time: '2:28 PM',
    patient: 'Jane Smith',
    type: 'RESCHEDULED',
    status: 'info',
  },
  {
    time: '2:25 PM',
    patient: 'Mike Johnson',
    type: 'NEW BOOKING',
    status: 'success',
  },
  {
    time: '2:20 PM',
    patient: 'Sarah Williams',
    type: 'CANCELLED',
    status: 'warning',
  },
  {
    time: '2:15 PM',
    patient: 'Tom Brown',
    type: 'NEW BOOKING',
    status: 'success',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0A2540]">Overview</h1>
        <p className="text-gray-600">
          Real-time metrics and recent activity for your clinic
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Calls Today"
          value={47}
          subtitle="Active calls"
          icon={Phone}
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="FCR (First Call Resolution)"
          value="92%"
          subtitle="Resolved on first contact"
          icon={CheckCircle}
          trend={{ value: 3, isPositive: true }}
        />
        <KPICard
          title="Average Handle Time"
          value="3m 12s"
          subtitle="Per call"
          icon={Clock}
          trend={{ value: 8, isPositive: false }}
        />
        <KPICard
          title="CSAT Score"
          value="4.8"
          subtitle="Out of 5.0"
          icon={Star}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Call Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Call Volume (Last 24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={callVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="calls"
                stroke="#FF6B00"
                strokeWidth={2}
                dot={{ fill: '#FF6B00', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAppointments.map((appointment, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500">
                    {appointment.time}
                  </span>
                  <span className="text-sm font-semibold text-[#0A2540]">
                    {appointment.patient}
                  </span>
                </div>
                <Badge
                  variant={
                    appointment.status === 'success'
                      ? 'default'
                      : appointment.status === 'warning'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className={
                    appointment.status === 'success'
                      ? 'bg-green-500 hover:bg-green-600'
                      : ''
                  }
                >
                  {appointment.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
