# 行程JSON数据结构说明

## 概述
本文档描述了行程数据在系统中的JSON结构格式，用于确保前后端数据格式的一致性。

## 行程数据结构

### 完整的行程对象结构
```json
{
  "title": "行程标题",
  "description": "行程描述",
  "startDate": "2024-07-01T00:00:00.000",
  "endDate": "2024-07-03T00:00:00.000",
  "budget": 3000,
  "participants": 2,
  "preferences": {
    "food": ["日料", "寿司"],
    "activities": ["观光", "购物"],
    "accommodation": "商务酒店"
  },
  "activities": [
    {
      "title": "活动标题",
      "description": "活动详细描述",
      "location": "具体地点",
      "city": "城市名称",
      "countryCode": "国家代码",
      "startTime": "2024-07-01T10:00:00.000",
      "endTime": "2024-07-01T13:00:00.000",
      "estimatedCost": 200,
      "notes": "备注信息"
    }
  ]
}
```

## 字段详细说明

### 根级别字段
| 字段名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| `title` | string | 是 | 行程标题 | "大阪悠闲三日游" |
| `description` | string | 否 | 行程描述 | "适合两人、预算约3000元的大阪轻松行程" |
| `startDate` | string | 是 | 开始日期 | "2024-07-01T00:00:00.000" |
| `endDate` | string | 是 | 结束日期 | "2024-07-03T00:00:00.000" |
| `budget` | number | 否 | 预算金额 | 3000 |
| `participants` | number | 否 | 出行人数 | 2 |
| `preferences` | object | 否 | 用户偏好设置 | 见偏好设置结构 |
| `activities` | array | 否 | 活动安排列表 | 见活动结构 |

### 偏好设置结构 (preferences)
| 字段名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| `food` | array | 否 | 饮食偏好 | ["日料", "寿司", "拉面"] |
| `activities` | array | 否 | 活动偏好 | ["观光", "购物", "美食"] |
| `accommodation` | string | 否 | 住宿偏好 | "商务酒店" |

### 活动结构 (activities)
| 字段名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| `title` | string | 是 | 活动标题 | "道顿堀游览" |
| `description` | string | 否 | 活动详细描述 | "从关西机场乘坐南海电铁前往市区..." |
| `location` | string | 否 | 具体地点 | "道顿堀" |
| `city` | string | 否 | 所在城市 | "大阪" |
| `countryCode` | string | 否 | 国家代码 | "JP" |
| `startTime` | string | 否 | 开始时间 | "2024-07-01T10:00:00.000" |
| `endTime` | string | 否 | 结束时间 | "2024-07-01T13:00:00.000" |
| `estimatedCost` | number | 否 | 预估费用 | 200 |
| `notes` | string | 否 | 备注信息 | "交通" |

## 数据类型说明

### 日期时间格式
- 使用ISO 8601格式：`YYYY-MM-DDTHH:mm:ss.sss`
- 示例：`"2024-07-01T10:00:00.000"`

### 国家代码
- 使用ISO 3166-1 alpha-2标准
- 示例：`"CN"` (中国), `"JP"` (日本), `"US"` (美国)

### 货币单位
- 默认使用人民币 (CNY)
- 金额单位为元

## 数据验证规则

1. **必填字段**：`title`, `startDate`, `endDate` 必须提供
2. **日期验证**：`endDate` 必须晚于或等于 `startDate`
3. **数值验证**：`budget`, `participants`, `estimatedCost` 必须为非负数
4. **数组验证**：`food`, `activities` 数组中的元素必须为字符串

## 示例数据

### 完整示例
```json
{
  "title": "大阪悠闲三日游",
  "description": "适合两人、预算约3000元的大阪轻松行程",
  "startDate": "2024-07-01T00:00:00.000",
  "endDate": "2024-07-03T00:00:00.000",
  "budget": 3000,
  "participants": 2,
  "preferences": {
    "food": ["日料", "寿司"],
    "activities": ["观光", "购物"],
    "accommodation": "商务酒店"
  },
  "activities": [
    {
      "title": "抵达大阪，游览道顿堀",
      "description": "从关西机场乘坐南海电铁前往市区，入住酒店后前往道顿堀品尝大阪美食",
      "location": "道顿堀",
      "city": "大阪",
      "countryCode": "JP",
      "startTime": "2024-07-01T10:00:00.000",
      "endTime": "2024-07-01T13:00:00.000",
      "estimatedCost": 200,
      "notes": "交通"
    }
  ]
}
```

### 最小示例
```json
{
  "title": "测试行程",
  "startDate": "2024-07-01T00:00:00.000",
  "endDate": "2024-07-01T00:00:00.000"
}
```

## 注意事项

1. 所有字符串字段都支持中文字符
2. 日期时间使用UTC时间格式
3. 空值使用 `null` 表示
4. 数组字段为空时使用空数组 `[]`
5. 对象字段为空时使用空对象 `{}`