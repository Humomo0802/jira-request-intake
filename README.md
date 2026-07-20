# Jira Ticket System

這是 Jira 需求開單系統的正式整理版。

## 專案結構

```text
jira-request-intake/
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── backend/
│   └── google-sheet-backup-apps-script.gs
└── docs/
    ├── GoogleSheet備份設定.md
    ├── architecture-flow.md
    ├── deployment-checklist.md
    ├── troubleshooting.md
    └── new-chat-handoff.md
```

## 前端

路徑：

```text
frontend/
```

用途：

- 顯示開單表單
- 產生 Jira Summary / Description
- 整理 `sheetRecord`
- 送出資料到 Apps Script Web App

目前部署目標：

```text
https://humomo0802.github.io/jira-request-intake/
```

## 後端

路徑：

```text
backend/google-sheet-backup-apps-script.gs
```

用途：

- 接收前端 POST
- 建立 Jira 工單
- 寫入 Google Sheet 備份
- 套用 Google Sheet 標題、顏色、欄寬、行高、下拉選單

目前後端版本：

```text
20260720-2355-fix-full-row-alignment
```

## 重要提醒

前端更新後，要上傳 GitHub Pages。

後端更新後推送到 `main`，GitHub Actions 會自動：

```text
clasp push → 建立版本 → 更新既有 Web App deployment
```

前端 URL 固定指向同一個 deployment，不需要隨後端版本修改。設定方式請參考 `docs/backend-auto-deploy-plan.md`。
