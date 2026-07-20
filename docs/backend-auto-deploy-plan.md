# Backend Auto Deploy

後端 Apps Script 使用 `clasp` 與 GitHub Actions 自動部署。

## 自動部署流程

推送 `backend/**` 到 `main` 後，`.github/workflows/deploy-backend.yml` 會自動：

```text
clasp push
→ 建立 Apps Script 版本
→ 更新既有正式 deployment
```

使用同一個 deployment ID 更新，因此 Web App `/exec` URL 不會改變，前端不需要隨版本修改。

## GitHub Secrets

到 GitHub repository：

```text
Settings → Secrets and variables → Actions → New repository secret
```

建立以下 secrets：

- `CLASPRC_JSON`：本機 clasp 登入後的 `~/.clasprc.json` 完整內容。
- `CLASP_JSON`：本機專案根目錄 `.clasp.json` 的完整內容。
- `APPS_SCRIPT_DEPLOYMENT_ID`：正式 `@版本號` deployment ID，不是唯讀的 `@HEAD` ID。

目前正式 deployment ID：

```text
AKfycbx_BRzcBnnLC8dydTgUBECc5p3KoHyhxp-b3NfThF4LfkZDQI0RZsC9L-_lXKDsqa_w
```

`CLASPRC_JSON` 含 OAuth refresh token，不可提交到 Git。若憑證失效，重新執行 `clasp login`，再更新 secret。

## 觸發方式

自動觸發：

```text
git push origin main
```

只有 backend 或後端 workflow 有變更時才部署 Apps Script。也可以在 GitHub Actions 頁面手動執行 `Deploy Backend to Apps Script`。

## 前端

`frontend/**` 變更時，既有的 `deploy-frontend.yml` 會自動部署 GitHub Pages。前後端同一個 commit 都有變更時，兩個 workflows 會各自執行。
