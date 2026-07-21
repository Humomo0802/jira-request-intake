var BT_SPREADSHEET_ID = "1cHApcumQHJy22LELj3HW7Cp72UGGOipe";
var BT_SHEET_NAME = "Jira開單備份";
var BT_DEFAULT_JIRA_BASE_URL = "https://mgbilibili.atlassian.net";
var BT_DEFAULT_JIRA_PROJECT_KEY = "UD";
var BT_DEFAULT_JIRA_ISSUE_TYPE = "Task";
var BT_APP_VERSION = "20260721-1540-colored-dropdown-chips";
var BT_ERROR_SHEET_NAME = "Apps Script錯誤紀錄";
var BT_TEMPLATE_ROW = 2;
var BT_FIRST_SYSTEM_ROW = 3;
var BT_HEADER_ROW_HEIGHT = 25;
var BT_DATA_ROW_HEIGHT = 80;

var BT_ASSIGNEE_OPTIONS = ["未指派", "Momo", "Pen", "Tracy", "Sushi"];
var BT_REQUEST_STATUS_OPTIONS = ["未處理", "UI處理中", "運營審核中", "技術開發中", "已完成"];

var BT_COLUMNS = [
  column_("submittedAt", "建立時間", "jira", 100),
  column_("jiraKey", "Jira單號", "jira", 100),
  column_("jiraUrl", "Jira連結", "jira", 100),
  column_("assignee", "負責人", "jira", 100),
  column_("project", "Jira專案", "jira", 100),
  column_("issueType", "工單類型", "jira", 100),
  column_("summary", "Jira標題", "jira", 260),
  column_("requester", "需求人", "base", 100),
  column_("department", "單位", "base", 100),
  column_("platform", "平台", "base", 100),
  column_("requestType", "需求類型", "base", 120),
  column_("scenario", "需求場景", "base", 120),
  column_("priority", "優先級", "base", 100),
  column_("title", "活動名稱", "base", 180),
  column_("quantity", "張數", "base", 80),
  column_("uiDueDate", "交件日期", "base", 110),
  column_("onlineDate", "上線日期", "base", 110),
  column_("requestSummary", "需求說明", "summary", 260),
  column_("scenarioDetail", "場景明細", "scenario", 420),
  column_("assetLink", "素材或附件", "reference", 220),
  column_("figmaLink", "Figma", "reference", 180),
  column_("relatedJira", "相關Jira", "reference", 120),
  column_("legacyRef", "舊圖或舊活動", "reference", 180),
  column_("selectedFiles", "已選參考檔案", "reference", 180),
  column_("notes", "備註", "note", 260),
  column_("requestStatus", "需求狀態", "status", 130)
];

function column_(key, label, group, width) {
  return {
    key: key,
    label: label,
    group: group,
    width: width
  };
}

function doGet() {
  setupHeaders();
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      version: BT_APP_VERSION,
      mappingMode: "sheetRecord-first-by-header-label",
      message: "Jira backup endpoint is ready."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    return handlePost_(e);
  } catch (error) {
    logPostError_(error);
    return jsonOutput_({
      ok: false,
      version: BT_APP_VERSION,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function handlePost_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    setupHeaders();
    return jsonOutput_({ ok: true, message: "setupHeaders completed." });
  }

  var payload = JSON.parse(e.postData.contents || "{}");
  var spreadsheet = SpreadsheetApp.openById(BT_SPREADSHEET_ID);
  var sheet = getOrCreateSheet_(spreadsheet);

  removeDeprecatedColumns_(sheet);
  ensureHeaders_(sheet);
  repairSheetData_(sheet);
  applySheetFormatting_(sheet);

  try {
    var jiraIssue = createJiraIssue_(payload);
    payload.jiraKey = jiraIssue.key || payload.jiraKey || "";
    payload.jiraUrl = jiraIssue.url || payload.jiraUrl || "";
  } catch (error) {
    payload.jiraKey = "建立失敗";
    payload.jiraUrl = "";
    payload.notes = appendNote_(payload.notes, "Jira 建立失敗：" + error.message);
  }

  payload.assignee = "未指派";
  payload.requestStatus = "未處理";
  payload.sheetRecord = payload.sheetRecord || {};
  payload.sheetRecord["Jira單號"] = payload.jiraKey || "";
  payload.sheetRecord["Jira連結"] = payload.jiraUrl || "";
  payload.sheetRecord["負責人"] = "未指派";
  payload.sheetRecord["備註"] = payload.notes || "";
  payload.sheetRecord["需求狀態"] = "未處理";

  appendPayloadByHeaders_(sheet, payload);
  repairSheetData_(sheet);
  applySheetFormatting_(sheet);

  return jsonOutput_({
    ok: true,
    version: BT_APP_VERSION,
    jiraKey: payload.jiraKey || "",
    jiraUrl: payload.jiraUrl || ""
  });
}

function setupHeaders() {
  var spreadsheet = SpreadsheetApp.openById(BT_SPREADSHEET_ID);
  var sheet = getOrCreateSheet_(spreadsheet);
  removeDeprecatedColumns_(sheet);
  ensureHeaders_(sheet);
  repairSheetData_(sheet);
  applySheetFormatting_(sheet);
}

function repairSheetRows() {
  var spreadsheet = SpreadsheetApp.openById(BT_SPREADSHEET_ID);
  var sheet = getOrCreateSheet_(spreadsheet);
  ensureHeaders_(sheet);
  repairSheetData_(sheet);
  applySheetFormatting_(sheet);
}

function testJiraConnection() {
  var config = jiraConfig_();
  var response = UrlFetchApp.fetch(config.baseUrl + "/rest/api/3/myself", {
    method: "get",
    headers: jiraHeaders_(config),
    muteHttpExceptions: true
  });
  Logger.log(response.getResponseCode());
  Logger.log(response.getContentText());
}

function testSheetMappingOnly() {
  var spreadsheet = SpreadsheetApp.openById(BT_SPREADSHEET_ID);
  var sheet = getOrCreateSheet_(spreadsheet);
  var payload = {
    submittedAt: new Date().toISOString(),
    jiraKey: "TEST-KEY",
    jiraUrl: "https://example.com/browse/TEST-KEY",
    assignee: "未指派",
    project: "UD",
    issueType: "Task",
    summary: "[BB][直播間素材][新增] 0704-05樂享-首單包賠",
    requester: "Annie",
    department: "運營",
    platform: "BB",
    requestType: "新增",
    scenario: "直播間素材",
    priority: "一般",
    title: "0704-05樂享-首單包賠",
    quantity: "3",
    uiDueDate: "2026-06-30",
    onlineDate: "2026-07-04",
    requestSummary: "測試欄位 mapping 是否正確",
    scenarioDetail: "【場景明細】\n預期產出：\n1. 朋友圈｜375 x 812",
    assetLink: "",
    figmaLink: "",
    relatedJira: "",
    legacyRef: "參考 0704-05 樂享首單包賠原文檔",
    selectedFiles: "",
    notes: "",
    requestStatus: "未處理"
  };

  ensureHeaders_(sheet);
  appendPayloadByHeaders_(sheet, payload);
  repairSheetData_(sheet);
  applySheetFormatting_(sheet);
}

function testFrontendSheetRecordMapping() {
  var spreadsheet = SpreadsheetApp.openById(BT_SPREADSHEET_ID);
  var sheet = getOrCreateSheet_(spreadsheet);
  var payload = {
    submittedAt: new Date().toISOString(),
    jiraKey: "",
    jiraUrl: "",
    assignee: "未指派",
    project: "UD",
    issueType: "Task",
    summary: "[BB][直播間素材][新增] 測試 sheetRecord mapping",
    requester: "jack",
    department: "運營",
    platform: "BB",
    requestType: "新增",
    scenario: "直播間素材",
    priority: "一般",
    title: "測試活動名稱",
    quantity: "3",
    uiDueDate: "2026-06-30",
    onlineDate: "2026-07-04",
    requestSummary: "這列是後端 testFrontendSheetRecordMapping 測試。",
    scenarioDetail: "【場景明細】\n1. 朋友圈｜375 x 812",
    assetLink: "",
    figmaLink: "",
    relatedJira: "",
    legacyRef: "測試舊圖或舊活動",
    selectedFiles: "",
    notes: "如果這列正確，代表 Apps Script mapping 正確。",
    requestStatus: "未處理"
  };

  payload.sheetRecord = buildSheetRecordFromPayload_(payload);

  ensureHeaders_(sheet);
  appendPayloadByHeaders_(sheet, payload);
  repairSheetData_(sheet);
  applySheetFormatting_(sheet);
}

function getOrCreateSheet_(spreadsheet) {
  return spreadsheet.getSheetByName(BT_SHEET_NAME) || spreadsheet.insertSheet(BT_SHEET_NAME);
}

function ensureHeaders_(sheet) {
  if (sheet.getMaxColumns() < BT_COLUMNS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), BT_COLUMNS.length - sheet.getMaxColumns());
  }

  var labels = BT_COLUMNS.map(function(column) {
    return column.label;
  });
  sheet.getRange(1, 1, 1, labels.length).setValues([labels]);
  sheet.setFrozenRows(1);
}

function appendMissingHeaders_(sheet, currentHeaders, labels) {
  var existing = {};
  currentHeaders.forEach(function(header) {
    var label = normalizeHeaderLabel_(header);
    if (label) existing[canonicalHeaderLabel_(label)] = true;
  });

  var nextColumn = currentHeaders.length + 1;
  labels.forEach(function(label) {
    if (!existing[canonicalHeaderLabel_(label)]) {
      sheet.getRange(1, nextColumn).setValue(label);
      nextColumn += 1;
    }
  });
}

function appendPayloadByHeaders_(sheet, payload) {
  payload.sheetRecord = payload.sheetRecord || buildSheetRecordFromPayload_(payload);
  var columnCount = Math.max(sheet.getLastColumn(), BT_COLUMNS.length);
  var headers = sheet.getRange(1, 1, 1, columnCount).getValues()[0];
  var row = new Array(columnCount).fill("");

  headers.forEach(function(header, index) {
    var column = columnByLabel_(header);
    if (column) {
      row[index] = valueForColumn_(payload, column);
    }
  });

  var nextRow = Math.max(sheet.getLastRow() + 1, BT_FIRST_SYSTEM_ROW);
  applyTemplateRowRules_(sheet, nextRow, columnCount);
  setRowValuesIgnoringValidation_(sheet, nextRow, columnCount, row);
  sheet.setRowHeightsForced(nextRow, 1, BT_DATA_ROW_HEIGHT);
}

function setRowValuesIgnoringValidation_(sheet, rowNumber, columnCount, rowValues) {
  var range = sheet.getRange(rowNumber, 1, 1, columnCount);
  var validations = range.getDataValidations();
  range.clearDataValidations();

  try {
    range.setValues([rowValues]);
  } finally {
    range.setDataValidations(validations);
  }
}

function logPostError_(error) {
  try {
    var spreadsheet = SpreadsheetApp.openById(BT_SPREADSHEET_ID);
    var sheet = spreadsheet.getSheetByName(BT_ERROR_SHEET_NAME) || spreadsheet.insertSheet(BT_ERROR_SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["發生時間", "版本", "錯誤訊息", "Stack"]);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      BT_APP_VERSION,
      error && error.message ? error.message : String(error),
      error && error.stack ? error.stack : ""
    ]);
  } catch (loggingError) {
    console.error(loggingError);
  }
}

function buildSheetRecordFromPayload_(payload) {
  var record = payload.sheetRecord || {};
  return {
    "建立時間": record["建立時間"] || payload.submittedAt || new Date().toISOString(),
    "Jira單號": record["Jira單號"] || payload.jiraKey || "",
    "Jira連結": record["Jira連結"] || payload.jiraUrl || "",
    "負責人": "未指派",
    "Jira專案": record["Jira專案"] || payload.project || BT_DEFAULT_JIRA_PROJECT_KEY,
    "工單類型": record["工單類型"] || payload.issueType || BT_DEFAULT_JIRA_ISSUE_TYPE,
    "Jira標題": record["Jira標題"] || payload.summary || payload.title || "",
    "需求人": record["需求人"] || payload.requester || "",
    "單位": record["單位"] || payload.department || "",
    "平台": record["平台"] || payload.platform || "",
    "需求類型": record["需求類型"] || payload.requestType || "",
    "需求場景": record["需求場景"] || payload.scenario || "",
    "優先級": record["優先級"] || payload.priority || "",
    "活動名稱": record["活動名稱"] || payload.title || "",
    "張數": record["張數"] || payload.quantity || "",
    "交件日期": record["交件日期"] || payload.uiDueDate || "",
    "上線日期": record["上線日期"] || payload.onlineDate || "",
    "需求說明": record["需求說明"] || payload.requestSummary || "",
    "場景明細": record["場景明細"] || payload.scenarioDetail || extractScenarioDetail_(payload.jiraDescription) || "",
    "素材或附件": record["素材或附件"] || payload.assetLink || "",
    "Figma": record["Figma"] || payload.figmaLink || "",
    "相關Jira": record["相關Jira"] || payload.relatedJira || "",
    "舊圖或舊活動": record["舊圖或舊活動"] || payload.legacyRef || "",
    "已選參考檔案": record["已選參考檔案"] || payload.selectedFiles || "",
    "備註": record["備註"] || payload.notes || "",
    "需求狀態": "未處理"
  };
}

function applyTemplateRowRules_(sheet, targetRow, columnCount) {
  if (sheet.getLastRow() < BT_TEMPLATE_ROW || targetRow <= BT_TEMPLATE_ROW || columnCount < 1) return;

  var templateRange = sheet.getRange(BT_TEMPLATE_ROW, 1, 1, columnCount);
  var targetRange = sheet.getRange(targetRow, 1, 1, columnCount);
  templateRange.copyTo(targetRange, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  templateRange.copyTo(targetRange, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
}

function columnByLabel_(label) {
  var normalizedLabel = canonicalHeaderLabel_(label);
  for (var index = 0; index < BT_COLUMNS.length; index += 1) {
    if (canonicalHeaderLabel_(BT_COLUMNS[index].label) === normalizedLabel) {
      return BT_COLUMNS[index];
    }
  }
  return null;
}

function normalizeHeaderLabel_(label) {
  return String(label || "").trim();
}

function canonicalHeaderLabel_(label) {
  var normalized = normalizeHeaderLabel_(label);
  if (normalized === "開單狀態") return "需求狀態";
  return normalized;
}

function valueForColumn_(payload, column) {
  var sheetRecord = payload.sheetRecord || buildSheetRecordFromPayload_(payload);
  var sheetValue = sheetRecord[column.label];

  if (column.key === "assignee") {
    return "未指派";
  }

  if (column.key === "project") {
    return payload.project || BT_DEFAULT_JIRA_PROJECT_KEY;
  }

  if (column.key === "issueType") {
    return payload.issueType || BT_DEFAULT_JIRA_ISSUE_TYPE;
  }

  if (column.key === "summary") {
    return payload.summary || payload.title || "";
  }

  if (column.key === "requestStatus") {
    return "未處理";
  }

  if (sheetValue !== undefined && sheetValue !== null) {
    return sheetValue;
  }

  if (column.key === "scenarioDetail") {
    var detail = payload.scenarioDetail || extractScenarioDetail_(payload.jiraDescription) || "";
    if (looksLikeScenarioDetail_(payload.assetLink)) {
      detail = detail ? detail + "\n\n" + payload.assetLink : payload.assetLink;
    }
    return detail;
  }

  if (column.key === "assetLink") {
    if (looksLikeScenarioDetail_(payload.assetLink)) {
      return "";
    }
    return payload.assetLink || "";
  }

  return payload[column.key] || "";
}

function createJiraIssue_(payload) {
  var config = jiraConfig_();
  if (!config.email || !config.apiToken) {
    throw new Error("尚未設定 JIRA_EMAIL 或 JIRA_API_TOKEN。");
  }

  var summary = payload.summary || payload.title || "未命名需求";
  var description = payload.jiraDescription || payload.scenarioDetail || payload.requestSummary || "";
  var dueDate = normalizeJiraDate_(payload.uiDueDate || payload.onlineDate);

  var fields = {
    project: { key: payload.project || config.projectKey },
    issuetype: { name: payload.issueType || config.issueType },
    summary: summary,
    description: textToAdf_(description)
  };

  if (dueDate) {
    fields.duedate = dueDate;
  }

  var response = UrlFetchApp.fetch(config.baseUrl + "/rest/api/3/issue", {
    method: "post",
    contentType: "application/json",
    headers: jiraHeaders_(config),
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error("Jira API 回傳 " + code + "：" + body);
  }

  var data = JSON.parse(body || "{}");
  return {
    key: data.key || "",
    url: data.key ? config.baseUrl + "/browse/" + data.key : ""
  };
}

function jiraConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    baseUrl: stripTrailingSlash_(props.getProperty("JIRA_BASE_URL") || BT_DEFAULT_JIRA_BASE_URL),
    email: props.getProperty("JIRA_EMAIL") || "",
    apiToken: props.getProperty("JIRA_API_TOKEN") || "",
    projectKey: props.getProperty("JIRA_PROJECT_KEY") || BT_DEFAULT_JIRA_PROJECT_KEY,
    issueType: props.getProperty("JIRA_ISSUE_TYPE") || BT_DEFAULT_JIRA_ISSUE_TYPE
  };
}

function jiraHeaders_(config) {
  var token = Utilities.base64Encode(config.email + ":" + config.apiToken);
  return {
    Authorization: "Basic " + token,
    Accept: "application/json"
  };
}

function textToAdf_(text) {
  var lines = String(text || "").split("\n");
  return {
    type: "doc",
    version: 1,
    content: lines.map(function(line) {
      return {
        type: "paragraph",
        content: line ? [{ type: "text", text: line }] : []
      };
    })
  };
}

function normalizeJiraDate_(value) {
  var text = String(value || "").trim();
  if (!text) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  var match = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (match) {
    return match[1] + "-" + pad2_(match[2]) + "-" + pad2_(match[3]);
  }

  var parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  return "";
}

function pad2_(value) {
  return String(value).padStart(2, "0");
}

function stripTrailingSlash_(value) {
  return String(value || "").replace(/\/+$/, "");
}

function appendNote_(notes, extra) {
  var base = String(notes || "").trim();
  return base ? base + "\n" + extra : extra;
}

function normalizeAssignee_(assignee) {
  if (BT_ASSIGNEE_OPTIONS.indexOf(assignee) !== -1) {
    return assignee;
  }
  return "未指派";
}

function normalizeRequestStatus_(status) {
  if (BT_REQUEST_STATUS_OPTIONS.indexOf(status) !== -1) {
    return status;
  }
  return "未處理";
}

function repairSheetData_(sheet) {
  repairMisalignedRows_(sheet);
  repairRequesterShiftedIntoSummary_(sheet);
  repairScenarioDetailText_(sheet);
  repairScenarioAssetColumns_(sheet);
  normalizeDropdownValues_(sheet);
}

function repairRequesterShiftedIntoSummary_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow <= 1 || lastColumn === 0) return;

  var summaryIndex = sheetColumnIndex_(sheet, "Jira標題");
  var requesterIndex = sheetColumnIndex_(sheet, "需求人");
  var departmentIndex = sheetColumnIndex_(sheet, "單位");
  var platformIndex = sheetColumnIndex_(sheet, "平台");
  var requestTypeIndex = sheetColumnIndex_(sheet, "需求類型");
  var scenarioIndex = sheetColumnIndex_(sheet, "需求場景");
  var titleIndex = sheetColumnIndex_(sheet, "活動名稱");
  var statusIndex = statusColumnIndex_(sheet);

  if (
    summaryIndex < 1 ||
    requesterIndex < 1 ||
    departmentIndex < 1 ||
    platformIndex < 1 ||
    requestTypeIndex < 1 ||
    scenarioIndex < 1 ||
    titleIndex < 1 ||
    statusIndex < 1
  ) {
    return;
  }

  var range = sheet.getRange(2, 1, lastRow - 1, lastColumn);
  var values = range.getValues();
  var changed = false;

  for (var row = 0; row < values.length; row += 1) {
    var rowValues = values[row];
    var summary = rowValues[summaryIndex - 1];
    var requester = rowValues[requesterIndex - 1];
    var department = rowValues[departmentIndex - 1];
    var platform = rowValues[platformIndex - 1];

    if (looksLikeRequesterShiftedIntoSummary_(summary, requester, department, platform)) {
      for (var col = statusIndex - 1; col > summaryIndex - 1; col -= 1) {
        rowValues[col] = rowValues[col - 1];
      }

      rowValues[summaryIndex - 1] = buildSummaryFromRow_(rowValues, platformIndex, scenarioIndex, requestTypeIndex, titleIndex);
      rowValues[statusIndex - 1] = "未處理";
      changed = true;
    }
  }

  if (changed) {
    range.setValues(values);
  }
}

function repairScenarioDetailText_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow <= 1 || lastColumn === 0) return;

  var scenarioDetailIndex = sheetColumnIndex_(sheet, "場景明細");
  if (scenarioDetailIndex < 1) return;

  var range = sheet.getRange(2, scenarioDetailIndex, lastRow - 1, 1);
  var values = range.getValues();
  var changed = false;

  for (var row = 0; row < values.length; row += 1) {
    var text = String(values[row][0] || "");
    var cleaned = extractScenarioDetail_(text);
    if (cleaned && cleaned !== text) {
      values[row][0] = cleaned;
      changed = true;
    }
  }

  if (changed) {
    range.setValues(values);
  }
}

function repairMisalignedRows_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow <= 1 || lastColumn === 0) return;

  var assigneeIndex = sheetColumnIndex_(sheet, "負責人");
  var projectIndex = sheetColumnIndex_(sheet, "Jira專案");
  var issueTypeIndex = sheetColumnIndex_(sheet, "工單類型");
  var statusIndex = statusColumnIndex_(sheet);
  if (assigneeIndex < 1 || projectIndex < 1 || issueTypeIndex < 1 || statusIndex < 1) return;

  var range = sheet.getRange(2, 1, lastRow - 1, lastColumn);
  var values = range.getValues();
  var changed = false;

  for (var row = 0; row < values.length; row += 1) {
    var rowValues = values[row];
    var assignee = rowValues[assigneeIndex - 1];
    var project = rowValues[projectIndex - 1];

    if (isLikelyProjectKey_(assignee) && isLikelyIssueType_(project)) {
      for (var col = statusIndex - 1; col > assigneeIndex - 1; col -= 1) {
        rowValues[col] = rowValues[col - 1];
      }
      rowValues[assigneeIndex - 1] = "未指派";
      rowValues[statusIndex - 1] = "未處理";
      changed = true;
    }
  }

  if (changed) {
    range.setValues(values);
  }
}

function repairScenarioAssetColumns_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow <= 1 || lastColumn === 0) return;

  var scenarioDetailIndex = sheetColumnIndex_(sheet, "場景明細");
  var assetLinkIndex = sheetColumnIndex_(sheet, "素材或附件");
  if (scenarioDetailIndex < 1 || assetLinkIndex < 1) return;

  var range = sheet.getRange(2, 1, lastRow - 1, lastColumn);
  var values = range.getValues();
  var changed = false;

  for (var row = 0; row < values.length; row += 1) {
    var rowValues = values[row];
    var scenarioDetail = rowValues[scenarioDetailIndex - 1];
    var assetLink = rowValues[assetLinkIndex - 1];

    if (looksLikeScenarioDetail_(assetLink)) {
      rowValues[scenarioDetailIndex - 1] = scenarioDetail ?
        String(scenarioDetail) + "\n\n" + assetLink :
        assetLink;
      rowValues[assetLinkIndex - 1] = "";
      changed = true;
    }
  }

  if (changed) {
    range.setValues(values);
  }
}

function normalizeDropdownValues_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow <= 1 || lastColumn === 0) return;

  var assigneeIndex = sheetColumnIndex_(sheet, "負責人");
  var statusIndex = statusColumnIndex_(sheet);
  if (assigneeIndex < 1 || statusIndex < 1) return;

  var range = sheet.getRange(2, 1, lastRow - 1, lastColumn);
  var values = range.getValues();
  var changed = false;

  for (var row = 0; row < values.length; row += 1) {
    var rowValues = values[row];
    var assignee = rowValues[assigneeIndex - 1];
    var status = rowValues[statusIndex - 1];

    if (BT_ASSIGNEE_OPTIONS.indexOf(assignee) === -1) {
      rowValues[assigneeIndex - 1] = "未指派";
      changed = true;
    }

    if (BT_REQUEST_STATUS_OPTIONS.indexOf(status) === -1) {
      rowValues[statusIndex - 1] = "未處理";
      changed = true;
    }
  }

  if (changed) {
    range.setValues(values);
  }
}

function removeDeprecatedColumns_(sheet) {
  var deprecatedLabels = ["輸出項目", "jiraDescription"];
  var lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) return;

  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  for (var index = headers.length - 1; index >= 0; index -= 1) {
    if (deprecatedLabels.indexOf(headers[index]) !== -1) {
      sheet.deleteColumn(index + 1);
    }
  }
}

function applySheetFormatting_(sheet) {
  var maxRows = Math.max(sheet.getMaxRows(), 1000);
  var columnCount = Math.max(sheet.getLastColumn(), BT_COLUMNS.length);

  if (sheet.getMaxRows() < maxRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), maxRows - sheet.getMaxRows());
  }

  if (sheet.getMaxColumns() < columnCount) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), columnCount - sheet.getMaxColumns());
  }

  var headerRange = sheet.getRange(1, 1, 1, columnCount);
  headerRange
    .setFontWeight("bold")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), columnCount).setWrap(true);
  sheet.getRange(1, 1, maxRows, columnCount).setVerticalAlignment("middle");
  sheet.setRowHeight(1, BT_HEADER_ROW_HEIGHT);
  sheet.setRowHeightsForced(2, maxRows - 1, BT_DATA_ROW_HEIGHT);

  var headers = sheet.getRange(1, 1, 1, columnCount).getValues()[0];
  for (var index = 0; index < columnCount; index += 1) {
    var column = columnByLabel_(headers[index]) || BT_COLUMNS[index] || column_("", "", "base", 120);
    var columnNumber = index + 1;
    var colors = groupColors_(column.group);

    if (column.width) {
      sheet.setColumnWidth(columnNumber, column.width);
    }
    sheet.getRange(1, columnNumber).setBackground(colors.header);
    sheet.getRange(2, columnNumber, maxRows - 1, 1)
      .setBackground(colors.body)
      .setNumberFormat(numberFormatForColumn_(column));
  }

  applyDropdownValidation_(sheet, "負責人", BT_ASSIGNEE_OPTIONS);
  applyDropdownValidation_(sheet, "需求狀態", BT_REQUEST_STATUS_OPTIONS);

  var filter = sheet.getFilter();
  if (filter) filter.remove();
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), columnCount).createFilter();
}

function numberFormatForColumn_(column) {
  if (column.key === "quantity") {
    return "0";
  }

  if (column.key === "uiDueDate" || column.key === "onlineDate") {
    return "yyyy-mm-dd";
  }

  return "@";
}

function groupColors_(group) {
  var map = {
    jira: { header: "#1d4ed8", body: "#eaf3ff" },
    base: { header: "#60a5fa", body: "#f1f7ff" },
    summary: { header: "#64748b", body: "#f8fafc" },
    scenario: { header: "#059669", body: "#ecfdf5" },
    reference: { header: "#d97706", body: "#fff8e6" },
    note: { header: "#64748b", body: "#f8fafc" },
    status: { header: "#7c3aed", body: "#ffffff" }
  };
  return map[group] || map.base;
}

function applyDropdownValidation_(sheet, label, options) {
  var index = sheetColumnIndex_(sheet, label);
  if (index < 1) return;

  var maxRows = Math.max(sheet.getMaxRows(), 1000);
  var range = sheet.getRange(2, index, maxRows - 1, 1);
  var templateCell = sheet.getRange(BT_TEMPLATE_ROW, index);
  var existingValidation = templateCell.getDataValidation();

  if (existingValidation) {
    templateCell.copyTo(range, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    return;
  }

  var validation = SpreadsheetApp.newDataValidation()
    .requireValueInList(options, true)
    .setAllowInvalid(false)
    .build();

  range.setDataValidation(validation);
}

function columnIndex_(label) {
  var normalizedLabel = canonicalHeaderLabel_(label);
  for (var index = 0; index < BT_COLUMNS.length; index += 1) {
    if (canonicalHeaderLabel_(BT_COLUMNS[index].label) === normalizedLabel) {
      return index + 1;
    }
  }
  return -1;
}

function sheetColumnIndex_(sheet, label) {
  var lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) return -1;

  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var normalizedLabel = canonicalHeaderLabel_(label);
  for (var index = 0; index < headers.length; index += 1) {
    if (canonicalHeaderLabel_(headers[index]) === normalizedLabel) {
      return index + 1;
    }
  }
  return -1;
}

function statusColumnIndex_(sheet) {
  var index = sheetColumnIndex_(sheet, "需求狀態");
  if (index > 0) return index;
  return sheetColumnIndex_(sheet, "開單狀態");
}

function looksLikeScenarioDetail_(value) {
  var text = String(value || "");
  if (!text) return false;
  return text.indexOf("預期產出") !== -1 ||
    text.indexOf("文字內容 / 備註") !== -1 ||
    text.indexOf("【場景明細】") !== -1 ||
    text.indexOf("活動內容") !== -1 ||
    text.indexOf("活動流程") !== -1 ||
    text.indexOf("活動規則") !== -1 ||
    text.length > 120;
}

function extractScenarioDetail_(value) {
  var text = String(value || "").trim();
  if (!text) return "";

  var marker = "【場景明細】";
  var start = text.indexOf(marker);
  if (start === -1) {
    return text;
  }

  var detail = text.slice(start);
  var nextSection = detail.search(/\n【交付時間】|\n【參考資料】|\n【備註】/);
  if (nextSection !== -1) {
    detail = detail.slice(0, nextSection);
  }

  return detail.trim();
}

function isLikelyProjectKey_(value) {
  return value === "UD" || value === "BB1" || value === "YY1";
}

function isLikelyIssueType_(value) {
  return value === "Task" || value === "Story" || value === "Bug";
}

function looksLikeRequesterShiftedIntoSummary_(summary, requester, department, platform) {
  var summaryText = String(summary || "").trim();
  if (!summaryText || summaryText.indexOf("[") === 0) return false;
  return isLikelyDepartment_(requester) &&
    isLikelyPlatform_(department) &&
    isLikelyRequestType_(platform);
}

function buildSummaryFromRow_(rowValues, platformIndex, scenarioIndex, requestTypeIndex, titleIndex) {
  var platform = rowValues[platformIndex - 1] || "平台";
  var scenario = rowValues[scenarioIndex - 1] || "需求場景";
  var requestType = rowValues[requestTypeIndex - 1] || "類型";
  var title = rowValues[titleIndex - 1] || "需求抬頭";
  return "[" + platform + "][" + scenario + "][" + requestType + "] " + title;
}

function isLikelyDepartment_(value) {
  return ["運營", "代理", "PM", "主播"].indexOf(value) !== -1;
}

function isLikelyPlatform_(value) {
  return ["YY", "BB", "其他"].indexOf(value) !== -1;
}

function isLikelyRequestType_(value) {
  return ["新增", "調整", "換皮"].indexOf(value) !== -1;
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
