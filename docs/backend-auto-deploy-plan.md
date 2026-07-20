# Backend Auto Deploy Plan

後端 Apps Script 可以用 `clasp` 自動部署，但需要先設定 Google 權限與 GitHub Secrets。

## 目前建議

第一階段先手動部署 Apps Script：

```text
Apps Script → 部署 → 管理部署作業 → 編輯 → 新增版本 → 部署
```

## 後續可自動化

目標流程：

```text
backend/google-sheet-backup-apps-script.gs 變更
↓
git push
↓
GitHub Actions
↓
clasp push
↓
clasp deploy
```

## 需要補齊

- Apps Script 專案的 `.clasp.json`
- Google Apps Script API 啟用
- Google OAuth credentials
- GitHub Secrets
- 部署版本命名規則
