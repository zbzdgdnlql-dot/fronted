# Git 工作规范

## 1. 远程仓库

- **仓库地址：** `https://github.com/zbzdgdnlql-dot/fronted`
- **协议：** HTTPS

---

## 2. 分支策略

```
main ──→ develop ──→ features
```

| 分支 | 用途 | 谁维护 | 能否直接推送 |
|------|------|--------|------------|
| `main` | 稳定成品版，仅放已验证的代码 | 共同维护 | ❌ 仅合并 |
| `develop` | 开发主分支，**保留领导的学生端代码** ❌ 仅合并（从远端拉取领导更新） |
| `features` | **功能开发分支**，所有新功能/新页面都放这里 | 开发者维护 | ✅ 可推送 |

### 关键规则

1. **新功能一律提交到 `features` 分支** — 无论是学生端新页面还是教师端新页面
2. **`develop` 分支保留原版** — 不从 `develop` 推送新代码，只从远端拉取领导的更新
3. **`main` 分支只做发布** — 不可直接推送，通过合并进入

---

## 3. 日常操作流程

### 3.1 开始新功能开发

```bash
# 确保在 features 分支上
git checkout features

# 拉取最新远程变更
git pull origin features

# 开始开发...
```

### 3.2 提交代码

```bash
# 查看变更
git status
git diff

# 添加变更文件
git add <file1> <file2>

# 提交（使用英文 commit message）
git commit -m "$(cat <<'EOF'
<type>: <short description>

<detailed description if needed>
EOF
)"

# 推送到远程
git push origin features
```

### 3.3 同步领导的学生端更新

```bash
# 切到 develop 拉取领导最新代码
git checkout develop
git pull origin develop

# 切回 features 合并领导更新
git checkout features
git merge develop

# 处理冲突后推送
git push origin features
```

### 3.4 发布到 main

```bash
git checkout main
git merge features
git push origin main
```

---

## 4. Commit Message 规范

使用 Angular 风格的 commit message：

```
<type>: <简短描述>

<详细说明（可选）>
```

**type 类型：**

| type | 适用场景 |
|------|---------|
| `feat` | 新功能/新页面 |
| `fix` | Bug 修复 |
| `refactor` | 重构，无功能变化 |
| `style` | UI 样式调整 |
| `docs` | 文档 |
| `chore` | 构建/配置/依赖 |

**示例：**

```
feat: add weakness analysis page with session detail API

- implement WeaknessResultView per Figma 873:2953
- add getSessionDetail and getProblemAreas endpoints
- replace placeholder ResultView.vue
```

---

## 5. 注意事项

- ⚠️ **谨慎使用 force push：** 仅在确认无其他人基于同一分支工作时使用 `git push --force-with-lease`
- ⚠️ **不要直接 push main：** main 分支通过合并进入
- ⚠️ **不要修改 develop 分支代码：** 只从远端拉取
- ✅ **所有新开发代码统一推到 features**

---

## 6. 当前版本归属

| 版本 | 包含内容 | 目标分支 |
|------|---------|---------|
| 教师端页面（概况/内容管理/创建作业/练习提交/批改） | 已开发完成 | `features` |
| **当前更新版本（P0-P2 页面更新）** | 薄弱分析 / 缺省空态 / 个人中心 / 学习分析 / 班级管理 / 班级组织 / 学生表现 | **`features`** |
| 学生端代码 | 原始学生端 | `develop` |
