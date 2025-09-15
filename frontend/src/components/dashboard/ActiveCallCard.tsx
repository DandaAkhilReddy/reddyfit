'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  PhoneForwarded, 
  Eye, 
  Clock, 
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

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
  transcript?: string
  confidence?: number
}

interface ActiveCallCardProps {
  call: Call
  onTransfer: () => void
  onListen: () => void
}

export function ActiveCallCard({ call, onTransfer, onListen }: ActiveCallCardProps) {
  const [isListening, setIsListening] = useState(false)
  const [liveDuration, setLiveDuration] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveDuration(formatDistanceToNow(call.startTime, { addSuffix: false }))
    }, 1000)

    return () => clearInterval(interval)
  }, [call.startTime])

  const getSentimentIcon = (sentiment: Call['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getSentimentColor = (sentiment: Call['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 300) return 'text-green-600'
    if (latency < 500) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
  }

  const handleListenToggle = () => {
    setIsListening(!isListening)
    onListen()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full"
    >
      <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Call Info */}
            <div className="flex items-center space-x-4 flex-1">
              {/* Status Indicator */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <Phone className="h-5 w-5" />
                </div>
                {call.status === 'active' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse ring-2 ring-white" />
                )}
                {call.status === 'transferring' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-pulse ring-2 ring-white" />
                )}
              </div>
              
              {/* Call Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {call.callerName || 'Unknown Caller'}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getSentimentColor(call.sentiment)}`}
                  >
                    {getSentimentIcon(call.sentiment)}
                    <span className="ml-1 capitalize">{call.sentiment}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span>{formatPhoneNumber(call.phoneNumber)}</span>
                  </span>
                  
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{liveDuration}</span>
                  </span>
                  
                  <span className={`flex items-center space-x-1 ${getLatencyColor(call.latency)}`}>
                    <AlertCircle className="h-3 w-3" />
                    <span>{call.latency}ms</span>
                  </span>
                </div>
                
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    Intent: <span className="font-medium">{call.intent}</span>
                    {call.confidence && (
                      <span className="ml-2">
                        Confidence: <span className="font-medium">{Math.round(call.confidence * 100)}%</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={handleListenToggle}
                className={isListening ? 'bg-green-50 border-green-200' : ''}
              >
                {isListening ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-1" />
                    Listening
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Listen
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                onClick={onTransfer}
                disabled={call.status === 'transferring'}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <PhoneForwarded className="h-4 w-4 mr-1" />
                {call.status === 'transferring' ? 'Transferring...' : 'Transfer'}
              </Button>
            </div>
          </div>
          
          {/* Live Transcript Preview */}
          {call.transcript && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Live Transcript:</p>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {call.transcript}
                </p>
              </div>
            </div>
          )}
          
          {/* Progress Bar for Latency */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Response Time</span>
              <span className={`text-xs font-medium ${getLatencyColor(call.latency)}`}>
                {call.latency}ms / 500ms target
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  call.latency < 300 ? 'bg-green-500' :
                  call.latency < 500 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((call.latency / 500) * 100, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}