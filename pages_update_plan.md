# 页面更新实现计划

## 目录
1. [Figma 设计稿页面索引](#1-figma-设计稿页面索引)
2. [现有路由与页面状态](#2-现有路由与页面状态)
3. [API 接口映射](#3-api-接口映射)
4. [更新任务清单（按优先级）](#4-更新任务清单按优先级)
5. [详细实现说明](#5-详细实现说明)
6. [项目结构变更](#6-项目结构变更)

---

## 1. Figma 设计稿页面索引

**Figma 文件：** [jVpXW4ocCgj2PcUqXpXGau](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled)

### 教师端页面（已有实现，按 Figma 一比一落地）

| Figma 节点 | 页面名称 | Figma 链接 | 当前路由 | 当前状态 |
|-----------|---------|------------|---------|---------|
| 344:853 | 概况 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=344-853) | `/teacher/overview` | ✅ 已实现 |
| 392:1534 | 内容管理 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=392-1534) | `/teacher/content` | ✅ 已实现 |
| 525:1248 | 创建作业 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=525-1248) | `/teacher/assignments/create` | ✅ 已实现 |
| 604:1637 | 练习管理 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=604-1637) | 暂无独立路由（从内容管理跳转） | ✅ 已实现为卡片页 |
| 650:860 | 练习提交 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=650-860) | `/teacher/submissions` | ✅ 已实现 |
| 687:1699 | 批改 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=687-1699) | `/teacher/grading` | ✅ 已实现 |

### 教师端新增页面（Figma 已更新，需新实现）

| Figma 节点 | 页面名称 | Figma 链接 | 建议路由 | 当前状态 |
|-----------|---------|------------|---------|---------|
| 859:1896 | 班级管理 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=859-1896) | `/teacher/classes` | ❌ 未实现 |
| 860:2154 | 班级组织 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=860-2154) | `/teacher/classes/:classId/organize` | ❌ 未实现 |
| 873:3390 | 学生表现 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=873-3390) | `/teacher/classes/:classId/student/:userId` | ❌ 未实现 |

### 学生端页面（需更新/新实现）

| Figma 节点 | 页面名称 | Figma 链接 | 当前路由 | 当前状态 |
|-----------|---------|------------|---------|---------|
| 843:1610 | 个人中心 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=843-1610) | `/profile` | 🔄 占位页待替换 |
| 866:2592 | 学习分析 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=866-2592) | `/history` | 🔄 占位页待替换 |
| 873:2953 | 薄弱分析 | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=873-2953) | `/evaluate/result` | 🔄 占位页待替换 |

### 全局组件

| Figma 节点 | 组件名称 | Figma 链接 | 当前状态 |
|-----------|---------|------------|---------|
| 607:1857 | 缺省页（空态组件） | [link](https://www.figma.com/design/jVpXW4ocCgj2PcUqXpXGau/Untitled?node-id=607-1857) | ❌ 未实现 |

---

## 2. 现有路由与页面状态

### 22 路由一览（Current）

| 路由路径 | 页面组件 | 当前实现状态 | 需更新 |
|---------|---------|------------|-------|
| `/login` | `LoginView.vue` | ✅ 登录表单 | 否 |
| `/` | `HomeView.vue` | ✅ 学生主页（已对接API） | 否 |
| `/tasks` | `TaskView.vue` | ✅ 任务列表（已对接API） | 否 |
| `/tasks/:taskId/test` | `RecordingView.vue` | ✅ 录音评测（已完整实现） | 否 |
| `/history` | `StudentHistoryView.vue` | 🔄 骨架屏占位 → **替换为 学习分析** | **是** |
| `/archive` | `StudentArchiveView.vue` | ✅ 已对接 archive statistics API | 否 |
| `/profile` | `ProfileView.vue` | 🔄 已对接API有点击 → **替换为 个人中心** | **是** |
| `/about` | `AboutView.vue` | ✅ 静态产品页 | 否 |
| `/evaluate/recording` | `RecordingView.vue` | ✅ 复用录音组件 | 否 |
| `/evaluate/result` | `ResultView.vue` | 🔄 骨架屏占位 → **替换为 薄弱分析** | **是** |
| `/teacher/overview` | `TeacherOverviewView.vue` | ✅ 已实现 | 否 |
| `/teacher/content` | `PracticeManagementView.vue` | ✅ 已实现 | 否 |
| `/teacher/assignments/create` | `CreateAssignmentView.vue` | ✅ 已实现 | 否 |
| `/teacher/submissions` | `PracticeSubmissionsView.vue` | ✅ 已实现 | 否 |
| `/teacher/grading` | `PracticeGradingView.vue` | ✅ 已实现 | 否 |

---

## 3. API 接口映射

### 需新增 endpoint

| 接口路径 | 方法 | 用途 | 对应页面 | 状态 |
|---------|------|------|---------|------|
| `student/history/words` | GET | 获取评测单词列表 | 个人中心(单词历史区) | ✅ 已有 |
| `student/history/phonemes` | GET | 获取评测音素列表 | 学习分析(音素区) | ✅ 已有 |
| `student/history/word/<word>` | GET | 获取单词历史评分 | 学习分析(单词详情) | ❌ 需要封装 |
| `student/history/phoneme/<phoneme>` | GET | 获取音素历史评分 | 学习分析(音素详情) | ❌ 需要封装 |
| `student/history/ranking` | GET | 获取排名/最好最差 | 学习分析(强弱对比) | ❌ 需要封装 |
| `student/custom_content/detail/<session_id>` | GET | 获取条目句子详情 | 薄弱分析(句子详情) | ❌ 需要封装 |
| `student/custom_content/problem_areas/<session_id>` | GET | 获取问题区域 | 薄弱分析(弱项展示) | ❌ 需要封装 |
| `teacher/classes` | GET | 获取教师所有班级 | 班级管理 | ✅ 已有 |
| `teacher/class/<class_id>/manage` | GET | 获取班级详情与成员 | 班级组织 | ❌ 需要封装 |
| `teacher/class/<class_id>/add_student` | POST | 添加学生到班级 | 班级组织 | ❌ 需要封装 |
| `teacher/class/<class_id>/remove_student` | POST | 移除学生 | 班级组织 | ❌ 需要封装 |
| `teacher/class/<class_id>/student/<user_id>/analysis` | GET | 学生分析数据 | 学生表现 | ❌ 需要封装 |
| `teacher/api/student/<user_id>/progress` | GET | 学生进度数据 | 学生表现 | ❌ 需要封装 |

### 已有 endpoint（无需新增）

| 接口路径 | 对应页面 |
|---------|---------|
| `auth/users/user_detail` | 个人中心(用户资料) |
| `student/archive/statistics` | 个人中心(统计概览) |
| `student/custom_content` | 学生主页 |
| `student/tasks` | 任务列表 |
| `student/task_detail` | 录音评测 |
| `student/test/create_session` | 录音评测 |
| `student/pron-test/analyze` | 录音评测 |
| `student/test/submit_session` | 录音评测 |
| `teacher/basic_information` | 教师概况 |
| `teacher/tasks` | 内容管理 |
| `teacher/task/save` | 创建作业 |
| `teacher/task/delete` | 内容管理 |
| `teacher/task/records` | 练习提交 |
| `teacher/get_session` | 批改 |
| `teacher/comment` | 批改 |

---

## 4. 更新任务清单（按优先级）

### P0 — 核心替换（需立即实现）

| # | 任务 | 替换页面 | Figma | API | 使用场景 |
|---|------|---------|-------|-----|---------|
| 1 | **薄弱分析页** | `ResultView.vue` → 重写 | 873:2953 | `problem_areas`, `detail` | 录音评测后的结果展示 |
| 2 | **缺省空态组件** | 新建全局组件 | 607:1857 | — | 全软件数据为空时展示 |

### P1 — 学生端页面升级

| # | 任务 | 替换页面 | Figma | API | 使用场景 |
|---|------|---------|-------|-----|---------|
| 3 | **个人中心** | `ProfileView.vue` → 重写 | 843:1610 | `user_detail`, `archive/statistics`, `history/words` | 学生查看个人资料与统计 |
| 4 | **学习分析** | `StudentHistoryView.vue` → 重写 | 866:2592 | `history/words`, `history/phonemes`, `history/ranking` | 学生查看强弱分析 |

### P2 — 教师端新页面

| # | 任务 | 新建页面 | Figma | API | 使用场景 |
|---|------|---------|-------|-----|---------|
| 5 | **班级管理** | 新建 | 859:1896 | `teacher/classes` | 教师查看所有班级列表 |
| 6 | **班级组织** | 新建 | 860:2154 | `class/manage`, `add_student`, `remove_student` | 教师查看/管理班级成员 |
| 7 | **学生表现** | 新建 | 873:3390 | `student/analysis`, `student/progress` | 教师查看单个学生详细表现 |

---

## 5. 详细实现说明

### 5.1 P0-1: 薄弱分析页 (`/evaluate/result`)

- **Figma：** 873:2953 — 包含：header + 总体分数面板 + 逐句评分列表 + 薄弱点汇总
- **API 依赖：**
  - `student/custom_content/detail/<session_id>` — 逐句评分详情（pronunciation/rhythm/fluency/completeness/total_score）
  - `student/custom_content/problem_areas/<session_id>` — 薄弱点（weak_phonemes/difficult_words/problematic_sentences）
- **设计要点：**
  - 顶部展示总分和提交时间
  - 左侧/上半：薄弱单词/音素/句子卡片
  - 右侧/下半：逐句详表（发音/节奏/流畅/完整度雷达或横向条）
- **类型定义：** 在 `endpoints.ts` 中新增 `getSessionDetail()` 和 `getProblemAreas()` 函数
- **路由复用：** `/evaluate/result?session_id=xxx` 查询参数传 session_id

### 5.2 P0-2: 缺省空态组件 (`components/EmptyState.vue`)

- **Figma：** 607:1857 — 插画 + 主标题 + 副标题 + 操作按钮
- **Props 设计：**
  ```ts
  type EmptyStateProps = {
    icon?: string       // 图标名称或插画
    title: string       // 主标题
    description: string // 副标题
    actionLabel?: string // 按钮文字
    actionLink?: string  // 跳转路由
  }
  ```
- **复用范围：** 所有列表为空时的页面都使用此组件

### 5.3 P1-3: 个人中心 (`/profile`)

- **Figma：** 843:1610 — TopAppBar + 用户头像/信息 + 统计数据 + 班级卡片
- **API 依赖：**
  - `auth/users/user_detail` — 用户名、学号、班级、学校等（✅ 已有）
  - `student/archive/statistics` — 完成条目、平均分、最高分（✅ 已有）
  - `student/history/words` — 历史单词（✅ 已有）
- **设计要点：**
  - 顶部导航栏显示"个人中心"
  - 用户资料卡片：头像、姓名、学号、班级
  - 统计卡片：完成条目、平均分、最高分
  - 下方班级列表
- **当前 ProfileView.vue 已对接这些 API，需按 Figma 布局重写 UI**

### 5.4 P1-4: 学习分析 (`/history`)

- **Figma：** 866:2592 — breadcrumbs + 得分趋势图表 + 强弱对比卡片 + 音素/单词列表
- **API 依赖：**
  - `student/history/words` — 已评单词列表（✅ 已有）
  - `student/history/phonemes` — 已评音素列表（需新增 endpoint）
  - `student/history/ranking` — 最高/最低得分单词和音素（需新增 endpoint）
  - `student/history/word/<word>` — 单词历史评分（需新增 endpoint）
  - `student/history/phoneme/<phoneme>` — 音素历史评分（需新增 endpoint）
- **设计要点：**
  - 导航：breadcrumbs "学习分析"
  - 左侧/上方：得分趋势图（可选时间范围）
  - 右侧/下方：最强 / 最弱单词 & 音素卡片
  - 底部：全部历史单词/音素列表，点击可查看详情

### 5.5 P2-5: 班级管理 (`/teacher/classes`)

- **Figma：** 859:1896 — 表格列表 + 创建班级按钮
- **API 依赖：**
  - `teacher/classes` — 班级列表（✅ 已有）
  - `teacher/create_class` — 创建班级（需新增 endpoint）
- **设计要点：**
  - 顶部：标题 + 创建班级按钮
  - 表格列：班级名称、学生数、作业数、创建时间、操作
  - 操作包括：管理成员（跳转班级组织）、查看分析

### 5.6 P2-6: 班级组织 (`/teacher/classes/:classId/organize`)

- **Figma：** 860:2154 — breadcrumbs + 成员列表 + 添加/移除学生
- **API 依赖：**
  - `teacher/class/<class_id>/manage` — 班级信息+成员列表（需新增 endpoint）
  - `teacher/class/<class_id>/add_student` — 添加学生（需新增 endpoint）
  - `teacher/class/<class_id>/remove_student` — 移除学生（需新增 endpoint）
- **设计要点：**
  - breadcrumbs：班级管理 > 班级名称
  - 成员表格：用户名、用户类型、加入时间、操作(移除)
  - 顶部搜索框 + 添加学生按钮

### 5.7 P2-7: 学生表现 (`/teacher/classes/:classId/student/:userId`)

- **Figma：** 873:3390 — breadcrumbs + tabs + 统计卡片 + 进度图表 + 薄弱区域
- **API 依赖：**
  - `teacher/class/<class_id>/student/<user_id>/analysis` — 学生分析总览（需新增 endpoint）
  - `teacher/api/student/<user_id>/progress` — 学生进度数据（需新增 endpoint）
- **设计要点：**
  - breadcrumbs：班级管理 > 学生表现 > 学生姓名
  - Tab 切换：总览 / 发音 / 节奏 / 流畅 / 完整
  - 统计卡片：评测次数、首次/最后评测时间
  - 各维度得分趋势图
  - 薄弱区域卡片：薄弱音素、困难单词

---

## 6. 项目结构变更

### 6.1 新增文件

```
src/
├── api/
│   ├── endpoints.ts                    # 新增函数（见第3节接口映射）
│   └── __tests__/endpoints.test.ts     # 新增接口测试
├── components/
│   └── EmptyState.vue                  # [NEW] 缺省页空态组件 (607:1857)
├── views/
│   ├── student/
│   │   ├── ProfileView.vue             # [NEW] 个人中心 (843:1610)
│   │   ├── AnalysisView.vue            # [NEW] 学习分析 (866:2592)
│   │   └── WeaknessResultView.vue      # [NEW] 薄弱分析 (873:2953)
│   ├── teacher/
│   │   ├── ClassManagementView.vue     # [NEW] 班级管理 (859:1896)
│   │   ├── ClassOrganizationView.vue   # [NEW] 班级组织 (860:2154)
│   │   └── StudentPerformanceView.vue  # [NEW] 学生表现 (873:3390)
│   └── placeholders/                   # 删除或保留为临时引用
│       ├── ResultView.vue              # → 删除，替换为 WeaknessResultView
│       ├── StudentHistoryView.vue      # → 删除，替换为 AnalysisView
│       ├── ProfileView.vue             # → 删除，替换为 StudentProfileView
│       └── (保留 RecordingView/AboutView/StudentArchiveView)
└── router/
    └── index.ts                        # 新增 5 条路由
```

### 6.2 路由变更

```typescript
// 新增路由
{ path: '/student/profile',        name: 'student-profile',     component: () => import('../views/student/ProfileView.vue') }
{ path: '/student/analysis',       name: 'student-analysis',    component: () => import('../views/student/AnalysisView.vue') }
{ path: '/student/weakness',       name: 'student-weakness',    component: () => import('../views/student/WeaknessResultView.vue') }
{ path: '/teacher/classes',        name: 'teacher-classes',     component: () => import('../views/teacher/ClassManagementView.vue') }
{ path: '/teacher/classes/:classId/organize', name: 'teacher-class-organize', component: () => import('../views/teacher/ClassOrganizationView.vue') }
{ path: '/teacher/classes/:classId/student/:userId', name: 'teacher-student-performance', component: () => import('../views/teacher/StudentPerformanceView.vue') }

// 路由替换
/profile  → 重定向到 /student/profile  或 直接替换 component
/history  → 重定向到 /student/analysis  或 直接替换 component
/evaluate/result  → 重定向到 /student/weakness  或 直接替换 component
```

### 6.3 删除旧占位文件

```
src/views/placeholders/ResultView.vue              # 删除
src/views/placeholders/StudentHistoryView.vue      # 删除
src/views/placeholders/ProfileView.vue             # 删除
```

---

## 7. 执行顺序

```
Week 1 (P0):
  Day 1-2:  EmptyState.vue 组件 + 全局复用
  Day 3-5:  WeaknessResultView.vue (薄弱分析) + API封装

Week 2 (P1):
  Day 1-3:  ProfileView.vue (个人中心) + API对接
  Day 4-5:  AnalysisView.vue (学习分析) + API封装

Week 3 (P2):
  Day 1-2:  ClassManagementView.vue (班级管理) + API封装
  Day 3-4:  ClassOrganizationView.vue (班级组织) + API封装
  Day 5:    StudentPerformanceView.vue (学生表现) + API封装
```
