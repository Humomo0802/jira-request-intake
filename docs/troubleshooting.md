# Troubleshooting

## Google Sheet 欄位錯位

現象：

```text
負責人 = UD
Jira專案 = Task
工單類型 = Summary
Jira標題 = 需求人
```

代表：

```text
前端或後端仍在用舊欄位順序寫入。
```

檢查：

1. Chrome Network Payload 是否有 `sheetRecord`。
2. Apps Script `/exec` 是否回傳最新版 `version`。
3. Apps Script 專案是否只有一個 `function doPost`。
4. 前端 `GOOGLE_SHEET_BACKUP_URL` 是否指向目前部署的 `/exec`。

## 開單系統送出後錯，手動執行 repair 後正確

代表：

```text
Apps Script 編輯器內是新版，但 Web App 部署版本不是新版。
```

解法：

```text
部署 → 管理部署作業 → 編輯 → 版本選新增版本 → 部署
```

## 張數顯示成 1900-01-02

原因：

```text
Google Sheet 把張數欄套成日期格式。
```

解法：

1. 確認後端版本至少是：

```text
20260720-2155-fix-quantity-number-format
```

2. 執行：

```text
repairSheetRows
```

## 需求狀態出現長文

期望：

```text
需求狀態 = 未處理
```

檢查：

- 後端 `buildSheetRecordFromPayload_()` 是否固定 `"需求狀態": "未處理"`。
- 後端 `valueForColumn_()` 是否固定 `requestStatus` 回傳 `未處理`。
- Google Sheet 最後一欄表頭是否為 `需求狀態`。

## 前端是否最新版

確認方式：

Chrome Network Payload 裡應該看到：

```text
sheetRecord
```

如果沒有看到，代表 GitHub Pages 的 `app.js` 不是最新版，或瀏覽器快取還沒清。

## 後端是否最新版

打開 Apps Script Web App `/exec` URL，應看到：

```json
{
  "ok": true,
  "version": "20260720-2155-fix-quantity-number-format",
  "mappingMode": "sheetRecord-first-by-header-label"
}
```

