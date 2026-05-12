import mqtt, { MqttClient, IClientOptions } from 'mqtt'
import { v4 as uuidv4 } from 'uuid'
import type { MqttConfig, MqttMessage, MqttConnectionStatus } from '@/types/mqtt'

export class MqttService {
  private client: MqttClient | null = null
  private config: MqttConfig
  private status: MqttConnectionStatus = 'disconnected'
  private pendingRequests: Map<string, {
    resolve: (value: MqttMessage) => void
    reject: (error: Error) => void
    timeout: ReturnType<typeof setTimeout>
  }> = new Map()
  private statusCallbacks: Set<(status: MqttConnectionStatus) => void> = new Set()
  private messageCallbacks: Map<string, Set<(msg: MqttMessage) => void>> = new Map()
  private requestTimeout: number

  constructor(config: MqttConfig, requestTimeout = 10000) {
    this.config = config
    this.requestTimeout = requestTimeout
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.status = 'connecting'
      this.notifyStatusChange()

      const options: IClientOptions = {
        clientId: this.config.clientId || `web_client_${uuidv4()}`,
        clean: true,
        reconnectPeriod: this.config.reconnectPeriod || 5000,
        username: this.config.username,
        password: this.config.password,
      }

      this.client = mqtt.connect(this.config.brokerUrl, options)

      this.client.on('connect', () => {
        this.status = 'connected'
        this.notifyStatusChange()
        console.log('[MQTT] Connected to broker')
        resolve()
      })

      this.client.on('error', (err) => {
        this.status = 'error'
        this.notifyStatusChange()
        console.error('[MQTT] Connection error:', err)
        reject(err)
      })

      this.client.on('message', (topic: string, payload: Buffer) => {
        this.handleMessage(topic, payload)
      })

      this.client.on('close', () => {
        this.status = 'disconnected'
        this.notifyStatusChange()
        console.log('[MQTT] Disconnected from broker')
      })

      this.client.on('reconnect', () => {
        this.status = 'connecting'
        this.notifyStatusChange()
        console.log('[MQTT] Reconnecting...')
      })
    })
  }

  disconnect(): void {
    if (this.client) {
      this.client.end()
      this.client = null
      this.status = 'disconnected'
      this.notifyStatusChange()
    }
    this.pendingRequests.forEach(({ timeout }) => clearTimeout(timeout))
    this.pendingRequests.clear()
  }

  private handleMessage(topic: string, payload: Buffer): void {
    try {
      const rawMessage = JSON.parse(payload.toString())
      console.log(`[MQTT] Received on ${topic}:`, rawMessage)

      // 支持两种消息格式：
      // 1. 标准 MqttMessage 格式（带 id, action）
      // 2. 广播消息格式（只有 timestamp 和 data）
      const message: MqttMessage = rawMessage.id ? rawMessage : {
        id: '',
        timestamp: rawMessage.timestamp || Date.now(),
        action: '',
        data: rawMessage.data
      }

      if (message.id && this.pendingRequests.has(message.id)) {
        const pending = this.pendingRequests.get(message.id)!
        clearTimeout(pending.timeout)
        this.pendingRequests.delete(message.id)
        
        if (message.result === 'error') {
          pending.reject(new Error(message.error || 'Unknown error'))
        } else {
          pending.resolve(message)
        }
      }

      const callbacks = this.messageCallbacks.get(topic)
      if (callbacks) {
        callbacks.forEach(cb => cb(message))
      }

      const wildcardCallbacks = this.messageCallbacks.get('#')
      if (wildcardCallbacks) {
        wildcardCallbacks.forEach(cb => cb(message))
      }
    } catch (err) {
      console.error('[MQTT] Failed to parse message:', err)
    }
  }

  async subscribe(topic: string, callback?: (msg: MqttMessage) => void): Promise<void> {
    if (!this.client) {
      throw new Error('MQTT client not connected')
    }

    return new Promise((resolve, reject) => {
      this.client!.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          reject(err)
        } else {
          console.log(`[MQTT] Subscribed to ${topic}`)
          if (callback) {
            if (!this.messageCallbacks.has(topic)) {
              this.messageCallbacks.set(topic, new Set())
            }
            this.messageCallbacks.get(topic)!.add(callback)
          }
          resolve()
        }
      })
    })
  }

  async unsubscribe(topic: string, callback?: (msg: MqttMessage) => void): Promise<void> {
    if (!this.client) return

    return new Promise((resolve, reject) => {
      this.client!.unsubscribe(topic, (err) => {
        if (err) {
          reject(err)
        } else {
          if (callback) {
            this.messageCallbacks.get(topic)?.delete(callback)
          }
          resolve()
        }
      })
    })
  }

  async publish(topic: string, message: Partial<MqttMessage>): Promise<void> {
    if (!this.client) {
      throw new Error('MQTT client not connected')
    }

    const fullMessage: MqttMessage = {
      id: message.id || uuidv4(),
      timestamp: message.timestamp || Date.now(),
      action: message.action || '',
      ...message
    }

    return new Promise((resolve, reject) => {
      this.client!.publish(
        topic,
        JSON.stringify(fullMessage),
        { qos: 1 },
        (err) => {
          if (err) {
            reject(err)
          } else {
            console.log(`[MQTT] Published to ${topic}:`, fullMessage)
            resolve()
          }
        }
      )
    })
  }

  async request(
    commandTopic: string,
    responseTopic: string,
    action: string,
    params?: Record<string, unknown>
  ): Promise<MqttMessage> {
    const id = uuidv4()
    
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error(`Request timeout for action: ${action}`))
      }, this.requestTimeout)

      this.pendingRequests.set(id, { resolve, reject, timeout })

      await this.subscribe(responseTopic)
      
      await this.publish(commandTopic, {
        id,
        action,
        params
      })
    })
  }

  onStatusChange(callback: (status: MqttConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback)
    callback(this.status)
    return () => this.statusCallbacks.delete(callback)
  }

  getStatus(): MqttConnectionStatus {
    return this.status
  }

  private notifyStatusChange(): void {
    this.statusCallbacks.forEach(cb => cb(this.status))
  }
}

export const createMqttService = (config: MqttConfig): MqttService => {
  return new MqttService(config)
}
