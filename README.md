# 社畜加班紀錄器 - 前端 (Overwork Tracker)

專為社畜打造的加班時數紀錄系統，每一分鐘的加班，都是為了更美好的...退休？
基於 Google Sheets 作為資料庫，資料完全掌握在自己手中。

## ✨ 功能特色

- ⏱ **即時統計**：登入即顯示本月與上月累積加班時數，時刻提醒自己是否太奴。
- 🌡 **熱力圖分析**：由淺至深的綠色方塊，視覺化呈現近 4 週的加班強度（顏色越深，代表你越操！）。
- 📊 **報表匯出**：一鍵匯出上個月的加班紀錄 (CSV)，整理加班費申報資料不再頭痛。
- 📝 **簡單紀錄**：快速紀錄加班日期、時數、原因與備註。
- ☁️ **雲端同步**：資料儲存於 Google Sheets，支援跨裝置存取。
- 📱 **RWD 設計**：手機、電腦都能完美顯示。

## 🛠 技術棧

- **Core**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **UI Component**: SweetAlert2 (為了漂亮的彈窗)
- **Styling**: CSS Variables, Grid/Flexbox Layout
- **Font**: Zen Maru Gothic (圓體字型，讓加班看起來沒那麼沈重)
- **API**: Fetch API

## 📂 檔案結構

```
frontend/
├── index.html      # 應用程式主入口
├── style.css       # 樣式表 (包含 RWD 與熱力圖樣式)
├── app.js          # 核心邏輯 (Auth, CRUD, 匯出, 熱力圖計算)
├── config.js       # API 連線設定
├── icon.png        # Favicon
└── README.md       # 說明文件
```

## 🚀 快速開始

### 1. 修改 API 連線

打開 `config.js`，將網址修改為你的後端服務位址（本地開發或 Zeabur 網址）：

```javascript
const CONFIG = {
  // API_BASE_URL: "http://localhost:3000",
  API_BASE_URL: "https://your-app.zeabur.app", 
};
```

### 2. 啟動

直接用瀏覽器打開 `index.html`，或使用 Live Server 啟動。

## 📖 使用說明

### 註冊/登入
- 首次使用請點擊「還沒加入？點我註冊」。
- 輸入帳號、顯示名稱與密碼即可建立帳號。

### 紀錄加班
1. 點擊主畫面下方的「✍️ 紀錄加班」按鈕。
2. 選擇日期、輸入時數（支援 0.5 小時）、原因（如：趕專案、開會）。
3. 按下紀錄即可。

### 匯出報表
1. 點擊主畫面下方的「📊 匯出上月報表」按鈕。
2. 系統會自動篩選上個月的所有紀錄。
3. 下載 `.csv` 檔案，可用 Excel 或 Google Sheets 開啟。

### 熱力圖 (Heatmap)
- 位於首頁中段，顯示過去 4 週 (28天) 的加班狀況。
- **等級說明**：
  - ⬜️ 無加班
  - 🟢 < 1 小時 (輕度)
  - 🌿 1-2 小時 (中度)
  - 🌳 2-4 小時 (重度)
  - 🌲 > 4 小時 (極度過勞)

## 📄 License

MIT License
