# 部署檢查清單

## 前端 GitHub Pages

更新檔案：

```text
frontend/index.html
frontend/app.js
frontend/styles.css
```

上傳到 GitHub repo：

```text
Humomo0802/jira-request-intake
```

正式網址：

```text
https://humomo0802.github.io/jira-request-intake/
```

確認方式：

1. 開 Chrome DevTools。
2. Network 勾選 Disable cache。
3. 重新整理頁面。
4. 送出測試。
5. 檢查 `exec` request 的 Payload。
6. Payload 應該看得到 `sheetRecord`。

## 後端 Apps Script

更新檔案：

```text
backend/google-sheet-backup-apps-script.gs
```

自動部署步驟：

```text
push 到 main
→ GitHub Actions 執行 clasp push
→ 建立 Apps Script 版本
→ redeploy 固定的正式 deployment
```

確認方式：

1. 打開 Web App `/exec` URL。
2. 確認 JSON 有最新版 version。

目前期望版本：

```text
20260720-2355-fix-full-row-alignment
```

## Google Sheet

後端更新後，建議在 Apps Script 執行一次：

```text
setupHeaders
```

或：

```text
repairSheetRows
```

用途：

- 修正表頭
- 修正舊資料錯位
- 套用欄寬與行高
- 套用下拉選單
- 修正張數格式

## Jira API

Apps Script 的 Script Properties 需有：

```text
JIRA_BASE_URL
JIRA_EMAIL
JIRA_API_TOKEN
JIRA_PROJECT_KEY
JIRA_ISSUE_TYPE
```

目前預設：

```text
JIRA_BASE_URL = https://mgbilibili.atlassian.net
JIRA_PROJECT_KEY = UD
JIRA_ISSUE_TYPE = Task
```

測試 Jira 連線：

```text
testJiraConnection
```
