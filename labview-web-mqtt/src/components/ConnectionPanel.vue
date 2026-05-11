<template>
  <div class="connection-panel">
    <div class="status-indicator" :class="statusClass">
      <span class="status-dot"></span>
      <span class="status-text">{{ statusText }}</span>
    </div>
    
    <div class="connection-form" v-if="!isConnected">
      <div class="form-group">
        <label>Broker地址:</label>
        <input 
          v-model="brokerUrl" 
          placeholder="ws://192.168.1.100:9001"
          @keyup.enter="handleConnect"
        />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>用户名:</label>
          <input v-model="username" placeholder="可选" />
        </div>
        <div class="form-group">
          <label>密码:</label>
          <input v-model="password" type="password" placeholder="可选" />
        </div>
      </div>
      <button 
        class="btn btn-primary" 
        @click="handleConnect"
        :disabled="isConnecting"
      >
        {{ isConnecting ? '连接中...' : '连接' }}
      </button>
    </div>
    
    <button 
      v-else 
      class="btn btn-danger" 
      @click="handleDisconnect"
    >
      断开连接
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMqtt } from '@/composables/useServices'
import type { MqttConnectionStatus } from '@/types/mqtt'

const mqtt = useMqtt()

const brokerUrl = ref('ws://localhost:9001')
const username = ref('')
const password = ref('')

const status = ref<MqttConnectionStatus>('disconnected')

const isConnected = computed(() => status.value === 'connected')
const isConnecting = computed(() => status.value === 'connecting')

const statusClass = computed(() => {
  switch (status.value) {
    case 'connected': return 'status-connected'
    case 'connecting': return 'status-connecting'
    case 'error': return 'status-error'
    default: return 'status-disconnected'
  }
})

const statusText = computed(() => {
  switch (status.value) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中...'
    case 'error': return '连接错误'
    default: return '未连接'
  }
})

mqtt.onStatusChange((newStatus) => {
  status.value = newStatus
})

const handleConnect = async () => {
  try {
    await mqtt.connect()
  } catch (err) {
    console.error('Connection failed:', err)
  }
}

const handleDisconnect = () => {
  mqtt.disconnect()
}
</script>

<style scoped>
.connection-panel {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-connected .status-dot { background: #4caf50; }
.status-connecting .status-dot { background: #ff9800; }
.status-error .status-dot { background: #f44336; }
.status-disconnected .status-dot { background: #9e9e9e; }

.status-connected { color: #4caf50; }
.status-connecting { color: #ff9800; }
.status-error { color: #f44336; }
.status-disconnected { color: #9e9e9e; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.connection-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  color: #666;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-primary {
  background: #2196f3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
}

.btn-primary:disabled {
  background: #bbb;
  cursor: not-allowed;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}
</style>
