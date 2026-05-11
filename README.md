# Labview-Web

LabVIEW 作为 API Web 调用实现界面 - 基于 Vue.js + MQTT 的 LabVIEW 混合编程解决方案。

## 项目简介

本项目提供了一套完整的 Web 前端与 LabVIEW 后端通信方案，通过 MQTT 协议实现实时数据交换，支持数据采集、设备控制、状态监控等功能。

## 功能模块

### 1. LabVIEW Web MQTT 控制面板

位于 `labview-web-mqtt/` 目录，是一个完整的 Vue.js 前端应用：

- **MQTT 连接管理** - WebSocket 连接，带状态指示器
- **数据采集控制** - 配置采样率、通道、时长，启动/停止采集任务
- **模拟输出控制** - 设置指定通道的输出值
- **系统状态监控** - 实时显示 CPU、内存、温度、运行时间
- **数据可视化** - 实时波形图，支持最大/最小/平均值统计
- **操作日志** - 记录所有操作和系统反馈

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Web 前端 (Vue.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ 连接面板    │  │ 控制面板    │  │ 数据监控            │ │
│  │ Connection  │  │ Control     │  │ Data Monitor        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ MQTT over WebSocket
┌───────────────────────────┼─────────────────────────────────┐
│                      MQTT Broker                            │
│                    (Mosquitto/EMQX)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │ MQTT TCP
┌───────────────────────────┼─────────────────────────────────┐
│                      LabVIEW 服务端                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ MQTT Client │  │ 消息路由    │  │ 功能处理器          │ │
│  │ Module      │  │ Router      │  │ Function Handlers   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 目录结构

```
labview-web-mqtt/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── ConnectionPanel.vue   # MQTT 连接面板
│   │   ├── ControlPanel.vue      # 设备控制面板
│   │   └── DataMonitor.vue       # 数据监控组件
│   ├── composables/         # 组合式函数
│   ├── services/            # 服务层
│   │   ├── MqttService.ts        # MQTT 客户端服务
│   │   └── LabViewApi.ts         # LabVIEW API 封装
│   ├── types/               # TypeScript 类型定义
│   ├── App.vue              # 主应用组件
│   └── main.ts              # 应用入口
├── dist/                    # 生产构建产物
├── LABVIEW_GUIDE.md         # LabVIEW 集成指南
└── README.md                # 项目说明
```

## 快速开始

### 前置要求

- Node.js 18+
- MQTT Broker (推荐 Mosquitto)
- LabVIEW 2018+ (用于后端开发)

### 安装依赖

```bash
cd labview-web-mqtt
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 类型检查

```bash
npm run typecheck
```

## MQTT 通信协议

### 主题约定

| 主题 | 方向 | 说明 |
|------|------|------|
| `labview/command/{func}` | Web → LabVIEW | 命令请求 |
| `labview/response/{func}` | LabVIEW → Web | 命令响应 |
| `labview/status` | LabVIEW → Web | 状态广播 |
| `labview/data/{type}` | LabVIEW → Web | 数据推送 |

### 消息格式示例

**请求消息：**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1699876543210,
  "action": "startCollect",
  "params": {
    "channels": [1, 2],
    "sampleRate": 1000,
    "duration": 5
  }
}
```

**响应消息：**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1699876543220,
  "action": "startCollect",
  "result": "success",
  "data": {
    "taskId": "task_001"
  }
}
```

## LabVIEW 集成

详细的 LabVIEW 后端集成指南请参考 [labview-web-mqtt/LABVIEW_GUIDE.md](./labview-web-mqtt/LABVIEW_GUIDE.md)，包含：

- MQTT 客户端实现方案（LabVIEW MQTT Toolkit）
- 消息协议规范详解
- LabVIEW 程序架构设计
- API 功能实现示例
- Mosquitto Broker 部署配置
- 调试技巧和性能优化建议

## 技术栈

- **前端框架**: Vue 3.4 + TypeScript
- **构建工具**: Vite 5
- **MQTT 客户端**: mqtt.js 5.x
- **样式**: 原生 CSS
- **协议**: MQTT over WebSocket

## 默认配置

- **Broker 地址**: `ws://localhost:9001` (WebSocket)
- **QoS**: 1
- **请求超时**: 10 秒
- **自动重连间隔**: 5 秒

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## 许可证

MIT
