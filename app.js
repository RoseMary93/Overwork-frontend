// ===== State =====
let token = localStorage.getItem("token") || null;
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let worklogs = [];

// ===== DOM Elements =====
const landingSection = document.getElementById("landing-section");
const loginSection = document.getElementById("login-section");
const registerSection = document.getElementById("register-section");
const mainSection = document.getElementById("main-section");

// Buttons (Landing)
const goLoginBtn = document.getElementById("go-login-btn");
const goRegisterLink = document.getElementById("go-register-link");

// Forms
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginError = document.getElementById("login-error");

// Main UI
const welcomeMsg = document.getElementById("welcome-msg");
const logoutBtn = document.getElementById("logout-btn");
const lastMonthHoursEl = document.getElementById("last-month-hours");
const currentMonthHoursEl = document.getElementById("current-month-hours");
const worklogList = document.getElementById("worklog-list");
const btnAddWorklog = document.getElementById("btn-add-worklog");
const btnExport = document.getElementById("btn-export");
const heatmapGrid = document.getElementById("heatmap-grid");

// ===== API Helper =====
async function api(endpoint, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      logout();
    }
    throw new Error(data.message || "請求失敗");
  }

  return data;
}

// ===== Auth =====
async function login(username, password) {
  const data = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  token = data.token;
  currentUser = data.user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(currentUser));
  return data;
}

async function register(username, password, display_name) {
  const data = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password, display_name }),
  });
  token = data.token;
  currentUser = data.user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(currentUser));
  return data;
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  showLanding();
}

// ===== Navigation =====
function hideAllSections() {
  landingSection.classList.add("hidden");
  loginSection.classList.add("hidden");
  registerSection.classList.add("hidden");
  mainSection.classList.add("hidden");
}

function showLanding() {
  hideAllSections();
  landingSection.classList.remove("hidden");
}

function showLogin() {
  hideAllSections();
  loginSection.classList.remove("hidden");
}

function showRegister() {
  hideAllSections();
  registerSection.classList.remove("hidden");
}

function showMain() {
  hideAllSections();
  mainSection.classList.remove("hidden");
  if (currentUser) {
    welcomeMsg.textContent = `${currentUser.display_name}，今天辛苦了！`;
  }
  loadWorklogs();
}

// ===== Helper Functions =====
function formatExcelDate(value) {
  if (!value) return "";
  // Check if it's a serial number (e.g., 46046)
  if (!isNaN(value) && !value.toString().includes("-")) {
    // Excel base date is 1899-12-30
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().split("T")[0];
  }
  // Assume it's already a date string
  return value;
}

// 根據加班時數給予回應
function getOvertimeMessage(hours) {
  if (hours <= 0.5) return "效率很高喔~下班下班";
  if (hours <= 1) return "辛苦了！吃飯去";
  if (hours <= 1.5) return "趕快回家休息吧！";
  if (hours <= 2) return "有點晚了，回家注意安全！";
  if (hours <= 2.5) return "現在才下班，回家只能洗洗睡了(T T)";
  if (hours <= 3) return "為什麼要加班到這麼晚！";
  if (hours <= 4) return "多工作半天，薪水有變多嗎？";
  if (hours <= 5) return "有這麼多事怎麼不隔天再做(o_o)";
  if (hours <= 6) return "要不要直接睡在公司？";
  return "「up3h;6vmp4vu6，ji3ru04u4su3xu656~」";
}

// 根據本月加班時數給予評語
function getMonthlyComment(totalHours) {
  if (totalHours === 0) return "本月還沒加班，保持下去！";
  if (totalHours <= 5) return "加班時數還算正常，繼續保持！";
  if (totalHours <= 10) return "有點累了吧？記得休息喔~";
  if (totalHours <= 15) return "加班有點多了，注意身體！";
  if (totalHours <= 20) return "這個月辛苦了，多休息吧！";
  if (totalHours <= 25) return "加班時數偏高，要注意健康喔！";
  if (totalHours <= 30) return "工作狂？記得適度休息！";
  if (totalHours <= 35) return "這樣下去會過勞的...";
  if (totalHours <= 40) return "已經快到極限了，好好照顧自己！";
  if (totalHours <= 46) return "嚴重超時！該考慮換工作了嗎？";
  return "超過勞基法上限了喔~是不是該離職呢xd";
}

// ===== Data Loading =====
async function loadWorklogs() {
  try {
    const data = await api("/api/worklogs");
    worklogs = data.data || [];
    renderWorklogs();
    updateSummary();
    renderHeatmap();
  } catch (error) {
    console.error(error);
  }
}

// ===== Render Functions =====
function renderWorklogs() {
  if (worklogs.length === 0) {
    worklogList.innerHTML = `<div style="text-align:center; padding:20px; color:#9ca095;">
      🍃 還沒有加班紀錄，是福氣嗎？
    </div>`;
    return;
  }

  worklogList.innerHTML = worklogs
    .map((log) => {
      const displayDate = formatExcelDate(log.date);
      return `
      <div class="transaction-item">
        <div class="left">
          <div class="category-icon" style="background-color: #5abf98;">
            ⏰
          </div>
          <div class="info">
            <span class="note">${log.reason}</span>
            <span class="meta">${displayDate} ${log.notes ? `· ${log.notes}` : ""
        }</span>
          </div>
        </div>
        <div class="right">
          <span class="amount expense">
            ${log.duration_hours} hr
          </span>
          <button class="edit-btn" onclick="window.editWorklog('${log.id
        }')">✎</button>
          <button class="delete-btn" onclick="window.deleteWorklog('${log.id
        }')">✕</button>
        </div>
      </div>
    `;
    })
    .join("");
}

function updateSummary() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based

  // Calculate Last Month
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonth = lastMonthDate.getMonth();

  const currentMonthLogs = worklogs.filter((log) => {
    const formattedDate = formatExcelDate(log.date);
    const logDate = new Date(formattedDate);
    return (
      logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth
    );
  });

  const lastMonthLogs = worklogs.filter((log) => {
    const formattedDate = formatExcelDate(log.date);
    const logDate = new Date(formattedDate);
    return (
      logDate.getFullYear() === lastMonthYear && logDate.getMonth() === lastMonth
    );
  });

  const currentTotal = currentMonthLogs.reduce(
    (sum, log) => sum + Number(log.duration_hours),
    0
  );

  const lastTotal = lastMonthLogs.reduce(
    (sum, log) => sum + Number(log.duration_hours),
    0
  );

  currentMonthHoursEl.textContent = currentTotal.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  lastMonthHoursEl.textContent = lastTotal.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  // 更新本月評語
  const monthlyCommentEl = document.getElementById("monthly-comment");
  if (monthlyCommentEl) {
    monthlyCommentEl.textContent = getMonthlyComment(currentTotal);
  }
}

function renderHeatmap() {
  if (!heatmapGrid) return;
  heatmapGrid.innerHTML = "";

  const today = new Date();
  // Generate last 28 days (4 weeks)
  const days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  // Aggregate hours
  const hoursMap = {};
  worklogs.forEach((log) => {
    const dateStr = formatExcelDate(log.date);
    if (!hoursMap[dateStr]) hoursMap[dateStr] = 0;
    hoursMap[dateStr] += Number(log.duration_hours);
  });

  days.forEach((date) => {
    const dateStr = date.toISOString().split("T")[0];
    const hours = hoursMap[dateStr] || 0;

    let level = 0;
    if (hours > 0) level = 1;
    if (hours >= 1) level = 2; // >= 1
    if (hours >= 2) level = 3; // >= 2
    if (hours >= 4) level = 4; // >= 4

    const el = document.createElement("div");
    el.className = `heatmap-day level-${level}`;
    el.dataset.date = `${dateStr.slice(5)}: ${hours}hr`; // Show MM-DD
    el.title = `${dateStr}: ${hours}小時`;
    heatmapGrid.appendChild(el);
  });
}

function exportLastMonthReport() {
  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const targetYear = lastMonthDate.getFullYear();
  const targetMonth = lastMonthDate.getMonth(); // 0-based

  const targetLogs = worklogs.filter((log) => {
    const d = new Date(formatExcelDate(log.date));
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  });

  if (targetLogs.length === 0) {
    Swal.fire("沒資料", "上個月沒有加班紀錄 (是好事還是壞事？)", "info");
    return;
  }

  // Sort by date
  targetLogs.sort((a, b) => {
    return new Date(formatExcelDate(a.date)) - new Date(formatExcelDate(b.date));
  });

  let csvContent = "\uFEFF"; // BOM for Excel encoding
  csvContent += "日期,時數,原因,備註\n";

  targetLogs.forEach((log) => {
    const date = formatExcelDate(log.date);
    const reason = (log.reason || "").replace(/,/g, "，").replace(/\n/g, " ");
    const notes = (log.notes || "").replace(/,/g, "，").replace(/\n/g, " ");
    csvContent += `${date},${log.duration_hours},${reason},${notes}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `加班報表_${targetYear}_${targetMonth + 1}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===== Modals =====

async function openAddWorklogModal() {
  const today = new Date().toISOString().split("T")[0];

  const { value: formValues } = await Swal.fire({
    title: "紀錄加班",
    html: `
      <form id="swal-form" class="swal-form">
        <div class="form-group">
          <label>日期</label>
          <input type="date" id="swal-date" class="swal2-input" value="${today}" required>
        </div>
        <div class="form-group">
          <label>時數 (小時)</label>
          <input type="number" id="swal-hours" class="swal2-input" placeholder="0.5" step="0.5" min="0" required>
        </div>
        <div class="form-group">
          <label>加班原因</label>
          <input type="text" id="swal-reason" class="swal2-input" placeholder="例如：趕專案、開會" required>
        </div>
        <div class="form-group">
          <label>備註 (選填)</label>
          <input type="text" id="swal-notes" class="swal2-input" placeholder="心情札記...">
        </div>
      </form>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "紀錄",
    cancelButtonText: "取消",
    confirmButtonColor: "#5abf98",
    preConfirm: () => {
      const date = document.getElementById("swal-date").value;
      const hours = document.getElementById("swal-hours").value;
      const reason = document.getElementById("swal-reason").value;
      const notes = document.getElementById("swal-notes").value;

      if (!date || !hours || !reason) {
        Swal.showValidationMessage("請填寫日期、時數與原因");
        return false;
      }

      return {
        date,
        duration_hours: Number(hours),
        reason,
        notes,
      };
    },
  });

  if (formValues) {
    Swal.fire({
      title: "處理中...",
      didOpen: () => Swal.showLoading(),
    });

    try {
      await api("/api/worklogs", {
        method: "POST",
        body: JSON.stringify(formValues),
      });
      await loadWorklogs();
      const message = getOvertimeMessage(formValues.duration_hours);
      Swal.fire("成功", message, "success");
    } catch (error) {
      Swal.fire("失敗", error.message, "error");
    }
  }
}

window.editWorklog = async function (id) {
  const log = worklogs.find((l) => l.id === id);
  if (!log) return;

  const { value: formValues } = await Swal.fire({
    title: "編輯紀錄",
    html: `
      <form id="swal-form" class="swal-form">
        <div class="form-group">
          <label>日期</label>
          <input type="date" id="swal-date" class="swal2-input" value="${formatExcelDate(log.date)
      }" required>
        </div>
        <div class="form-group">
          <label>時數 (小時)</label>
          <input type="number" id="swal-hours" class="swal2-input" value="${log.duration_hours
      }" step="0.5" min="0" required>
        </div>
        <div class="form-group">
          <label>加班原因</label>
          <input type="text" id="swal-reason" class="swal2-input" value="${log.reason
      }" required>
        </div>
        <div class="form-group">
          <label>備註 (選填)</label>
          <input type="text" id="swal-notes" class="swal2-input" value="${log.notes || ""
      }">
        </div>
      </form>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "儲存",
    cancelButtonText: "取消",
    confirmButtonColor: "#5abf98",
    preConfirm: () => {
      const date = document.getElementById("swal-date").value;
      const hours = document.getElementById("swal-hours").value;
      const reason = document.getElementById("swal-reason").value;
      const notes = document.getElementById("swal-notes").value;

      if (!date || !hours || !reason) {
        Swal.showValidationMessage("請填寫日期、時數與原因");
        return false;
      }

      return {
        date,
        duration_hours: Number(hours),
        reason,
        notes,
      };
    },
  });

  if (formValues) {
    Swal.fire({
      title: "更新中...",
      didOpen: () => Swal.showLoading(),
    });

    try {
      await api(`/api/worklogs/${id}`, {
        method: "PUT",
        body: JSON.stringify(formValues),
      });
      await loadWorklogs();
      Swal.fire("成功", "紀錄已更新", "success");
    } catch (error) {
      Swal.fire("失敗", error.message, "error");
    }
  }
};

window.deleteWorklog = async function (id) {
  const result = await Swal.fire({
    title: "確定要刪除嗎？",
    text: "這筆血淚史將被抹去...",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ff7675",
    confirmButtonText: "刪除",
    cancelButtonText: "保留",
  });

  if (result.isConfirmed) {
    try {
      await api(`/api/worklogs/${id}`, { method: "DELETE" });
      await loadWorklogs();
      Swal.fire("已刪除", "紀錄已清空", "success");
    } catch (error) {
      Swal.fire("失敗", error.message, "error");
    }
  }
};

// ===== Event Listeners =====
goLoginBtn.addEventListener("click", showLogin);
goRegisterLink.addEventListener("click", showRegister);

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    await login(username, password);
    showMain();
  } catch (error) {
    loginError.textContent = error.message;
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("reg-username").value;
  const displayName = document.getElementById("reg-display-name").value;
  const password = document.getElementById("reg-password").value;

  try {
    await register(username, password, displayName);
    showMain();
    Swal.fire("歡迎加入", "註冊成功！", "success");
  } catch (error) {
    Swal.fire("註冊失敗", error.message, "error");
  }
});

logoutBtn.addEventListener("click", logout);
btnAddWorklog.addEventListener("click", openAddWorklogModal);
btnExport.addEventListener("click", exportLastMonthReport);

// ===== Initialize =====
async function init() {
  if (token) {
    showMain();
  } else {
    showLanding();
  }
}

init();
