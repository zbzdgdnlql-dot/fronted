# Authentification routes

## Login
### **path:**`auth/login`
### **method:**`POST`
### **功能：** 登录
### **form**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| institute | str | 是 | 用户所在的机构 |
| username | str | 是 | 所在机构内唯一的工号或学号 |
| password | str | 是 | --- |

### **response**

#### **成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | 系统内唯一标识 |
| user_type | str | 用户种类 |
| class_context | dict | 班级信息，下有详细描述 |

**class_context**

| 字段       | 类型 | 说明           |
| ---------- | ---- | -------------- |
| class_id   | str  | 班级的唯一标识 |
| class_name | str  | 班级名称 |
| teacher_name | str | 教师名 |

#### **400 登录错误**
用户名不存在、管理员和教师账户需要输入密码
#### **401 没有权限登录**
用户名或密码错误
#### **403 账户被禁用**
账户已被禁用
#### **500 其他错误**

服务器内部错误

## Logout
### **path:**`auth/logout`
### **method:**`GET`
### **功能：** 登出

### **response**

#### **成功**
重定向到登录页*目前使用flask的函数，返回值是flask的Response类*

#### **500 其他错误**

登出过程中出现问题，但会话已清除

# Student Routes

## Custom Content
### **path:**`student/custom_content`
### **method:**`GET`
### **功能：** 作业页
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class_content | list | 其中每一个元素为dict，下有详细描述 |

**作业dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| content_id | str | --- |
| class_id | str | --- |
| title | str | 作业标题 |
| segmented_sentences | list | 分句后的文本，其中每一个元素为str，代表一个句子 |
| max_submission | int | 最大提交次数 |
| target_phonemes | list | 目标音素 |
| created_at | str | ISO格式时间 |
| updated_at | str | ISO格式时间 |
| avg_score | float | 该学生该作业所有提交记录的平均分，若无记录则返回-1 |
| is_active | bool | 是否正在使用 |

#### **500 其他错误**
访问任务时出现错误，请稍后再试

## Custom Content Records
### **path:**`student/custom_content/<content_id>`
### **method:**`GET`
### **功能：** 获取作业记录
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| content_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class_content | list | 其中每一个元素为dict，下有详细描述 |

**条目dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| session_id | str | 即session_id |
| title | str | 条目标题 |
| average_score | float | 平均分 |
| teacher_score | float | 教师给分 |
| teacher_notes | float | 教师评语 |
| completed_at | str | 完成时间，ISO格式 |
| created_at | str | 开始时间，ISO格式 |

#### **500 其他错误**
访问任务时出现错误，请稍后再试

## Archive Entry Detail
### **path:**`/student/custom_content/detail/<session_id>`
### **method:**`GET`
### **功能：** 获取条目展开信息
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| session_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| details | list | 其中每一个元素为dict，代表条目中的一个句子，下有详细描述 |

##### **条目信息dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| eval_id | str | --- |
| line_number | int | 句子编号，从1开始 |
| sentence_text | str | 句子文本 |
| pronunciation | float | 发音得分 |
| rhythm | float | 节奏得分 |
| fluency | float | 流畅度得分 |
| completeness | float | 完整性得分 |
| total_score | float | 总得分 |
| teacher_notes | float | 教师评语 |
| created_at | str | 开始时间，ISO格式 |
| word_and_phoneme | list | 其中每一个元素为dict，代表一个单词，下有详细描述 |

###### **单词dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| word_text | str | 单词文本 |
| word_position | int | 单词在句子中的位置，从1开始 |
| pronunciation_score | float | 单词得分 |
| start_time | int | 开始时间（ms） |
| end_time | int | 结束时间（ms） |
| phonemes | list | 其中每一个元素为dict，代表一个音素，下有详细描述 |

**音素dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| phoneme_symbol | str | 音标 |
| phoneme_position | int | 音素在单词中的位置，从1开始 |
| pronunciation_score | float | 音素得分 |

#### **401 用户未登录**
用户未登录

#### **404 条目未找到**
归档条目不存在或无权访问

#### **500 其他错误**
获取归档条目失败

## Problem Areas
### **path:**`/student/custom_content/problem_areas/<session_id>`
### **method:**`GET`
### **功能：** 获取条目展开信息
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| session_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| problem_areas | dict | 下有详细描述 |

**problem_areas**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| weak_phonemes | list | 薄弱音素，其中每个元素为str，代表一个音素 |
| difficult_words | list | 薄弱单词，其中每个元素为str，代表一个单词 |
| problematic_sentences | list | 薄弱句子，其中每个元素为str，代表一个句子 |

# Legacy Archive Routes

## Statistics
### **path:**`/student/archive/statistics`
### **method:**`GET`
### **功能：** 获取档案统计数据
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| statistics | dict | 下有详细描述 |

**statistics**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| total_entries | int | 条目总数 |
| main_page_entries | int | 主页条目数 |
| aufgaben_entries | int | 作业条目数 |
| average_score | float | 平均分 |
| max_score | float | 最高分 |
| latest_activity | str | 最后一个条目生成的时间，ISO格式 |

#### **401 用户未登录**
用户未登录

#### **500 其他错误**
获取统计信息失败

# Legacy History Routes

## Words
### **path:**`/student/history/words`
### **method:**`GET`
### **功能：** 获取用户所有评测过的单词列表
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| words | list | 其中每一个元素为str，代表一个单词 |

#### **500 其他错误**
出现异常

## Phonemes
### **path:**`/student/history/phonemes`
### **method:**`GET`
### **功能：** 获取用户所有评测过的音素列表
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| phonemes | list | 其中每一个元素为str，代表一个音素 |

#### **500 其他错误**
出现异常

## Word History
### **path:**`/student/history/word/<word>`
### **method:**`GET`
### **功能：** 获取指定单词的历史评分数据
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| word | str | 是 | 要查询的单词 |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| data | dict | 下有详细描述 |

**data**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| word | str | 查询的单词 |
| scores | list | 其中每个元素为float，代表一次评测的分数 |
| dates | list | 其中每个元素为str，代表一个评测的日期 |

## Phoneme History
### **path:**`/student/history/phoneme/<phoneme>`
### **method:**`GET`
### **功能：** 获取指定音素的历史评分数据
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| phoneme | str | 是 | 要查询的音素 |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| data | dict | 下有详细描述 |

**data**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| word | str | 查询的音素 |
| scores | list | 其中每个元素为float，代表一次评测的分数 |
| dates | list | 其中每个元素为str，代表一个评测的日期 |

## Trend
### **path:**`/student/history/ranking`
### **method:**`GET`
### **功能：** 获取用户得分排名（可以用薄弱环节接口部分替代，但是那个接口没有得分最高的单词和音素）
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| data | dict | 下有详细描述 |

**data**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| highest_words | list | 得分最高的单词，其中每一个元素为dict，代表一个单词，下有详细描述 |
| lowest_words | list | 得分最低的单词，其中每一个元素为dict，代表一个单词，下有详细描述 |
| highest_phonemes | list | 得分最高的音素，其中每一个元素为dict，代表一个音素，下有详细描述 |
| lowest_phonemes | list | 得分最低的音素，其中每一个元素为dict，代表一个音素，下有详细描述 |

**dicts**
*以上所有dict的格式均相同*

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| item | str | 单词或音素 |
| avg_score | float | 该单词或音素的平均分 |
| count | 该单词或音素的评测次数 |

#### **500 其他错误**
出现异常

# Admin routes

## Dashboard Page
### **path:**`admin/dashboard`
### **method:**`GET`
### **功能：** 管理员面板
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| total_users | int | 用户总数 |
| total_evaluations | int | 评测总数 |
| user_types | dict | 各用户种类的用户数，下有具体描述 |

**user_types**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| guest | int | 访客数 |
| teacher | int | 教师数 |
| admin | int | 管理员数 |

*原程序中就没有学生数*

## Users Page
### **path:**`admin/users`
### **method:**`GET`
### **功能：** 用户总览页
### **args**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | ----------------- |
| user_type | str | 是 | guest, teacher或admin |
| search | str | 是 | 搜索关键词，我没看到长度等限制 |

### **response**
#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| users | list | 所有用户信息（数据库查询结果） |

## User Detail Page
### **path:**`admin/user/<user_id>`
### **method:**`GET`
### **功能：** 用户细节页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_id | str | 是 | --- |

### **response** 

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user | _T | 用户信息（数据库中查询到的一行）；_T是SQLAlchemy定义的TypeVar |
| login_logs | list | 该用户的所有登录记录（数据库查询结果） |
| evaluations_count | int | 用户评测次数 |
| reading_units_count | int | 用户朗读session个数 |

## Edit User
### **path:**`admin/user/edit/<user_id>`
### **method:**`GET`, `POST`
### **功能：** 编辑用户
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_id | str | 是 | --- |

### **form**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_type | str | 是 | --- |

### **response** 

#### **200 成功**
重定向到用户信息页

## User Reading Sessions Page
### **path:**`admin/user/evaluations/<user_id>`
### **method:**`GET`
### **功能：** 用户session记录页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_id | str | 是 | --- |

### **response** 

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user | _T | 用户信息（数据库中查询到的一行）；_T是SQLAlchemy定义的TypeVar |
| reading_units | list | 用户session记录 |

## Proxy History Page
### **path:**`admin/proxy/lernverlauf/<user_id>`
### **method:**`GET`
### **功能：** 代理用户历史记录页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_id | str | 是 | --- |

### **response** 

#### **200 成功**
重定向到目标用户的历史记录

## Proxy Archive Page
### **path:**`admin/proxy/archiv/<user_id>`
### **method:**`GET`
### **功能：** 代理用户档案页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_id | str | 是 | --- |

### **response** 

#### **200 成功**
重定向到目标用户的档案

## Exit Proxy Page
### **path:**`admin/proxy/return`
### **method:**`GET`
### **功能：** 退出代理
### **response** 

#### **200 成功**
重定向到用户信息页面

## Add User
### **path:**`admin/user/add`
### **method:**`POST`
### **功能：** 添加用户
### **body**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| username | str | 是 | 用户名 |
| password | str | 是 | --- |
| user_type | str | 是 | 用户种类 *程序中没有student种类* |

### **response** 

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| message | str | 固定内容："用户创建成功" |
| user_id | str | 自动生成的唯一用户标识 |

#### **400 请求验证错误**
缺少必要的参数、无效的用户类型、用户名已存在

#### **500 其他错误**

发生错误

## Batch Delete Users
### **path:**`admin/users/batch_delete`
### **method:**`POST`
### **功能：** 批量删除用户
### **body**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_ids | list | 是 | 其中包括要删除的用户id |

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| message | str | 固定内容："成功删除{n}个用户" |
| deleted_count | int | 删除用户的个数 |

#### **400 请求验证错误**
未提供用户ID、不能删除当前登录的管理员账号

#### **500 其他错误**

发生错误

## Batch Change User Type
### **path:**`admin/users/batch_change_type`
### **method:**`POST`
### **功能：** 批量修改用户种类
### **body**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_ids | list | 是 | 其中包括要删除的用户id |
| new_user_type | str | 是 | 新用户种类 |

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| message | str | 固定内容："成功更新{n}个用户的类型" |
| deleted_count | int | 改变类型的用户的个数 |

#### **400 请求验证错误**
未提供用户ID、无效的用户类型、不能修改当前登录的管理员账号类型

#### **500 其他错误**

发生错误

## Teachers Page
### **path:**`admin/teachers`
### **method:**`GET`
### **功能：** 教师总览页
### **args**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | ----------------- |
| search | str | 是 | 搜索关键词，我没看到长度等限制 |

### **response**
#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| teachers | list | 所有教师信息（数据库查询结果） |

## Teacher Detail Page
### **path:**`admin/teacher/<teacher_id>`
### **method:**`GET`
### **功能：** 教师细节页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| teacher_id | str | 是 | --- |

### **response** 

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| teacher | _T | 用户信息（数据库中查询到的一行）；_T是SQLAlchemy定义的TypeVar |
| managed_classes | list | 教师的所有班级（数据库查询结果） |
| total_students | int | 教师的总学生数 |
| total_content | int | 教师的总作业数 |
| login_logs | list | 该用户的所有登录记录（数据库查询结果） |

## Create Teacher Page
### **path:**`admin/teacher/create`
### **method:**`GET`, `POST`
### **功能：** 教师细节页
### **body**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| username | str | 是 | 用户名 |
| password | str | 是 | 6位以上 |
| confirm_password | str | 是 | --- |

### **response**

#### **200 成功**
重定向到教师信息页
#### **400 用户名或密码不合要求**
密码不能为空、两次输入的密码不一致、密码长度至少6位、用户名已存在
#### **500 其他错误**

创建教师账户失败

## Edit Teacher
### **path:**`admin/teacher/edit/<teacher_id>`
### **method:**`GET`, `POST`
### **功能：** 编辑教师
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| teacher_id | str | 是 | --- |

### **form**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| username | str | 是 | 用户名 |
| password | str | 否 | 6位以上 |
| confirm_password | str | 否 | --- |

### **response** 

#### **200 成功**
重定向到教师信息页
#### **400 用户名或密码不合要求**
两次输入的密码不一致、密码长度至少6位、用户名已被其他用户使用、用户名不能为空
#### **500 其他错误**

更新教师信息失败

## Teacher`s Classes Page
### **path:**`admin/teacher/classes/<teacher_id>`
### **method:**`GET`
### **功能：** 教师班级页
### **response** 

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| teacher | _T | 用户信息（数据库中查询到的一行） |
| classes_with_stats | list | 每一个元素为一个dict，代表一个班级，下有详细描述 |

**班级dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class | _T | 班级信息（数据库中查询到的一行） |
| student_count | int | 学生数 |
| content_count | int | 作业数 |

## Teachers(api)

### **path:**`admin/api/teachers`
### **method:**`GET`
### **功能：** 获取所有教师信息
### **response**

#### **200 成功**
一个list，其中每个元素为一个dict，表示一个教师的信息

**教师信息dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | --- |
| username | str | --- |
| created_at | str | ISO格式时间 |
| class_count | int | 教师的班级数 |
| student_count | int | 教师的学生总数 |
| last_login | --- | AI未完成 |

## Teachers Activity
### **path:**`admin/api/teacher/<teacher_id>/activity`
### **method:**`GET`
### **功能：** 获取所有教师信息
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| teacher_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | --- |
| username | str | --- |
| created_at | str | ISO格式时间|
| class_count | int | 教师的班级数 |
| student_count | int | 教师的学生总数 |
| recent_logins | list | 其中每个元素为一个dict，代表一次登录信息，下有详细描述 |

**登录信息dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| login_time | str | ISO格式时间|
| ip_address | str | --- |

## System Health Page `admin/system-health`
## System Analytics Page `admin/analytics`
以上两个接口仅用于渲染页面，没有请求和返回值。

## System Statistics
### **path:**`admin/api/system/stats`
### **method:**`GET`
### **功能：** 获取系统统计信息
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| basic_stats | dict | 基本信息，下有详细描述 |
| user_distribution | dict | 用户分布，下有详细描述 |
| recent_activity | dict | 最近活动，下有详细描述 |
| activity_stats | dict | 活动统计，下有详细描述 |

**basic_stats**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| total_users | int | 用户总数 |
| total_teachers | int | 教师总数 |
| total_students | int | 学生总数 |
| total_classes | int | 班级总数 |
| total_evaluations | int | 评测总数 |
| total_custom_content | int | 作业总数 |

**user_distribution**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| guest | int | 访客总数 |
| student | int | 学生总数 |
| teacher | int | 教师总数 |
| admin | int | 管理员总数 |

*学生和教师的数量重复了，原程序如此，不知道为什么*

**recent_activity**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| new_users_30d | int | 30日新增用户数 |
| new_evaluations_30d | int | 30日新增测评数 |
| new_classes_30d | int | 30日新增班级数 |

**activity_stats**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| active_classes | int | 正在使用的班级数（考虑到毕业等情况，则班级不再使用，下同） |
| active_memberships | int | 正在使用的班级的成员数 |
| avg_students_per_class | float | 班级内的平均成员数 |

## Usage Trends within Last 30 Days
### **path:**`admin/api/system/usage-trends`
### **method:**`GET`
### **功能：** 获取过去30日的系统使用趋势
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| daily_users | list | 其中每一个元素为dict，代表每日的新增用户情况 |
| daily_evaluations | list | 其中每一个元素为dict，代表每日的测评情况 |
| daily_logins | list | 其中每一个元素为dict，代表每日的登录情况 |

**dict**
*三个字段对应的dict格式相同*

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| date | str | ISO格式日期 |
| count | str | 新增用户、测评或登录的数量

## System Performance
### **path:**`admin/api/system/performance`
### **method:**`GET`
### **功能：** 获取系统性能
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| timestamp | str | ISO格式时间 |
| cpu | dict | 处理器信息，下有详细描述 |
| memory | dict | 内存信息，下有详细描述 |
| disk | dict | 磁盘信息，下有详细描述 |
| database | dict | 数据库信息，下有详细描述 |

**cpu**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| usage_percent | float | 使用率 |
| load_avg_1m | float | 1分钟系统负载，仅Unix支持，下同 |
| load_avg_5m | float | 5分钟系统负载 |
| load_avg_15m | float | 15分钟系统负载 |

**memory & disk**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| usage_percent | float | 使用率 |
| used_gb | float | 已使用的空间（GB） |
| total_gb | float | 总空间（GB） |

**database**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| connections | int | 连接的数据库数量，AI简化处理为固定值1 |

## User Activity
### **path:**`admin/api/system/user-activity`
### **method:**`GET`
### **功能：** 获取用户活动统计
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| recent_logins | list | 最近登录，10个元素，其中每一个元素为dict，下有详细描述 |
| most_active_users | list | 最活跃用户，10个元素，其中每一个元素为dict，下有详细描述 |
| recent_users | list | 最新用户，10个元素，其中每一个元素为dict，下有详细描述 |

**最近登录dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | --- |
| username | str | --- |
| user_type | str | 用户种类 |
| last_login | str | 最后登录时间，ISO格式 |

**最活跃用户dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | --- |
| username | str | --- |
| user_type | str | 用户种类 |
| evaluation_count | int | 评测数量 |

**最新用户dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | --- |
| username | str | --- |
| user_type | str | 用户种类 |
| created_at | str | 用户创建时间，ISO格式 |

## Class Analytics
### **path:**`admin/api/system/class-analytics`
### **method:**`GET`
### **功能：** 获取班级分析
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class_sizes | list | 班级人数，其中每一个元素为dict，下有详细描述 |
| content_creation | list | 教师的作业数，10个元素，其中每一个元素为dict，下有详细描述 |
| class_creation_trend | list | 30日内每日创建的班级数，其中每一个元素为dict，下有详细描述 |

**班级人数dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class_id | str | --- |
| class_name | str | 班级名称 |
| teacher_name | str | 教师名 |
| student_count | int | 学生数量 |

**教师的作业数dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| teacher_name | str | 教师名 |
| content_count | int | 作业数量 |

**30日内每日创建的班级数dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| date | str | ISO格式日期 |
| count | int | 班级数量 |

# Teacher Routes (教师端路由)

## Teacher Dashboard Page
### **path:**`teacher/dashboard`
### **method:**`GET`
### **功能：** 教师面板页
### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user | _T | 用户信息（数据库中查询到的一行） |
| class_details | list | 其中每一个元素为dict，代表一个班级，下有详细描述 |
| total_classes | int | 教师的班级总数 |
| total_students | int | 教师的学生总数 |
| total_content | int | 教师的作业总数 |

**班级dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class | _T | 班级信息（数据库中查询到的一行） |
| student_count | int | 班级学生数 |
| content_count | int | 班级作业数 |

#### **401 没有用户数据**
用户信息不存在

#### **500 其他错误**
*只在后端抛出异常，没有返回给前端*

## Class Management Page
### **path:**`teacher/class/<class_id>/manage`
### **method:**`GET`
### **功能：** 班级管理页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class_obj | _T | 班级信息（数据库中查询到的一行） |
| class_members | list | 其中每个元素为dict，代表一个班级成员，下有详细描述 |
| get_user_by_id | _T | 用户信息（数据库中查询到的一行） |

**班级成员dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | --- |
| username | str | --- |
| display_name | str | 显示名称，历史遗留，现同用户名 |
| user_type | str | 用户种类 |
| user_type_name | str | 用户种类对应的中文名称 |
| membership_id | str | 班级成员关系的唯一标识 |
| tags | str | 标签，*功能未实现* |
| joined_at | str | 加入时间，ISO格式 |
| is_active | bool | 是否正在使用（考虑到毕业等情况则不再使用） |

#### **404 班级未找到**
班级不存在

#### **500 其他错误**
*只在后端抛出异常，没有返回给前端*

## Add Student
### **path:**`teacher/class/<class_id>/add_student`
### **method:**`GET`, `POST`
### **功能：** 添加学生
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |

### **form**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| username | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| message | str | "成功添加学生{username}" |
| student | dict | 添加的学生的信息，下有详细描述 |

**student**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| username | str | --- |
| user_type_name | str | 用户种类对应的中文名称 |
| joined_at | str | 加入时间，ISO格式 |
| membership_id | str | --- |

#### **400 请求验证错误**
用户名不能为空、该学生已在班级中

#### **404 班级未找到**
班级不存在

#### **500 其他错误**
添加学生失败

## Remove Student
### **path:**`teacher/class/<class_id>/remove_student`
### **method:**`GET`, `POST`
### **功能：** 移除学生
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |

### **form**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| membership_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| message | str | "成功从班级移除学生{username}" |

#### **400 请求验证错误**
成员ID不能为空

#### **404 未找到**
成员关系不存在、用户不存在

#### **500 其他错误**
移除学生失败

## Add Student by Code
### **path:**`teacher/class/<class_id>/enroll_by_code`
### **method:**`GET`, `POST`
### **功能：** 通过邀请码添加学生
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |

### **form**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| username | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| message | str | "成功添加学生{username}到班级" |
| class_name | str | 班级名称 |

#### **400 请求验证错误**
用户名不能为空

#### **404 班级未找到**
班级不存在

#### **500 其他错误**
添加学生失败

## Create Class Page
### **path:**`teacher/create_class`
### **method:**`GET`, `POST`
### **功能：** 创建班级页
### **form**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_name | str | 是 | 班级名称 |
| description | str | 否 | 班级描述，默认为空 |
| grade_level | str | 否 | 年级，默认为空 |
| max_students | int | 否 | 最大学生数，默认50 |

### **response**

#### **200 成功**
重定向到班级管理页

#### **400 请求验证错误**
班级名称不能为空

#### **401 教师错误**
用户信息不存在

#### **500 其他错误**
创建班级失败

## Teacher's Classes
### **path:**`teacher//api/classes`
### **method:**`GET`
### **功能：** 获取教师管理的所有班级

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| classes | list | 其中每个元素为dict，代表一个班级，下有详细描述 |
| total_count | int | 班级总数 |

**班级dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class_id | str | --- |
| class_name | str | --- |
| description | str | 班级描述 |
| student_count | int | 学生数量 |
| content_count | int | 作业数量 |
| created_at | str | 创建时间，ISO格式 |

#### **401 教师错误**
用户信息不存在

#### **500 其他错误**
创建班级失败

## Manage Content Page
### **path:**`teacher/class/<class_id>/content`
### **method:**`GET`
### **功能：** 作业管理页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class_obj | _T | 班级信息（数据库中查询到的一行） |
| content_list | list | 作业列表（数据库查询结果）
 |

#### **404 班级未找到**
班级不存在

## Create Content Page
### **path:**`teacher/class/<class_id>/content`
### **method:**`GET`, `POST`
### **功能：** 创建作业页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |

### **form**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| title | str | 是 | 作业标题 |
| content_text | str | 是 | 作业原文 |
| max_submission | int | 否 | 最大提交次数 |
| target_phonemes | list | 否 | 目标音素，默认为空 |

### **response**

#### **200 成功**
重定向到作业管理页

#### **400 请求验证错误**
标题不能为空、难度等级必须是1-3之间的整数

#### **401 教师错误**
用户信息不存在

#### **404 班级未找到**
班级不存在

#### **500 其他错误**
创建内容失败



## Preview Content Page
### **path:**`teacher/class/<class_id>/content/<content_id>/preview`
### **method:**`GET`, `POST`
### **功能：** 预览作业页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |
| content_id | str | 是 | --- |

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class_obj | _T | 班级信息（数据库中查询到的一行） |
| content | _T | 作业信息（数据库中查询到的一行） |

#### **404 班级未找到**
班级不存在、内容不存在

## Validate Content
### **path:**`teacher/api/content/validate`
### **method:**`POST`
### **功能：** 验证文本
### **body**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| content_text | str | 是 | 要验证的文本，10-10000字符 |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| valid | bool | True |
| has_german_chars | bool | 是否包含德语字符ÄÖÜß |
| word_count | int | 单词数 |
| sentence_count | int | 句子数 |
| character_count | int | 字符数 |
| message | str | "内容验证通过" |

#### **400 请求验证错误**
内容不能为空、内容至少需要10个字符、内容不能超过10000个字符

#### **500 其他错误**
验证失败

## Delete Content
### **path:**`teacher/class/<class_id>/content/<content_id>/delete`
### **method:**`GET`
### **功能：** 删除作业
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |
| content_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| message | str | "内容已删除" |
| content_id | str | --- |

#### **401 教师错误**
没有权限删除此内容

#### **404 作业未找到**
内容不存在

#### **500 其他错误**
删除内容失败

## Segment Content
### **path:**`teacher/api/content/segment`
### **method:**`POST`
### **功能：** 为文本分句
### **body**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| content_text | str | 是 | 要验证的文本，10-10000字符 |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| sentences | list | 其中每个元素为str，表示一个句子 |
| sentence_count | int | 句子数量 |
| statistics | dict | 下有详细描述 |
| estimated_difficulty | int | 估算的难度 |
| suggested_phonemes | list | 其中每个元素为str，表示一个音素 |
| has_german_chars | bool | 是否包含德语字符ÄÖÜß |

**statistics**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| character_count | int | 字符数 |
| word_count | int | 单词数 |
| sentence_count | int | 句子数 |
| paragraph_count | int | 段落数 |
| german_char_count | int | 德语字符数 |

#### **400 请求验证错误**
内容不能为空、文本长度至少需要10个字符、文本长度不能超过10000个字符

#### **500 其他错误**
分句失败

## Edit Content Segmentation Page
### **path:**`teacher/class/<class_id>/content/<content_id>/segment`
### **method:**`GET`, `POST`
### **功能：** 编辑内容的句子分割页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |
| content_id | str | 是 | --- |

### **body**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| sentences | list | 是 | 句子列表，其中每一个元素为str，代表一个句子 |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| message | str | "句子分割更新成功" |
| sentence_count | int | 句子数 |

#### **400 请求验证错误**
句子列表不能为空、至少需要一个有效句子

#### **404 作业未找到**
班级不存在、内容不存在

#### **500 其他错误**
删除内容失败

## Segment Content
### **path:**`teacher/api/content/auto_segment`
### **method:**`POST`
### **功能：** 为文本自动分句
### **body**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| content_text | str | 是 | 要验证的文本，10-10000字符 |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| sentences | list | 其中每个元素为str，表示一个句子 |
| sentence_count | int | 句子数量 |
| message | str | "自动分句完成，共分割出{n}个句子" |

#### **400 请求验证错误**
内容不能为空

#### **500 其他错误**
自动分句失败

## Student Analysis Page
### **path:**`teacher/class/<class_id>/student/<user_id>/analysis`
### **method:**`GET`
### **功能：** 学生页面
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |
| user_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class_id | str | --- |
| class_obj | _T | 班级信息（数据库中查询到的一行） |
| student | dict | 学生信息，下有详细描述 |
| progress | dict | 下有详细描述 |
| initial_time_range | str | 初始时间范围，"week" |
| initial_evaluation_type | str | 初始评测类型，"all" |

**student**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | --- |
| username | str | --- |
| user_type | str | 用户种类 |
| user_type_name | str | 用户种类对应的中文名称 |
| joined_at | str | 加入时间，ISO格式 |

##### **progress**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| student_info | dict | 下有详细描述 |
| overall_stats | dict | 下有详细描述 |
| current_performance | dict | 下有详细描述 |
| historical_performance | dict | 下有详细描述 |
| improvement_trends | dict | 评分变化趋势，字段与current_performance相同，但含义不同，下有详细描述 |
| problem_areas | dict | 下有详细描述 |
| unit_progress | --- | *历史遗留，不再使用* |

**student_info**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | --- |
| username | str | --- |
| user_type | str | 用户种类 |
| created_at | str | 加入时间，ISO格式 |

**overall_stats**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
total_evaluations
| first_evaluation | str | 首次评测时间，ISO格式 |
| last_evaluation | str | 最后评测时间，ISO格式 |

**current_performance & improvement_trends**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| pronunciation | float | 发音得分 |
| rhythm | float | 节奏得分 |
| fluency | float | 流利程度得分 |
| completeness | float | 完整度得分 |
| total_score | float | 总得分 |

**historical_performance**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| pronunciation | list | 其中每一个元素为float，代表一次测评中的发音得分，下同 |
| rhythm | list | 节奏得分 |
| fluency | list | 流利程度得分 |
| completeness | list | 完整度得分 |
| total_score | list | 总得分 |

**problem_areas**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| weak_phonemes | list | 薄弱音素，其中每个元素为str，代表一个音素 |
| difficult_words | list | 薄弱单词，其中每个元素为str，代表一个单词 |
| problematic_sentences | list | 薄弱句子，其中每个元素为str，代表一个句子 |

#### **404 班级未找到**
班级不存在、学生不存在、该学生不在此班级中

#### **500 其他错误**
获取学生数据失败

## Student Progress
### **path:**`teacher/api/student/<user_id>/progress`
### **method:**`GET`
### **功能：** 学生进度
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_id | str | 是 | --- |

### **args**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| time_range | str | 否 | "day", "three_days", "week", "month", "quarter" 或 "all"，默认"week" |
| evaluation_type | str | 否 | "practice", "assignment" 或 "all"，默认"all" |
| class_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| progress | dict | 与上一个接口中的progress完全相同 |

#### **500 其他错误**
获取学生进度失败

## Student Audio
### **path:**`teacher/api/student/<user_id>/audio`
### **method:**`GET`, `POST`
### **功能：** 学生音频
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_id | str | 是 | --- |

### **args**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| time_range | str | 否 | "day", "three_days", "week", "month", "quarter" 或 "all"，默认"month" |
| evaluation_type | str | 否 | "practice", "assignment" 或 "all"，默认"all" |
| limit | int | 否 | 限制音频个数，默认20 |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| recordings | dict | 下有详细描述 |

**recordings**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| eval_id | str | 评测的唯一标识 |
| text | str | 评测文本 |
| audio_path | str | 音频本机路径 *AI写的，应该没什么意义* |
| audio_url | str | 音频URL |
| total_score | float | 总分 |
| created_at | str | 创建时间，ISO格式 |

#### **500 其他错误**
获取学生音频失败

## Get Evaluation from Phoneme
### **path:**`teacher/api/student/<user_id>/phoneme-words`
### **method:**`GET`, `POST`
### **功能：** 通过音素查询评测记录
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_id | str | 是 | --- |

### **args**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| phoneme | str | 是 | 查询音素 |
| time_range | str | 否 | "day", "three_days", "week", "month", "quarter" 或 "all"，默认"month" |
| evaluation_type | str | 否 | "practice", "assignment" 或 "all"，默认"all" |
| limit | int | 否 | 限制音频个数，默认20 |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| items | list | 其中每一个元素为dict，代表一个评测记录，下有详细描述 |

**items**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| phoneme | str | 音素 |
| word | str | 包含该音素的单词 |
| word_score | float | 单词分数 |
| sentence_text | str | 句子文本 |
| eval_id | str | --- |
| audio_url | str | 音频URL |
| created_at | str | 创建时间，ISO格式 |

#### **400 请求验证错误**
缺少参数: "phoneme"

#### **401 用户登陆状态错误**
用户信息不存在、没有权限访问该学生

#### **404 学生未找到**
学生不存在

#### **500 其他错误**
获取音素相关单词失败

## Get Evaluation from Phoneme
### **path:**`teacher/api/student/<user_id>/word-sentences`
### **method:**`GET`, `POST`
### **功能：** 通过音素查询评测记录
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| user_id | str | 是 | --- |

### **args**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| word | str | 是 | 查询音素 |
| time_range | str | 否 | "day", "three_days", "week", "month", "quarter" 或 "all"，默认"month" |
| evaluation_type | str | 否 | "practice", "assignment" 或 "all"，默认"all" |
| limit | int | 否 | 限制音频个数，默认20 |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| items | list | 其中每一个元素为dict，代表一个评测记录，下有详细描述 |

**items**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| word | str | 单词 |
| sentence_text | str | 句子文本 |
| sentence_score | float | 句子分数 |
| eval_id | str | --- |
| audio_url | str | 音频URL |
| created_at | str | 创建时间，ISO格式 |

#### **400 请求验证错误**
缺少参数: "word"

#### **401 用户登陆状态错误**
用户信息不存在、没有权限访问该学生

#### **404 学生未找到**
学生不存在

#### **500 其他错误**
获取音素相关单词失败

## Class Analysis Data
### **path:**`teacher/class/<class_id>/analytics/data`
### **method:**`GET`, `POST`
### **功能：** 获取班级分析数据
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |

### **args**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| time_range | str | 否 | "day", "three_days", "week", "month", "quarter" 或 "all"，默认"month" |
| evaluation_type | str | 否 | "practice", "assignment" 或 "all"，默认"all" |
| limit | int | 否 | 限制音频个数，默认20 |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| statistics | dict | 下有详细描述 |
| charts | dict | 下有详细描述 |
| students | dict | 下有详细描述 |
| filters | dict | 下有详细描述 |

##### **statistics**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| total_evaluations | int | 总评测数 |
| main_page_evaluations | int | 主页评测数 |
| aufgaben_evaluations | int | 作业评测数 |
| average_scores | dict | 每个维度的平均分，下有详细描述 |
| score_distribution | dict | 总分的分布，下有详细描述 |

**average_scores**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| pronunciation | float | 发音得分 |
| rhythm | float | 节奏得分 |
| fluency | float | 流利程度得分 |
| completeness | float | 完整度得分 |
| total_score | float | 总得分 |

**score_distribution**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| excellent | int | 优秀的次数 |
| good | int | 良好的次数 |
| fair | int | 通过的次数 |
| poor | int | 差的次数 |

##### **charts**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| performance_trends | dict | 下有详细描述 |
| score_distribution | dict | 与上述score_distribution相同 |

**performance_trends**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| dates | list | 其中每一个元素为str，代表一个日期 |
| pronunciation | list | 其中每一个元素为float，代表一个日期的平均发音得分，下同 |
| rhythm | list | 节奏得分 |
| fluency | list | 流利程度得分 |
| completeness | list | 完整度得分 |

##### **students**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | --- |
| username | str | --- |
| display_name | str | 即username |
| joined_at | str | ISO格式时间 |
| seat_number | --- | 不再使用 |
| group_name | --- | 不再使用 |
| total_evaluations | int | 总评测数 |
| last_evaluation | str | 最后评测时间，ISO格式 |
| current_performance | dict | 仅包括一个字段，total_score, float, 总分 |
| improvement_trend | --- | 不再使用 |
| problem_areas | --- | 不再使用 | 

##### **filters**

| 字段       | 类型 | 说明              |
| ---------- | ---- | --- | ----------------- |
| time_range | str | "day", "three_days", "week", "month", "quarter" 或 "all"，默认"month" |
| evaluation_type | str | "practice", "assignment" 或 "all"，默认"all" |
| date_range | dict | 时间范围，下有详细描述 |

**date_range** 

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| start | str | 开始日期，ISO格式 |
| end | str | 结束日期，ISO格式 |

#### **500 其他错误**
获取分析数据失败

## Analytics Dashboard Page
### **path:**`teacher/class/<class_id>/analytics`
### **method:**`GET`
### **功能：** 获取班级分析数据
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| class_obj | _T | 班级信息（数据库中查询到的一行） |
| statistics | dict | 下有详细描述 |

##### **statistics**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| total_students | int | 学生总数 |
| total_evaluations | int | 总评测数 |
| main_page_evaluations | int | 主页评测数 |
| aufgaben_evaluations | int | 作业评测数 |
| average_scores | dict | 每个维度的平均分，下有详细描述 |
| score_distribution | dict | 总分的分布，下有详细描述 |
| activity_stats | dict | 活动统计，下有详细描述 |

**average_scores**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| pronunciation | float | 发音得分 |
| rhythm | float | 节奏得分 |
| fluency | float | 流利程度得分 |
| completeness | float | 完整度得分 |
| total_score | float | 总得分 |

**score_distribution**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| excellent | int | 优秀的次数 |
| good | int | 良好的次数 |
| fair | int | 通过的次数 |
| poor | int | 差的次数 |

**activity_stats**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| active_students_today | int | 今日活跃学生数 |
| active_students_week | int | 本周活跃学生数 |
| evaluations_today | int | 今日评测数 |
| evaluations_week | int | 本周评测数 |

#### **404 班级未找到**
班级不存在

#### **500 其他错误**
获取分析数据失败

## Class Custom Content Analysis
### **path:**`teacher/class/<class_id>/analytics/custom-contents`
### **method:**`GET`
### **功能：** 获取班级的作业
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| class_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| success | bool | True |
| analytics | list | 其中每个元素为dict，代表一个作业，下有详细描述 |

**作业dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| content_id | str | --- |
| title | str | 作业标题 |
| finished_student_count | int | 完成人数 |
| total_student_count | int | 总学生数 |
| unfinished_students | list | 未完成学生的用户名，其中每一个元素为str，代表一个未完成的学生 |

#### **500 其他错误**
获取作业分析失败

## Custom Content Detail Page
### **path:**`teacher/custom_content/<content_id>/custom_content_detail`
### **method:**`GET`
### **功能：** 作业详情页
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| content_id | str | 是 | --- |

### **response**

#### **200 成功**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| content_id | str | --- |
| class_id | str | --- |
| custom_content | dict | 作业信息，下有详细描述 |
| avg_scores | dict | 平均分数，下有详细描述 |
| problem_areas | dict | 薄弱点，下有详细描述 |

**custom_content**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| title | str | 作业标题 |
| due_date | str | 截止日期，ISO格式 |
| created_at | str | 创建日期，ISO格式 |

**avg_scores**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| pronunciation | float | 发音得分 |
| rhythm | float | 节奏得分 |
| fluency | float | 流利程度得分 |
| completeness | float | 完整度得分 |
| total_score | float | 总得分 |

**problem_areas**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| weak_phonemes | list | 薄弱音素，其中每个元素为str，代表一个音素 |
| difficult_words | list | 薄弱单词，其中每个元素为str，代表一个单词 |
| problematic_sentences | list | 薄弱句子，其中每个元素为str，代表一个句子 |

#### **500 其他错误**
*只在后端抛出异常，没有返回给前端*

## Custom Content Records
### **path:**`teacher/custom_content/<content_id>/custom_content_detail`
### **method:**`GET`
### **功能：** 获取作业记录
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| content_id | str | 是 | --- |

### **response**

#### **200 成功**
list，其中每个元素为dict，代表一个学生

##### **学生dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| user_id | str | --- |
| username | str | --- |
| records_count | int | 该作业下该学生的提交记录数 |
| records | list | 记录详细信息，其中每一个元素为dict，代表一次记录 |

**记录dict**

| 字段       | 类型 | 说明              |
| ---------- | ---- | ----------------- |
| session_id | str | --- |
| average_score | float | 平均分 |
| completed_at | str | 完成时间，ISO格式 |

#### **500 其他错误**
*只在后端抛出异常，没有返回给前端*

## `teacher/api/class/<class_id>/analytics/immediate-actions`
## `teacher/api/class/<class_id>/analytics/targeted-interventions`
## `teacher/api/class/<class_id>/analytics/class-strategies`
## `teacher/api/class/<class_id>/analytics/individual-plans`
*以上四个接口为示例接口，返回的是后端写死的数据*

## `teacher/api/class/<class_id>/analytics/activity`
## `teacher/api/class/<class_id>/analytics/recent-activity`
## `teacher/api/class/<class_id>/analytics/phoneme-weaknesses`
## `teacher/api/class/<class_id>/analytics/word-difficulties`
*以上四个接口无法正常工作，需要重新设计*

# General routes

## Get Audio
### **path:**`api/audio/<eval_id>`
### **method:**`GET`
### **功能：** 获取音频及URL
### **header**

| 字段       | 类型 | 必填 | 说明              |
| ---------- | ---- | --- | ----------------- |
| eval_id | str | 是 | --- |

### **response**

#### **200 成功**
URL,这个URL应该是在返回的headers里。

#### **401 用户未登录**
用户未登录

#### **403 用户无权访问**
学生不在教师班级中、评测不属于用户

#### **404 未找到**
评测不存在、用户不存在

## Clean Temporary Files
### **path:**`/api/clean_temp_file`
### **method:**`POST`
### **功能：** 清除临时音频文件
### **body**
list _其中每一个元素为一个临时音频文件地址_
_我解释一下：这个是我自己写的，当时没有用Key_Value键值对，直接用json传了一个list过来。_

### **response**

#### **200 成功**

| 字段    | 类型 | 说明 |
| ------- | ---- | ---- |
| success | bool | True |

#### **500 其他错误**

服务器内部错误

## Submit

### **path:**`/api/submit_session`
### **method:**`POST`
### **功能：** 提交
### **body**
list _其中每一个元素是/api/process_sentence的返回值_
_这个跟上一个一样，总之当时写的时候相当随意。下面我就不一一解释了。重新写的时候肯定按照你的标准来。_

### **response**

#### **200 成功**

| 字段    | 类型 | 说明 |
| ------- | ---- | ---- |
| success | bool | True |

#### **500 其他错误**

服务器内部错误

## Process and Evaluate the Sentence

### **path:**`/api/process_sentence`

### **method:**`POST`

### **功能：** 调用评测函数，返回评测结果

### **body**

| 字段                 | 类型      | 必填 | 说明                                 |
| -------------------- | --------- | ---- | ------------------------------------ |
| audio                | audioBlob | 是   | 音频                                 |
| text                 | str       | 是   | 音频对应的文本                       |
| user_id              | str       | 是   | ---                                  |
| timestamp            | str       | 是   | ISO格式时间戳                        |
| session_id           | str       | 是   | ---                                  |
| client_instance_id   | str       | 是   | _（没看到后端引用）_                 |
| sentence_number      | int       | 是   | 第几句，从1开始                      |

### **response**

#### **200 成功**

| 字段            | 类型 | 说明                                                                               |
| --------------- | ---- | ---------------------------------------------------------------------------------- |
| sentence_values | dict | ---                                                                                |
| word_data       | dict | ---                                                                                |
| evaluation      | dict | _以上三个为SessionEvaluationService.create_session_evaluation()的返回值，可以优化_ |
| session_context | dict | session信息，下有详细描述                                                          |

##### **session_context**

| 字段            | 类型 | 说明               |
| --------------- | ---- | ------------------ |
| session_id      | str  | ---                |
| sentence_number | int  | 第几句，从1开始    |
| content_id      | str  | body中的content_id |
| content_type    | str  | body中的content_id |

#### **400 请求验证错误**

表单验证失败、会话评测处理错误

#### **404 用户不存在**

用户不存在

#### **500 其他错误**

服务器内部错误

## Create Session Record
### **path:**`/api/create_reading_session`
### **method:**`POST`
### **功能：** 创建一个任务记录
### **body**

| 字段               | 类型 | 必填                 | 说明                                                         |
| ------------------ | ---- | -------------------- | ------------------------------------------------------------ |
| full_text          | str  | 是                   | session的全部文本                                            |
| user_id            | str  | 是                   | ---                                                          |
| client_instance_id | str  | _（没看到后端引用）_ |
| content_id         | str  | 否                   | 若source为'main_page'则不填，若source为'unit_learning'则必填 |
| source             | str  | 否                   | 'unit_learning'或'main_page', 默认'main_page'                |

### **response**

#### **200 成功**

| 字段          | 类型 | 说明                   |
| ------------- | ---- | ---------------------- |
| success       | bool | True                   |
| session_id    | str  | ---                    |

#### **400 请求验证错误**

无效的请求数据、缺少必要字段

#### **401 用户未登录**

未授权

#### **403 未加入班级**

您尚未加入任何班级，请联系教师将您添加到班级中

#### **404 用户不存在**

用户不存在

#### **500 其他错误**

服务器内部错误
