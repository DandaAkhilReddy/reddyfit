'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface WebSocketMessage {
  data: string
  timestamp: Date
}

export interface UseWebSocketOptions {
  protocols?: string | string[]
  onOpen?: () => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

export function useWebSocket(url: string | null, options: UseWebSocketOptions = {}) {
  const {
    protocols,
    onOpen,
    onClose,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000
  } = options

  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!url) return

    try {
      setConnectionStatus('connecting')
      ws.current = new WebSocket(url, protocols)

      ws.current.onopen = (event) => {
        setReadyState(WebSocket.OPEN)
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
        onOpen?.()

        // Start heartbeat
        if (heartbeatInterval > 0) {
          heartbeatTimer.current = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({ type: 'ping' }))
            }
          }, heartbeatInterval)
        }
      }

      ws.current.onmessage = (event) => {
        const message: WebSocketMessage = {
          data: event.data,
          timestamp: new Date()
        }
        
        // Skip pong messages
        try {
          const parsed = JSON.parse(event.data)
          if (parsed.type === 'pong') return
        } catch {
          // Not JSON, process as regular message
        }
        
        setLastMessage(message)
      }

      ws.current.onclose = (event) => {
        setReadyState(WebSocket.CLOSED)
        setConnectionStatus('disconnected')
        
        // Clear heartbeat
        if (heartbeatTimer.current) {
          clearInterval(heartbeatTimer.current)
          heartbeatTimer.current = null
        }

        onClose?.(event)

        // Attempt to reconnect if not a clean close
        if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(`WebSocket reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`)
          
          reconnectTimer.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.current.onerror = (event) => {
        setConnectionStatus('error')
        onError?.(event)
      }

    } catch (error) {
      setConnectionStatus('error')
      console.error('WebSocket connection error:', error)
    }
  }, [url, protocols, onOpen, onClose, onError, heartbeatInterval, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current)
      heartbeatTimer.current = null
    }
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }

    if (ws.current) {
      ws.current.close(1000, 'Client disconnect')
      ws.current = null
    }
  }, [])

  const sendMessage = useCallback((message: string | ArrayBuffer | Blob) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message)
      return true
    }
    return false
  }, [])

  const sendJsonMessage = useCallback((message: any) => {
    return sendMessage(JSON.stringify(message))
  }, [sendMessage])

  // Connect on mount
  useEffect(() => {
    if (url) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [url, connect, disconnect])

  // Update ready state when WebSocket state changes
  useEffect(() => {
    if (ws.current) {
      setReadyState(ws.current.readyState)
    }
  }, [connectionStatus])

  return {
    lastMessage,
    readyState,
    connectionStatus,
    sendMessage,
    sendJsonMessage,
    disconnect,
    reconnect: connect
  }
}