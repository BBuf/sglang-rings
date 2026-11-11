/* Interactive ring city: free camera, contributor lookup, timeline, share card.
 * Reuses the film's RingCity / RingExtras; the film itself (film.html, film.js) is not touched by this file. */
(function () {
  "use strict";
  const T = window.THREE, D = window.RINGS, X = window.RINGS_X, M = D.meta, B = D.b;
  const N = B.x.length, C = D.day.length, DAYS = M.days, NP = D.people.length;
  const REPO = "https://github.com/" + X.repo, FILM = "https://www.bilibili.com/video/BV1VmWL6fEWE";
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const sstep = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const sstep5 = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const p2 = (n) => String(n).padStart(2, "0");
  const qs = new URLSearchParams(location.search);
  const COARSE = window.matchMedia("(pointer: coarse)").matches;
  const narrow = () => window.innerWidth <= 760;

  // ---------- strings ----------
  const STR = {
    en: {
      docTitle: "Tree Rings of SGLang", title: "Tree Rings of an Open-Source Project", sub: "SGLang's git history, drawn as a city",
      searchLabel: "Find your building", searchPh: "GitHub username", random: "Random contributor",
      noMatch: "No GitHub account by that name in the git history.",
      noMatchHint: "Contributors are matched by GitHub account. A commit whose email is not linked to an account cannot be matched to a person.",
      rank: "Contributor", of: "of {n}", firstCommit: "First commit", day: "Day {n}", ring: "{m} ring", seed: "the first commit of the repo",
      sCommits: "commits", sBuilt: "buildings built", sTouched: "buildings changed", builtKey: "built by @{u}", touchedKey: "changed by @{u}",
      tallest: "Tallest building you built", lines: "lines", where: "Where your buildings are",
      aFirst: "First building", aAll: "Whole city", aReplay: "Replay from first commit", aCopy: "Copy link", copied: "Copied", aSave: "Save card",
      building: "Building", builtOn: "built {d}", by: "by", removed: "removed {d}", ruin: "Removed on {d}. Only the foundation is left.",
      changedBy: "Changed by {p} contributors in {c} commits", open: "Open on GitHub", birth: "Commit that built it", back: "Back to @{u}",
      tipBuilt: "built by @{u}", tipTouched: "changed by @{u}", unlinked: "an account that is not linked",
      hintMouse: "Drag to rotate · scroll to zoom · right-drag to move", hintTouch: "Drag to rotate · pinch to zoom · two fingers to move",
      cCommits: "commits", cPeople: "contributors", cFiles: "files", cLines: "lines", play: "Play", pause: "Pause",
      legend: "Roof color = area of the repo", milestones: "Milestones", lang: "中文", about: "About", close: "Close",
      files: "files", download: "Download image", shareHint: "On a phone, press and hold the image to save it.", cardFirst: "first building",
      cardFind: "Find your building", loading: "Building the city…", nogl: "This page needs WebGL, which this browser does not provide.",
      aboutHtml:
        `<h2>How to read the city</h2>
         <p>Every file ever tracked in <a href="${REPO}" target="_blank" rel="noopener">sgl-project/sglang</a> is a building, and the more lines it has, the taller it stands. Each month the city grows one ring outward. The two wide roads are New Year 2025 and 2026. Roof color shows the area of the repo. A deleted file leaves a pale foundation. Pins on the rings are LMSYS blog posts, and the large ones are milestones. The towns around the city are ecosystem repos, drawn at the same scale.</p>
         <h2>Finding yourself</h2>
         <p>Type your GitHub username. A building is <b>built</b> by you when the file first appeared in one of your commits, and <b>changed</b> by you when one of your commits touched it. Co-authors count. The highlighted ring is the month of your first commit.</p>
         <h2>Data</h2>
         <p>Git history of the main branch as of ${M.d1} (${M.head.slice(0, 9)}): ${fmt(M.commits)} commits, ${fmt(M.people)} contributors. Contributors are GitHub accounts, with bots and AI accounts left out. Commits whose email is not linked to an account cannot be matched to a person.</p>
         <p>This is the interactive version of the film <a href="${FILM}" target="_blank" rel="noopener">Tree Rings of an Open-Source Project</a>. Inspired by @EianLu's film about the growth rings of a city. The page and the film are code written by Claude Fable 5.2.</p>`,
    },
    zh: {
      docTitle: "SGLang 的年轮", title: "一个开源项目的年轮", sub: "SGLang 的 git 历史，画成一座城",
      searchLabel: "找到你的楼", searchPh: "GitHub 用户名", random: "随机看一位贡献者",
      noMatch: "git 历史里没有这个 GitHub 账号。",
      noMatchHint: "贡献者按 GitHub 账号统计。提交邮箱没有关联账号的，对应不到人。",
      rank: "第 {n} 位贡献者", of: "共 {n} 位", firstCommit: "第一次提交", day: "第 {n} 天", ring: "{m} 这一环", seed: "仓库的第一次提交",
      sCommits: "次提交", sBuilt: "栋楼是你盖的", sTouched: "栋楼你改过", builtKey: "@{u} 盖的", touchedKey: "@{u} 改过的",
      tallest: "你盖的最高的楼", lines: "行", where: "你的楼在哪些分区",
      aFirst: "第一栋楼", aAll: "看全城", aReplay: "从第一次提交重放", aCopy: "复制链接", copied: "已复制", aSave: "保存卡片",
      building: "这栋楼", builtOn: "{d} 盖起", by: "盖楼的人", removed: "{d} 已删除", ruin: "{d} 被删除，只剩地基。",
      changedBy: "{p} 位贡献者在 {c} 次提交里改过它", open: "在 GitHub 上打开", birth: "盖起它的那次提交", back: "回到 @{u}",
      tipBuilt: "@{u} 盖的", tipTouched: "@{u} 改过", unlinked: "没有关联账号的作者",
      hintMouse: "拖动旋转 · 滚轮缩放 · 右键拖动平移", hintTouch: "单指旋转 · 双指缩放和平移",
      cCommits: "次提交", cPeople: "位贡献者", cFiles: "个文件", cLines: "行代码", play: "播放", pause: "暂停",
      legend: "屋顶颜色：代码所在的分区", milestones: "大事记", lang: "EN", about: "说明", close: "关闭",
      files: "个文件", download: "下载图片", shareHint: "手机上长按图片即可保存。", cardFirst: "第一栋楼",
      cardFind: "找到你的楼", loading: "正在盖城…", nogl: "这个页面需要 WebGL，当前浏览器不支持。",
      aboutHtml:
        `<h2>怎么看这座城</h2>
         <p><a href="${REPO}" target="_blank" rel="noopener">sgl-project/sglang</a> 仓库里出现过的每个文件都是一栋楼，行数越多楼越高。每过一个月，城市向外长一环。两条较宽的环路是 2025 和 2026 的新年。屋顶颜色表示代码所在的分区。被删除的文件留下一块浅色地基。环上的图钉是 LMSYS 博客，大图钉是大事件。城外的小城是生态仓库，和主城同一比例。</p>
         <h2>找到自己</h2>
         <p>输入你的 GitHub 用户名。文件第一次出现在你的提交里，这栋楼就算你<b>盖的</b>；你的提交改动过它，就算你<b>改过</b>。co-author 也算。亮起的那一环是你第一次提交所在的月份。</p>
         <h2>数据</h2>
         <p>main 分支的 git 历史，截至 ${M.d1}（${M.head.slice(0, 9)}）：${fmt(M.commits)} 次提交，${fmt(M.people)} 位贡献者。贡献者按 GitHub 账号统计，不含机器人和 AI 账号。提交邮箱没有关联账号的，对应不到人。</p>
         <p>这是影片<a href="${FILM}" target="_blank" rel="noopener">《一个开源项目的年轮》</a>的可交互版本。灵感来自 @EianLu《一座城的年轮》。页面和影片都是 Claude Fable 5.2 写的代码。</p>`,
    },
  };
  let lang = qs.get("lang");
  if (lang !== "zh" && lang !== "en") {
    try { lang = localStorage.getItem("rings-lang"); } catch (e) { lang = null; }
    if (lang !== "zh" && lang !== "en") lang = (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
  }
  const t = (k, v) => { let s = STR[lang][k]; if (s == null) s = STR.en[k]; if (v) for (const key in v) s = s.split("{" + key + "}").join(v[key]); return s; };
  const modName = (i) => (lang === "zh" ? D.modules[i].zh : D.modules[i].en);

  // ---------- time ----------
  const RUN = 106, WD = 0.45, T_END = RUN + 3, SPEED = 1.8;
  const vtc = new Float64Array(C);
  for (let i = 0; i < C; i++) vtc[i] = RUN * ((WD * D.day[i]) / DAYS + ((1 - WD) * (i + 1)) / C);
  function commitAt(tt) { let lo = -1, hi = C - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (vtc[m] <= tt) lo = m; else hi = m - 1; } return lo; }
  function commitAtDay(d) { let lo = 0, hi = C - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (D.day[m] <= d) lo = m; else hi = m - 1; } return lo; }
  function dayAt(tt, c) { if (c < 1) return 0; if (c >= C - 1) return DAYS; return clamp(((tt / RUN - ((1 - WD) * (c + 1)) / C) * DAYS) / WD, D.day[c], D.day[c + 1]); }
  const ymd = (sec) => { const d = new Date(sec * 1000); return `${d.getUTCFullYear()}.${p2(d.getUTCMonth() + 1)}.${p2(d.getUTCDate())}`; };
  const commitDate = (ci) => (ci === 0 ? M.first.date.replace(/-/g, ".") : ymd(M.t0 + D.day[ci] * 86400));
  const monthOf = (ci) => { const d = new Date((M.t0 + D.day[ci] * 86400) * 1000); return clamp((d.getUTCFullYear() - 2024) * 12 + d.getUTCMonth(), 0, D.months.length - 1); };
  const monthLabel = (k) => D.months[k].label.replace("-", ".");

  // ---------- people index ----------
  const cpo = X.cp.off, cpp = X.cp.p, evc = D.ev.c, evn = D.ev.n, off = B.off;
  const pcOff = new Int32Array(NP + 1);
  for (let k = 0; k < cpp.length; k++) pcOff[cpp[k] + 1]++;
  for (let p = 0; p < NP; p++) pcOff[p + 1] += pcOff[p];
  const pc = new Int32Array(cpp.length), fill = pcOff.slice(0, NP);
  for (let ci = 0; ci < C; ci++) for (let k = cpo[ci]; k < cpo[ci + 1]; k++) pc[fill[cpp[k]]++] = ci;
  const logins = D.people.map((p) => p[0]), lower = logins.map((s) => s.toLowerCase());
  const byLogin = new Map(lower.map((s, i) => [s, i]));
  const PATHS = X.paths.split("\n");
  const hashOf = (ci) => X.h.substr(ci * 8, 8);
  const finalLines = (i) => (B.death[i] >= 0 ? 0 : evn[off[i + 1] - 1]);
  function linesAt(i, c) { let lo = off[i], hi = off[i + 1] - 1; if (evc[lo] > c) return 0; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (evc[m] <= c) lo = m; else hi = m - 1; } return evn[lo]; }
  const ca = new Float32Array(N), sa = new Float32Array(N);
  for (let i = 0; i < N; i++) { ca[i] = Math.cos(B.a[i]); sa[i] = Math.sin(B.a[i]); }

  // ---------- scene ----------
  const PAL = { ground: "#EDE5D6", bodyA: "#F3EDE1", bodyB: "#E6DDCD", hot: "#FF5E14", hotRoof: "#FFE08A", ruin: "#DCD2BF", ringLine: "#D2C5AE", road: "#DACDB6", roadW: 1.5,
    sparkIn: "#FFD08A", sparkOut: "#FF6A12", pin: "#2B211C", pinEvent: "#1F1410", pinRing: "#D55816" };
  const lin = (hex) => { const c = new T.Color(hex); return [c.r, c.g, c.b]; };
  const cv = $("cv");
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "high-performance" }); }
  catch (e) { $("loading").textContent = t("nogl"); return; }
  const PR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(PR);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = T.NoToneMapping;
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  scene.background = new T.Color(PAL.ground);
  const city = window.RingCity.build(D, scene, PAL);
  const extras = window.RingExtras.build(D, scene, PAL);
  const sparks = scene.children.find((o) => o.isPoints);
  const cam = new T.PerspectiveCamera(30, 1, 1, 4000);
  const TANV = Math.tan((cam.fov * Math.PI) / 360);
  {
    const R = 214, RS = 100, SH = Math.min(renderer.capabilities.maxTextureSize, COARSE ? 2048 : 4096);
    const sun = new T.DirectionalLight("#FFF0DC", 1.95);
    sun.position.set(-R * 0.9, R * 1.25, R * 0.75);
    sun.castShadow = true;
    sun.shadow.mapSize.set(SH, SH);
    const sc = sun.shadow.camera;   // shadows cover the main city; the towns outside are lit but cast none
    sc.left = -RS * 1.08; sc.right = RS * 1.08; sc.top = RS * 1.08; sc.bottom = -RS * 1.08; sc.near = R * 0.2; sc.far = R * 4;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04 * (4096 / SH); sun.shadow.radius = 2.2;
    scene.add(sun, sun.target);
    scene.add(new T.HemisphereLight("#FFFFFF", "#EADFCB", 1.45));
    const fillL = new T.DirectionalLight("#E9EEF5", 0.6);
    fillL.position.set(R * 0.9, R * 0.55, -R * 0.8);
    scene.add(fillL);
  }

  // when pins and towns appear on the timeline
  const NB = D.bpins.length, NE = D.events.length;
  const ptau = new Float64Array(NB + NE), etau2 = new Float64Array(NE).fill(-1e9), stau = new Float64Array(D.sats.length);
  for (let i = 0; i < NB; i++) ptau[i] = vtc[D.bpins[i][2]];
  D.events.forEach((e, j) => { ptau[NB + j] = e.c == null ? RUN + 0.4 : vtc[e.c]; });
  D.sats.forEach((s, i) => { stau[i] = vtc[commitAtDay((Date.parse(s.created.slice(0, 10) + "T12:00:00Z") / 1000 - M.t0) / 86400)]; });

  // ---------- camera ----------
  let W = 1, H = 1;
  const DMIN = 7, DMAX = 1150, ELMIN = 0.1, ELMAX = 1.553;
  const view = { tx: 0, ty: 0, tz: 0, az: -0.55, el: 0.62, dist: 420 };
  const voff = { x: 0, y: 0 }, voffT = { x: 0, y: 0 };
  let dirty = true, idle = !window.matchMedia("(prefers-reduced-motion: reduce)").matches, fly = null;
  function applyCam() {
    const ce = Math.cos(view.el), se = Math.sin(view.el);
    cam.position.set(view.tx + view.dist * ce * Math.sin(view.az), view.ty + view.dist * se, view.tz + view.dist * ce * Math.cos(view.az));
    cam.up.set(0, 1, 0);
    cam.lookAt(view.tx, view.ty, view.tz);
    cam.near = Math.max(0.3, view.dist * 0.03);
    cam.far = view.dist * 4 + 1200;
    if (Math.abs(voff.x) > 0.5 || Math.abs(voff.y) > 0.5) cam.setViewOffset(W, H, voff.x, voff.y, W, H); else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
  }
  const free = { l: 0, r: 1, t: 0, b: 1 };   // the part of the screen no panel covers; the scene is centred in it
  function fitDist(R, el) {
    const fw = Math.max(0.25, (free.r - free.l) / W), fh = Math.max(0.25, (free.b - free.t) / H);
    return Math.max(R / (TANV * cam.aspect * fw), (R * Math.max(Math.sin(el), 0.5)) / (TANV * fh)) * 1.08;
  }
  function flyTo(to, dur) {
    const a = { ...view }, b = { ...view, ...to };
    let da = (b.az - a.az) % (2 * Math.PI);
    if (da > Math.PI) da -= 2 * Math.PI; else if (da < -Math.PI) da += 2 * Math.PI;
    b.az = a.az + da;
    const gap = Math.hypot(b.tx - a.tx, b.tz - a.tz);
    fly = { t0: performance.now(), dur: (dur || 1.9) * 1000, a, b, hop: clamp(gap / (a.dist + b.dist) - 0.25, 0, 0.7) };
    idle = false;
  }
  const v3 = new T.Vector3();
  function project(x, y, z) { v3.set(x, y, z).project(cam); return [(v3.x * 0.5 + 0.5) * W, (1 - (v3.y * 0.5 + 0.5)) * H, v3.z]; }
  const rc = new T.Raycaster(), ndc = new T.Vector2();
  function rayAt(x, y) { ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1); rc.setFromCamera(ndc, cam); return rc.ray; }
  function groundAt(x, y) { const r = rayAt(x, y); if (r.direction.y > -0.02) return null; const k = -r.origin.y / r.direction.y; return [r.origin.x + r.direction.x * k, r.origin.z + r.direction.z * k]; }
  function panBy(dx, dz) {
    const m = Math.hypot(dx, dz), lim = view.dist * 0.6;
    if (m > lim) { dx *= lim / m; dz *= lim / m; }
    view.tx = clamp(view.tx + dx, -340, 340); view.tz = clamp(view.tz + dz, -340, 340);
  }

  // ---------- timeline state ----------
  let tl = T_END, curC = C - 1, playing = false;
  const mark = new Uint8Array(N);   // 0 none, 1 changed by the selected person, 2 built by them
  let sel = null, bsel = -1;
  const C_BUILT_B = lin("#F4813B"), C_BUILT_R = lin("#FF5A0F"), C_TOUCH_B = lin("#F6DDB8"), C_TOUCH_R = lin("#EDA53A"), C_DIM_B = lin("#EFE8DC"), C_DIM_R = lin("#DAD1C0");
  function paint() {
    if (!sel) return;
    const bc = city.body.instanceColor.array, rcA = city.roof.instanceColor.array;
    for (let i = 0; i < N; i++) {
      const o = i * 3, m = mark[i];
      if (m === 2) { bc[o] = C_BUILT_B[0]; bc[o + 1] = C_BUILT_B[1]; bc[o + 2] = C_BUILT_B[2]; rcA[o] = C_BUILT_R[0]; rcA[o + 1] = C_BUILT_R[1]; rcA[o + 2] = C_BUILT_R[2]; }
      else if (m === 1) { bc[o] = C_TOUCH_B[0]; bc[o + 1] = C_TOUCH_B[1]; bc[o + 2] = C_TOUCH_B[2]; rcA[o] = C_TOUCH_R[0]; rcA[o + 1] = C_TOUCH_R[1]; rcA[o + 2] = C_TOUCH_R[2]; }
      else {
        bc[o] += (C_DIM_B[0] - bc[o]) * 0.6; bc[o + 1] += (C_DIM_B[1] - bc[o + 1]) * 0.6; bc[o + 2] += (C_DIM_B[2] - bc[o + 2]) * 0.6;
        rcA[o] += (C_DIM_R[0] - rcA[o]) * 0.8; rcA[o + 1] += (C_DIM_R[1] - rcA[o + 1]) * 0.8; rcA[o + 2] += (C_DIM_R[2] - rcA[o + 2]) * 0.8;
      }
    }
    city.body.instanceColor.needsUpdate = true; city.roof.instanceColor.needsUpdate = true;
  }
  function refresh() {
    curC = commitAt(tl);
    city.update(curC, tl, vtc, { heatTau: 0.42 });
    extras.update(tl, ptau, etau2, tl, stau);
    paint();
    renderer.shadowMap.needsUpdate = true;
    readout();
    dirty = true;
  }

  // ---------- markers ----------
  const beacon = new T.Group();
  const bPole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 8).translate(0, 0.5, 0), new T.MeshBasicMaterial({ color: "#D55816" }));
  const bHead = new T.Mesh(new T.SphereGeometry(0.5, 20, 14), new T.MeshBasicMaterial({ color: "#FF5A0F" }));
  const flat = (geo, color, op) => { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, depthTest: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 5; return m; };
  const bRing = flat(new T.RingGeometry(1.0, 1.22, 56, 1), "#D55816", 0.95), bPulse = flat(new T.RingGeometry(0.9, 1.0, 56, 1), "#D55816", 0.6);
  bRing.position.y = 0.06; bPulse.position.y = 0.07;
  beacon.add(bPole, bHead, bRing, bPulse);
  beacon.visible = false;
  scene.add(beacon);
  const pick2 = flat(new T.RingGeometry(0.86, 1.0, 56, 1), "#1F1410", 0.9);
  pick2.position.y = 0.065; pick2.visible = false;
  scene.add(pick2);
  let band = null;
  function setBand(k) {
    if (band) { scene.remove(band); band.geometry.dispose(); band.material.dispose(); band = null; }
    if (k == null) return;
    const m = D.months[k];
    band = flat(new T.RingGeometry(Math.max(0.05, m.r0), m.r1, 256, 1), "#F26A1B", 0.22);
    band.material.depthTest = true; band.position.y = 0.03; band.renderOrder = 2;
    scene.add(band);
  }
  let beaconTop = 0;
  function updateMarkers(now) {
    beacon.visible = !!(sel && sel.first);
    if (beacon.visible) {
      const i = sel.first.bi, s = clamp(view.dist / 70, 0.8, 5), h = city.heights[i] + 0.3 + 2.3 * s;
      beacon.position.set(B.x[i], 0, B.z[i]);
      bPole.scale.set(s, h, s); bHead.scale.setScalar(s * 0.72); bHead.position.y = h;
      bRing.scale.setScalar(s);
      const ph = ((now / 1000) % 1.7) / 1.7;
      bPulse.scale.setScalar(s * (1.3 + 5.5 * (1 - Math.pow(1 - ph, 3)))); bPulse.material.opacity = 0.6 * (1 - ph);
      beaconTop = h + 0.36 * s;
    }
    pick2.visible = bsel >= 0;
    if (pick2.visible) { pick2.position.x = B.x[bsel]; pick2.position.z = B.z[bsel]; pick2.scale.setScalar(clamp(view.dist / 90, 1, 4)); }
  }

  // ---------- DOM labels ----------
  const labels = $("labels");
  const mk = (cls, html) => { const d = document.createElement("div"); d.className = cls; if (html != null) d.innerHTML = html; labels.appendChild(d); return d; };
  const place = (el, p, ax, ay, show) => {
    const on = show && p[2] < 1 && p[0] > -200 && p[0] < W + 200 && p[1] > -100 && p[1] < H + 100;
    el.style.display = on ? "" : "none";
    if (on) el.style.transform = `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(${ax}, ${ay})`;
  };
  const yearEls = D.months.filter((m) => m.year && m.line != null).map((m) => ({ el: mk("yl", String(Number(m.label.slice(0, 4)) + 1)), r: m.line, tau: vtc[m.c1] }));
  const satEls = D.sats.map(() => mk("town"));
  const evEls = D.events.map(() => mk("evl"));
  const meEl = mk("me"), ringEl = mk("ringl");
  let showEvents = false;
  const evSize = D.events.map(() => [0, 0]);
  function labelText() {
    D.sats.forEach((s, i) => { satEls[i].innerHTML = `<span>${esc(s.full.split("/")[0])}/</span><b>${esc(s.name)}</b><i>★ ${fmt(s.stars)} · ${fmt(s.n)} ${t("files")}</i>`; });
    D.events.forEach((e, j) => { const n = evEls[j]; n.innerHTML = `<i>${e.date.replace(/-/g, ".")}</i>${esc(lang === "zh" ? e.zh : e.en)}`; n.style.display = ""; evSize[j] = [n.offsetWidth, n.offsetHeight]; });
  }
  function updateLabels() {
    const ya = view.az + Math.PI / 2;
    for (const y of yearEls) place(y.el, project(y.r * Math.sin(ya), 0.05, y.r * Math.cos(ya)), "-50%", "-50%", tl > y.tau + 0.6 && view.dist > 60);
    const pxPerUnit = H / (2 * TANV * view.dist), squash = Math.max(Math.sin(view.el), 0.35);
    const farK = clamp((0.4 - (M.radius * pxPerUnit) / Math.min(W, H)) / 0.08, 0, 1);
    D.sats.forEach((s, i) => {
      const on = farK > 0 && tl > stau[i] + 1, p = project(s.cx, 0, s.cz);
      p[1] += s.r * pxPerUnit * squash + 6;   // just below the town on screen, whatever the camera angle
      place(satEls[i], p, "-50%", "0%", on);
      if (on) satEls[i].style.opacity = farK.toFixed(2);
    });
    const taken = [];
    for (let j = NE - 1; j >= 0; j--) {
      const e = D.events[j], p = project(e.x, extras.pinTop(j), e.z), w = evSize[j][0], h = evSize[j][1];
      const r = [p[0] - w / 2 - 4, p[1] - 6 - h - 3, p[0] + w / 2 + 4, p[1] - 3];
      let on = showEvents && tl >= ptau[NB + j];
      if (on) for (const q of taken) if (r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]) { on = false; break; }
      if (on) taken.push(r);
      place(evEls[j], p, "-50%", "calc(-100% - 6px)", on);
    }
    if (sel && sel.first) {
      const i = sel.first.bi;
      place(meEl, project(B.x[i], beaconTop, B.z[i]), "-50%", "calc(-100% - 8px)", true);
      const m = D.months[sel.k], r = (m.r0 + m.r1) / 2, a = view.az - Math.PI / 2;
      place(ringEl, project(r * Math.sin(a), 0.05, r * Math.cos(a)), "-50%", "-50%", view.dist > 70);
    } else { meEl.style.display = "none"; ringEl.style.display = "none"; }
  }

  // ---------- picking ----------
  function pick(x, y) {
    const r = rayAt(x, y), ox = r.origin.x, oy = r.origin.y, oz = r.origin.z, dx = r.direction.x, dy = r.direction.y, dz = r.direction.z;
    let best = -1, bt = 1e9;
    const hw = 0.43;
    for (let i = 0; i < N; i++) {
      let h = city.heights[i];
      if (h <= 0) { if (!(B.death[i] >= 0 && B.death[i] <= curC)) continue; h = 0.1; } else h += 0.09;
      const px = ox - B.x[i], pz = oz - B.z[i];
      if (px * px + pz * pz > 4 && Math.abs(px * dz - pz * dx) > 0.75 * Math.hypot(dx, dz) + 1e-6 && Math.abs(dy) < 0.999) continue;
      const c = ca[i], s = sa[i];
      const lx = px * c - pz * s, lz = px * s + pz * c, ex = dx * c - dz * s, ez = dx * s + dz * c;
      let t0 = 0, t1 = bt;
      if (Math.abs(ex) < 1e-9) { if (lx < -hw || lx > hw) continue; } else { let a = (-hw - lx) / ex, b = (hw - lx) / ex; if (a > b) { const q = a; a = b; b = q; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) continue; }
      if (Math.abs(dy) < 1e-9) { if (oy < 0 || oy > h) continue; } else { let a = (0 - oy) / dy, b = (h - oy) / dy; if (a > b) { const q = a; a = b; b = q; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) continue; }
      if (Math.abs(ez) < 1e-9) { if (lz < -hw || lz > hw) continue; } else { let a = (-hw - lz) / ez, b = (hw - lz) / ez; if (a > b) { const q = a; a = b; b = q; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) continue; }
      if (t0 < bt) { bt = t0; best = i; }
    }
    let ev = -1;
    for (let j = 0; j < NE; j++) {
      if (tl < ptau[NB + j]) continue;
      const e = D.events[j], cy = 7.65, px = e.x - ox, py = cy - oy, pz = e.z - oz;
      const k = px * dx + py * dy + pz * dz;
      if (k <= 0 || k > bt) continue;
      const d2 = px * px + py * py + pz * pz - k * k;
      if (d2 < 2.0) { bt = k; ev = j; }
    }
    return ev >= 0 ? { ev } : best >= 0 ? { b: best } : null;
  }

  // ---------- tooltip ----------
  const tip = $("tip");
  let hover = null, needPick = false, tipTimer = 0;
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.style.display = "block";
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.transform = `translate(${clamp(x + 16, 8, W - w - 8).toFixed(0)}px, ${clamp(y + 18 + h > H - 8 ? y - h - 14 : y + 18, 8, H - h - 8).toFixed(0)}px)`;
  }
  const hideTip = () => { tip.style.display = "none"; };
  function tipHtml(hit) {
    if (hit.ev != null) { const e = D.events[hit.ev]; return `<div class="d">${e.date.replace(/-/g, ".")}</div><div class="e">${esc(lang === "zh" ? e.zh : e.en)}</div>`; }
    const i = hit.b, dead = B.death[i] >= 0 && B.death[i] <= curC;
    return `<div class="p">${esc(PATHS[i])}</div><div class="m"><i style="background:${D.modules[B.m[i]].color}"></i>${esc(modName(B.m[i]))} · ` +
      (dead ? t("removed", { d: commitDate(B.death[i]) }) : `${fmt(linesAt(i, curC))} ${t("lines")}`) + ` · ${t("builtOn", { d: commitDate(B.birth[i]) })}</div>` +
      (sel && mark[i] ? `<div class="u ${mark[i] === 2 ? "o" : "a"}">${t(mark[i] === 2 ? "tipBuilt" : "tipTouched", { u: esc(sel.login) })}</div>` : "");
  }

  // ---------- selection ----------
  const inC = new Uint8Array(C);
  function selectPerson(pi, opt) {
    opt = opt || {};
    const commits = pc.subarray(pcOff[pi], pcOff[pi + 1]);
    inC.fill(0);
    for (let k = 0; k < commits.length; k++) inC[commits[k]] = 1;
    mark.fill(0);
    const dist = new Array(D.modules.length).fill(0);
    let nBuilt = 0, nTouched = 0, tall = -1, tallN = -1;
    for (let i = 0; i < N; i++) {
      let m = 0;
      if (inC[B.birth[i]]) m = 2;
      else for (let j = off[i]; j < off[i + 1]; j++) if (inC[evc[j]]) { m = 1; break; }
      if (!m) continue;
      mark[i] = m; nTouched++; dist[B.m[i]]++;
      if (m === 2) { nBuilt++; const n = finalLines(i); if (B.death[i] < 0 && n > tallN) { tallN = n; tall = i; } }
    }
    let first = null;
    for (let k = 0; k < commits.length && !first; k++) {
      const ci = commits[k];
      let best = -1, bs = -1;
      for (let i = 0; i < N; i++) {
        if (!mark[i]) continue;
        let hit = B.birth[i] === ci;
        if (!hit) for (let j = off[i]; j < off[i + 1]; j++) { if (evc[j] === ci) { hit = true; break; } if (evc[j] > ci) break; }
        if (!hit) continue;
        const sc = (B.birth[i] === ci ? 2e7 : 0) + (B.death[i] < 0 ? 1e7 : 0) + finalLines(i);
        if (sc > bs) { bs = sc; best = i; }
      }
      if (best >= 0) first = { ci, bi: best };
    }
    sel = { pi, login: logins[pi], commits, nBuilt, nTouched, tall, tallN, dist, first, ci0: commits[0], k: monthOf(commits[0]) };
    bsel = -1;
    setPlaying(false); tl = T_END; slider.value = 1000;
    setBand(sel.k);
    meEl.textContent = "@" + sel.login;
    ringEl.textContent = monthLabel(sel.k);
    refresh(); renderCard(); renderLegend(); updateURL(); layout();
    if (opt.fly !== false) flyFirst();
  }
  function clearPerson() {
    sel = null; bsel = -1; mark.fill(0); setBand(null);
    refresh(); renderCard(); renderLegend(); updateURL(); layout();
  }
  function flyFirst() {
    if (!sel || !sel.first) return;
    const i = sel.first.bi, x = B.x[i], z = B.z[i];
    flyTo({ tx: x, ty: Math.min(city.heights[i] * 0.5, 6), tz: z, az: Math.hypot(x, z) < 3 ? view.az : Math.atan2(x, z), el: narrow() ? 0.72 : 0.6, dist: narrow() ? 64 : 38 }, 2.2);
  }
  function flyAll() { flyTo({ tx: 0, ty: 0, tz: 0, el: 1.2, dist: fitDist(M.radius + 4, 1.2) }, 1.8); }
  function flyBuilding(i) { const x = B.x[i], z = B.z[i]; flyTo({ tx: x, ty: Math.min(city.heights[i] * 0.5, 6), tz: z, az: Math.hypot(x, z) < 3 ? view.az : Math.atan2(x, z), el: narrow() ? 0.72 : 0.6, dist: narrow() ? 54 : 32 }, 1.6); }
  function selectBuilding(i) { bsel = i; renderCard(); layout(); dirty = true; }
  function updateURL() {
    const u = new URL(location.href);
    if (sel) u.searchParams.set("u", sel.login); else u.searchParams.delete("u");
    try { history.replaceState(null, "", u); } catch (e) { /* file:// */ }
    document.title = sel ? `@${sel.login} · ${t("docTitle")}` : t("docTitle");
  }

  // ---------- card ----------
  const card = $("card");
  const who = (pi) => `<a href="#" data-act="person" data-pi="${pi}">@${esc(logins[pi])}</a>`;
  function renderCard() {
    if (bsel >= 0) {
      const i = bsel, b = B.birth[i], dead = B.death[i] >= 0;
      const set = new Set();
      for (let j = off[i]; j < off[i + 1]; j++) for (let k = cpo[evc[j]]; k < cpo[evc[j] + 1]; k++) set.add(cpp[k]);
      const builders = Array.from(cpp.slice(cpo[b], cpo[b + 1]));
      const byHtml = builders.length ? builders.slice(0, 4).map(who).join("、") + (builders.length > 4 ? ` +${builders.length - 4}` : "") : esc(t("unlinked"));
      card.innerHTML =
        `<button class="x" data-act="closeB" aria-label="${t("close")}">×</button>
         <div class="k">${t("building")}</div>
         <div class="path">${esc(PATHS[i]).replace(/\//g, "/<wbr>")}</div>
         <div class="row"><i class="sw" style="background:${D.modules[B.m[i]].color}"></i>${esc(modName(B.m[i]))}${dead ? "" : ` · ${fmt(finalLines(i))} ${t("lines")}`}</div>
         <div class="row">${t("builtOn", { d: commitDate(b) })} · ${t("ring", { m: monthLabel(monthOf(b)) })}</div>
         <div class="row">${t("by")}: ${byHtml}</div>
         <div class="row">${t("changedBy", { p: fmt(set.size), c: fmt(off[i + 1] - off[i]) })}</div>
         ${dead ? `<div class="row dead">${t("ruin", { d: commitDate(B.death[i]) })}</div>` : ""}
         <div class="acts">${dead ? "" : `<a class="btn" href="${REPO}/blob/main/${PATHS[i].split("/").map(encodeURIComponent).join("/")}" target="_blank" rel="noopener">${t("open")}</a>`}
           <a class="btn" href="${REPO}/commit/${hashOf(b)}" target="_blank" rel="noopener">${t("birth")}</a></div>
         ${sel ? `<button class="link" data-act="closeB">← ${t("back", { u: esc(sel.login) })}</button>` : ""}`;
      card.hidden = false;
      return;
    }
    if (!sel) { card.hidden = true; card.innerHTML = ""; return; }
    const s = sel, ci = s.ci0, tot = s.nTouched || 1;
    const top = s.dist.map((n, i) => [n, i]).filter((d) => d[0] > 0).sort((a, b) => b[0] - a[0]);
    const prev = s.pi > 0 ? s.pi - 1 : -1, next = s.pi < NP - 1 ? s.pi + 1 : -1;
    const when = ci === 0 ? `${commitDate(ci)} · ${t("seed")}` : `${commitDate(ci)} · ${t("day", { n: fmt(Math.floor(D.day[ci]) + 1) })} · ${t("ring", { m: monthLabel(s.k) })}`;
    card.innerHTML =
      `<button class="x" data-act="clear" aria-label="${t("close")}">×</button>
       <div class="who"><img class="av" src="https://github.com/${encodeURIComponent(s.login)}.png?size=120" alt="" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'" />
         <div><a class="login" href="https://github.com/${encodeURIComponent(s.login)}" target="_blank" rel="noopener">@${esc(s.login)}</a>
         <div class="rank">${lang === "zh" ? t("rank", { n: `<b>${fmt(s.pi + 1)}</b>` }) : `${t("rank")} <b>#${fmt(s.pi + 1)}</b>`} <span>${t("of", { n: fmt(NP) })}</span></div></div></div>
       <div class="k">${t("firstCommit")}</div>
       <div class="row">${when}</div>
       <a class="subj" href="${REPO}/commit/${hashOf(ci)}" target="_blank" rel="noopener">${esc(X.subj[s.pi])}</a>
       <div class="stats"><div><b>${fmt(s.commits.length)}</b><span>${t("sCommits")}</span></div><div><b class="o">${fmt(s.nBuilt)}</b><span>${t("sBuilt")}</span></div><div><b class="a">${fmt(s.nTouched)}</b><span>${t("sTouched")}</span></div></div>
       ${s.tall >= 0 ? `<div class="k">${t("tallest")}</div><a class="tall" href="#" data-act="bld" data-b="${s.tall}"><span>${esc(PATHS[s.tall]).replace(/\//g, "/<wbr>")}</span><em>${fmt(s.tallN)} ${t("lines")}</em></a>` : ""}
       <div class="k">${t("where")}</div>
       <div class="bar">${top.map(([n, i]) => `<i style="width:${((n / tot) * 100).toFixed(2)}%;background:${D.modules[i].color}"></i>`).join("")}</div>
       <div class="keys">${top.slice(0, 4).map(([n, i]) => `<span><i class="sw" style="background:${D.modules[i].color}"></i>${esc(modName(i))} ${fmt(n)}</span>`).join("")}</div>
       <div class="acts"><button class="btn pri" data-act="first">${t("aFirst")}</button><button class="btn" data-act="all">${t("aAll")}</button><button class="btn" data-act="replay">${t("aReplay")}</button></div>
       <div class="acts"><button class="btn" data-act="copy">${t("aCopy")}</button><button class="btn" data-act="save">${t("aSave")}</button></div>
       <div class="nav">${prev >= 0 ? `<a href="#" data-act="person" data-pi="${prev}">← #${fmt(prev + 1)} @${esc(logins[prev])}</a>` : "<span></span>"}${next >= 0 ? `<a href="#" data-act="person" data-pi="${next}">#${fmt(next + 1)} @${esc(logins[next])} →</a>` : "<span></span>"}</div>`;
    card.hidden = false;
    card.scrollTop = 0;
  }
  card.addEventListener("click", (e) => {
    const n = e.target.closest("[data-act]");
    if (!n) return;
    const act = n.dataset.act;
    if (n.tagName === "A" && n.getAttribute("href") === "#") e.preventDefault();
    if (act === "clear") clearPerson();
    else if (act === "closeB") { bsel = -1; renderCard(); layout(); dirty = true; }
    else if (act === "person") selectPerson(Number(n.dataset.pi));
    else if (act === "bld") { const i = Number(n.dataset.b); selectBuilding(i); flyBuilding(i); }
    else if (act === "first") flyFirst();
    else if (act === "all") flyAll();
    else if (act === "replay") { tl = Math.max(0, vtc[sel.ci0] - 2.5); refresh(); setPlaying(true); }
    else if (act === "copy") copyLink(n);
    else if (act === "save") openShare();
  });
  function copyLink(btn) {
    const done = () => { const old = btn.textContent; btn.textContent = t("copied"); setTimeout(() => { btn.textContent = old; }, 1400); };
    const url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => window.prompt("", url));
    else window.prompt("", url);
  }

  // ---------- legend, readout, static text ----------
  const legend = $("legend");
  function renderLegend() {
    legend.innerHTML = `<div class="k">${t("legend")}</div>` + D.modules.map((m, i) => `<div class="lg"><i class="sw" style="background:${m.color}"></i>${esc(modName(i))}</div>`).join("") +
      (sel ? `<div class="sep"></div><div class="lg"><i class="sw" style="background:#FF5A0F"></i>${t("builtKey", { u: esc(sel.login) })}</div><div class="lg"><i class="sw" style="background:#EDA53A"></i>${t("touchedKey", { u: esc(sel.login) })}</div>` : "") +
      `<div class="sep"></div><label class="tg"><input type="checkbox" id="evToggle" ${showEvents ? "checked" : ""} />${t("milestones")}</label>`;
  }
  legend.addEventListener("change", (e) => { if (e.target.id === "evToggle") { showEvents = e.target.checked; dirty = true; } });
  const slider = $("tl"), playBtn = $("play");
  function readout() {
    const c = Math.max(0, curC), day = dayAt(tl, curC);
    $("r-date").textContent = curC < 1 ? commitDate(0) : ymd(M.t0 + day * 86400);
    $("r-day").textContent = curC < 1 ? "" : t("day", { n: fmt(Math.floor(day) + 1) });
    $("r-commits").textContent = fmt(curC + 1); $("r-people").textContent = fmt(curC < 0 ? 0 : D.ppl[c]);
    $("r-files").textContent = fmt(curC < 0 ? 0 : D.alive[c]); $("r-lines").textContent = fmt(curC < 0 ? 0 : D.lines[c]);
  }
  function setPlaying(on) {
    playing = on;
    playBtn.classList.toggle("on", on);
    playBtn.setAttribute("aria-label", t(on ? "pause" : "play"));
  }
  playBtn.addEventListener("click", () => { if (!playing && tl >= T_END - 0.01) { tl = 0; refresh(); } setPlaying(!playing); });
  slider.addEventListener("input", () => { setPlaying(false); tl = (slider.value / 1000) * T_END; refresh(); });
  function applyLang() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.body.classList.toggle("zh", lang === "zh");
    document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach((n) => { n.placeholder = t(n.dataset.i18nPh); });
    document.querySelectorAll("[data-i18n-title]").forEach((n) => { n.title = t(n.dataset.i18nTitle); n.setAttribute("aria-label", t(n.dataset.i18nTitle)); });
    $("about-body").innerHTML = t("aboutHtml");
    $("hint").textContent = t(COARSE ? "hintTouch" : "hintMouse");
    labelText(); renderLegend(); renderCard(); readout(); setPlaying(playing); updateURL();
    dirty = true;
  }
  $("lang").addEventListener("click", () => { lang = lang === "zh" ? "en" : "zh"; try { localStorage.setItem("rings-lang", lang); } catch (e) { /* private mode */ } applyLang(); layout(); });

  // ---------- search ----------
  const q = $("q"), results = $("results");
  let resItems = [], resIdx = -1;
  function find(s) {
    s = s.trim().replace(/^@/, "").toLowerCase();
    if (!s) return [];
    const a = [], b = [];
    for (let i = 0; i < NP && a.length < 40; i++) if (lower[i].startsWith(s)) a.push(i);
    if (a.length < 8) for (let i = 0; i < NP && b.length < 8; i++) if (!lower[i].startsWith(s) && lower[i].includes(s)) b.push(i);
    const ex = byLogin.get(s), out = a.concat(b).filter((i) => i !== ex);
    if (ex != null) out.unshift(ex);
    return out.slice(0, 8);
  }
  function renderResults() {
    const s = q.value.trim();
    resItems = find(s); resIdx = resItems.length ? 0 : -1;
    if (!s) { results.hidden = true; results.innerHTML = ""; return; }
    results.hidden = false;
    results.innerHTML = resItems.length
      ? resItems.map((pi, k) => `<div class="res${k === 0 ? " on" : ""}" role="option" data-pi="${pi}"><b>@${esc(logins[pi])}</b><span>#${fmt(pi + 1)} · ${commitDate(D.people[pi][1]).slice(0, 7)}</span></div>`).join("")
      : `<div class="none"><b>${t("noMatch")}</b><span>${t("noMatchHint")}</span></div>`;
  }
  function choose(pi) { q.value = logins[pi]; results.hidden = true; q.blur(); selectPerson(pi); }
  q.addEventListener("input", renderResults);
  q.addEventListener("focus", () => { if (q.value.trim()) renderResults(); });
  q.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!resItems.length) return;
      e.preventDefault();
      resIdx = (resIdx + (e.key === "ArrowDown" ? 1 : resItems.length - 1)) % resItems.length;
      results.querySelectorAll(".res").forEach((n, k) => n.classList.toggle("on", k === resIdx));
    } else if (e.key === "Enter") { if (resIdx >= 0) choose(resItems[resIdx]); else renderResults(); }
    else if (e.key === "Escape") { results.hidden = true; q.blur(); }
  });
  results.addEventListener("pointerdown", (e) => { const n = e.target.closest(".res"); if (n) { e.preventDefault(); choose(Number(n.dataset.pi)); } });
  document.addEventListener("pointerdown", (e) => { if (!e.target.closest("#search")) results.hidden = true; });
  $("dice").addEventListener("click", () => { const pi = Math.floor(Math.random() * NP); q.value = logins[pi]; results.hidden = true; selectPerson(pi); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== q) { e.preventDefault(); q.focus(); q.select(); }
    else if (e.key === "Escape") { if (!$("about").hidden) $("about").hidden = true; else if (!$("share").hidden) $("share").hidden = true; else if (bsel >= 0) { bsel = -1; renderCard(); layout(); dirty = true; } }
  });

  // ---------- about / share ----------
  $("aboutBtn").addEventListener("click", () => { $("about").hidden = false; });
  document.querySelectorAll("[data-close]").forEach((n) => n.addEventListener("click", (e) => { if (e.target === n || e.target.closest("button[data-close]")) n.closest(".modal").hidden = true; }));
  function fitText(g, text, font, size, maxW, family) { let s = size; do { g.font = `${font} ${s}px ${family}`; if (g.measureText(text).width <= maxW) break; s -= 2; } while (s > 20); return s; }
  async function makeCard() {
    const s = sel, S = 1500, CW = 1200, CH = 1560, CY = 350;
    const SERIF = `"EB Garamond", "Noto Serif SC", Georgia, serif`, SANS = `Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif`, MONO = `"JetBrains Mono", ui-monospace, Menlo, monospace`;
    try { await Promise.all([document.fonts.load(`700 80px "EB Garamond"`), document.fonts.load(`700 30px Inter`), document.fonts.load(`400 30px Inter`), document.fonts.load(`400 30px "JetBrains Mono"`), document.fonts.load(`700 30px "Noto Serif SC"`, t("title"))]); } catch (e) { /* fall back to system fonts */ }
    const logo = $("logo");
    // one top-down frame of the whole city, rendered off the visible size and restored before the browser paints
    const kv = { ...view }, ko = { ...voff }, kW = W, kH = H;
    W = S; H = S; voff.x = voff.y = 0;
    renderer.setPixelRatio(1); renderer.setSize(S, S, false);
    cam.aspect = 1;
    Object.assign(view, { tx: 0, ty: 0, tz: 0, az: 0, el: ELMAX, dist: ((M.radius + 3) / TANV) * 1.03 });
    applyCam();
    beacon.visible = false; pick2.visible = false;
    renderer.render(scene, cam);
    const cnv = document.createElement("canvas");
    cnv.width = CW; cnv.height = CH;
    const g = cnv.getContext("2d"), k = CW / S;
    g.drawImage(cv, 0, 0, S, S, 0, CY, CW, CW);
    const px = g.getImageData(5, CY + CW / 2, 1, 1).data;   // lit ground at the left edge of the frame
    g.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`; g.fillRect(0, 0, CW, CH);
    g.save(); g.beginPath(); g.arc(CW / 2, CY + CW / 2, CW / 2 - 3, 0, 6.2832); g.clip();
    g.drawImage(cv, 0, 0, S, S, 0, CY, CW, CW);
    g.restore();
    const pts = [[], []];
    for (let i = 0; i < N; i++) if (mark[i] && (city.heights[i] > 0 || B.death[i] >= 0)) { const p = project(B.x[i], city.heights[i], B.z[i]); pts[mark[i] - 1].push(p[0] * k, CY + p[1] * k); }
    const fp = s.first ? project(B.x[s.first.bi], city.heights[s.first.bi], B.z[s.first.bi]) : null;
    const mo = D.months[s.k], pc0 = project(0, 0, 0), pc1 = project((mo.r0 + mo.r1) / 2, 0, 0), ringR = Math.hypot(pc1[0] - pc0[0], pc1[1] - pc0[1]) * k, ringC = [pc0[0] * k, CY + pc0[1] * k];
    W = kW; H = kH; voff.x = ko.x; voff.y = ko.y;
    renderer.setPixelRatio(PR); renderer.setSize(W, H, false);
    cam.aspect = W / H; Object.assign(view, kv);
    applyCam(); updateMarkers(performance.now()); renderer.render(scene, cam); dirty = true;
    // the person's buildings as dots, so that a single building still shows at this scale
    const dots = (arr, r, col) => { g.fillStyle = col; g.beginPath(); for (let j = 0; j < arr.length; j += 2) { g.moveTo(arr[j] + r, arr[j + 1]); g.arc(arr[j], arr[j + 1], r, 0, 6.2832); } g.fill(); };
    const many = pts[0].length + pts[1].length > 1600;
    dots(pts[0], many ? 1.6 : 2.6, "rgba(226,150,40,0.85)"); dots(pts[1], many ? 2.2 : 3.6, "rgba(255,90,15,0.92)");
    {   // the ring of the first commit's month, with its label on the left
      g.strokeStyle = "rgba(213,88,22,0.6)"; g.lineWidth = 3; g.beginPath(); g.arc(ringC[0], ringC[1], Math.max(4, ringR), 0, 6.2832); g.stroke();
      g.font = `700 21px ${SANS}`;
      const txt = monthLabel(s.k), tw = g.measureText(txt).width + 22, bx = Math.max(8, ringC[0] - ringR - tw / 2), by = ringC[1];
      g.fillStyle = "#D55816"; g.beginPath();
      if (g.roundRect) g.roundRect(bx, by - 17, tw, 34, 17); else g.rect(bx, by - 17, tw, 34);
      g.fill();
      g.fillStyle = "#fff"; g.textBaseline = "middle"; g.textAlign = "center"; g.fillText(txt, bx + tw / 2, by + 1);
    }
    if (fp) {
      const x = fp[0] * k, y = CY + fp[1] * k, right = x < CW * 0.62, lx = x + (right ? 1 : -1) * 34, ly = y - 34;
      g.strokeStyle = "#D55816"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 13, 0, 6.2832); g.stroke();
      g.lineWidth = 2; g.beginPath(); g.moveTo(x + (right ? 9.5 : -9.5), y - 9.5); g.lineTo(lx, ly); g.stroke();
      g.font = `700 22px ${SANS}`;
      const txt = t("cardFirst"), tw = g.measureText(txt).width + 24;
      g.fillStyle = "#D55816"; g.beginPath();
      if (g.roundRect) g.roundRect(right ? lx : lx - tw, ly - 19, tw, 38, 19); else g.rect(right ? lx : lx - tw, ly - 19, tw, 38);
      g.fill();
      g.fillStyle = "#fff"; g.textBaseline = "middle"; g.textAlign = right ? "left" : "right"; g.fillText(txt, lx + (right ? 12 : -12), ly + 1);
    }
    g.textBaseline = "alphabetic"; g.textAlign = "left";
    if (logo.complete && logo.naturalWidth) g.drawImage(logo, 64, 56, 52, 52);
    g.fillStyle = "#7A6A5E";
    if (lang === "zh") { g.font = `700 30px "Noto Serif SC", ${SERIF}`; g.fillText(t("title"), 132, 93); }
    else { g.font = `700 19px ${SANS}`; try { g.letterSpacing = "3.4px"; } catch (e) { /* older browsers */ } g.fillText(t("title").toUpperCase(), 132, 90); try { g.letterSpacing = "0px"; } catch (e) { /* older browsers */ } }
    g.fillStyle = "#1F1410";
    const name = "@" + s.login, fs = fitText(g, name, "700", 96, CW - 128, SERIF);
    g.font = `700 ${fs}px ${SERIF}`; g.fillText(name, 62, 212);
    let x = 64;
    const seg = (txt, font, col) => { g.font = font; g.fillStyle = col; g.fillText(txt, x, 268); x += g.measureText(txt).width; };
    if (lang === "zh") { seg("第 ", `400 31px ${SANS}`, "#1F1410"); seg(fmt(s.pi + 1), `700 31px ${SANS}`, "#D55816"); seg(` 位贡献者 · 共 ${fmt(NP)} 位`, `400 31px ${SANS}`, "#1F1410"); }
    else { seg("Contributor ", `400 31px ${SANS}`, "#1F1410"); seg("#" + fmt(s.pi + 1), `700 31px ${SANS}`, "#D55816"); seg(` of ${fmt(NP)}`, `400 31px ${SANS}`, "#1F1410"); }
    seg(`   ${t("firstCommit")} ${commitDate(s.ci0)}`, `400 31px ${SANS}`, "#7A6A5E");
    x = 64;
    const st = (n, lab, col) => { g.font = `700 29px ${SANS}`; g.fillStyle = col; g.fillText(n, x, 322); x += g.measureText(n).width + 9; g.font = `400 25px ${SANS}`; g.fillStyle = "#1F1410"; g.fillText(lab, x, 322); x += g.measureText(lab).width + 34; };
    st(fmt(s.commits.length), t("sCommits"), "#1F1410"); st(fmt(s.nBuilt), t("sBuilt"), "#F0570E"); st(fmt(s.nTouched), t("sTouched"), "#C8841A");
    const host = /^(localhost|127\.|\[::1\])/.test(location.host) || !location.host ? "" : (location.host + location.pathname).replace(/\/(index\.html)?$/, "");
    g.font = `400 23px ${SANS}`; g.fillStyle = "#7A6A5E"; g.textAlign = "left";
    g.fillText(host ? `${t("cardFind")}: ${host}` : `SGLang · ${X.repo}`, 64, CH - 40);
    g.textAlign = "right";
    g.fillText(lang === "zh" ? `${fmt(Math.floor(DAYS) + 1)} 天 · ${fmt(M.commits)} 次提交` : `${fmt(Math.floor(DAYS) + 1)} days · ${fmt(M.commits)} commits`, CW - 64, CH - 40);
    return cnv;
  }
  async function openShare() {
    if (!sel) return;
    const cnv = await makeCard();
    cnv.toBlob((blob) => {
      const url = URL.createObjectURL(blob), img = $("share-img"), dl = $("share-dl");
      if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
      img.dataset.url = url; img.src = url;
      dl.href = url; dl.download = `sglang-rings-${sel.login}.png`;
      $("share").hidden = false;
    }, "image/png");
  }

  // ---------- pointer input ----------
  const ptr = new Map();
  let gest = null, lastTap = 0;
  function interact() { idle = false; fly = null; $("hint").classList.add("gone"); }
  cv.addEventListener("contextmenu", (e) => e.preventDefault());
  cv.addEventListener("pointerdown", (e) => {
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    interact(); hideTip(); hover = null;
    if (ptr.size === 1) gest = { mode: e.button === 2 || e.button === 1 || e.shiftKey ? "pan" : "rot", t0: performance.now(), moved: 0 };
    else if (ptr.size === 2) { const [a, b] = [...ptr.values()]; gest = { mode: "pinch", d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, moved: 99 }; }
    cv.classList.add("drag");
  });
  cv.addEventListener("pointermove", (e) => {
    const p = ptr.get(e.pointerId);
    if (!p) { if (e.pointerType === "mouse") { hover = { x: e.clientX, y: e.clientY }; needPick = true; } return; }
    if (!gest) return;
    if (gest.mode === "pinch") {
      p.x = e.clientX; p.y = e.clientY;
      if (ptr.size < 2) return;
      const [a, b] = [...ptr.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      const g0 = groundAt(gest.cx, gest.cy);
      view.dist = clamp((view.dist * gest.d) / Math.max(1, d), DMIN, DMAX);
      applyCam();
      const g1 = groundAt(cx, cy);
      if (g0 && g1) panBy(g0[0] - g1[0], g0[1] - g1[1]);
      gest.d = d; gest.cx = cx; gest.cy = cy; dirty = true;
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    gest.moved += Math.abs(dx) + Math.abs(dy);
    if (gest.mode === "rot") { view.az -= dx * 0.0055; view.el = clamp(view.el + dy * 0.0045, ELMIN, ELMAX); }
    else { const g0 = groundAt(p.x, p.y), g1 = groundAt(e.clientX, e.clientY); if (g0 && g1) panBy(g0[0] - g1[0], g0[1] - g1[1]); }
    p.x = e.clientX; p.y = e.clientY; dirty = true;
  });
  function release(e) {
    if (!ptr.has(e.pointerId)) return;
    ptr.delete(e.pointerId);
    const g = gest;
    if (ptr.size === 0) { gest = null; cv.classList.remove("drag"); }
    else if (ptr.size === 1) gest = { mode: "rot", t0: 0, moved: 99 };
    if (e.type !== "pointerup" || !g || g.mode === "pinch" || g.moved > 6 || performance.now() - g.t0 > 600) return;
    applyCam();
    const hit = pick(e.clientX, e.clientY), now = performance.now(), dbl = now - lastTap < 320;
    lastTap = now;
    if (hit && hit.b != null) { selectBuilding(hit.b); if (dbl) flyBuilding(hit.b); }
    else if (hit) { showTip(tipHtml(hit), e.clientX, e.clientY); clearTimeout(tipTimer); if (e.pointerType !== "mouse") tipTimer = setTimeout(hideTip, 3200); }
    else if (bsel >= 0) { bsel = -1; renderCard(); layout(); dirty = true; }
  }
  cv.addEventListener("pointerup", release);
  cv.addEventListener("pointercancel", release);
  cv.addEventListener("pointerleave", () => { hover = null; if (!COARSE) hideTip(); });
  cv.addEventListener("wheel", (e) => {
    e.preventDefault(); interact();
    const dy = clamp(e.deltaY * (e.deltaMode === 1 ? 16 : 1), -260, 260);
    const g0 = groundAt(e.clientX, e.clientY);
    view.dist = clamp(view.dist * Math.exp(dy * (e.ctrlKey ? 0.01 : 0.0016)), DMIN, DMAX);
    view.ty = Math.min(view.ty, view.dist * 0.12);
    applyCam();
    const g1 = groundAt(e.clientX, e.clientY);
    if (g0 && g1) panBy(g0[0] - g1[0], g0[1] - g1[1]);
    dirty = true;
  }, { passive: false });

  // ---------- layout ----------
  function layout() {
    const open = !card.hidden, barTop = $("bar").getBoundingClientRect().top;
    if (narrow()) { free.l = 0; free.r = W; free.t = $("top").getBoundingClientRect().bottom + 4; free.b = (open ? card.getBoundingClientRect().top : barTop) - 4; }
    else { free.l = 0; free.r = open ? card.getBoundingClientRect().left - 18 : W; free.t = 40; free.b = barTop - 6; }
    if (free.b - free.t < 120 || free.r - free.l < 120) { free.l = 0; free.r = W; free.t = 0; free.b = H; }
    voffT.x = W / 2 - (free.l + free.r) / 2; voffT.y = H / 2 - (free.t + free.b) / 2;
    dirty = true;
  }
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    cam.aspect = W / H;
    if (sparks) sparks.material.uniforms.scale.value = (H * PR) / (2 * TANV);
    layout();
  }
  window.addEventListener("resize", resize);

  // ---------- frame ----------
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (playing) {
      tl = Math.min(T_END, tl + dt * SPEED);
      slider.value = Math.round((tl / T_END) * 1000);
      refresh();
      if (tl >= T_END) setPlaying(false);
    }
    if (idle) { view.az += dt * 0.03; dirty = true; }
    if (fly) {
      const k = sstep5((now - fly.t0) / fly.dur), a = fly.a, b = fly.b;
      view.tx = lerp(a.tx, b.tx, k); view.ty = lerp(a.ty, b.ty, k); view.tz = lerp(a.tz, b.tz, k); view.az = lerp(a.az, b.az, k); view.el = lerp(a.el, b.el, k);
      view.dist = Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k)) * (1 + fly.hop * Math.sin(Math.PI * k));
      if (k >= 1) fly = null;
      dirty = true;
    }
    if (Math.abs(voff.x - voffT.x) > 0.5 || Math.abs(voff.y - voffT.y) > 0.5) {
      const e = 1 - Math.exp(-dt * 7);
      voff.x = lerp(voff.x, voffT.x, e); voff.y = lerp(voff.y, voffT.y, e); dirty = true;
    }
    if (sel) dirty = true;   // the beacon pulses
    if (needPick && hover && !gest) {
      needPick = false;
      const hit = pick(hover.x, hover.y);
      if (hit) showTip(tipHtml(hit), hover.x, hover.y); else hideTip();
      cv.classList.toggle("point", !!hit);
    }
    if (!dirty) return;
    dirty = false;
    applyCam();
    updateMarkers(now);
    renderer.render(scene, cam);
    updateLabels();
  }

  // ---------- start ----------
  resize();
  if (narrow()) view.el = 0.95;
  view.dist = fitDist(M.radius + 6, view.el) * (narrow() ? 0.92 : 1.0);
  applyLang();
  refresh();
  applyCam();
  const u0 = (qs.get("u") || "").replace(/^@/, "").toLowerCase();
  if (u0) {
    const pi = byLogin.get(u0);
    q.value = qs.get("u").replace(/^@/, "");
    if (pi != null) { idle = false; selectPerson(pi, { fly: false }); setTimeout(flyFirst, 500); }
    else renderResults();
  }
  requestAnimationFrame((now) => { frame(now); $("loading").classList.add("gone"); document.body.classList.add("ready"); });
  window.__rings = { view, flyTo, selectPerson, clearPerson, pick, project, makeCard, logins, byLogin, B, heights: city.heights, state: () => ({ sel, bsel, tl, curC, playing }) };
})();
