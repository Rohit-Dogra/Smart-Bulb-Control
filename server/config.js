// Configuration for the bulb control system

module.exports = {
  // WebSocket server configuration
  websocket: {
    port: 8080,
  },

  // TCP client configuration for connecting to the bulb controller
  bulbController: {
    host: "192.168.1.100", // Change to your bulb controller's IP
    port: 8888, // Change to your bulb controller's port
  },

  // Protocol constants
  protocol: {
    firmwareVersion: "wmv2",
    gatewayMac: "800000fff0000001",
    lampControl: "0xF001",
    groupControl: "0xC002",
    lampAck: "0xC003",
    groupStatus: "0xC004",
    circuitControl: "0xC005",
    nodeMac: "011221f6fe01201",
  },
}

