# AIDeutsch 前端（Vue3 + TS + Vite）

## 本地运行

- 安装依赖：`npm install`
- 启动开发：`npm run dev`
- 构建：`npm run build`
- 运行测试：`npm test`

## 环境变量

- `VITE_API_BASE_URL`：后端 API 基地址
  - 未设置时默认走服务器同域 Nginx 代理前缀：`/api`
  - 服务器 Nginx 可将 `/api/*` 转发到后端并去掉 `/api` 前缀
  - 本地直连后端时可在 `.env.local` 中设置，例如：`VITE_API_BASE_URL=http://127.0.0.1:8000`
  - 请求默认使用 bearer token，不跨域携带 cookie

## 已接入接口清单

### 认证
- `POST auth/login`：登录（保存 session 到 localStorage）
- `POST auth/logout`：登出（无论成功与否都会清理本地 session）
- `GET auth/institute/all`、`GET auth/institute/search`：学校列表与搜索

### 学生端
- `GET student/basic_information`：学生班级上下文
- `GET student/tasks`：任务/作业列表（任务页左侧）
- `GET student/task?task_id=...`：任务记录列表（任务页右侧）
- `GET student/session?session_id=...`：session 逐句明细
- `GET student/archive/statistics`：学生档案统计
- `GET student/history/words`：历史单词集合
- `POST student/pron-test/create_session`、`POST student/pron-test/analyze`、`POST student/pron-test/submit_session`：学生朗读评测流程

### 教师端
- `GET teacher/basic_information`：教师概览统计
- `GET teacher/classes`：教师班级列表（内容管理页班级下拉）
- `GET teacher/tasks`：教师创建的任务列表
- `POST teacher/class/tasks`：班级任务完成概览
- `POST teacher/task/save`：创建/更新作业
- `POST teacher/task/auto_segment`：创建作业时的智能分句
- `POST teacher/task/records`：作业提交列表
- `POST teacher/get_session`：教师查看学生 session 逐句明细
- `POST teacher/comment`：教师批改评语

## 临时占位页面清单

这些页面已接好路由与导航，可编译、可点击跳转，但未依赖真实数据：
- 学生端：`/profile`、`/about`
- 评测流程：`/evaluate/recording`、`/evaluate/result`

## TODO 位置（后续接入点）

项目中已用 `TODO:` 标记后续需要接入的接口与数据格式，常见位置：
- 评测录音流程 UI：[HomeRightColumn.vue](src/views/home/HomeRightColumn.vue)
- 结果页展示：[ResultView.vue](src/views/placeholders/ResultView.vue)
- 课程章节（单元学习）占位：[TaskSidebar.vue](src/views/tasks/TaskSidebar.vue)
