# AIDeutsch 前端（Vue3 + TS + Vite）

## 本地运行

- 安装依赖：`npm install`
- 启动开发：`npm run dev`
- 构建：`npm run build`
- 运行测试：`npm test`

## 环境变量

- `VITE_API_BASE_URL`：后端 API 基地址（例如 `http://localhost:5000`）
  - 未设置时默认走同源相对路径（`/auth/login` 等）
  - 请求默认携带 `credentials: include` 以支持 cookie session

## 已接入接口清单

### 认证
- `POST auth/login`：登录（保存 session 到 localStorage）
- `GET auth/logout`：登出（无论成功与否都会清理本地 session）

### 学生端
- `GET student/custom_content`：任务/作业列表（任务页左侧）
- `GET student/custom_content/<content_id>`：任务记录列表（任务页右侧）

### 教师端
- `GET teacher/dashboard`：教师概览
- `GET teacher//api/classes`：教师班级列表（内容管理页班级下拉）
- `GET teacher/class/<class_id>/content`：班级作业列表（内容管理页）
- `POST teacher/api/content/validate`：创建作业时的文本校验
- `POST teacher/api/content/segment`：创建作业时的智能分句（提取 suggested_phonemes）
- `GET teacher/custom_content/<content_id>/custom_content_detail`：作业提交列表
- `POST teacher/class/<class_id>/content`：创建作业（使用 FormData 提交）

## 临时占位页面清单

这些页面已接好路由与导航，可编译、可点击跳转，但未依赖真实数据：
- 学生端：`/history`、`/archive`、`/profile`、`/about`
- 评测流程：`/evaluate/recording`、`/evaluate/result`
- 教师端：`/teacher/grading`（仅保留结构与导航）

## TODO 位置（后续接入点）

项目中已用 `TODO:` 标记后续需要接入的接口与数据格式，常见位置：
- 学生记录详情与薄弱点：[TaskView.vue](file:///e:/front_build/src/views/TaskView.vue)
- 学生历史/档案占位页：[placeholders](file:///e:/front_build/src/views/placeholders)
- 评测提交流程（create_session/process_sentence/submit）：[HomeRightColumn.vue](file:///e:/front_build/src/views/home/HomeRightColumn.vue)
- 课程章节（单元学习）占位：[TaskSidebar.vue](file:///e:/front_build/src/views/tasks/TaskSidebar.vue)
- 教师批改提交接口缺失提示：[PracticeGradingView.vue](file:///e:/front_build/src/views/teacher/PracticeGradingView.vue)
