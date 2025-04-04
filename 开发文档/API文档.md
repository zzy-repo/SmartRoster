# SmartRoster 接口文档

## 认证模块

### 用户登录
- **路径**: /api/auth/login
- **方法**: POST
- 请求参数：
```json
{
  "username": "string",
  "password": "string"
}
```
- 响应示例：
```json
{
  "token": "JWT_TOKEN",
  "userInfo": {
    "userId": 1,
    "username": "admin"
  }
}
```

## 门店管理模块

### 获取门店列表
- **路径**: /api/stores
- **方法**: GET
- 响应结构：
```ts
interface Store {
  id: number;
  name: string;
  address: string;
  businessHours: string;
}
```

## 员工管理模块

### 创建员工
- **路径**: /api/employees
- **方法**: POST
- 请求体：
```json
{
  "name": "张三",
  "position": "店员",
  "storeId": 1,
  "availability": ["MON", "WED"]
}
```

## 排班规则模块

### 设置规则
- **路径**: /api/rules/{storeId}
- **方法**: PUT
- 参数示例：
```json
{
  "minStaff": 3,
  "maxHours": 8,
  "shiftTypes": ["早班", "晚班"]
}
```

## 通用响应格式
```ts
interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}
```

## 错误代码表
| 代码 | 说明         |
|------|------------|
| 401  | 未授权访问    |
| 404  | 资源不存在    |
| 500  | 服务器内部错误 |