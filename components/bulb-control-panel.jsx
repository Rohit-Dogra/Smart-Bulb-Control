"use client"

import { useState, useEffect } from "react"
import { useWebSocket } from "../hooks/use-websocket"
import { Lightbulb, Power, Zap, Info } from "lucide-react"

// Protocol constants
const FIRMWARE_VERSION = "wmv2"
const GATEWAY_MAC = "800000fff0000001"
const LAMP_CONTROL = "0xF001"
const GROUP_CONTROL = "0xC002"
const LAMP_ACK = "0xC003"
const GROUP_STATUS = "0xC004"
const NODE_MAC = "011221f6fe01201"

export default function BulbControlPanel() {
  const [bulb1On, setBulb1On] = useState(false)
  const [bulb2On, setBulb2On] = useState(false)
  const [groupControlOn, setGroupControlOn] = useState(false) // Separate state for group control
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const [lastCommand, setLastCommand] = useState("")
  const { sendMessage, lastMessage, connectionState } = useWebSocket()

  useEffect(() => {
    setConnectionStatus(connectionState)
  }, [connectionState])

  useEffect(() => {
    if (lastMessage) {
      try {
        console.log("Received message:", lastMessage)
        const data = JSON.parse(lastMessage)

        // Handle different message types based on protocol
        if (data.command === LAMP_ACK) {
          // Update individual bulb status
          if (data.nodeMac === "bulb1") {
            setBulb1On(data.currentValue === "1")
          } else if (data.nodeMac === "bulb2") {
            setBulb2On(data.currentValue === "1")
          }

          // Don't update group control state when individual bulbs change
        } else if (data.command === GROUP_STATUS) {
          // Update all bulbs based on group status
          const newState = data.currentValue === "1"
          setBulb1On(newState)
          setBulb2On(newState)
          setGroupControlOn(newState) // Update group control state
        }

        setLastCommand(`${data.command} - ${new Date().toLocaleTimeString()}`)
      } catch (e) {
        console.error("Failed to parse message:", e)
      }
    }
  }, [lastMessage])

  const toggleBulb = (bulbId) => {
    const nodeMac = bulbId === 1 ? "bulb1" : "bulb2"
    const currentState = bulbId === 1 ? bulb1On : bulb2On
    const newState = !currentState

    // Format according to protocol
    const message = {
      protocol: "ILCMS",
      firmwareVersion: FIRMWARE_VERSION,
      header: "0x01",
      gatewayMac: GATEWAY_MAC,
      command: LAMP_CONTROL,
      nodeMac: nodeMac,
      actionValue: newState ? "1" : "0",
      currentValue: currentState ? "1" : "0",
      currentDate: new Date().toISOString().split("T")[0],
      currentTime: new Date().toTimeString().split(" ")[0],
      footer: "0xA3",
    }

    sendMessage(JSON.stringify(message))

    // Update local state immediately for responsive UI
    if (bulbId === 1) {
      setBulb1On(newState)
    } else {
      setBulb2On(newState)
    }

    // Do NOT update group control state when individual bulbs change
  }

  const toggleBothBulbs = () => {
    // Toggle the group control state
    const newGroupState = !groupControlOn
    setGroupControlOn(newGroupState)

    // Format according to protocol
    const message = {
      protocol: "ILCMS",
      firmwareVersion: FIRMWARE_VERSION,
      header: "0x01",
      gatewayMac: GATEWAY_MAC,
      command: GROUP_CONTROL,
      nodeMac: "FFFFFFFFFFFF",
      actionValue: newGroupState ? "1" : "0",
      currentValue: groupControlOn ? "1" : "0",
      currentDate: new Date().toISOString().split("T")[0],
      currentTime: new Date().toTimeString().split(" ")[0],
      footer: "0xA3",
    }

    sendMessage(JSON.stringify(message))

    // Update bulb states to match group control
    setBulb1On(newGroupState)
    setBulb2On(newGroupState)
  }

  return (
    <div className="max-w-4xl mx-auto bg-blue-800/30 backdrop-blur-sm border border-blue-700 rounded-lg shadow-xl overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-blue-900 to-blue-800">
        <h1 className="text-2xl font-bold text-white flex items-center justify-center mb-2">
          <Zap className="h-6 w-6 mr-2 text-cyan-400" />
          Inxee Switch Control
        </h1>

        <div className="text-center mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              connectionStatus === "connected" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {connectionStatus === "connected" ? "Connected to Server" : "Disconnected"}
          </span>
        </div>

        <div className="text-xs text-cyan-300 text-center mb-4">
          Firmware: {FIRMWARE_VERSION} | Gateway: {GATEWAY_MAC.substring(0, 8)}...
        </div>
      </div>

      <div className="p-4">
        {/* Lamps side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Lamp 1 */}
          <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-700">
            <h2 className="text-lg font-medium text-white text-center mb-3">Lamp 1</h2>
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <Lightbulb
                  size={60}
                  className={`${bulb1On ? "text-yellow-300 filter drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" : "text-gray-400"}`}
                  fill={bulb1On ? "currentColor" : "none"}
                />
              </div>
              <button
                onClick={() => toggleBulb(1)}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  bulb1On ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {bulb1On ? "Off" : "On"}
              </button>
              <div className="mt-2 text-xs text-cyan-300">{NODE_MAC.substring(0, 8)}...</div>
            </div>
          </div>

          {/* Lamp 2 */}
          <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-700">
            <h2 className="text-lg font-medium text-white text-center mb-3">Lamp 2</h2>
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <Lightbulb
                  size={60}
                  className={`${bulb2On ? "text-yellow-300 filter drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" : "text-gray-400"}`}
                  fill={bulb2On ? "currentColor" : "none"}
                />
              </div>
              <button
                onClick={() => toggleBulb(2)}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  bulb2On ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {bulb2On ? "Off" : "On"}
              </button>
              <div className="mt-2 text-xs text-cyan-300">{NODE_MAC.substring(0, 8)}...</div>
            </div>
          </div>
        </div>

        {/* Group Control - below both lamps */}
        <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-700 mb-4">
          <h2 className="text-lg font-medium text-white text-center mb-3">Group Control</h2>
          <button
            onClick={toggleBothBulbs}
            className={`w-full py-2 px-4 rounded-md font-medium flex items-center justify-center transition-colors ${
              groupControlOn ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            <Power className="mr-2 h-5 w-5" />
            {groupControlOn ? "Turn All Off" : "Turn All On"}
          </button>
        </div>

        {/* Protocol Status */}
        <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-700">
          <h2 className="text-sm font-medium text-white text-center flex items-center justify-center mb-2">
            <Info className="h-4 w-4 mr-2" />
            Protocol Status
          </h2>
          <div className="text-xs text-cyan-200 font-mono overflow-x-auto whitespace-nowrap">
            Last Command: {lastCommand || "None"}
          </div>
        </div>
      </div>
    </div>
  )
}

