# 原型驗證

三個原型均以本機 Chromium 實際操作，桌機 1440×960、小視窗 390×844。

通過：六個區塊、日誌示例更換文字與海景、鍵盤 Enter 選取海域、送風動畫與可讀回報、啟航示例對話框與 Esc 關閉、減少動態控制、系統減少動態偏好。小視窗沒有水平溢出，原型沒有 JavaScript 錯誤或素材 4xx/5xx。

A 額外驗證捲動後海景 transform 改變，以及減少動態後固定場景恢復一般版面。比較頁三個方向與三份圖集共 18 張高解析區塊稿都成功載入及解碼。

原型不串接正式遊戲、AI 或儲存；未執行正式遊戲測試，也未宣稱圖像原型能代表完整 3D 效能。

重新驗證指令：`node verify-prototypes.mjs`。需先由專案根目錄啟動 `python3 -m http.server 4187 --bind 127.0.0.1`；腳本沿用本機既有的 Playwright 與 Chromium 路徑。

## 驗證結果

```json
[
  {
    "variant": "a",
    "sections": 6,
    "scrollParallax": true,
    "journalExample": true,
    "seaKeyboardSelection": true,
    "wind": true,
    "dialogEscape": true,
    "motionToggle": true,
    "systemReducedMotion": true,
    "mobileOverflow": false,
    "browserErrors": []
  },
  {
    "variant": "b",
    "sections": 6,
    "scrollParallax": false,
    "journalExample": true,
    "seaKeyboardSelection": true,
    "wind": true,
    "dialogEscape": true,
    "motionToggle": true,
    "systemReducedMotion": true,
    "mobileOverflow": false,
    "browserErrors": []
  },
  {
    "variant": "c",
    "sections": 6,
    "scrollParallax": false,
    "journalExample": true,
    "seaKeyboardSelection": true,
    "wind": true,
    "dialogEscape": true,
    "motionToggle": true,
    "systemReducedMotion": true,
    "mobileOverflow": false,
    "browserErrors": []
  },
  {
    "gallery": true,
    "comparisonVariants": 3,
    "sectionImages": 18
  }
]
```

提示詞：prompts.md 記錄 18 個區塊初稿；additional-prompts.md 記錄 A 無文字海景和 B 最後一張重製稿。產圖使用內建 imagegen。
