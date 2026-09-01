# 協作開發指南

本文件說明 i-Fare 基金會網站的 Git 協作流程，請所有成員閱讀後再開始開發。

---

## 分支結構（2026-09-01 依現況更正）

```
master      ← 預設分支（正式基準，不直接 push）
feat/*      ← 各功能開發（從 master 切出）
fix/*       ← Bug 修正（從 master 切出）
hotfix/*    ← 緊急線上修正（從 master 切出）
```

> 早期規劃的 main／develop 雙層流程從未建立（repo 沒有 develop 分支），本文件已改為實際做法。

---

## 開發流程

### 1. 開始新功能

```bash
# 先確保本地 master 是最新的
git checkout master
git pull origin master

# 建立新的功能分支
git checkout -b feat/你的功能名稱
```

### 2. 開發中，定期提交

```bash
# 查看變更狀態
git status

# 加入變更
git add .

# 提交（使用有意義的 commit 訊息）
git commit -m "feat: 新增消息列表頁面"

# 推送到遠端
git push origin feature/你的功能名稱
```

### 3. 完成功能，發 Pull Request

1. 前往 GitHub，點選「Compare & pull request」
2. Base 設為 `master`，Compare 設為你的功能分支
3. 填寫 PR 說明（依照範本）
4. 請其他成員 Code Review
5. 通過後合併，刪除已合併的功能分支

### 4. 上線流程

合入 `master` 後，由負責人依 `docs/iFare_系統文件.docx` 第 5 章的部署步驟上線。

---

## Commit 訊息規範

使用以下前綴，讓歷程一目瞭然：

| 前綴 | 使用時機 |
|---|---|
| `feat:` | 新增功能 |
| `fix:` | 修正 Bug |
| `refactor:` | 重構（不影響功能） |
| `style:` | 樣式、格式調整 |
| `docs:` | 文件更新 |
| `chore:` | 設定、套件更新 |
| `hotfix:` | 緊急修正 |

**範例：**
```
feat: 新增福利政策篩選功能
fix: 修正手機版 Header 顯示錯誤
docs: 更新 README 環境設定說明
```

---

## 衝突處理

當 Pull Request 發生衝突時：

```bash
# 先更新 master
git checkout master
git pull origin master

# 切回你的分支，並合併 master
git checkout feat/你的功能名稱
git merge master

# 手動解決衝突後
git add .
git commit -m "chore: 解決與 master 的合併衝突"
git push origin feat/你的功能名稱
```

---

## 常用指令速查

```bash
# 查看所有分支
git branch -a

# 切換分支
git checkout master

# 查看最近 commit 歷程
git log --oneline -10

# 取消尚未 commit 的變更
git restore .

# 暫存目前工作（切換分支前）
git stash
git stash pop    # 還原
```
