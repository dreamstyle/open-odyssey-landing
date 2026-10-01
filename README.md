# Open Odyssey landing page

Open Odyssey 的正式 landing page。現行版本由根目錄的 `index.html` 啟動，採用 Vite 管理前端原始碼與靜態素材。

## 本機開發

```bash
pnpm install
pnpm dev --host 127.0.0.1 --port 4174
```

開啟 `http://127.0.0.1:4174/`。

```bash
pnpm build
LANDING_PREVIEW_URL=http://127.0.0.1:4174/ pnpm test:ui
```

## 專案結構

```text
.
├── index.html          # 正式頁面與內容結構
├── src/
│   ├── main.js         # 正式頁面互動
│   └── styles.css      # 正式頁面樣式
├── public/images/      # 正式頁面會發布的圖片
└── tests/landing.mjs   # 正式頁面的瀏覽器驗證
```

探索原型、設計稿與製作紀錄已移至獨立專案，正式 repo 只保留會發布的 landing page。

## 文案原則

- 大標題與場景文字可以保留「海、航程、伊薩卡」的情感語言。
- 功能說明直接描述玩家可以做什麼、世界如何回應，以及紀錄會留下什麼。
- 不把探索原型的互動寫成已上線功能；同行者也不宣稱為即時多人連線。
