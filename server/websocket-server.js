const WebSocket = require("ws")
const BulbTcpClient = require("./tcp-client")

// Protocol constants
const FIRMWARE_VERSION = "wmv2"
const GATEWAY_MAC = "800000fff0000001"
const LAMP_CONTROL = "0xF001"
const GROUP_CONTROL = "0xC002"
const LAMP_ACK = "0xC003"
const GROUP_STATUS = "0xC004"
const CIRCUIT_CONTROL = "0xC005"
const NODE_MAC = "011221f6fe01201"

// TCP connection settings for the bulb controller
const BULB_CONTROLLER_HOST = "192.168.1.100" // Change to your bulb controller's IP
const BULB_CONTROLLER_PORT = 8888 // Change to your bulb controller's port

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 })

// Store the current state of the bulbs
const bulbState = {
  bulb1: false,
  bulb2: false,
  groupControl: false,
}

// Create a TCP client to communicate with the bulb controller
const tcpClient = new BulbTcpClient(BULB_CONTROLLER_HOST, BULB_CONTROLLER_PORT)

// Connect to the bulb controller
tcpClient.connect()

// Handle messages from the bulb controller
tcpClient.on("message", (data) => {
  console.log("Received message from bulb controller:", data)

  // Process the message based on your hardware protocol
  // This is a simplified example. You'll need to adjust this
  // based on your actual hardware protocol.

  if (data.command === LAMP_ACK) {
    // Update bulb state based on acknowledgement from hardware
    if (data.nodeMac === "bulb1") {
      bulbState.bulb1 = data.currentValue === "1"
    } else if (data.nodeMac === "bulb2") {
      bulbState.bulb2 = data.currentValue === "1"
    }

    // Broadcast the updated state to all WebSocket clients
    broadcastBulbState()
  } else if (data.command === GROUP_STATUS) {
    // Update group state based on acknowledgement from hardware
    const newState = data.currentValue === "1"
    bulbState.groupControl = newState
    bulbState.bulb1 = newState
    bulbState.bulb2 = newState

    // Broadcast the updated state to all WebSocket clients
    broadcastBulbState()
  }
})

// Handle connection status changes
tcpClient.on("connected", () => {
  console.log("Connected to bulb controller")
  // You might want to query the current state of the bulbs here
})

tcpClient.on("disconnected", () => {
  console.log("Disconnected from bulb controller")
})

console.log("WebSocket server started on port 8080")
console.log(`Firmware Version: ${FIRMWARE_VERSION}`)
console.log(`Gateway MAC: ${GATEWAY_MAC}`)
console.log(`Attempting to connect to bulb controller at ${BULB_CONTROLLER_HOST}:${BULB_CONTROLLER_PORT}`)

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("WebSocket client connected")

  // Send the current state to the newly connected client
  sendLampAcknowledgement(ws, "bulb1", bulbState.bulb1)
  sendLampAcknowledgement(ws, "bulb2", bulbState.bulb2)

  // Handle messages from WebSocket clients
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message)
      console.log("Received from WebSocket client:", data)

      // Forward the command to the bulb controller
      tcpClient.sendCommand(data)

      // Handle different message types based on command
      if (data.command === LAMP_CONTROL) {
        const { nodeMac, actionValue } = data
        const newState = actionValue === "1"

        // Update local state (will be confirmed by hardware acknowledgement)
        if (nodeMac === "bulb1") {
          bulbState.bulb1 = newState
        } else if (nodeMac === "bulb2") {
          bulbState.bulb2 = newState
        }

        // Send acknowledgement to the WebSocket client
        sendLampAcknowledgement(ws, nodeMac, newState)
      } else if (data.command === GROUP_CONTROL) {
        const { actionValue } = data
        const newState = actionValue === "1"

        // Update local state (will be confirmed by hardware acknowledgement)
        bulbState.groupControl = newState
        bulbState.bulb1 = newState
        bulbState.bulb2 = newState

        // Send group status to all clients
        broadcastGroupStatus(newState)
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error)
    }
  })

  // Handle client disconnection
  ws.on("close", () => {
    console.log("WebSocket client disconnected")
  })
})

// Send lamp acknowledgement to a WebSocket client
function sendLampAcknowledgement(ws, nodeMac, state) {
  const message = {
    protocol: "ILCMS",
    firmwareVersion: FIRMWARE_VERSION,
    header: "0x01",
    gatewayMac: GATEWAY_MAC,
    command: LAMP_ACK,
    nodeMac: nodeMac,
    actionValue: state ? "1" : "0",
    currentValue: state ? "1" : "0",
    currentDate: new Date().toISOString().split("T")[0],
    currentTime: new Date().toTimeString().split(" ")[0],
    footer: "0xA3",
  }

  ws.send(JSON.stringify(message))
}

// Broadcast group status to all WebSocket clients
function broadcastGroupStatus(state) {
  const message = {
    protocol: "ILCMS",
    firmwareVersion: FIRMWARE_VERSION,
    header: "0x01",
    gatewayMac: GATEWAY_MAC,
    command: GROUP_STATUS,
    nodeMac: "FFFFFFFFFFFF",
    actionValue: state ? "1" : "0",
    currentValue: state ? "1" : "0",
    currentDate: new Date().toISOString().split("T")[0],
    currentTime: new Date().toTimeString().split(" ")[0],
    footer: "0xA3",
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}

// Broadcast the current bulb state to all WebSocket clients
function broadcastBulbState() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      sendLampAcknowledgement(client, "bulb1", bulbState.bulb1)
      sendLampAcknowledgement(client, "bulb2", bulbState.bulb2)
    }
  })
}

// Send heartbeat to all clients every 30 seconds
setInterval(() => {
  const heartbeat = {
    protocol: "ILCMS",
    firmwareVersion: FIRMWARE_VERSION,
    header: "0x01",
    gatewayMac: GATEWAY_MAC,
    command: "0xF004", // Heartbeat interval
    nodeMac: "SYSTEM",
    actionValue: "30",
    currentValue: "30",
    currentDate: new Date().toISOString().split("T")[0],
    currentTime: new Date().toTimeString().split(" ")[0],
    footer: "0xA3",
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(heartbeat))
    }
  })

  // Also send heartbeat to the bulb controller
  tcpClient.sendCommand(heartbeat)

  console.log("Heartbeat sent")
}, 30000)

// Clean up on process exit
process.on("SIGINT", () => {
  console.log("Shutting down...")
  tcpClient.disconnect()
  process.exit()
})

