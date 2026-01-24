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
const totalHoursEl = document.getElementById("total-hours");
const worklogList = document.getElementById("worklog-list");
const btnAddWorklog = document.getElementById("btn-add-worklog");

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

// ===== Data Loading =====
async function loadWorklogs() {
  try {
    const data = await api("/api/worklogs");
    worklogs = data.data || [];
    renderWorklogs();
    updateSummary();
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
    .map(
      (log) => `
      <div class="transaction-item">
        <div class="left">
          <div class="category-icon" style="background-color: #5abf98;">
            ⏰
          </div>
          <div class="info">
            <span class="note">${log.reason}</span>
            <span class="meta">${log.date} ${log.notes ? `· ${log.notes}` : ""
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
    `
    )
    .join("");
}

function updateSummary() {
  // Calculate total hours
  const total = worklogs.reduce(
    (sum, log) => sum + Number(log.duration_hours),
    0
  );
  totalHoursEl.textContent = total.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
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
      Swal.fire("成功", "加班紀錄已儲存", "success");
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
          <input type="date" id="swal-date" class="swal2-input" value="${log.date
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

// ===== Initialize =====
async function init() {
  if (token) {
    showMain();
  } else {
    showLanding();
  }
}

init();
