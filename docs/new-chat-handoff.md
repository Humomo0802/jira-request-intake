# 新對話交接摘要

請在新對話開頭貼這段：

```text
我的正式專案路徑是：
/Users/user/Projects/jira-request-intake

如果還沒搬移，暫存整理版在：
/Users/user/Documents/Codex/2026-07-09/new-chat/_active-projects/jira-request-intake

專案結構：
- frontend/：GitHub Pages 前端
- backend/google-sheet-backup-apps-script.gs：Google Apps Script 後端
- docs/：流程、部署、除錯文件

前端正式網址：
https://humomo0802.github.io/jira-request-intake/

後端 Apps Script 目前期望版本：
20260720-2155-fix-quantity-number-format

目前資料流：
前端填表 → app.js 產生 payload/sheetRecord → POST 到 Apps Script /exec → Apps Script 建立 Jira → 寫入 Google Sheet。

目前重點：
1. 前端 Payload 需有 sheetRecord。
2. 後端 /exec 需回傳最新版 version。
3. Google Sheet 寫入必須依中文表頭 mapping。
4. 負責人預設未指派。
5. 需求狀態預設未處理。
6. 張數欄位必須顯示 3，不可變成日期。

請只看這個正式專案資料夾，不要再從 Codex 日期資料夾尋找版本。
```

## 建議下一步

1. 把專案搬到：

```text
/Users/user/Projects/jira-request-intake
```

2. 把 GitHub repo clone 或同步到 `frontend/`，避免手動上傳檔案。
3. 把 Apps Script 部署 URL 記錄到 `.env.example` 或 docs。
4. 後續新增功能前，先確認前後端版本與資料流。

