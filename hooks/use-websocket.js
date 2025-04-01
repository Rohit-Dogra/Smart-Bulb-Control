"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export function useWebSocket(url = "ws://localhost:8080") {
  const [connectionState, setConnectionState] = useState("disconnected")
  const [lastMessage, setLastMessage] = useState(null)
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(url)

      socket.onopen = () => {
        setConnectionState("connected")
        console.log("WebSocket connection established")
      }

      socket.onmessage = (event) => {
        setLastMessage(event.data)
        console.log("Received message:", event.data)
      }

      socket.onclose = () => {
        setConnectionState("disconnected")
        console.log("WebSocket connection closed")

        // Attempt to reconnect after 3 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...")
          connect()
        }, 3000)
      }

      socket.onerror = (error) => {
        console.error("WebSocket error:", error)
        socket.close()
      }

      socketRef.current = socket
    } catch (error) {
      console.error("Failed to connect to WebSocket server:", error)
      setConnectionState("disconnected")
    }
  }, [url])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const sendMessage = useCallback((message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message)
      console.log("Sent message:", message)
      return true
    } else {
      console.warn("WebSocket is not connected, cannot send message")
      return false
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    connectionState,
    lastMessage,
    sendMessage,
  }
}

