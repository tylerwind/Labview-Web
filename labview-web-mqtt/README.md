# LabVIEW Web MQTT 控制面板

基于 Vue.js + MQTT 的 LabVIEW 混合编程 Web 控制面板，实现 Web 前端与 LabVIEW 后端的实时通信。

## 功能特性

- **MQTT 连接管理** - 支持 WebSocket 连接，带连接状态指示
- **数据采集控制** - 配置采样率、通道、时长，启动/停止采集
- **模拟输出控制** - 设置指定通道的输出值
- **系统状态监控** - 实时显示 CPU、内存、温度、运行时间
- **数据可视化** - 实时波形图展示，支持统计信息（最大/最小/平均值）
- **操作日志** - 记录所有操作和系统反馈

## 技术栈

- **前端框架**: Vue 3.4 + TypeScript
- **构建工具**: Vite 5
- **MQTT 客户端**: mqtt.js 5.x
- **样式**: 原生 CSS

## 快速开始

### 安装依赖

```bash
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

### 预览生产构建

```bash
npm run preview
```

### 类型检查

```bash
npm run typecheck
```

## 项目结构

```
labview-web-mqtt/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── ConnectionPanel.vue   # MQTT 连接面板
│   │   ├── ControlPanel.vue      # 设备控制面板
│   │   └── DataMonitor.vue       # 数据监控组件
│   ├── composables/         # 组合式函数
│   │   └── useServices.ts        # 服务访问封装
│   ├── services/            # 服务层
│   │   ├── MqttService.ts        # MQTT 客户端服务
│   │   └── LabViewApi.ts         # LabVIEW API 封装
│   ├── types/               # TypeScript 类型定义
│   │   ├── mqtt.ts               # MQTT 相关类型
│   │   └── api.ts                # API 相关类型
│   ├── App.vue              # 主应用组件
│   └── main.ts              # 应用入口
├── dist/                    # 构建产物
├── LABVIEW_GUIDE.md         # LabVIEW 集成指南
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## MQTT 主题约定

| 主题 | 方向 | 说明 |
|------|------|------|
| `labview/command/{func}` | Web → LabVIEW | 命令请求 |
| `labview/response/{func}` | LabVIEW → Web | 命令响应 |
| `labview/status` | LabVIEW → Web | 状态广播 |
| `labview/data/{type}` | LabVIEW → Web | 数据推送 |

## 消息格式

### 请求消息

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

### 响应消息

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

详细集成指南请参考 [LABVIEW_GUIDE.md](./LABVIEW_GUIDE.md)，包含：

- MQTT 客户端实现方案
- 消息协议规范
- LabVIEW 程序结构
- API 实现示例
- 部署配置

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
