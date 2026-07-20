# 系統資料流

## 一句話版

使用者在前端填表，前端把資料送到 Apps Script，Apps Script 建立 Jira 工單，再把結果備份到 Google Sheet。

## 流程

```text
使用者填寫開單系統
↓
點擊「建立 Jira 工單」
↓
frontend/app.js 整理資料
↓
產生 payload 與 sheetRecord
↓
POST 到 Apps Script Web App /exec
↓
Apps Script doPost 接收資料
↓
Apps Script 呼叫 Jira API 建立 Task
↓
Jira 回傳 Jira 單號與連結
↓
Apps Script 依 Google Sheet 中文表頭寫入資料
↓
Google Sheet 顯示備份資料
```

## 前端負責

檔案：

```text
frontend/index.html
frontend/app.js
frontend/styles.css
```

職責：

- 表單畫面
- 即時預覽
- 產生 Jira Summary
- 產生 Jira Description
- 組出 `sheetRecord`
- 呼叫 Apps Script Web App URL

## 後端負責

檔案：

```text
backend/google-sheet-backup-apps-script.gs
```

職責：

- `doGet()`：確認 Web App 是否正常與顯示版本
- `doPost(e)`：接收前端資料
- `createJiraIssue_(payload)`：建立 Jira 工單
- `appendPayloadByHeaders_(sheet, payload)`：依 Google Sheet 標題寫入資料
- `applySheetFormatting_(sheet)`：套用格式
- `repairSheetRows()`：修正既有錯位資料

## Google Sheet 欄位對應

```text
建立時間 = submittedAt
Jira單號 = Jira API 回傳 key
Jira連結 = Jira API 回傳 url
負責人 = 未指派
Jira專案 = Project
工單類型 = Issue Type
Jira標題 = Summary
需求人 = 需求人
單位 = 單位
平台 = 平台
需求類型 = 需求類型
需求場景 = 需求場景
優先級 = 優先級
活動名稱 = 需求抬頭
張數 = 張數
交件日期 = 期望 UI 交付日期
上線日期 = 期望功能上線日
需求說明 = 需求說明
場景明細 = 預期產出與長文內容
素材或附件 = 素材或附件連結
Figma = Figma
相關Jira = 相關 Jira
舊圖或舊活動 = 舊圖 / 舊活動
已選參考檔案 = 上傳檔案名稱
備註 = 備註
需求狀態 = 未處理
```

## 判斷問題在哪裡

```text
Chrome Network Payload 有 sheetRecord
= 前端是新版

/exec 回傳 version 是最新版
= 後端部署是新版

Google Sheet 仍錯位
= 檢查 Apps Script 是否有舊版同名函式、或 Google Sheet 表頭是否被手動改動
```

