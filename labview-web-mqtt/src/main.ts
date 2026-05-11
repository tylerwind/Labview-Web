import { createApp } from 'vue'
import App from './App.vue'
import { createServices, ServicesKey } from './composables/useServices'

const services = createServices({
  brokerUrl: 'ws://localhost:9001',
  reconnectPeriod: 5000
})

const app = createApp(App)
app.provide(ServicesKey, services)
app.mount('#app')
