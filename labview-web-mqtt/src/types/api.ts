export interface CollectParams {
  channels: number[]
  sampleRate: number
  duration: number
}

export interface CollectResult {
  data: number[][]
  actualSampleRate: number
  timestamp: number
}

export interface DeviceStatus {
  connected: boolean
  model: string
  firmware: string
  lastUpdate: number
}

export interface SystemInfo {
  cpuUsage: number
  memoryUsage: number
  temperature: number
  uptime: number
}
