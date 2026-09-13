# Changelog

本文件记录本项目的重要变更。

## [未发布] - 2026-09-13

### 修复

- **学生评测语种改为跟随「当前选中班级」**
  - 文件：`src/views/home/useHomeEvaluation.ts`
  - 原逻辑固定取 `getStudentBasicInformation().info[0]` 的语种，学生切换班级后仍使用第一个班级的语种。
  - 现改为从 `useAuth().session.class_context.class_id` 取当前选中班级，在 `info` 中按 `class_id` 匹配语种（匹配不到才回退 `info[0]`）。
  - 新增 `studentLanguageClassId` 记录「已加载语种所属班级」，实现切换班级后自动重新读取；读取失败时仍回退默认 `fr`。
  - 主页自由评测、单句评测、整段提交三处取语种入口（`loadStudentLanguage`）统一生效，未新增接口。

### 新增

- **教师批改作业页支持播放「该词的用户发音」**
  - 文件：`src/views/teacher/PracticeSubmissionsView.vue`
  - 「单词/音素评分」列表中，每个单词行右侧新增发音按钮（播放 / 停止 / 加载三态）。
  - 无独立词级接口，采用整句用户录音按该词的 `start_ms` / `duration_ms` 切片播放：
    取 `getTeacherEvaluationAudio(sentence.id)` → `audio.currentTime = start_ms / 1000` → 用 `requestAnimationFrame` 按音频时钟精确判停。
  - 无切片区间信息时提示「暂无发音区间信息」；播放整句录音前会先停止词级播放（`cleanupAudio` 中调用 `releaseWordAudio`）。

### 样式调整

- **档案页单词悬停浮层改版**
  - 文件：`src/views/student/ArchiveView.vue`
  - 背景由深色 `#1B254B` 改为浅色卡片（`bg-white/95` + `#E8ECF2` 边框 + `backdrop-blur-sm` + 柔和阴影），文字改为深色，错误标签改橙色，音素 chip 改浅色。
  - 卡片分两行：第一行「单词 + 右侧发音按钮」（按钮不单独占行）；第二行「单词得分 + 描述（errorType 标签）」。
  - 第二行中「单词得分 + 分数」靠左、`errorType` 标签（如 `Mispronunciation`）用 `ml-auto` 右对齐。
  - 去掉按钮上的「查看我的该词发音」文案，改为 `title` 悬浮提示。

- **档案页雷达图放大贴顶、与总分合并为同一视觉块**
  - 文件：`src/views/student/ArchiveView.vue`
  - 右侧雷达列宽度由 `w-[480px]` 收窄为 `w-[400px]`，左列 `flex-1 min-w-0` 因此获得更多横向空间，长句文本相应右移。
  - 雷达列改为 `self-stretch` + `items-start`（父级为 `items-center`），使右列撑满卡片高度、雷达图贴卡片顶部。
  - 雷达图 SVG 尺寸由 `250 × 158` 放大为 `284 × 180`（`viewBox` 仍为 `0 0 300 190`，几何常量不变，避免标签越界需重新标定）。
  - 每句总分不再参与文档流（此前位于雷达图上方的 `flex-col` 中，句子折行时会被挤压得看似单独成行），改为 `absolute right-4 top-0` 叠放在雷达图右上角空白区，与雷达图视为同一视觉块。
  - 雷达图上三项得分数字 `font-size` 12 → 15；坐标轴标签改为 11 并相应下移，避免重叠与越界。

- **主页单词悬停浮层同步浅色风格**
  - 文件：`src/views/home/HomeRightColumn.vue`
  - 浮层由深色 `#1B254B` 改为与档案页一致的浅色卡片风格（保持只读展示，无发音按钮）。

### 其他

- **本地 mock 数据：档案页首句改为长句，便于验证换行与词级发音切片**
  - 文件：`src/api/mock.ts`
  - `GET /student/session` 中 `eval-1` 的 `sentence_text` 由 4 词的 `Bonjour, comment allez-vous ?` 改为 13 词长句 `Bonjour, je m'appelle Marie et je suis très heureuse de vous rencontrer aujourd'hui.`，含 4 个 `Mispronunciation`（`m'appelle` / `très` / `vous` / `aujourd'hui`）。
  - 词级时间轴连续覆盖 0–4390ms；mock WAV 时长由约 3.2 秒延长到约 5 秒，避免词级切片落到音频尾部之外。
  - 仅影响 `VITE_ENABLE_MOCK=true` 的本地开发，不影响测试与生产构建。

### 校验

- `npx vue-tsc -b --force`：通过，无类型错误。
- `npx vitest run`：3 个测试文件、60 个用例全部通过。
