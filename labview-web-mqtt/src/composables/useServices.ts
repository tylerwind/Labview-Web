import { inject, type InjectionKey } from 'vue'
import { MqttService, createMqttService } from '@/services/MqttService'
import { LabViewApi, createLabViewApi } from '@/services/LabViewApi'
import type { MqttConfig } from '@/types/mqtt'

export interface AppServices {
  mqtt: MqttService
  api: LabViewApi
}

export const ServicesKey: InjectionKey<AppServices> = Symbol('services')

export const createServices = (config: MqttConfig): AppServices => {
  const mqtt = createMqttService(config)
  const api = createLabViewApi(mqtt)
  return { mqtt, api }
}

export const useServices = (): AppServices => {
  const services = inject(ServicesKey)
  if (!services) {
    throw new Error('Services not provided. Make sure to call app.provide(ServicesKey, services)')
  }
  return services
}

export const useMqtt = (): MqttService => {
  return useServices().mqtt
}

export const useLabViewApi = (): LabViewApi => {
  return useServices().api
}
