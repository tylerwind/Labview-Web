<template>
  <div id="app">
    <header class="app-header">
      <h1>LabVIEW Web Control Panel</h1>
      <span class="subtitle">MQTT混合编程架构示例</span>
    </header>
    
    <main class="app-main">
      <aside class="sidebar">
        <ConnectionPanel />
      </aside>
      
      <section class="content">
        <ControlPanel />
        <DataMonitor />
      </section>
    </main>
    
    <footer class="app-footer">
      <span>LabVIEW + MQTT + Vue.js 混合编程架构</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import ConnectionPanel from '@/components/ConnectionPanel.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import DataMonitor from '@/components/DataMonitor.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #f0f2f5;
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #1976d2, #2196f3);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.app-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.app-header .subtitle {
  font-size: 14px;
  opacity: 0.8;
}

.app-main {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-footer {
  background: #fff;
  padding: 12px 24px;
  text-align: center;
  font-size: 12px;
  color: #888;
  border-top: 1px solid #eee;
}

@media (max-width: 768px) {
  .app-main {
    grid-template-columns: 1fr;
  }
}
</style>
