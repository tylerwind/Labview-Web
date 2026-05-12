export interface MqttConfig {
  brokerUrl: string
  clientId?: string
  username?: string
  password?: string
  reconnectPeriod?: number
}

export interface MqttMessage {
  id?: string
  timestamp: number
  action?: string
  params?: Record<string, unknown>
  result?: 'success' | 'error'
  data?: unknown
  error?: string
}

export type MqttConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface MqttStatusMessage {
  connected: boolean
  timestamp: number
  modules: Record<string, {
    status: 'idle' | 'running' | 'error'
    lastUpdate: number
  }>
}
