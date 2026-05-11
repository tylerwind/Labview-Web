import { MqttService } from './MqttService'
import type { MqttMessage } from '@/types/mqtt'
import type { CollectParams, CollectResult, DeviceStatus, SystemInfo } from '@/types/api'

const TOPICS = {
  command: (func: string) => `labview/command/${func}`,
  response: (func: string) => `labview/response/${func}`,
  status: 'labview/status',
  data: (type: string) => `labview/data/${type}`
}

export class LabViewApi {
  constructor(private mqtt: MqttService) {}

  private async callApi<T>(
    functionName: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const response = await this.mqtt.request(
      TOPICS.command(functionName),
      TOPICS.response(functionName),
      functionName,
      params
    )
    return response.data as T
  }

  async startCollect(params: CollectParams): Promise<{ taskId: string }> {
    return this.callApi('startCollect', params as unknown as Record<string, unknown>)
  }

  async stopCollect(): Promise<{ stopped: boolean }> {
    return this.callApi('stopCollect')
  }

  async getCollectResult(): Promise<CollectResult> {
    return this.callApi('getCollectResult')
  }

  async setOutput(channel: number, value: number): Promise<{ success: boolean }> {
    return this.callApi('setOutput', { channel, value })
  }

  async getDeviceStatus(): Promise<DeviceStatus> {
    return this.callApi('getDeviceStatus')
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return this.callApi('getSystemInfo')
  }

  async startTest(testType: string, config: Record<string, unknown>): Promise<{ testId: string }> {
    return this.callApi('startTest', { testType, config })
  }

  async stopTest(testId: string): Promise<{ stopped: boolean }> {
    return this.callApi('stopTest', { testId })
  }

  async loadConfig(configName: string): Promise<{ loaded: boolean; config: Record<string, unknown> }> {
    return this.callApi('loadConfig', { configName })
  }

  async saveConfig(configName: string, config: Record<string, unknown>): Promise<{ saved: boolean }> {
    return this.callApi('saveConfig', { configName, config })
  }

  subscribeStatus(callback: (status: MqttMessage) => void): Promise<void> {
    return this.mqtt.subscribe(TOPICS.status, callback)
  }

  subscribeData(dataType: string, callback: (data: MqttMessage) => void): Promise<void> {
    return this.mqtt.subscribe(TOPICS.data(dataType), callback)
  }

  unsubscribeStatus(callback?: (status: MqttMessage) => void): Promise<void> {
    return this.mqtt.unsubscribe(TOPICS.status, callback)
  }

  unsubscribeData(dataType: string, callback?: (data: MqttMessage) => void): Promise<void> {
    return this.mqtt.unsubscribe(TOPICS.data(dataType), callback)
  }
}

export const createLabViewApi = (mqtt: MqttService): LabViewApi => {
  return new LabViewApi(mqtt)
}
