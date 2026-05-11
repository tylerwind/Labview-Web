<template>
  <div class="data-monitor">
    <h3>实时数据监控</h3>
    
    <div class="chart-container">
      <div class="chart-placeholder">
        <div class="chart-bars">
          <div 
            v-for="(value, index) in chartData" 
            :key="index"
            class="bar"
            :style="{ height: `${value}%` }"
          ></div>
        </div>
        <div class="chart-labels">
          <span v-for="i in 10" :key="i">{{ i }}</span>
        </div>
      </div>
    </div>

    <div class="data-stats">
      <div class="stat-card">
        <span class="stat-label">当前值</span>
        <span class="stat-value">{{ currentValue.toFixed(2) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">最大值</span>
        <span class="stat-value">{{ maxValue.toFixed(2) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">最小值</span>
        <span class="stat-value">{{ minValue.toFixed(2) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">平均值</span>
        <span class="stat-value">{{ avgValue.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLabViewApi } from '@/composables/useServices'
import type { MqttMessage } from '@/types/mqtt'

const api = useLabViewApi()

const dataBuffer = ref<number[]>([])
const currentValue = ref(0)

const chartData = computed(() => {
  const data: number[] = []
  for (let i = 0; i < 10; i++) {
    const idx = Math.floor(dataBuffer.value.length * i / 10)
    data.push(Math.abs(dataBuffer.value[idx] || 0) * 100 % 100)
  }
  return data
})

const maxValue = computed(() => {
  if (dataBuffer.value.length === 0) return 0
  return Math.max(...dataBuffer.value)
})

const minValue = computed(() => {
  if (dataBuffer.value.length === 0) return 0
  return Math.min(...dataBuffer.value)
})

const avgValue = computed(() => {
  if (dataBuffer.value.length === 0) return 0
  return dataBuffer.value.reduce((a, b) => a + b, 0) / dataBuffer.value.length
})

const handleDataMessage = (msg: MqttMessage) => {
  if (msg.data && Array.isArray(msg.data)) {
    const newData = msg.data as number[]
    dataBuffer.value = [...dataBuffer.value, ...newData].slice(-1000)
    currentValue.value = newData[newData.length - 1] || 0
  }
}

onMounted(async () => {
  await api.subscribeData('waveform', handleDataMessage)
})

onUnmounted(async () => {
  await api.unsubscribeData('waveform', handleDataMessage)
})
</script>

<style scoped>
.data-monitor {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.data-monitor h3 {
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.chart-container {
  margin-bottom: 16px;
}

.chart-placeholder {
  background: #fafafa;
  border-radius: 4px;
  padding: 16px;
  height: 200px;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding-bottom: 8px;
}

.bar {
  flex: 1;
  background: linear-gradient(to top, #2196f3, #64b5f6);
  border-radius: 2px 2px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #999;
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}
</style>
