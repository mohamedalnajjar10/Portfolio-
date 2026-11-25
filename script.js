(() => {
  const root = document.documentElement;
  const PALETTE_KEY = "portfolio-palette";
  const THEME_KEY = "portfolio-theme";
  const VALID_PALETTES = new Set(["nile-silt", "deep-moss", "basalt", "nocturne"]);

  function applyStoredPreferences() {
    const savedPalette = localStorage.getItem(PALETTE_KEY);
    const savedTheme = localStorage.getItem(THEME_KEY);
    root.dataset.palette = VALID_PALETTES.has(savedPalette) ? savedPalette : "nile-silt";
    root.dataset.theme = savedTheme === "light" ? "light" : "dark";
  }
  applyStoredPreferences();

  /* ==========================================================================
     Entrance Choreography
     ========================================================================== */
  const shell = document.querySelector(".viewport-shell");
  if (shell && shell.classList.contains("is-world-entering")) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      shell.classList.add("is-sky-ready", "is-sea-ready");
    } else {
      requestAnimationFrame(() => {
        shell.classList.add("is-sky-ready");
        setTimeout(() => shell.classList.add("is-sea-ready"), 60);
      });
    }
  }

  /* ==========================================================================
     Theme & Palette Controls
     ========================================================================== */
  const paletteBtn = document.querySelector("[data-palette-toggle]");
  const palettePopover = document.querySelector("[data-palette-popover]");
  const paletteOptions = [...document.querySelectorAll("[data-palette-option]")];
  const themeBtn = document.querySelector("[data-theme-toggle]");
  const themeTip = themeBtn ? themeBtn.querySelector(".dock-morph-tip") : null;
  const sunIcon = themeBtn ? themeBtn.querySelector("[data-icon-sun]") : null;
  const moonIcon = themeBtn ? themeBtn.querySelector("[data-icon-moon]") : null;

  let sceneDirty = true;

  function syncThemeUI() {
    const isDark = root.dataset.theme !== "light";
    if (themeTip) themeTip.textContent = isDark ? "light" : "dark";
    if (themeBtn) themeBtn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    if (sunIcon) sunIcon.hidden = !isDark;
    if (moonIcon) moonIcon.hidden = isDark;
  }

  function syncPaletteUI() {
    const current = root.dataset.palette || "nile-silt";
    for (const opt of paletteOptions) {
      opt.setAttribute("aria-checked", String(opt.dataset.paletteOption === current));
    }
  }

  function toggleTheme() {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, root.dataset.theme);
    syncThemeUI();
    sceneDirty = true;
  }

  function setPalette(name) {
    if (!VALID_PALETTES.has(name)) return;
    root.dataset.palette = name;
    localStorage.setItem(PALETTE_KEY, name);
    syncPaletteUI();
    sceneDirty = true;
  }

  syncThemeUI();
  syncPaletteUI();

  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
  }

  if (paletteBtn && palettePopover) {
    const closePopover = () => {
      palettePopover.hidden = true;
      paletteBtn.setAttribute("aria-expanded", "false");
    };
    const openPopover = () => {
      palettePopover.hidden = false;
      paletteBtn.setAttribute("aria-expanded", "true");
    };

    paletteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (palettePopover.hidden) openPopover();
      else closePopover();
    });

    for (const opt of paletteOptions) {
      opt.addEventListener("click", () => {
        setPalette(opt.dataset.paletteOption);
        closePopover();
      });
    }

    document.addEventListener("click", (e) => {
      if (!palettePopover.hidden && !palettePopover.contains(e.target) && !paletteBtn.contains(e.target)) {
        closePopover();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !palettePopover.hidden) {
        closePopover();
        paletteBtn.focus();
      }
    });
  }

  /* ==========================================================================
     Copy Email Button
     ========================================================================== */
  const copyBtn = document.querySelector("[data-copy-email]");
  if (copyBtn) {
    const defaultLabel = copyBtn.textContent.trim();
    let copyTimer = null;
    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.dataset.copyEmail;
      try {
        await navigator.clipboard.writeText(email);
      } catch {
        const area = document.createElement("textarea");
        area.value = email;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      copyBtn.classList.add("is-copied");
      copyBtn.textContent = "Copied";
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copyBtn.classList.remove("is-copied");
        copyBtn.textContent = defaultLabel;
      }, 2000);
    });
  }

  /* ==========================================================================
     Connected Folder Tabs & Sliding Tab Bridge
     ========================================================================== */
  const tabsBar = document.querySelector(".tabs-bar");
  const tabBridge = document.querySelector(".tab-bridge");
  const tabButtons = [...document.querySelectorAll(".tab-btn")];
  const tabPanels = [...document.querySelectorAll(".tab-panel")];

  function positionBridge(activeBtn) {
    if (!tabsBar || !tabBridge || !activeBtn) return;
    const x = activeBtn.offsetLeft;
    const w = activeBtn.offsetWidth;
    tabBridge.style.width = `${w}px`;
    tabBridge.style.transform = `translateX(${x}px)`;
  }

  function activateTab(tabId, { focus = false } = {}) {
    const targetBtn = tabButtons.find((b) => b.dataset.tabTarget === tabId);
    if (!targetBtn) return;
    for (const btn of tabButtons) {
      const isSelected = btn === targetBtn;
      btn.setAttribute("aria-selected", String(isSelected));
      btn.tabIndex = isSelected ? 0 : -1;
    }
    for (const panel of tabPanels) {
      panel.hidden = panel.dataset.tabPanel !== tabId;
    }
    positionBridge(targetBtn);
    if (focus) targetBtn.focus();
  }

  if (tabButtons.length) {
    const initialTab = tabButtons.find((b) => b.getAttribute("aria-selected") === "true") || tabButtons[0];
    requestAnimationFrame(() => positionBridge(initialTab));
    window.addEventListener("resize", () => {
      const current = tabButtons.find((b) => b.getAttribute("aria-selected") === "true");
      positionBridge(current);
    });

    for (const btn of tabButtons) {
      btn.addEventListener("click", () => activateTab(btn.dataset.tabTarget));
      btn.addEventListener("keydown", (e) => {
        const idx = tabButtons.indexOf(btn);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          activateTab(tabButtons[(idx + 1) % tabButtons.length].dataset.tabTarget, { focus: true });
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          activateTab(tabButtons[(idx - 1 + tabButtons.length) % tabButtons.length].dataset.tabTarget, { focus: true });
        }
      });
    }
  }

  /* ==========================================================================
     Master-Detail Drum Rails (Experience & Projects)
     ========================================================================== */
  const drumControllers = new Map();

  for (const master of document.querySelectorAll("[data-master-detail]")) {
    const rail = master.querySelector(".drum-rail");
    const items = [...master.querySelectorAll(".drum-item")];
    const details = [...master.querySelectorAll("[data-detail-id]")];
    const filterButtons = [...master.querySelectorAll("[data-category-filter]")];
    const groupKey = master.dataset.masterDetail;

    const getVisibleItems = () => items.filter((item) => !item.hidden);

    function selectItem(id, { scrollIntoView = true, focus = false } = {}) {
      const target = items.find((i) => i.dataset.itemId === id && !i.hidden) || getVisibleItems()[0];
      if (!target) return;
      const targetId = target.dataset.itemId;

      for (const item of items) {
        const selected = item === target;
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
      }
      for (const detail of details) {
        detail.hidden = detail.dataset.detailId !== targetId;
      }
      if (scrollIntoView && rail) {
        target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      }
      if (focus) target.focus();
    }

    function stepSelection(delta, focus = false) {
      const visible = getVisibleItems();
      if (!visible.length) return;
      const currentIdx = visible.findIndex((i) => i.getAttribute("aria-selected") === "true");
      const nextIdx = Math.max(0, Math.min(visible.length - 1, (currentIdx === -1 ? 0 : currentIdx) + delta));
      selectItem(visible[nextIdx].dataset.itemId, { scrollIntoView: true, focus });
    }

    for (const item of items) {
      item.addEventListener("click", () => selectItem(item.dataset.itemId, { scrollIntoView: true }));
      item.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          stepSelection(1, true);
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          stepSelection(-1, true);
        }
      });
    }

    if (rail) {
      let wheelLock = 0;
      rail.addEventListener("wheel", (e) => {
        if (window.innerWidth <= 959) return;
        const now = performance.now();
        if (now - wheelLock < 95) return;
        if (Math.abs(e.deltaY) < 6) return;
        wheelLock = now;
        e.preventDefault();
        stepSelection(e.deltaY > 0 ? 1 : -1);
      }, { passive: false });
    }

    for (const filterBtn of filterButtons) {
      filterBtn.addEventListener("click", () => {
        const category = filterBtn.dataset.categoryFilter;
        for (const b of filterButtons) {
          b.setAttribute("aria-pressed", String(b === filterBtn));
        }
        for (const item of items) {
          item.hidden = category !== "all" && item.dataset.category !== category;
        }
        const currentSelected = items.find((i) => i.getAttribute("aria-selected") === "true");
        if (!currentSelected || currentSelected.hidden) {
          const first = getVisibleItems()[0];
          if (first) selectItem(first.dataset.itemId, { scrollIntoView: true });
        }
      });
    }

    drumControllers.set(groupKey, { selectItem });
  }

  // Deep-link from Experience project pills straight into Projects tab + item
  for (const jumpBtn of document.querySelectorAll("[data-jump-project]")) {
    jumpBtn.addEventListener("click", () => {
      const slug = jumpBtn.dataset.jumpProject;
      activateTab("projects");
      const projectsCtrl = drumControllers.get("projects");
      if (projectsCtrl) projectsCtrl.selectItem(slug, { scrollIntoView: true });
    });
  }

  /* ==========================================================================
     Animated Pixel-Art Landscape Canvas (glgl.me style)
     ========================================================================== */
  const canvas = document.getElementById("pixel-landscape-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d", { alpha: false });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const BAYER4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];

    function parseHex(hex) {
      const h = hex.trim().replace("#", "");
      if (h.length === 3) {
        return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
      }
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }

    function mixRgb(a, b, t) {
      const k = Math.max(0, Math.min(1, t));
      return [
        Math.round(a[0] + (b[0] - a[0]) * k),
        Math.round(a[1] + (b[1] - a[1]) * k),
        Math.round(a[2] + (b[2] - a[2]) * k)
      ];
    }

    function readColors() {
      const cs = getComputedStyle(root);
      return {
        isDark: root.dataset.theme !== "light",
        skyTop: parseHex(cs.getPropertyValue("--sky-top") || "#070606"),
        skyMid: parseHex(cs.getPropertyValue("--sky-mid") || "#17100b"),
        skyHor: parseHex(cs.getPropertyValue("--sky-horizon") || "#4a2915"),
        waterTop: parseHex(cs.getPropertyValue("--water-top") || "#101724"),
        waterBot: parseHex(cs.getPropertyValue("--water-bot") || "#090d14"),
        cloudDark: parseHex(cs.getPropertyValue("--cloud-dark") || "#25150c"),
        cloudMid: parseHex(cs.getPropertyValue("--cloud-mid") || "#472816"),
        cloudLit: parseHex(cs.getPropertyValue("--cloud-lit") || "#9b6a43"),
        reedDark: parseHex(cs.getPropertyValue("--reed-dark") || "#282012"),
        reedMid: parseHex(cs.getPropertyValue("--reed-mid") || "#6e5932"),
        reedLit: parseHex(cs.getPropertyValue("--reed-lit") || "#c6a764"),
        celestial: parseHex(cs.getPropertyValue("--celestial") || "#f5dfb0")
      };
    }

    // Seeded deterministic PRNG
    function mulberry32(seed) {
      let a = seed >>> 0;
      return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const rand = mulberry32(20260417);
    const stars = Array.from({ length: 145 }, () => ({
      nx: rand(),
      ny: rand() * 0.56,
      size: rand() > 0.87 ? 2 : 1,
      phase: rand() * Math.PI * 2,
      speed: 0.6 + rand() * 1.6,
      bright: 0.35 + rand() * 0.65
    }));

    // Multi-lobe pixel cloud definitions
    const cloudDefs = [
      {
        x: 0.04, y: 0.14, speed: 0.0022, scale: 1.18,
        lobes: [
          [0, 12, 34, 16], [-24, 22, 46, 18], [26, 20, 42, 17],
          [56, 26, 36, 15], [84, 34, 28, 12], [-44, 32, 38, 14]
        ]
      },
      {
        x: 0.24, y: 0.28, speed: 0.0014, scale: 0.82,
        lobes: [
          [0, 6, 24, 9], [-18, 11, 22, 8], [18, 12, 20, 7]
        ]
      },
      {
        x: 0.92, y: 0.19, speed: 0.0018, scale: 1.25,
        lobes: [
          [0, 12, 36, 16], [-32, 20, 44, 17], [30, 22, 40, 16],
          [-64, 30, 34, 13], [-88, 37, 26, 10], [60, 32, 34, 14]
        ]
      },
      {
        x: 0.72, y: 0.34, speed: 0.0026, scale: 0.9,
        lobes: [
          [0, 5, 28, 8], [-22, 8, 22, 7], [22, 9, 20, 6]
        ]
      }
    ];

    const reeds = Array.from({ length: 195 }, (_, idx) => {
      const t = idx / 195;
      const edgeWeight = Math.abs(t - 0.5) * 2;
      return {
        nx: t + (rand() - 0.5) * 0.014,
        height: (0.09 + rand() * 0.17) * (0.55 + edgeWeight * 0.75),
        lean: (rand() - 0.5) * 20 + (t < 0.5 ? -4 : 4),
        phase: rand() * Math.PI * 2,
        layer: rand(),
        hasPlume: rand() > 0.62
      };
    });

    let pw = 360;
    let ph = 225;
    let imgData = null;
    let paletteColors = readColors();
    let lastTime = 0;

    function resize() {
      const vw = window.innerWidth || 1440;
      const vh = window.innerHeight || 900;
      const targetPixelWidth = vw >= 960 ? 360 : Math.max(210, Math.round(vw / 2.6));
      pw = targetPixelWidth;
      ph = Math.max(160, Math.round((vh / vw) * pw));
      canvas.width = pw;
      canvas.height = ph;
      imgData = ctx.createImageData(pw, ph);
      sceneDirty = true;
    }

    function getCelestialPos() {
      const isNarrow = (window.innerWidth || 1440) < 960;
      return {
        cx: Math.round(pw * (isNarrow ? 0.72 : 0.365)),
        cy: Math.round(ph * (isNarrow ? 0.11 : 0.135)),
        r: Math.max(10, Math.round(pw * 0.032))
      };
    }

    function setPixel(buf, x, y, rgb) {
      if (x < 0 || x >= pw || y < 0 || y >= ph) return;
      const i = (y * pw + x) * 4;
      buf[i] = rgb[0];
      buf[i + 1] = rgb[1];
      buf[i + 2] = rgb[2];
      buf[i + 3] = 255;
    }

    function renderFrame(timeSec) {
      if (!imgData) return;
      if (sceneDirty) {
        paletteColors = readColors();
        sceneDirty = false;
      }

      const c = paletteColors;
      const buf = imgData.data;
      const horizonY = Math.round(ph * 0.64);
      const { cx: sunX, cy: sunY, r: sunR } = getCelestialPos();

      // 1. Dithered Sky & Water Base
      for (let y = 0; y < ph; y++) {
        const bayerRow = BAYER4[y & 3];
        if (y < horizonY) {
          const t = y / horizonY;
          const base = t < 0.58
            ? mixRgb(c.skyTop, c.skyMid, t / 0.58)
            : mixRgb(c.skyMid, c.skyHor, (t - 0.58) / 0.42);
          const nextStep = t < 0.58
            ? mixRgb(c.skyTop, c.skyMid, Math.min(1, (t + 0.035) / 0.58))
            : mixRgb(c.skyMid, c.skyHor, Math.min(1, (t - 0.58 + 0.035) / 0.42));

          for (let x = 0; x < pw; x++) {
            const dither = bayerRow[x & 3] / 16;
            const col = dither < 0.5 ? base : nextStep;
            setPixel(buf, x, y, col);
          }
        } else {
          const wt = (y - horizonY) / Math.max(1, ph - horizonY);
          const wCol = mixRgb(c.waterTop, c.waterBot, wt);
          const wCol2 = mixRgb(c.waterTop, c.waterBot, Math.min(1, wt + 0.06));
          for (let x = 0; x < pw; x++) {
            const dither = bayerRow[x & 3] / 16;
            setPixel(buf, x, y, dither < 0.45 ? wCol : wCol2);
          }
        }
      }

      // Thin warm horizon sheen
      const horizonSheen = mixRgb(c.skyHor, c.celestial, 0.32);
      for (let x = 0; x < pw; x++) {
        setPixel(buf, x, horizonY, horizonSheen);
      }

      // 2. Stars (dark mode)
      if (c.isDark) {
        for (const s of stars) {
          const sx = Math.floor(s.nx * pw);
          const sy = Math.floor(s.ny * ph);
          if (sy >= horizonY - 4) continue;
          const tw = 0.55 + 0.45 * Math.sin(timeSec * s.speed + s.phase);
          const fade = Math.max(0, 1 - (sy / horizonY) * 1.15);
          const alpha = s.bright * tw * fade;
          if (alpha < 0.22) continue;
          const bgIdx = (sy * pw + sx) * 4;
          const bg = [buf[bgIdx], buf[bgIdx + 1], buf[bgIdx + 2]];
          const starCol = mixRgb(bg, c.celestial, alpha);
          setPixel(buf, sx, sy, starCol);
          if (s.size === 2 && alpha > 0.55) {
            const armCol = mixRgb(bg, c.celestial, alpha * 0.45);
            setPixel(buf, sx - 1, sy, armCol);
            setPixel(buf, sx + 1, sy, armCol);
            setPixel(buf, sx, sy - 1, armCol);
            setPixel(buf, sx, sy + 1, armCol);
          }
        }
      }

      // 3. Celestial Body (Crescent Moon in Dark, Sun in Light) + Dithered Glow
      const glowRadius = sunR * 3.1;
      for (let dy = -Math.ceil(glowRadius); dy <= Math.ceil(glowRadius); dy++) {
        const py = sunY + dy;
        if (py < 0 || py >= horizonY) continue;
        for (let dx = -Math.ceil(glowRadius); dx <= Math.ceil(glowRadius); dx++) {
          const px = sunX + dx;
          if (px < 0 || px >= pw) continue;
          const dist = Math.hypot(dx, dy);
          if (dist > glowRadius) continue;

          if (c.isDark) {
            const inOuter = dist <= sunR;
            const cutDist = Math.hypot(dx - sunR * 0.42, dy + sunR * 0.18);
            const inCrescent = inOuter && cutDist > sunR * 0.86;
            if (inCrescent) {
              setPixel(buf, px, py, c.celestial);
            } else {
              const g = Math.max(0, 1 - dist / glowRadius);
              const thr = BAYER4[py & 3][px & 3] / 16;
              if (g * 0.55 > thr) {
                const bgIdx = (py * pw + px) * 4;
                const bg = [buf[bgIdx], buf[bgIdx + 1], buf[bgIdx + 2]];
                setPixel(buf, px, py, mixRgb(bg, c.celestial, 0.25 * g));
              }
            }
          } else {
            if (dist <= sunR * 0.88) {
              const edgeT = dist / (sunR * 0.88);
              const sunCol = mixRgb([255, 240, 175], c.celestial, edgeT * 0.8);
              setPixel(buf, px, py, sunCol);
            } else {
              const g = Math.max(0, 1 - dist / (glowRadius * 0.9));
              const thr = BAYER4[py & 3][px & 3] / 16;
              if (g * 0.7 > thr) {
                const bgIdx = (py * pw + px) * 4;
                const bg = [buf[bgIdx], buf[bgIdx + 1], buf[bgIdx + 2]];
                setPixel(buf, px, py, mixRgb(bg, c.celestial, 0.35 * g));
              }
            }
          }
        }
      }

      // 4. Drifting Pixel Clouds with Dithered Rim Lighting
      for (const cd of cloudDefs) {
        const cx = ((cd.x * pw + timeSec * cd.speed * pw) % (pw + 140)) - 70;
        const cy = cd.y * ph;
        for (const [lx, ly, rx, ry] of cd.lobes) {
          const ex = Math.round(cx + lx * cd.scale);
          const ey = Math.round(cy + ly * cd.scale);
          const erx = Math.max(6, Math.round(rx * cd.scale));
          const ery = Math.max(4, Math.round(ry * cd.scale));

          for (let dy = -ery; dy <= ery; dy++) {
            const py = ey + dy;
            if (py < 0 || py >= horizonY) continue;
            for (let dx = -erx; dx <= erx; dx++) {
              const px = ex + dx;
              if (px < 0 || px >= pw) continue;
              const norm = (dx * dx) / (erx * erx) + (dy * dy) / (ery * ery);
              if (norm > 1) continue;

              const bayer = BAYER4[py & 3][px & 3] / 16;
              // Soft dithered perimeter
              if (norm > 0.78 && (norm - 0.78) / 0.22 > bayer) continue;

              // Rim lighting from celestial body + top edge
              const toSunX = sunX - px;
              const toSunY = sunY - py;
              const sunFactor = Math.max(0, 1 - Math.hypot(toSunX, toSunY) / (pw * 0.55));
              const topEdge = Math.max(0, -dy / ery);
              const lightVal = topEdge * 0.65 + sunFactor * 0.55;

              let col = c.cloudDark;
              if (lightVal > 0.58 + bayer * 0.16) {
                col = c.cloudLit;
              } else if (lightVal > 0.28 + bayer * 0.2) {
                col = c.cloudMid;
              }
              setPixel(buf, px, py, col);
            }
          }
        }
      }

      // 5. Shimmering Water Reflections
      for (let y = horizonY + 1; y < ph; y++) {
        const wt = (y - horizonY) / Math.max(1, ph - horizonY);
        const spread = 8 + wt * (pw * 0.22);
        const wave = Math.sin(y * 0.45 + timeSec * 1.9) * 3.5 + Math.cos(y * 0.19 - timeSec * 1.2) * 2;
        const center = sunX + wave;
        const rowSeed = Math.sin(y * 12.9898 + Math.floor(timeSec * 2.2) * 0.15) * 43758.5453;
        const frac = rowSeed - Math.floor(rowSeed);

        if (frac > 0.22) {
          const halfW = Math.max(2, Math.round(spread * (0.25 + 0.75 * frac)));
          const xStart = Math.max(0, Math.round(center - halfW));
          const xEnd = Math.min(pw - 1, Math.round(center + halfW));
          for (let x = xStart; x <= xEnd; x++) {
            const distFromCenter = Math.abs(x - center) / Math.max(1, halfW);
            const shimmer = Math.sin(x * 0.25 + y * 0.7 + timeSec * 2.4);
            if (distFromCenter < 0.78 && shimmer > -0.25) {
              const reflCol = mixRgb(c.waterTop, c.celestial, (1 - distFromCenter) * (0.45 + wt * 0.35));
              setPixel(buf, x, y, reflCol);
            }
          }
        }
      }

      // 6. Foreground Swaying Pixel-Art Reeds
      for (const r of reeds) {
        const baseX = Math.round(r.nx * pw);
        const bladeH = Math.round(r.height * ph);
        const sway = Math.sin(timeSec * 1.45 + r.phase) * 3.5;
        const tipX = baseX + r.lean + sway;
        const tipY = ph - 1 - bladeH;

        for (let step = 0; step <= bladeH; step++) {
          const t = step / Math.max(1, bladeH);
          const x = Math.round(baseX + (tipX - baseX) * (t * t));
          const y = ph - 1 - step;
          if (y < 0 || y >= ph) continue;

          const col = t > 0.65
            ? (r.layer > 0.45 ? c.reedLit : c.reedMid)
            : (r.layer > 0.6 ? c.reedMid : c.reedDark);

          setPixel(buf, x, y, col);
          if (t < 0.55) {
            setPixel(buf, x + 1, y, c.reedDark);
          }
          if (r.hasPlume && t > 0.82 && step % 2 === 0) {
            setPixel(buf, x - 1, y, c.reedLit);
            setPixel(buf, x + 1, y, c.reedMid);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }

    function tick(ts) {
      const sec = reduceMotion ? 0 : ts * 0.001;
      if (reduceMotion) {
        renderFrame(0);
        return;
      }
      if (ts - lastTime >= 42 || sceneDirty) {
        lastTime = ts;
        renderFrame(sec);
      }
      requestAnimationFrame(tick);
    }

    // Hover & click interaction on Moon / Sun
    if (shell) {
      const isOverCelestial = (clientX, clientY) => {
        const vw = window.innerWidth || 1440;
        const vh = window.innerHeight || 900;
        const { cx, cy, r } = getCelestialPos();
        const screenX = (cx / pw) * vw;
        const screenY = (cy / ph) * vh;
        const hitR = Math.max(26, (r / pw) * vw * 1.8);
        return Math.hypot(clientX - screenX, clientY - screenY) <= hitR;
      };

      window.addEventListener("mousemove", (e) => {
        const interactiveTarget = e.target.closest("a, button, .panel-box, .tabs-bar, .utility-dock, .palette-popover");
        shell.classList.toggle("is-celestial-hover", !interactiveTarget && isOverCelestial(e.clientX, e.clientY));
      });

      shell.addEventListener("click", (e) => {
        const interactiveTarget = e.target.closest("a, button, .panel-box, .tabs-bar, .utility-dock, .palette-popover");
        if (!interactiveTarget && isOverCelestial(e.clientX, e.clientY)) {
          toggleTheme();
        }
      });
    }

    window.addEventListener("resize", resize);
    resize();
    if (reduceMotion) {
      renderFrame(0);
    } else {
      requestAnimationFrame(tick);
    }
  }
})();
