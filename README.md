# xxsy-admin-frontend

基于 Vue 3 + Naive UI 的游戏后台管理系统前端。

## 技术栈

- **框架**: Vue 3 + TypeScript
- **构建**: Vite 6
- **UI 库**: Naive UI 2
- **状态管理**: Pinia 2
- **路由**: Vue Router 4（Hash 模式）

## 快速开始

```bash
pnpm install                  # 安装依赖
cp .env.example .env.development  # 配置开发环境变量
pnpm dev                      # 启动开发服务器 (localhost:5173)
```

## 功能模块

| 模块 | 路由 | 说明 |
|---|---|---|
| 仪表盘 | `/dashboard` | 用户数/角色数/今日操作统计 |
| 用户管理 | `/users` | 用户 CRUD + 启停 + 角色分配 |
| 角色管理 | `/roles` | 角色 CRUD + 权限分配 |
| 排行榜管理 | `/ranks` | 游戏角色战力排行 + AI 图片识别 |
| 门派排行 | `/schools` | 游戏门派排行数据 + AI 图片识别 |
| 捉宠管理 | `/pets` | 捉宠地图/宠物位置数据 CRUD，图片存阿里云 OSS |
| 区服管理 | `/game-servers` | 区服数据字典 |
| 职业管理 | `/professions` | 职业数据字典 |
| 操作日志 | `/audit-logs` | 系统操作日志审计 |
| 个人设置 | `/profile` | 修改密码 |

## 开发命令

```bash
pnpm dev       # 启动开发服务器
pnpm build     # 生产构建
pnpm preview   # 预览生产构建
```

## Docker 部署

```bash
docker build -t xxsy-admin-frontend .
docker run -d -p 80:80 xxsy-admin-frontend
```

## 环境变量

| 变量 | 说明 |
|---|---|
| `VITE_API_BASE_URL` | API 基础地址，开发时 `/api`，生产环境 Nginx 反代 |
