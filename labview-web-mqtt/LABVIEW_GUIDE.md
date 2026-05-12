# LabVIEW MQTT API 实现指南

## 概述

本文档说明如何在 LabVIEW 2018+ 中实现 MQTT 客户端，作为 Web 前端的功能 API 服务端。

## 架构图

```
┌──────────────────────────────────────────────────────────────┐
│                      LabVIEW 主程序                           │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ MQTT Client │───►│  Message    │───►│  Function   │      │
│  │   Module    │    │  Router     │    │  Handlers   │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Subscribe  │    │ JSON Parser │    │  Publish    │      │
│  │  Topics     │    │  (JKI JSON) │    │  Response   │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

## 一、MQTT 客户端实现

### 方案选择

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **LabVIEW MQTT Toolkit** | 原生VI，易使用 | 需购买或下载 | ⭐⭐⭐⭐⭐ |
| libmosquitto DLL | 性能好，免费 | 需要封装 | ⭐⭐⭐⭐ |
| .NET MQTT库 | 功能丰富 | 需要.NET支持 | ⭐⭐⭐ |

### 推荐使用 LabVIEW MQTT Toolkit

下载地址：
- NI官网: https://www.ni.com/
- LabVIEW工具网络: 通过 VI Package Manager (VIPM) 安装

### 连接配置

```
Broker地址: 192.168.1.100 (局域网IP)
端口: 1883 (TCP) 或 9001 (WebSocket)
ClientID: "LabVIEW_Server_{唯一ID}"
```

## 二、消息协议规范

### 主题定义

```
订阅主题:
├── labview/command/startCollect     # 开始采集
├── labview/command/stopCollect      # 停止采集
├── labview/command/setOutput        # 设置输出
├── labview/command/getDeviceStatus  # 获取设备状态
├── labview/command/getSystemInfo    # 获取系统信息
└── labview/command/#                # 通配符订阅所有命令

发布主题:
├── labview/response/{功能名}        # 响应结果
├── labview/status                   # 状态广播
└── labview/data/waveform            # 波形数据
```

### JSON 消息格式

#### 请求消息 (Web → LabVIEW)

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

#### 响应消息 (LabVIEW → Web)

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

#### 错误响应

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1699876543220,
  "action": "startCollect",
  "result": "error",
  "error": "设备未连接"
}
```

## 三、LabVIEW 程序结构

### 主VI架构 (Producer-Consumer 模式)

```
┌─────────────────────────────────────────────────────────────┐
│                        主VI 前面板                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              MQTT Connection State                   │   │
│  │  [Broker URL] [Port] [Connect] [Disconnect]          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Message Log (String Indicator)          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        主VI 程序框图                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  MQTT Init   │───►│  Subscribe   │───►│  Queue       │  │
│  │  & Connect   │    │  Topics      │    │  (Messages)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                │            │
│                                                ▼            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Function    │◄───│  JSON        │◄───│  Dequeue     │  │
│  │  Handler     │    │  Parser      │    │  Element     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │  JSON        │───►│  MQTT        │                      │
│  │  Builder     │    │  Publish     │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心VI列表

| VI名称 | 功能 | 输入 | 输出 |
|--------|------|------|------|
| `MQTT_Init.vi` | 初始化MQTT连接 | Broker URL, Port, ClientID | Connection Ref |
| `MQTT_Subscribe.vi` | 订阅主题 | Topic, QoS | Status |
| `MQTT_Publish.vi` | 发布消息 | Topic, Payload, QoS | Status |
| `JSON_Parse.vi` | 解析JSON消息 | JSON String | Cluster |
| `JSON_Build.vi` | 构建JSON消息 | Cluster | JSON String |
| `Message_Router.vi` | 消息路由 | Message Cluster | Handler VI Ref |
| `API_Handler_Template.vi` | API处理模板 | Params | Result Data |

## 四、功能API实现示例

### 1. 数据采集 API

```
API: startCollect
输入参数:
  - channels: 数组 (通道列表)
  - sampleRate: 数值 (采样率 Hz)
  - duration: 数值 (采集时长 秒)

输出:
  - taskId: 字符串 (任务ID)
```

**LabVIEW 实现步骤:**

1. 解析参数获取通道、采样率、时长
2. 配置DAQ设备 (NI-DAQmx 或 其他采集卡)
3. 创建采集任务，生成唯一taskId
4. 启动后台采集线程
5. 返回 taskId 给调用方

### 2. 模拟输出 API

```
API: setOutput
输入参数:
  - channel: 数值 (通道号)
  - value: 数值 (输出值)

输出:
  - success: 布尔
```

### 3. 系统状态 API

```
API: getSystemInfo
输入参数: 无

输出:
  - cpuUsage: 数值 (CPU使用率 %)
  - memoryUsage: 数值 (内存使用率 %)
  - temperature: 数值 (CPU温度 °C)
  - uptime: 数值 (运行时间 秒)
```

**获取系统信息方法:**
- CPU/内存: 调用 System Exec 执行 `wmic` 命令 或 使用 .NET 调用
- 温度: 调用 Open Hardware Monitor DLL 或 NI 系统监控VI

## 五、状态广播实现

### 定时广播 (每秒)

```
┌───────────────────┐
│  Timed Loop       │
│  (Period: 1000ms) │
├───────────────────┤
│  1. 采集系统状态   │
│  2. 构建JSON      │
│  3. 发布到        │
│     labview/status│
└───────────────────┘
```

### 数据推送 (采集时)

```
┌───────────────────┐
│  DAQ Callback     │
│  (数据就绪时)      │
├───────────────────┤
│  1. 读取采集数据   │
│  2. 构建JSON      │
│  3. 发布到        │
│     labview/data/ │
│     waveform      │
└───────────────────┘
```

## 五、广播消息格式

### 1. 状态广播 (labview/status)

LabVIEW 定期（建议每秒）发布系统状态到 `labview/status` 主题。

**消息格式：**

```json
{
  "timestamp": 1699876543000,
  "data": {
    "cpuUsage": 45.2,
    "memoryUsage": 62.8,
    "temperature": 55.5,
    "uptime": 3600
  }
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `timestamp` | number | 消息发送时间戳（毫秒） |
| `data.cpuUsage` | number | CPU 使用率 (0-100%) |
| `data.memoryUsage` | number | 内存使用率 (0-100%) |
| `data.temperature` | number | CPU 温度 (°C) |
| `data.uptime` | number | 系统运行时间（秒） |

**LabVIEW 实现示例：**

```
┌─────────────────────────────────────────────┐
│  Timed Loop (1000ms)                        │
├─────────────────────────────────────────────┤
│  1. 获取CPU使用率 (System Exec: wmic)       │
│  2. 获取内存使用率                          │
│  3. 获取温度 (可选)                         │
│  4. 计算运行时间                            │
│  5. 构建JSON Cluster                        │
│     - timestamp: Get Date/Time In Seconds   │
│     - data: SystemInfo Cluster              │
│  6. Flatten To JSON                         │
│  7. MQTT Publish                            │
│     Topic: "labview/status"                 │
│     QoS: 0                                  │
└─────────────────────────────────────────────┘
```

### 2. 数据推送 (labview/data/{type})

LabVIEW 在数据采集过程中实时推送数据到 `labview/data/{type}` 主题。

**支持的类型：**
- `waveform` - 波形数据
- `spectrum` - 频谱数据
- `statistics` - 统计数据

**消息格式 (waveform 类型)：**

```json
{
  "timestamp": 1699876543210,
  "data": [0.5, 0.8, 1.2, 0.9, 0.3, -0.2, -0.7, -1.0, -0.6, 0.1]
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `timestamp` | number | 数据采样时间戳（毫秒） |
| `data` | array | 采样数据数组（数值数组） |

**LabVIEW 实现示例：**

```
┌─────────────────────────────────────────────┐
│  DAQmx Read (Analog 1D DBL NChan NSamp)     │
├─────────────────────────────────────────────┤
│  1. 读取采集数据 (二维数组)                  │
│  2. 转置数组 (通道 × 采样点 → 采样点 × 通道) │
│  3. 选择指定通道数据                         │
│  4. 构建JSON Cluster                        │
│     - timestamp: Get Date/Time In Seconds   │
│     - data: 数据数组 (1D DBL Array)         │
│  5. Flatten To JSON                         │
│  6. MQTT Publish                            │
│     Topic: "labview/data/waveform"          │
│     QoS: 0                                  │
└─────────────────────────────────────────────┘
```

**消息格式 (statistics 类型)：**

```json
{
  "timestamp": 1699876543210,
  "data": {
    "channel": 1,
    "min": -1.25,
    "max": 1.18,
    "mean": 0.05,
    "rms": 0.72,
    "sampleCount": 1000
  }
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `timestamp` | number | 统计计算时间戳（毫秒） |
| `data.channel` | number | 通道号 |
| `data.min` | number | 最小值 |
| `data.max` | number | 最大值 |
| `data.mean` | number | 平均值 |
| `data.rms` | number | 均方根值 |
| `data.sampleCount` | number | 样本数量 |

**LabVIEW 实现示例：**

```
┌─────────────────────────────────────────────┐
│  统计计算 (每N个采样点或每秒)                │
├─────────────────────────────────────────────┤
│  1. 获取最近N个采样点                        │
│  2. 计算统计值                               │
│     - Array Max & Min                       │
│     - Mean (Array Mean)                     │
│     - RMS (Array RMS)                       │
│  3. 构建JSON Cluster                        │
│     - timestamp                             │
│     - data: Statistics Cluster              │
│  4. Flatten To JSON                         │
│  5. MQTT Publish                            │
│     Topic: "labview/data/statistics"        │
│     QoS: 0                                  │
└─────────────────────────────────────────────┘
```

### 3. 广播消息通用说明

**QoS 建议：**
- 状态广播和数据推送使用 **QoS 0**（最多一次）
- 减少网络开销，允许偶尔丢失

**发布频率：**
- `labview/status`: 每秒 1 次
- `labview/data/waveform`: 根据采样率，建议每 100-500ms 推送一次（批量数据）
- `labview/data/statistics`: 每秒 1 次或每 N 个采样点计算一次

**数据压缩（可选）：**
当数据量较大时，可以考虑：
1. 使用二进制格式 + Base64 编码
2. 数据压缩（gzip）
3. 差分编码（只发送变化量）

## 六、错误处理

### 错误码定义

| 错误码 | 含义 | 处理建议 |
|--------|------|----------|
| 1001 | 设备未连接 | 检查硬件连接 |
| 1002 | 参数无效 | 检查参数范围 |
| 1003 | 任务已存在 | 先停止现有任务 |
| 2001 | MQTT连接失败 | 检查网络和Broker |
| 2002 | 发布失败 | 重试或重连 |

### 错误响应格式

```json
{
  "id": "请求ID",
  "timestamp": 时间戳,
  "action": "功能名",
  "result": "error",
  "error": "错误描述",
  "errorCode": 1001
}
```

## 七、部署配置

### Mosquitto Broker 配置 (mosquitto.conf)

```conf
# 基础配置
listener 1883
allow_anonymous true

# WebSocket 支持 (Web前端需要)
listener 9001
protocol websockets

# 日志配置
log_dest file /var/log/mosquitto/mosquitto.log
log_type all
```

### 启动 Mosquitto

```bash
# Windows
mosquitto -c mosquitto.conf

# Linux
sudo systemctl start mosquitto
```

### LabVIEW 运行配置

1. 将主VI编译为可执行文件或服务
2. 设置开机自启动
3. 配置防火墙允许 MQTT 端口通信

## 八、调试技巧

### 1. 使用 MQTT 客户端工具测试

推荐工具:
- **MQTTX** (跨平台GUI客户端)
- **MQTT.fx** (Java客户端)
- **mosquitto_pub/sub** (命令行工具)

测试命令:
```bash
# 订阅所有LabVIEW消息
mosquitto_sub -h 192.168.1.100 -t "labview/#" -v

# 发送测试命令
mosquitto_pub -h 192.168.1.100 -t "labview/command/getSystemInfo" \
  -m '{"id":"test001","action":"getSystemInfo","timestamp":1234567890}'
```

### 2. LabVIEW 调试面板

在主VI前面板添加:
- 消息日志显示 (String Indicator)
- 连接状态指示灯
- 发送/接收计数器
- 错误列表

## 九、性能优化建议

1. **消息队列**: 使用 Producer-Consumer 模式，避免阻塞
2. **JSON处理**: 使用 JKI JSON 库，性能较好
3. **数据压缩**: 大数据量时考虑压缩后传输
4. **QoS级别**: 命令用 QoS 1，状态广播用 QoS 0
5. **连接复用**: 保持MQTT长连接，避免频繁重连

## 十、安全建议

1. **认证**: 启用 MQTT 用户名/密码认证
2. **TLS**: 生产环境启用 TLS 加密
3. **ACL**: 配置主题访问控制列表
4. **输入验证**: 验证所有来自Web的参数
5. **速率限制**: 防止API被滥用

---

## 附录: 参考资源

- [LabVIEW MQTT Toolkit 文档](https://www.ni.com/)
- [MQTT 协议规范](https://mqtt.org/)
- [Mosquitto 文档](https://mosquitto.org/documentation/)
- [JKI JSON for LabVIEW](https://github.com/JKISoftware/JKI-JSON-Serialization)
