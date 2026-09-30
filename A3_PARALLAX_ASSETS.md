# A3 視差主視覺素材

所有圖層以 `a3-hero-clean.png` 的 1672×941 畫布為唯一座標系。產圖工具只提供船與島嶼的輪廓，以及物件移開後的補景；`build-a4-assets.cjs` 以原圖像素重新產生天空、海洋、島嶼、船四張圖層，避免重新繪製造成細節與色彩不一致。

重新產生圖層：`node design/landing-page-v2/build-a4-assets.cjs`

## 產圖提示詞

### 船與左右前景（`a4-ship-mask-source.png`）

> Use case: background-extraction. Asset type: pixel-aligned transparent foreground layer for a 1672×941 responsive parallax website hero. Image 1 is the EDIT TARGET. Isolate ONLY the ship foreground that already exists in Image 1: the large wooden bow/deck centered at the bottom, all attached railings and ropes, the tall dark rigging and pulley at the far left, and the sail plus rigging at the far right. Keep their original exact position, proportions, perspective, colors, highlights, fine rope details, and edge geometry. Everything else (sky, island, clouds, ocean, sunlight, birds) must be genuinely transparent alpha, not black or a checkerboard. Do not move, resize, redraw, restyle, invent, or complete any object; do not add text. The output must remain the SAME 1672×941 full-size canvas, with the foreground objects in precisely the original pixel coordinates, so it can be placed over the source image with zero scale or translation. Ensure feathered anti-aliased edges without halos or rectangular cutout boundaries.

### 島嶼（`a4-island-mask-source.png`）

> Use case: background-extraction. Create a pixel-aligned transparent ISLAND layer for a responsive 1672×941 parallax hero. The attached image is the edit target. Isolate ONLY the distant island chain along the horizon, including the left lighthouse cliffs, central mountainous island, little buildings, mist physically attached to the island edges, and right arch, all at their EXACT original pixel coordinates and scale. Preserve the original colors and detailed silhouette. Make sky, clouds not attached to the island, ocean, ship, rigging, sail, and everything else genuinely transparent alpha. No rectangular selection or artificial edge. No text. Do not move, resize, redraw or add anything. Return the SAME 1672×941 canvas; this layer must overlay its source with zero transform and zero registration error.

產圖結果雖然保留輪廓，但放大 125% 並下移約 80px。因此建置程式只取其透明度，再反向校正到原圖座標；不使用產圖結果的色彩像素。

### 空景補圖（`a4-empty-source.png`）

> Use case: background-removal / inpainting for a parallax website. Edit the supplied 1672×941 image. Remove the entire island chain from the left lighthouse cliff across the central mountain, buildings, mist, and right arch; fill its original footprint with believable continuation of the EXISTING blue/golden clouds and open sky above the original horizon. Also remove ALL foreground ship parts: the bottom bow/deck, left ropes/pulley/rigging and right sail/rigging, inpainting with continuation of the EXISTING ocean or sky. Keep the ocean horizon at precisely its original y coordinate. Keep original lighting, palette and sky texture. Do NOT change canvas size, crop, composition, ocean waves outside removed objects, sun position, horizon line, or any other source details. Do not add anything new; no text. This is the EMPTY BACKGROUND PLATE for separate transparent island and ship layers to overlay at their original coordinates.
