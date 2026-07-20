# Google Sheet 備份設定

目標備份表：
https://docs.google.com/spreadsheets/d/13UkD5HXGKw3W1VpNm_6_dW1MDw2w6BbXmldZPowaerU/edit?usp=sharing

## 設定步驟

1. 打開上方 Google Sheet。
2. 點選「擴充功能」→「Apps Script」。
3. 把 `google-sheet-backup-apps-script.gs` 的內容貼進 Apps Script。
4. 點選「部署」→「新增部署作業」。
5. 類型選「網頁應用程式」。
6. 執行身分選「我」。
7. 存取權限依公司規則選擇，內部使用可選公司帳號可存取；測試時可選知道連結的人。
8. 部署後複製 Web App URL。
9. 複製 Web App URL。
10. 將 Web App URL 填到網站程式 `app.js` 的 `GOOGLE_SHEET_BACKUP_URL`。
11. 之後點「建立 Jira 工單」時，網站會自動送一筆備份資料到 Google Sheet，不需要需求人另外填欄位。

## 備份內容

會記錄：

- 建立時間
- Jira 單號與連結
- Project / Issue Type
- Summary
- 需求人、單位、平台、需求類型、需求場景
- 優先級、抬頭、張數、交付日期、上線日
- 需求說明
- 預期產出項目、尺寸與文字內容
- 場景明細
- 素材連結、Figma、相關 Jira、舊圖 / 舊活動
- 已選參考檔名
- 備註
- 完整 Jira Description
