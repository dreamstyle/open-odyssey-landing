# A2 主視覺圖層

目前頁面使用同一個 1672×941 座標系的四張圖：`a2r-clean-backplate.png`、`a2r-clean-wordmark.png`、`a2r-clean-island.png`、`a2r-clean-ship.png`。底圖完全不透明；移動物件只存在各自的透明圖層，底圖不留下索具、島嶼或字標形狀的透明洞。這避免捲動時把補景與原稿的接縫揭露成殘影。

`a2r-clean-backplate.png` 以內建 imagegen 編修產生，原圖 `a2-hero-wordmark.png` 是編修目標，先前的 `a4-empty-source.png` 僅作補景參考。其餘三張由 `build-a2-hero-assets.cjs` 產生：船首取原 A2 圖的色彩與船遮罩；島嶼取不含索具的 `a4-island-mask-source.png`，依原座標縮放，僅將右半部下緣漸進延伸約 9 像素以貼合底圖略向右下降的海平線；左側、山峰和字標不移位，右側拱門保留實色，不套用整片淡出。字標取獨立的 `a2-layer-wordmark.png` 並提亮為暖白色，不再混入原圖中的船索或山體。重新產生：

```sh
node build-a2-hero-assets.cjs
```

## 內建 imagegen 底圖編修提示詞

> Use case: precise-object-edit. Asset type: clean, pixel-registration-friendly underpainting for an Open Odyssey website parallax hero, landscape 16:9. Image 1 is the edit target and the authoritative composition and color palette. Image 2 is only a supporting guide for what exists behind removed objects, NOT a new visual style. Produce a FULL OPAQUE background image at the same camera viewpoint as Image 1. Remove from Image 1 only: the entire distant island chain including the left lighthouse, central mountain and right arch; all ship foreground including left ropes/pulley, right sail/rigging, bottom bow and deck; and all letters of the large ODYSSEY wordmark. Reconstruct plausible uninterrupted clouds and sky behind the removed island and letters, and uninterrupted ocean behind the removed ship, while preserving the original image's sun placement, exact straight sea horizon position, navy and golden lighting, wave scale and perspective, and all original sky/ocean pixels outside the removed object footprints as closely as possible. No residual silhouettes, no outlines, no doubled horizon, no ghost ships, no islands, no text, no logos. This image will sit underneath separately animated transparent foreground layers, so the vacated regions need natural seamless sky/sea continuation.

原始島嶼與船去背素材的編修提示詞記錄於 [A3_PARALLAX_ASSETS.md](A3_PARALLAX_ASSETS.md)。
