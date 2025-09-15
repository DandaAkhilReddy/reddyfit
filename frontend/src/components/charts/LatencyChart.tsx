'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingDown, TrendingUp } from 'lucide-react'

interface LatencyDataPoint {
  timestamp: string
  time: string
  latency: number
  p50: number
  p90: number
  p99: number
  target: number
}

interface LatencyChartProps {
  data: LatencyDataPoint[]
  title?: string
  showTarget?: boolean
  height?: number
}

export function LatencyChart({ 
  data, 
  title = "Response Latency", 
  showTarget = true,
  height = 300 
}: LatencyChartProps) {
  
  const latest = data[data.length - 1]
  const previous = data[data.length - 2]
  const trend = latest && previous ? latest.latency - previous.latency : 0
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value}ms`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {latest && (
              <>
                <Badge variant={latest.latency < 500 ? "default" : "destructive"}>
                  {latest.latency}ms
                </Badge>
                {trend !== 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {trend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-green-500" />
                    )}
                    {Math.abs(trend).toFixed(0)}ms
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="p90Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            
            <YAxis 
              domain={[0, 800]}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Target line */}
            {showTarget && (
              <ReferenceLine 
                y={500} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label={{ value: "500ms Target", position: "topRight" }}
              />
            )}
            
            {/* P90 area */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="#8b5cf6"
              strokeWidth={1}
              fill="url(#p90Gradient)"
              name="P90 Latency"
            />
            
            {/* Average latency area */}
            <Area
              type="monotone"
              dataKey="latency"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#latencyGradient)"
              name="Avg Latency"
            />
            
            {/* P50 line */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="P50 Latency"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-muted-foreground">P50</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-muted-foreground">Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-muted-foreground">P90</span>
          </div>
          {showTarget && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500" />
              <span className="text-muted-foreground">Target (500ms)</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}