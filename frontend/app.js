const scenarioConfigs = {
  "直播間素材": {
    fields: [],
    checks: ["Banner", "浮窗", "活動彈窗", "直播間活動圖片", "其他"]
  },
  "代理": {
    fields: [
      ["promoPurpose", "推廣用途", "input", "例如：市場洽聊圖"],
      ["channel", "代理渠道 / 使用場景", "input", "例如：代理後台、社群"],
      ["mainCopy", "主文案", "textarea", "主要文字"],
      ["subCopy", "副文案", "textarea", "補充文字"],
      ["replaceContent", "需替換內容", "textarea", "人物、日期、活動名稱等"]
    ],
    checks: ["推廣圖", "維護素材", "人物替換", "活動圖", "其他"]
  },
  "直播間封面": {
    fields: [
      ["hostInfo", "主播 / 場次 / 房間類型", "input", "例如：娜娜 / 大尺直播"],
      ["coverType", "封面類型", "input", "主播 / 客服 / 骰寶 / 活動"],
      ["coverCopy", "封面文案", "textarea", "封面上要放的文字"],
      ["orientation", "橫版 / 竪版", "input", "橫版、竪版或兩者都要"],
      ["pairWithBackdrop", "是否與背板成套", "input", "否 / 是"]
    ],
    checks: ["主播封面", "客服封面", "骰寶封面", "活動封面", "其他"]
  },
  "直播間背板": {
    fields: [
      ["hostInfo", "主播 / 場次 / 房間類型", "input", "例如：性感野玫瑰"],
      ["backdropCopy", "背板文案", "textarea", "背板上要放的文字"],
      ["backdropSize", "背板尺寸", "input", "例如：1425 x 800"],
      ["sameStyle", "是否與封面共用風格", "input", "否 / 是"]
    ],
    checks: ["橫版背板", "竪屏背板", "活動背板", "其他"]
  },
  "活動": {
    fields: [],
    checks: [
      "分享彈窗",
      "PC 首頁輪播圖",
      "爆料輪播圖",
      "朋友圈 PYQ",
      "APP 浮窗",
      "直播間活動圖片",
      "活動模板圖",
      "H5 Banner",
      "PC Banner",
      "PC 端活動頁展示圖"
    ]
  },
  "僅活動配置圖": {
    fields: [
      ["configList", "配置圖檔名清單", "textarea", "逐行列出檔名或版位"],
      ["version", "需套用版本", "input", "版本一 / 版本二 / 都要"],
      ["sizeSpec", "尺寸規範", "textarea", "依照哪份規範或列出尺寸"],
      ["adjustment", "調整說明", "textarea", "需修改、保留、強調的內容"]
    ],
    checks: ["新增配置圖", "調整配置圖", "換皮", "批量處理"]
  },
  "燈牌": {
    fields: [
      ["badgeName", "燈牌名稱", "input", "例如：國家隊燈牌"],
      ["target", "對應主播 / 球員 / 隊伍", "input", "例如：阿根廷"],
      ["badgeCopy", "燈牌文案", "textarea", "燈牌文字"],
      ["reuseStyle", "是否沿用既有版型", "input", "否 / 是"],
      ["sizeSpec", "尺寸規範", "input", "若有固定尺寸請填"]
    ],
    checks: ["主播燈牌", "球員燈牌", "國家隊燈牌", "活動燈牌", "其他"]
  },
  "彈窗": {
    fields: [
      ["popupPurpose", "彈窗用途", "input", "例如：存送活動彈窗"],
      ["trigger", "觸發時機", "input", "例如：登入後、點擊活動入口"],
      ["popupTitle", "標題", "input", "彈窗標題"],
      ["popupCopy", "內容文案", "textarea", "彈窗內容"],
      ["buttonCopy", "按鈕文案", "input", "例如：立即參加"],
      ["sizeSpec", "尺寸 / 樣式參考", "input", "尺寸或參考圖"]
    ],
    checks: ["活動彈窗", "提示彈窗", "存送彈窗", "其他"]
  },
  "其他": {
    fields: [
      ["goal", "需求目標", "textarea", "請說明需要達成的結果"],
      ["scope", "需求範圍", "textarea", "包含與不包含的內容"],
      ["sizeSpec", "尺寸 / 格式", "input", "若有固定尺寸請填"]
    ],
    checks: ["圖片", "頁面", "調整", "其他"]
  }
};

const form = document.querySelector("#ticketForm");
const scenarioSelect = document.querySelector("#scenario");
const scenarioFields = document.querySelector("#scenarioFields");
const summaryPreview = document.querySelector("#summaryPreview");
const descriptionPreview = document.querySelector("#descriptionPreview");
const projectPreview = document.querySelector("#projectPreview");
const dueDatePreview = document.querySelector("#dueDatePreview");
const issueTypePreview = document.querySelector("#issueTypePreview");
const missingList = document.querySelector("#missingList");
const validationBox = document.querySelector("#validationBox");
const completion = document.querySelector("#completion");
const submitButton = document.querySelector("#submitTicket");
const resultBox = document.querySelector("#resultBox");
const ticketKey = document.querySelector("#ticketKey");
const ticketUrl = document.querySelector("#ticketUrl");
const referenceFiles = document.querySelector("#referenceFiles");
const fileList = document.querySelector("#fileList");
const backupStatus = document.querySelector("#backupStatus");
const GOOGLE_SHEET_BACKUP_URL = "https://script.google.com/macros/s/AKfycbx_BRzcBnnLC8dydTgUBECc5p3KoHyhxp-b3NfThF4LfkZDQI0RZsC9L-_lXKDsqa_w/exec";
let isSubmitting = false;
let hasSubmitted = false;

function value(name) {
  return new FormData(form).get(name)?.toString().trim() || "";
}

function selectedFiles() {
  return [...(referenceFiles?.files || [])];
}

function outputItems() {
  return [...form.querySelectorAll(".output-row")].map((row) => ({
    item: row.querySelector("[name='outputItem[]']")?.value.trim() || "",
    size: row.querySelector("[name='outputSize[]']")?.value.trim() || "",
    copy: row.querySelector("[name='outputCopy[]']")?.value.trim() || ""
  }));
}

function completedOutputItems() {
  return outputItems().filter((output) => output.item && output.size);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createOutputRow(item = "", size = "", copy = "") {
  return `
    <div class="output-row">
      <label>
        <span>項目</span>
        <input name="outputItem[]" value="${escapeHtml(item)}" placeholder="例如：Banner、浮窗、直播間活動圖片" />
      </label>
      <label>
        <span>尺寸</span>
        <input name="outputSize[]" value="${escapeHtml(size)}" placeholder="例如：1920 x 720" />
      </label>
      <label class="output-copy-field">
        <span>文字內容 / 備註</span>
        <textarea name="outputCopy[]" rows="3" placeholder="填此項目要放的主標、副標、規則或特殊備註">${escapeHtml(copy)}</textarea>
      </label>
      <button class="remove-output-button" type="button" aria-label="移除項目">移除</button>
    </div>
  `;
}

function outputItemsText() {
  const outputs = completedOutputItems();
  if (outputs.length === 0) return "";
  return outputs
    .map((output, index) => {
      const copy = output.copy ? `\n文字內容 / 備註：\n${output.copy}` : "";
      return `${index + 1}. ${output.item || "未填項目"}｜${output.size || "未填尺寸"}${copy}`;
    })
    .join("\n\n");
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function renderFileList() {
  const files = selectedFiles();
  if (!fileList) return;

  if (files.length === 0) {
    fileList.innerHTML = "<li>尚未選擇檔案</li>";
    return;
  }

  fileList.innerHTML = files
    .map((file) => `<li>${file.name} <span>(${formatBytes(file.size)})</span></li>`)
    .join("");
}

function renderScenarioFields() {
  const config = scenarioConfigs[scenarioSelect.value] || scenarioConfigs["其他"];
  const fieldHtml = config.fields
    .map(([name, label, type, placeholder]) => {
      if (type === "textarea") {
        return `<label><span>${label}</span><textarea name="${name}" rows="3" placeholder="${placeholder}"></textarea></label>`;
      }
      return `<label><span>${label}</span><input name="${name}" placeholder="${placeholder}" /></label>`;
    })
    .join("");

  const suggestionText = config.checks.join("、");

  scenarioFields.innerHTML = `
    <div class="output-builder">
      <div class="output-heading">
        <div>
          <strong>預期產出</strong>
          <p>每個項目請填名稱、尺寸，以及該項目要放的文字內容或備註。常見項目：${suggestionText}</p>
        </div>
        <button class="add-output-button" id="addOutputItem" type="button">新增項目</button>
      </div>
      <div class="output-list" id="outputList">
        ${createOutputRow()}
      </div>
    </div>
    ${fieldHtml}
  `;
}

function projectKey(platform, scenario) {
  return "UD";
}

function issueType(scenario) {
  return "Task";
}

function jiraSummary() {
  const platform = value("platform") || "平台";
  const scenario = value("scenario") || "需求場景";
  const type = value("requestType") || "類型";
  const title = value("title") || "需求抬頭";
  return `[${platform}][${scenario}][${type}] ${title}`;
}

function scenarioDescription() {
  const config = scenarioConfigs[value("scenario")] || scenarioConfigs["其他"];
  const lines = [];

  lines.push("【場景明細】");
  for (const [name, label] of config.fields) {
    lines.push(`${label}：${value(name)}`);
  }
  lines.push(`預期產出：\n${outputItemsText()}`);
  return lines.join("\n");
}

function jiraDescription() {
  return `【基本資訊】
需求人：${value("requester")}
單位：${value("department")}
平台：${value("platform")}
需求類型：${value("requestType")}
需求場景：${value("scenario")}
優先級：${value("priority")}

【需求摘要】
需求抬頭：${value("title")}
需求說明：${value("summary")}
預期產出：
${outputItemsText()}
張數：${value("quantity")}

${scenarioDescription()}

【交付時間】
期望 UI 交付日期：${value("uiDueDate")}
期望功能上線日：${value("onlineDate")}

【參考資料】
素材 / 附件：${value("assetLink")}
參考舊圖 / 舊活動：${value("legacyRef")}
Figma：${value("figmaLink")}
相關 Jira：${value("relatedJira")}
已選參考檔案：${selectedFiles().map((file) => file.name).join("、")}

【備註】
${value("notes")}`;
}

function backupRecord(key, url) {
  const project = projectKey(value("platform"), value("scenario"));
  const type = issueType(value("scenario"));
  const summary = jiraSummary();
  const detail = scenarioDescription();
  const selectedFileNames = selectedFiles().map((file) => file.name).join("、");
  const record = {
    submittedAt: new Date().toISOString(),
    jiraKey: key,
    jiraUrl: url,
    assignee: "未指派",
    project,
    issueType: type,
    summary,
    requester: value("requester"),
    department: value("department"),
    platform: value("platform"),
    requestType: value("requestType"),
    scenario: value("scenario"),
    priority: value("priority"),
    title: value("title"),
    quantity: value("quantity"),
    uiDueDate: value("uiDueDate"),
    onlineDate: value("onlineDate"),
    requestSummary: value("summary"),
    scenarioDetail: detail,
    jiraDescription: jiraDescription(),
    assetLink: value("assetLink"),
    figmaLink: value("figmaLink"),
    relatedJira: value("relatedJira"),
    legacyRef: value("legacyRef"),
    selectedFiles: selectedFileNames,
    notes: value("notes"),
    requestStatus: "未處理"
  };

  record.sheetRecord = {
    建立時間: record.submittedAt,
    Jira單號: record.jiraKey,
    Jira連結: record.jiraUrl,
    負責人: "未指派",
    Jira專案: project,
    工單類型: type,
    Jira標題: summary,
    需求人: record.requester,
    單位: record.department,
    平台: record.platform,
    需求類型: record.requestType,
    需求場景: record.scenario,
    優先級: record.priority,
    活動名稱: record.title,
    張數: record.quantity,
    交件日期: record.uiDueDate,
    上線日期: record.onlineDate,
    需求說明: record.requestSummary,
    場景明細: detail,
    素材或附件: record.assetLink,
    Figma: record.figmaLink,
    相關Jira: record.relatedJira,
    舊圖或舊活動: record.legacyRef,
    已選參考檔案: selectedFileNames,
    備註: record.notes,
    需求狀態: "未處理"
  };

  return record;
}

async function backupToGoogleSheet(record) {
  if (!GOOGLE_SHEET_BACKUP_URL) {
    backupStatus.textContent = "送出狀態：待建立 Apps Script 寫入權限";
    return false;
  }

  backupStatus.textContent = "送出狀態：正在建立 Jira 工單並備份...";

  try {
    await fetch(GOOGLE_SHEET_BACKUP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(record)
    });
    backupStatus.textContent = "送出狀態：已送出，請到 Jira 或 Google Sheet 確認單號";
    return true;
  } catch (error) {
    backupStatus.textContent = `送出狀態：送出失敗，${error.message}`;
    return false;
  }
}

function missingFields() {
  const required = [
    ["requester", "需求人"],
    ["department", "單位"],
    ["platform", "平台"],
    ["requestType", "需求類型"],
    ["title", "需求抬頭"],
    ["scenario", "需求場景"],
    ["quantity", "張數"],
    ["uiDueDate", "期望 UI 交付日期"],
    ["summary", "需求說明"]
  ];

  const missing = required.filter(([name]) => !value(name)).map(([, label]) => label);
  if (completedOutputItems().length === 0) missing.push("預期產出項目、尺寸與文字內容");
  return missing;
}

function updatePreview() {
  const platform = value("platform");
  const scenario = value("scenario");
  const project = projectKey(platform, scenario);
  const type = issueType(scenario);
  const missing = missingFields();
  const total = 10;
  const done = Math.max(0, total - missing.length);
  const percent = Math.round((done / total) * 100);

  projectPreview.textContent = project;
  issueTypePreview.textContent = type;
  dueDatePreview.textContent = value("uiDueDate") || "-";
  summaryPreview.value = jiraSummary();
  descriptionPreview.value = jiraDescription();
  completion.textContent = `${percent}% 完成`;
  completion.classList.toggle("done", missing.length === 0);

  missingList.innerHTML = "";
  if (missing.length === 0) {
    validationBox.classList.add("is-ok");
    validationBox.querySelector("strong").textContent = "可以建立";
    missingList.innerHTML = "<li>必填欄位已完整</li>";
  } else {
    validationBox.classList.remove("is-ok");
    validationBox.querySelector("strong").textContent = "待補欄位";
    missing.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      missingList.appendChild(li);
    });
  }

  submitButton.disabled = missing.length > 0 || isSubmitting || hasSubmitted;
  submitButton.textContent = hasSubmitted ? "已建立，請勿重複送出" : "建立 Jira 工單";
  if (!hasSubmitted && !isSubmitting) {
    resultBox.hidden = true;
  }
}

function fillSample() {
  const sample = {
    requester: "Annie",
    department: "運營",
    platform: "BB",
    requestType: "新增",
    title: "0704-05樂享-首單包賠",
    scenario: "直播間素材",
    quantity: "3",
    priority: "一般",
    uiDueDate: "2026-06-30",
    onlineDate: "2026-07-04",
    summary: "製作 0704-05 樂享首單包賠活動素材，包含朋友圈、封面、活動彈窗。",
    assetLink: "",
    legacyRef: "參考 0704-05 樂享首單包賠原文檔",
    notes: "請依照活動資訊製作朋友圈、封面與活動彈窗。"
  };

  Object.entries(sample).forEach(([name, data]) => {
    const field = form.elements[name];
    if (field) field.value = data;
  });

  renderScenarioFields();
  const outputList = document.querySelector("#outputList");
  outputList.innerHTML = [
    createOutputRow(
      "朋友圈",
      "375 x 812",
      "蔓蔓\n你投注我買單 x 包賠100%（主）\n專屬稱號 流水返券 現金紅包（小）\n2026-7-4 18:30 韓K聯 全北現代 - 江原FC\n2026-7-5 19:35 中超 上海申花 - 浙江隊"
    ),
    createOutputRow(
      "封面",
      "165 x 95",
      "蔓蔓、夢兒\n你投注我買單 x 包賠100%（主）\n專屬稱號 流水返券 現金紅包（小）"
    ),
    createOutputRow(
      "活動彈窗",
      "323 x 482",
      "蔓蔓、夢兒\n你投注我買單 x 包賠100%（主）\n專屬稱號、流水返券、現金紅包（小）\n\n活動內容：\n限本場賽事，當日累計充值≥100且首單有效投注≥100，會員根據首單投注的負盈利可獲得100元的包賠彩金。\n\n活動流程：\n進入直播間 → 點擊左邊活動浮標 → 點擊【我要報名】，進線找客服登記。\n\n活動規則：\n1. 活動僅限BB體育，當日累計充值≥100且首單有效投注≥100，負盈利僅對首單已結算並產生全輸結果來進行計算。\n2. 串關、對沖、提前結算、港賠0.75 / 歐賠1.75以下的首單投注將不列入活動計算。\n3. 獎勵於比賽結束48小時內審核派發，取款僅需3倍流水。\n4. 每位用戶僅限一個帳號參與本次活動，並只限領取一次獎勵。\n5. 為避免理解差異，平台保留本活動最終解釋權。"
    )
  ].join("");

  updatePreview();
}

async function simulateSubmit() {
  if (isSubmitting || hasSubmitted) return;

  isSubmitting = true;
  submitButton.disabled = true;
  submitButton.textContent = "建立中...";
  ticketKey.textContent = "已送出建立請求";
  ticketUrl.href = "https://mgbilibili.atlassian.net/jira/software/c/projects/UD/boards/21";
  ticketUrl.textContent = "前往 Jira 專案";
  resultBox.hidden = false;
  const success = await backupToGoogleSheet(backupRecord("", ""));

  isSubmitting = false;
  if (success) {
    hasSubmitted = true;
    submitButton.disabled = true;
    submitButton.textContent = "已建立，請勿重複送出";
    window.alert("建立成功");
  } else {
    submitButton.disabled = false;
    submitButton.textContent = "重新建立 Jira 工單";
  }
}

scenarioSelect.addEventListener("change", () => {
  renderScenarioFields();
  updatePreview();
});

scenarioFields.addEventListener("click", (event) => {
  if (event.target.closest("#addOutputItem")) {
    if (hasSubmitted) {
      hasSubmitted = false;
    }
    document.querySelector("#outputList").insertAdjacentHTML("beforeend", createOutputRow());
    updatePreview();
  }

  if (event.target.closest(".remove-output-button")) {
    if (hasSubmitted) {
      hasSubmitted = false;
    }
    const rows = [...document.querySelectorAll(".output-row")];
    if (rows.length > 1) {
      event.target.closest(".output-row").remove();
    } else {
      event.target.closest(".output-row").querySelectorAll("input, textarea").forEach((field) => {
        field.value = "";
      });
    }
    updatePreview();
  }
});

function handleFormEdit() {
  if (hasSubmitted) {
    hasSubmitted = false;
  }
  updatePreview();
}

form.addEventListener("input", handleFormEdit);
form.addEventListener("change", handleFormEdit);
referenceFiles.addEventListener("change", () => {
  if (hasSubmitted) {
    hasSubmitted = false;
  }
  renderFileList();
  updatePreview();
});
document.querySelector("#loadSample").addEventListener("click", fillSample);
document.querySelector("#resetForm").addEventListener("click", () => {
  hasSubmitted = false;
  isSubmitting = false;
  form.reset();
  renderFileList();
  renderScenarioFields();
  updatePreview();
});
submitButton.addEventListener("click", simulateSubmit);

renderScenarioFields();
renderFileList();
updatePreview();
