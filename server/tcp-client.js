const net = require("net")
const EventEmitter = require("events")

// Protocol constants
const FIRMWARE_VERSION = "wmv2"
const GATEWAY_MAC = "800000fff0000001"
const LAMP_CONTROL = "0xF001"
const GROUP_CONTROL = "0xC002"
const LAMP_ACK = "0xC003"
const GROUP_STATUS = "0xC004"
const NODE_MAC = "011221f6fe01201"

class BulbTcpClient extends EventEmitter {
  constructor(host, port) {
    super()
    this.host = host
    this.port = port
    this.client = null
    this.connected = false
    this.reconnectTimer = null
    this.buffer = ""
  }

  connect() {
    console.log(`Connecting to bulb controller at ${this.host}:${this.port}...`)

    this.client = new net.Socket()

    this.client.on("connect", () => {
      console.log(`Connected to bulb controller at ${this.host}:${this.port}`)
      this.connected = true
      this.emit("connected")

      // Clear any reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
    })

    this.client.on("data", (data) => {
      // Handle incoming data from the bulb controller
      const message = data.toString()
      console.log(`Received from bulb controller: ${message}`)

      // Process the message
      this.buffer += message
      this.processBuffer()
    })

    this.client.on("close", () => {
      console.log("Connection to bulb controller closed")
      this.connected = false
      this.emit("disconnected")

      // Attempt to reconnect after 5 seconds
      this.reconnectTimer = setTimeout(() => {
        this.connect()
      }, 5000)
    })

    this.client.on("error", (err) => {
      console.error(`TCP client error: ${err.message}`)
      this.client.destroy()
    })

    // Attempt to connect
    this.client.connect(this.port, this.host)
  }

  // Process the buffer for complete messages
  processBuffer() {
    // This is a simplified example. In a real implementation,
    // you would need to parse the protocol-specific message format
    // and handle message boundaries correctly.

    // For this example, we'll assume messages are separated by newlines
    const messages = this.buffer.split("\n")

    // Keep the last incomplete message in the buffer
    this.buffer = messages.pop()

    // Process complete messages
    for (const message of messages) {
      if (message.trim() === "") continue

      try {
        // Try to parse as JSON (adjust based on your actual protocol)
        const data = JSON.parse(message)
        this.emit("message", data)
      } catch (err) {
        console.error(`Failed to parse message: ${message}`)
      }
    }
  }

  // Send a command to the bulb controller
  sendCommand(command) {
    if (!this.connected) {
      console.warn("Cannot send command: not connected to bulb controller")
      return false
    }

    console.log(`Sending to bulb controller: ${JSON.stringify(command)}`)

    // Convert the command to the format expected by your hardware
    // This will depend on your specific hardware protocol
    const formattedCommand = this.formatCommand(command)

    this.client.write(formattedCommand)
    return true
  }

  // Format a command according to the hardware protocol
  formatCommand(command) {
    // This is a simplified example. You'll need to adjust this
    // based on your actual hardware protocol.

    // For this example, we'll just convert to JSON and add a newline
    return JSON.stringify(command) + "\n"
  }

  // Close the connection
  disconnect() {
    if (this.client) {
      this.client.destroy()
      this.client = null
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.connected = false
  }
}

module.exports = BulbTcpClient

