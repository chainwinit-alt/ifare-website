# 協作開發指南

本文件說明 i-Fare 基金會網站的 Git 協作流程，請所有成員閱讀後再開始開發。

---

## 分支結構

```
main        ← 正式穩定版（僅從 develop 合併，不直接 push）
develop     ← 整合開發分支（日常開發基準）
feature/*   ← 各功能開發（從 develop 切出）
fix/*       ← Bug 修正（從 develop 切出）
hotfix/*    ← 緊急線上修正（從 main 切出）
```

---

## 開發流程

### 1. 開始新功能

```bash
# 先確保本地 develop 是最新的
git checkout develop
git pull origin develop

# 建立新的功能分支
git checkout -b feature/你的功能名稱
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
2. Base 設為 `develop`，Compare 設為你的 feature 分支
3. 填寫 PR 說明（依照範本）
4. 請其他成員 Code Review
5. 通過後合併，刪除已合併的 feature 分支

### 4. 上線流程

由負責人從 `develop` → `main` 發 PR，測試確認無誤後合併。

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
# 先更新 develop
git checkout develop
git pull origin develop

# 切回你的分支，並合併 develop
git checkout feature/你的功能名稱
git merge develop

# 手動解決衝突後
git add .
git commit -m "chore: 解決與 develop 的合併衝突"
git push origin feature/你的功能名稱
```

---

## 常用指令速查

```bash
# 查看所有分支
git branch -a

# 切換分支
git checkout develop

# 查看最近 commit 歷程
git log --oneline -10

# 取消尚未 commit 的變更
git restore .

# 暫存目前工作（切換分支前）
git stash
git stash pop    # 還原
```
