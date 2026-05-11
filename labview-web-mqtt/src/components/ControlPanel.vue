<template>
  <div class="control-panel">
    <h3>设备控制</h3>
    
    <div class="control-section">
      <h4>数据采集</h4>
      <div class="form-row">
        <div class="form-group">
          <label>采样率:</label>
          <input v-model.number="collectParams.sampleRate" type="number" />
        </div>
        <div class="form-group">
          <label>时长:</label>
          <input v-model.number="collectParams.duration" type="number" />
        </div>
      </div>
      <div class="form-group">
        <label>通道:</label>
        <div class="channel-select">
          <label v-for="ch in 4" :key="ch">
            <input type="checkbox" v-model="collectParams.channels" :value="ch" />
            CH{{ ch }}
          </label>
        </div>
      </div>
      <div class="btn-group">
        <button 
          class="btn btn-primary" 
          @click="startCollect"
          :disabled="!isConnected || isCollecting"
        >
          开始采集
        </button>
        <button 
          class="btn btn-danger" 
          @click="stopCollect"
          :disabled="!isCollecting"
        >
          停止
        </button>
      </div>
    </div>

    <div class="control-section">
      <h4>模拟输出</h4>
      <div class="form-row">
        <div class="form-group">
          <label>通道:</label>
          <select v-model.number="outputChannel">
            <option v-for="ch in 4" :key="ch" :value="ch">CH{{ ch }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>值:</label>
          <input v-model.number="outputValue" type="number" step="0.1" />
        </div>
      </div>
      <button 
        class="btn btn-primary" 
        @click="setOutput"
        :disabled="!isConnected"
      >
        设置输出
      </button>
    </div>

    <div class="control-section">
      <h4>系统状态</h4>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">CPU:</span>
          <span class="value">{{ systemInfo.cpuUsage.toFixed(1) }}%</span>
        </div>
        <div class="status-item">
          <span class="label">内存:</span>
          <span class="value">{{ systemInfo.memoryUsage.toFixed(1) }}%</span>
        </div>
        <div class="status-item">
          <span class="label">温度:</span>
          <span class="value">{{ systemInfo.temperature.toFixed(1) }}°C</span>
        </div>
        <div class="status-item">
          <span class="label">运行时间:</span>
          <span class="value">{{ formatUptime(systemInfo.uptime) }}</span>
        </div>
      </div>
      <button 
        class="btn btn-secondary" 
        @click="refreshStatus"
        :disabled="!isConnected"
      >
        刷新状态
      </button>
    </div>

    <div class="log-section">
      <h4>操作日志</h4>
      <div class="log-container">
        <div 
          v-for="(log, index) in logs" 
          :key="index" 
          class="log-item"
          :class="log.type"
        >
          <span class="time">{{ log.time }}</span>
          <span class="message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useMqtt, useLabViewApi } from '@/composables/useServices'
import type { SystemInfo } from '@/types/api'
import type { MqttMessage } from '@/types/mqtt'

const mqtt = useMqtt()
const api = useLabViewApi()

const isConnected = computed(() => mqtt.getStatus() === 'connected')

const collectParams = reactive({
  channels: [1, 2] as number[],
  sampleRate: 1000,
  duration: 5
})

const outputChannel = ref(1)
const outputValue = ref(0)
const isCollecting = ref(false)

const systemInfo = ref<SystemInfo>({
  cpuUsage: 0,
  memoryUsage: 0,
  temperature: 0,
  uptime: 0
})

interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'error'
}

const logs = ref<LogEntry[]>([])

const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({ time, message, type })
  if (logs.value.length > 50) {
    logs.value.pop()
  }
}

const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

const startCollect = async () => {
  try {
    isCollecting.value = true
    const result = await api.startCollect({
      channels: collectParams.channels,
      sampleRate: collectParams.sampleRate,
      duration: collectParams.duration
    })
    addLog(`开始采集 - 任务ID: ${result.taskId}`, 'success')
  } catch (err) {
    addLog(`采集失败: ${(err as Error).message}`, 'error')
    isCollecting.value = false
  }
}

const stopCollect = async () => {
  try {
    await api.stopCollect()
    isCollecting.value = false
    addLog('采集已停止', 'info')
  } catch (err) {
    addLog(`停止失败: ${(err as Error).message}`, 'error')
  }
}

const setOutput = async () => {
  try {
    await api.setOutput(outputChannel.value, outputValue.value)
    addLog(`CH${outputChannel.value} 输出设置为 ${outputValue.value}`, 'success')
  } catch (err) {
    addLog(`设置输出失败: ${(err as Error).message}`, 'error')
  }
}

const refreshStatus = async () => {
  try {
    systemInfo.value = await api.getSystemInfo()
    addLog('状态已刷新', 'info')
  } catch (err) {
    addLog(`获取状态失败: ${(err as Error).message}`, 'error')
  }
}

const handleStatusMessage = (msg: MqttMessage) => {
  if (msg.data) {
    const data = msg.data as SystemInfo
    systemInfo.value = data
  }
}

onMounted(async () => {
  if (isConnected.value) {
    await api.subscribeStatus(handleStatusMessage)
    await refreshStatus()
  }
})

onUnmounted(async () => {
  await api.unsubscribeStatus(handleStatusMessage)
})
</script>

<style scoped>
.control-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.control-panel h3 {
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.control-section {
  margin-bottom: 24px;
}

.control-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  color: #888;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.channel-select {
  display: flex;
  gap: 16px;
}

.channel-select label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #333;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196f3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
}

.btn-secondary {
  background: #607d8b;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #455a64;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.status-item .label {
  color: #666;
  font-size: 12px;
}

.status-item .value {
  font-weight: 600;
  color: #333;
}

.log-section {
  margin-top: 24px;
}

.log-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  background: #fafafa;
  border-radius: 4px;
  padding: 8px;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 4px 8px;
  font-size: 12px;
  border-bottom: 1px solid #eee;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item .time {
  color: #999;
  font-family: monospace;
}

.log-item.success .message { color: #4caf50; }
.log-item.error .message { color: #f44336; }
.log-item.info .message { color: #666; }
</style>
