// ---------------------------------------------------------------------------
// Taller 3D: maniquí con el look que coses (siluetas, telas con material físico y adornos).
// Fase 1: las prendas se construyen por código. En la fase 2 se cambian por modelos .glb.
// ---------------------------------------------------------------------------
const Atelier3D = (() => {
  let loading = null;
  function load() {
    if (window.THREE) return Promise.resolve(true);
    if (loading) return loading;
    loading = new Promise((res) => {
      const s = document.createElement("script");
      s.src = "./js/vendor/three.min.js";
      s.onload = () => (window.THREE ? loadBody().then(() => res(true)) : res(false));
      s.onerror = () => res(false);
      document.head.append(s);
    });
    return loading;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- Texturas de tela (canvas) ----------
  function canvasTex(draw, size = 256, rep = [6, 6]) {
    const T = THREE;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d"), size);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(rep[0], rep[1]);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  const hex = (c) => "#" + new THREE.Color(c).getHexString();
  function lighten(c, f) { const k = new THREE.Color(c); k.lerp(new THREE.Color("#ffffff"), f); return k; }
  function darken(c, f) { const k = new THREE.Color(c); k.multiplyScalar(1 - f); return k; }

  function fabric(tela, color) {
    const T = THREE;
    const col = new T.Color(color);
    const P = (o) => new T.MeshPhysicalMaterial({ color: col, side: T.DoubleSide, ...o });
    switch (tela) {
      case "algodon": return P({ roughness: 0.9 });
      case "raso": return P({ roughness: 0.32, sheen: 0.4, sheenColor: lighten(col, 0.5), clearcoat: 0.25, clearcoatRoughness: 0.4 });
      case "tul": return P({ roughness: 0.75, transparent: true, opacity: 0.55, depthWrite: false, sheen: 0.6, sheenColor: lighten(col, 0.6) });
      case "encaje": {
        const t = canvasTex((g, s) => {
          g.clearRect(0, 0, s, s);
          g.strokeStyle = "#fff"; g.lineWidth = 7;
          for (let k = 0; k < 4; k++) { const x = (k % 2) * s / 2 + s / 4, y = Math.floor(k / 2) * s / 2 + s / 4; g.beginPath(); g.arc(x, y, s / 6, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, s / 14, 0, 7); g.fill(); }
          g.lineWidth = 4; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(0, (k * s) / 4); g.lineTo(s, (k * s) / 4); g.stroke(); }
        }, 256, [10, 8]);
        return P({ roughness: 0.6, alphaMap: t, transparent: true, alphaTest: 0.35 });
      }
      case "terciopelo": return P({ roughness: 0.9, sheen: 1, sheenRoughness: 0.3, sheenColor: lighten(col, 0.55) });
      case "lunares": return P({ roughness: 0.55, map: canvasTex((g, s) => { g.fillStyle = hex(col); g.fillRect(0, 0, s, s); g.fillStyle = col.getHex() > 0xeeeeee ? "#c8102e" : "#fff"; [[.25, .25], [.75, .75]].forEach(([x, y]) => { g.beginPath(); g.arc(x * s, y * s, s * 0.12, 0, 7); g.fill(); }); }, 128, [14, 10]) , color: 0xffffff });
      case "flores": return P({ roughness: 0.65, color: 0xffffff, map: canvasTex((g, s) => {
        g.fillStyle = hex(col); g.fillRect(0, 0, s, s);
        const pet = ["#ffffff", "#ffd34d", hex(lighten(col, 0.6))];
        for (let k = 0; k < 7; k++) { const x = rnd(0, s), y = rnd(0, s), r = rnd(10, 20), c = pet[k % 3]; g.fillStyle = c; for (let p = 0; p < 5; p++) { g.beginPath(); g.ellipse(x + Math.cos(p * 1.256) * r * 0.6, y + Math.sin(p * 1.256) * r * 0.6, r * 0.45, r * 0.28, p * 1.256, 0, 7); g.fill(); } g.fillStyle = "#c98b00"; g.beginPath(); g.arc(x, y, r * 0.22, 0, 7); g.fill(); g.strokeStyle = "#2f7a3a"; g.lineWidth = 3; g.beginPath(); g.moveTo(x + r, y + r * 0.3); g.quadraticCurveTo(x + r * 1.6, y + r, x + r * 1.2, y + r * 1.8); g.stroke(); }
      }, 256, [6, 5]) });
      case "leopardo": return P({ roughness: 0.6, color: 0xffffff, map: canvasTex((g, s) => {
        g.fillStyle = hex(col); g.fillRect(0, 0, s, s);
        for (let k = 0; k < 26; k++) { const x = rnd(0, s), y = rnd(0, s), r = rnd(7, 13); g.fillStyle = "#2a1a10"; g.beginPath(); g.ellipse(x, y, r, r * 0.75, rnd(0, 3), 0.3, 5.5); g.lineWidth = r * 0.45; g.strokeStyle = "#2a1a10"; g.stroke(); g.fillStyle = hex(darken(col, 0.35)); g.beginPath(); g.ellipse(x, y, r * 0.5, r * 0.35, 0, 0, 7); g.fill(); }
      }, 256, [5, 4]) });
      case "rayas": return P({ roughness: 0.45, color: 0xffffff, map: canvasTex((g, s) => { g.fillStyle = "#f4f1ec"; g.fillRect(0, 0, s, s); g.fillStyle = "#151515"; g.fillRect(0, 0, s / 2, s); }, 64, [24, 1]) });
      case "latex": return P({ roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, reflectivity: 0.7 });
      case "lame": return P({ metalness: 0.95, roughness: 0.26 });
      case "lentejuela": {
        const map = canvasTex((g, s) => {
          g.fillStyle = hex(darken(col, 0.2)); g.fillRect(0, 0, s, s);
          const n = 8, st = s / n;
          for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const cx = x * st + (y % 2) * st / 2, cy = y * st; const f = Math.random(); g.fillStyle = hex(f > 0.85 ? lighten(col, 0.8) : f > 0.5 ? lighten(col, 0.3) : col); g.beginPath(); g.arc(cx, cy, st * 0.48, 0, 7); g.fill(); }
        }, 256, [18, 14]);
        return P({ color: 0xffffff, map, metalness: 0.85, roughness: 0.22, clearcoat: 0.5, iridescence: 0.25 });
      }
      default: return P({ roughness: 0.5 });
    }
  }

  // ---------- Geometría ----------
  // Torno con pliegues: el radio ondula más cuanto más cerca del bajo
  function lathe(prof, { folds = 0, amp = 0, ell = 0.78, phiStart = 0, phiLength = Math.PI * 2, seg = 120, pow = 1.6, flat = false } = {}) {
    const T = THREE;
    const pts = prof.map(([r, y]) => new T.Vector2(r, y));
    const g = new T.LatheGeometry(pts, seg, phiStart, phiLength);
    const p = g.attributes.position;
    const yTop = Math.max(...prof.map((q) => q[1])), yBot = Math.min(...prof.map((q) => q[1]));
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const t = Math.min(1, Math.max(0, (yTop - y) / Math.max(0.001, yTop - yBot)));
      const th = Math.atan2(x, z);
      const w = 1 + amp * Math.pow(t, pow) * Math.sin(folds * th + Math.sin(th * 3) * 0.6);
      // Más plano (de lado) en el torso y redondo en la falda, según la altura real
      const e = flat ? ell : ell + (1 - ell) * Math.min(1, Math.max(0, (0.95 - y) / 0.4));
      p.setXYZ(i, x * w, y, z * w * e);
    }
    g.computeVertexNormals();
    return g;
  }
  // Punto de la superficie de un perfil a una altura y un ángulo
  function surf(prof, y, th, ell = 0.78, off = 0.008) {
    const P = prof.slice().sort((a, b) => a[1] - b[1]);
    let r = P[0][0];
    for (let i = 0; i < P.length - 1; i++) if (y >= P[i][1] && y <= P[i + 1][1]) { const k = (y - P[i][1]) / (P[i + 1][1] - P[i][1] || 1); r = P[i][0] + (P[i + 1][0] - P[i][0]) * k; }
    if (y > P[P.length - 1][1]) r = P[P.length - 1][0];
    const e = ell + (1 - ell) * Math.min(1, Math.max(0, (0.95 - y) / 0.4));
    return new THREE.Vector3(Math.sin(th) * (r + off), y, Math.cos(th) * (r + off) * e);
  }

  // Cuerpo: maniquí estilizado con tacones
  function body(skin, sheerLegs) {
    const T = THREE, g = new T.Group();
    const sk = new T.MeshPhysicalMaterial({ color: skin, roughness: 0.55, sheen: 0.3, sheenColor: new T.Color("#ffd9c4") });
    const torso = lathe([[0.001, 0.93], [0.16, 0.95], [0.165, 1.02], [0.13, 1.12], [0.15, 1.25], [0.165, 1.35], [0.15, 1.45], [0.11, 1.52], [0.05, 1.56], [0.045, 1.62]], { ell: 0.72, flat: true });
    g.add(new T.Mesh(torso, sk));
    const head = new T.Mesh(new T.SphereGeometry(0.105, 48, 32), sk);
    head.scale.set(0.82, 1.1, 0.92); head.position.set(0, 1.73, 0.01); g.add(head);
    const legM = sheerLegs ? new T.MeshPhysicalMaterial({ color: "#2b2024", roughness: 0.4, transparent: true, opacity: 0.85, sheen: 0.6 }) : sk;
    [-1, 1].forEach((s) => {
      const thigh = new T.Mesh(new T.CylinderGeometry(0.075, 0.05, 0.5, 24), legM); thigh.position.set(0.08 * s, 0.72, 0); thigh.rotation.z = 0.04 * s; g.add(thigh);
      const shin = new T.Mesh(new T.CylinderGeometry(0.05, 0.032, 0.44, 24), legM); shin.position.set(0.09 * s, 0.26, 0.0); g.add(shin);
      const shoe = new T.Mesh(new T.BoxGeometry(0.06, 0.03, 0.14), new T.MeshPhysicalMaterial({ color: "#111", roughness: 0.15, clearcoat: 1 })); shoe.position.set(0.09 * s, 0.06, 0.05); shoe.rotation.x = 0.45; g.add(shoe);
      const heel = new T.Mesh(new T.CylinderGeometry(0.006, 0.004, 0.09, 8), shoe.material); heel.position.set(0.09 * s, 0.045, -0.02); g.add(heel);
      const arm = new T.Mesh(new T.CapsuleGeometry(0.035, 0.5, 8, 16), sk); arm.position.set(0.2 * s, 1.18, 0); arm.rotation.z = 0.12 * s; g.add(arm);
      const fore = new T.Mesh(new T.CapsuleGeometry(0.028, 0.28, 8, 16), sk); fore.position.set(0.25 * s, 0.78, 0.03); fore.rotation.z = 0.05 * s; fore.rotation.x = -0.15; g.add(fore);
    });
    return g;
  }
  const HAIR = { Glamour: "#e6c47a", Camp: "#ff7ac0", Edgy: "#161616", Futurista: "#d9dde3", Folclórico: "#2a1a14" };
  function wig(tag) {
    const T = THREE, g = new T.Group();
    const m = new T.MeshPhysicalMaterial({ side: T.DoubleSide, color: HAIR[tag] || "#3a2418", roughness: 0.45, sheen: 1, sheenColor: new T.Color("#ffffff"), sheenRoughness: 0.4, metalness: tag === "Futurista" ? 0.6 : 0 });
    const cap = new T.Mesh(new T.SphereGeometry(0.118, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.55), m); cap.position.set(0, 1.745, 0.0); cap.scale.set(0.9, 1.12, 1); g.add(cap);
    if (tag === "Glamour") { const l = new T.Mesh(lathe([[0.06, 1.3], [0.12, 1.42], [0.125, 1.6], [0.11, 1.78]], { folds: 9, amp: 0.12, ell: 0.6, phiStart: Math.PI * 0.62, phiLength: Math.PI * 0.76 }), m); g.add(l); }
    if (tag === "Camp") { const b = new T.Mesh(new T.SphereGeometry(0.19, 40, 30), m); b.position.set(0, 1.86, -0.02); b.scale.set(1, 1.15, 0.95); g.add(b); }
    if (tag === "Edgy") { const b = new T.Mesh(new T.SphereGeometry(0.128, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.72), m); b.position.set(0, 1.74, -0.005); b.scale.set(0.95, 1.08, 1); g.add(b); }
    if (tag === "Futurista") { const p = new T.Mesh(new T.CapsuleGeometry(0.03, 0.42, 8, 16), m); p.position.set(0, 1.62, -0.13); p.rotation.x = 0.18; g.add(p); }
    if (tag === "Folclórico") {
      const b = new T.Mesh(new T.SphereGeometry(0.06, 32, 24), m); b.position.set(0, 1.74, -0.12); g.add(b);
      const pe = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.012, 32, 1, false, 0, Math.PI), new T.MeshPhysicalMaterial({ color: "#3b2414", roughness: 0.2, clearcoat: 1 })); pe.position.set(0, 1.84, -0.1); pe.rotation.x = Math.PI / 2 - 0.3; pe.rotation.z = Math.PI / 2; g.add(pe);
      const fl = new T.Mesh(new T.SphereGeometry(0.035, 16, 12), new T.MeshPhysicalMaterial({ color: "#c8102e", roughness: 0.6 })); fl.position.set(0.09, 1.8, -0.02); g.add(fl);
    }
    return g;
  }

  // Perfiles de cada silueta: [radio, altura]
  const BOD = [[0.178, 1.0], [0.148, 1.12], [0.168, 1.25], [0.182, 1.35], [0.166, 1.45]];
  function garment(spec) {
    const T = THREE, g = new T.Group();
    const mat = fabric(spec.tela, spec.color);
    const add = (geo, m = mat) => { const me = new T.Mesh(geo, m); me.castShadow = true; g.add(me); return me; };
    let main = BOD, hem = { y: 1.0, r: 0.18 }, legs = null;
    switch (spec.shape) {
      case "gown": main = [[0.66, 0.03], [0.54, 0.3], [0.38, 0.6], [0.25, 0.88], [0.17, 1.06], [0.148, 1.12], ...BOD.slice(2)]; add(lathe(main, { folds: 13, amp: 0.08 })); hem = { y: 0.03, r: 0.66 }; break;
      case "mermaid": main = [[0.5, 0.03], [0.32, 0.17], [0.17, 0.4], [0.155, 0.55], [0.188, 0.9], [0.178, 1.0], ...BOD.slice(1)]; add(lathe(main, { folds: 11, amp: 0.13, pow: 4 })); hem = { y: 0.03, r: 0.5 }; break;
      case "mini": main = [[0.33, 0.62], [0.26, 0.76], [0.2, 0.95], ...BOD.slice(1)]; add(lathe(main, { folds: 10, amp: 0.07 })); hem = { y: 0.62, r: 0.33 }; break;
      case "flamenca": {
        main = [[0.2, 0.6], [0.19, 0.9], ...BOD]; add(lathe(main, { folds: 0 }));
        for (let i = 0; i < 3; i++) { const y0 = 0.66 - i * 0.21, r0 = 0.21 + i * 0.09; add(lathe([[r0 + 0.17, y0 - 0.25], [r0 + 0.06, y0 - 0.12], [r0, y0]], { folds: 20, amp: 0.13, pow: 1.2 })); }
        hem = { y: 0.03, r: 0.6 }; break;
      }
      case "jumpsuit": case "suit": {
        const isSuit = spec.shape === "suit";
        main = isSuit ? [[0.2, 0.8], [0.19, 1.0], [0.17, 1.12], [0.19, 1.25], [0.2, 1.38], [0.19, 1.47]] : [[0.18, 0.86], [0.178, 1.0], ...BOD.slice(1)];
        add(lathe(main, { folds: isSuit ? 0 : 6, amp: 0.02 }));
        const lm = isSuit ? mat.clone() : mat; if (isSuit) lm.color = darken(mat.color, 0.25);
        [-1, 1].forEach((s) => { const leg = new T.Mesh(new T.CylinderGeometry(isSuit ? 0.075 : 0.085, isSuit ? 0.07 : 0.12, 0.84, 32, 1, true), lm); leg.position.set(0.085 * s, 0.48, 0); g.add(leg); });
        if (isSuit) [-1, 1].forEach((s) => { const sh = new T.Mesh(new T.BoxGeometry(0.11, 0.05, 0.16), mat); sh.position.set(0.18 * s, 1.47, 0); sh.rotation.z = -0.15 * s; g.add(sh); const sl = new T.Mesh(new T.CylinderGeometry(0.045, 0.04, 0.62, 24, 1, true), mat); sl.position.set(0.215 * s, 1.15, 0); sl.rotation.z = 0.12 * s; g.add(sl); });
        hem = { y: isSuit ? 0.8 : 0.86, r: 0.19 }; break;
      }
      case "cape": case "bodysuit": {
        main = [[0.11, 0.9], [0.172, 0.99], ...BOD.slice(1)]; add(lathe(main));
        legs = "sheer";
        if (spec.shape === "cape") { add(lathe([[0.85, 0.03], [0.5, 0.6], [0.3, 1.2], [0.21, 1.47], [0.16, 1.53]], { folds: 9, amp: 0.07, ell: 0.85, phiStart: Math.PI * 0.55, phiLength: Math.PI * 0.9 })); hem = { y: 0.03, r: 0.8 }; }
        else hem = { y: 0.92, r: 0.15 };
        break;
      }
    }
    // ---- Adornos
    const trims = spec.trims || [];
    const inst = (geo, m, n, place) => { const im = new T.InstancedMesh(geo, m, n); const o = new T.Object3D(); for (let i = 0; i < n; i++) { place(o, i); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } g.add(im); return im; };
    const yMin = Math.max(Math.min(...main.map((q) => q[1])), spec.shape === "flamenca" ? 0.62 : 0), yMax = 1.44;
    const lookAtOut = (o, p) => { o.position.copy(p); o.lookAt(p.x * 3, p.y, p.z * 3); };
    if (trims.includes("pedreria")) inst(new T.OctahedronGeometry(0.009), new T.MeshPhysicalMaterial({ color: "#ffffff", metalness: 1, roughness: 0.05, emissive: "#ffffff", emissiveIntensity: 0.15 }), 260, (o) => { const y = rnd(yMin, yMax), p = surf(main, y, rnd(0, Math.PI * 2)); o.position.copy(p); o.rotation.set(rnd(0, 3), rnd(0, 3), 0); o.scale.setScalar(rnd(0.7, 1.4)); });
    if (trims.includes("plumas")) {
      const fm = new T.MeshPhysicalMaterial({ color: lighten(spec.color, 0.25), roughness: 1, sheen: 1, sheenColor: lighten(spec.color, 0.7) });
      const n = 110;
      inst(new T.SphereGeometry(1, 10, 8), fm, n, (o, i) => { const top = i < 30; const th = (i / (top ? 30 : n - 30)) * Math.PI * 2 + rnd(-0.05, 0.05); const y = top ? 1.45 : hem.y + 0.03; const r = top ? 0.17 : hem.r; o.position.set(Math.sin(th) * (r + 0.02), y + rnd(-0.02, 0.02), Math.cos(th) * (r + 0.02) * (top ? 0.78 : 1)); o.lookAt(o.position.x * 3, y - (top ? -0.2 : 0.5), o.position.z * 3); o.scale.set(0.018, 0.012, rnd(0.06, 0.09)); });
    }
    if (trims.includes("flecos")) inst(new T.CylinderGeometry(0.0022, 0.0022, 1, 4), new T.MeshPhysicalMaterial({ color: lighten(spec.color, 0.35), metalness: 0.4, roughness: 0.3 }), 160, (o, i) => { const th = (i / 160) * Math.PI * 2, L = rnd(0.16, 0.22), p = surf(main, 1.1, th, 0.78, 0.012); o.position.set(p.x, 1.1 - L / 2, p.z); o.scale.set(1, L, 1); });
    if (trims.includes("volantes")) add(lathe([[hem.r + 0.1, Math.max(0.02, hem.y - 0.02)], [hem.r + 0.02, hem.y + 0.1]], { folds: 28, amp: 0.16, pow: 1, ell: 1 }), new T.MeshPhysicalMaterial({ color: lighten(spec.color, 0.65), roughness: 0.5, side: T.DoubleSide, sheen: 0.5 }));
    if (trims.includes("tachuelas")) inst(new T.ConeGeometry(0.008, 0.022, 10), new T.MeshPhysicalMaterial({ color: "#d0d4da", metalness: 1, roughness: 0.15 }), 90, (o, i) => { const y = i < 45 ? 1.43 : 1.12, th = ((i % 45) / 45) * Math.PI * 2, p = surf(main, y, th, 0.78, 0.01); lookAtOut(o, p); o.rotateX(Math.PI / 2); });
    if (trims.includes("leds")) inst(new T.SphereGeometry(0.009, 10, 8), new T.MeshStandardMaterial({ color: "#7ff9ff", emissive: "#5ff2ff", emissiveIntensity: 3 }), 90, (o) => { const p = surf(main, rnd(yMin, yMax), rnd(0, Math.PI * 2)); o.position.copy(p); });
    if (trims.includes("lazos")) {
      const bm = new T.MeshPhysicalMaterial({ color: lighten(spec.color, 0.45), roughness: 0.35, sheen: 0.8 });
      const p = surf(main, 1.12, 0, 0.78, 0.02);
      [-1, 1].forEach((s) => { const c = new T.Mesh(new T.ConeGeometry(0.05, 0.11, 24), bm); c.position.set(p.x + 0.05 * s, p.y, p.z); c.rotation.z = (Math.PI / 2) * s; c.scale.set(1, 1, 0.45); g.add(c); });
      const k = new T.Mesh(new T.SphereGeometry(0.022, 16, 12), bm); k.position.copy(p); g.add(k);
    }
    if (trims.includes("escamas")) inst(new T.CircleGeometry(0.018, 12, 0, Math.PI), new T.MeshPhysicalMaterial({ color: lighten(spec.color, 0.3), metalness: 0.9, roughness: 0.2, iridescence: 1, side: T.DoubleSide }), 380, (o) => { const p = surf(main, rnd(yMin, Math.min(yMax, 1.1)), rnd(0, Math.PI * 2), 0.78, 0.01); lookAtOut(o, p); o.rotateZ(Math.PI); });
    return { g, legs };
  }


  // ================= Cuerpo real (models/cuerpo.glb con formas Bajita y Grande) =================
  let REAL = null;
  // Lector mínimo de GLB: posiciones, normales, UV, índices y formas clave
  function parseGLB(buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("no es glb");
    let off = 12, json = null, bin = null;
    while (off < buf.byteLength) {
      const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
      if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off + 8, len)));
      else if (type === 0x004e4942) bin = buf.slice(off + 8, off + 8 + len);
      off += 8 + len;
    }
    const acc = (i) => {
      const a = json.accessors[i], bv = json.bufferViews[a.bufferView];
      const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
      const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
      const start = (bv.byteOffset || 0) + (a.byteOffset || 0);
      return new C(bin.slice(start, start + a.count * n * C.BYTES_PER_ELEMENT));
    };
    const mesh = json.meshes[0], p = mesh.primitives[0];
    const names = (mesh.extras && mesh.extras.targetNames) || [];
    return {
      pos: acc(p.attributes.POSITION),
      uv: p.attributes.TEXCOORD_0 != null ? acc(p.attributes.TEXCOORD_0) : null,
      index: p.indices != null ? acc(p.indices) : null,
      morphs: (p.targets || []).map((t, i) => ({ name: String(names[i] || i).toLowerCase(), d: acc(t.POSITION) })),
    };
  }
  async function loadBody() {
    try {
      const r = await fetch("./models/cuerpo.glb?v=1");
      if (!r.ok) return;
      REAL = parseGLB(await r.arrayBuffer());
      REAL.cache = {};
    } catch (e) { REAL = null; }
  }

  // Forma del cuerpo según el tipo (alta, bajita o grande) y sus medidas por altura
  function bodyOf(type) {
    const T = THREE;
    if (REAL.cache[type]) return REAL.cache[type];
    const pos = REAL.pos.slice();
    const m = REAL.morphs.find((x) => x.name === type);
    if (m) for (let i = 0; i < pos.length; i++) pos[i] += m.d[i];
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    if (REAL.uv) geo.setAttribute("uv", new T.BufferAttribute(REAL.uv, 2));
    if (REAL.index) geo.setIndex(new T.BufferAttribute(REAL.index, 1));
    geo.computeVertexNormals();
    const n = pos.length / 3;
    let H = 0;
    for (let i = 0; i < n; i++) H = Math.max(H, pos[i * 3 + 1]);
    // Triángulos agrupados en cubos de 1 cm de alto: cortar con un plano da contornos cerrados (tronco, piernas, brazos, manos)
    const ix = REAL.index || Uint32Array.from({ length: n }, (_, i) => i);
    const bins = [];
    for (let t = 0; t < ix.length; t += 3) {
      const y0 = Math.min(pos[ix[t] * 3 + 1], pos[ix[t + 1] * 3 + 1], pos[ix[t + 2] * 3 + 1]), y1 = Math.max(pos[ix[t] * 3 + 1], pos[ix[t + 1] * 3 + 1], pos[ix[t + 2] * 3 + 1]);
      for (let q = Math.floor(y0 * 100); q <= Math.floor(y1 * 100); q++) (bins[q] = bins[q] || []).push(t);
    }
    const sl = {};
    function slice(y) {
      const k = Math.round(y * 200);
      if (sl[k]) return sl[k];
      // Corta cada triángulo y une los trozos que comparten arista: cada grupo es un contorno
      const T3 = bins[Math.floor(y * 100)] || [], P2 = new Map(), par = new Map();
      const find = (a) => { while (par.get(a) !== a) { par.set(a, par.get(par.get(a))); a = par.get(a); } return a; };
      const cut = (u, v) => {
        const ya = pos[u * 3 + 1], yb = pos[v * 3 + 1];
        if ((ya - y) * (yb - y) > 0 || ya === yb) return null;
        const key = u < v ? u * 1e6 + v : v * 1e6 + u;
        if (!P2.has(key)) { const t = (y - ya) / (yb - ya); P2.set(key, [pos[u * 3] + (pos[v * 3] - pos[u * 3]) * t, pos[u * 3 + 2] + (pos[v * 3 + 2] - pos[u * 3 + 2]) * t]); par.set(key, key); }
        return key;
      };
      for (const t of T3) {
        const a = ix[t], b = ix[t + 1], c = ix[t + 2];
        const ks = [cut(a, b), cut(b, c), cut(c, a)].filter((x) => x != null);
        if (ks.length >= 2) { const r1 = find(ks[0]), r2 = find(ks[1]); if (r1 !== r2) par.set(r1, r2); }
      }
      if (P2.size < 6) return (sl[k] = null);
      const comps = new Map();
      P2.forEach((pt, key) => { const r = find(key); if (!comps.has(r)) comps.set(r, []); comps.get(r).push(pt); });
      // Tronco y piernas: contornos cerca del centro; brazos y manos: los que quedan lejos
      const TH = 0.19, core = [], arm = [];
      let nCore = 0;
      comps.forEach((cp) => {
        if (cp.length < 3) return;
        const cx = cp.reduce((t, q) => t + q[0], 0) / cp.length;
        if (Math.abs(cx) < TH) { nCore++; cp.forEach((q) => core.push(q)); }
        else if (cx > 0) cp.forEach((q) => arm.push(q));
      });
      if (core.length < 4) return (sl[k] = null);
      const pts = core;
      let bnd = 0;
      pts.forEach((q) => (bnd = Math.max(bnd, Math.abs(q[0]))));
      let zf = -1, zb = -1, minAx = 9, lx0 = 9, lx1 = 0, lzf = -1, lzb = -1;
      pts.forEach(([x, z]) => {
        const a = Math.abs(x);
        if (a <= bnd + 1e-6) {
          zf = Math.max(zf, z); zb = Math.max(zb, -z); minAx = Math.min(minAx, a);
          if (x > 0) { lx0 = Math.min(lx0, x); lx1 = Math.max(lx1, x); lzf = Math.max(lzf, z); lzb = Math.max(lzb, -z); }
        }
      });
      // Contorno del tronco por ángulos (alrededor de su centro), para que la tela lo copie
      const NB = 64, cz0 = (zf - zb) / 2, pol = new Array(NB).fill(0);
      pts.forEach(([x, z]) => { if (Math.abs(x) > bnd + 1e-6) return; const th = Math.atan2(x, z - cz0); const bi = ((Math.round((th / (Math.PI * 2)) * NB) % NB) + NB) % NB; pol[bi] = Math.max(pol[bi], Math.hypot(x, z - cz0)); });
      for (let pass = 0; pass < 3; pass++) for (let i = 0; i < NB; i++) if (!pol[i]) pol[i] = Math.max(pol[(i + NB - 1) % NB], pol[(i + 1) % NB]);
      const polar = pol.map((r, i) => Math.max(r, (pol[(i + 1) % NB] + pol[(i + NB - 1) % NB]) / 2));
      // Envolvente sin huecos (para las faldas que cubren las dos piernas)
      const hull = new Array(NB).fill(0);
      pts.forEach(([x, z]) => { if (Math.abs(x) > bnd + 1e-6) return; for (let i = 0; i < NB; i++) { const th = (i / NB) * Math.PI * 2; hull[i] = Math.max(hull[i], x * Math.sin(th) + (z - cz0) * Math.cos(th)); } });
      let A = null;
      if (arm.length > 4) {
        let x0 = 9, x1 = -9, z0 = 9, z1 = -9;
        arm.forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); });
        A = { cx: (x0 + x1) / 2, rx: (x1 - x0) / 2, cz: (z0 + z1) / 2, rz: (z1 - z0) / 2 };
      }
      return (sl[k] = { rx: bnd, zf, zb, polar, hull, cz0, split: nCore >= 2 || minAx > 0.004, leg: { cx: (lx0 + lx1) / 2, rx: (lx1 - lx0) / 2, zf: lzf, zb: lzb }, arm: A });
    }
    // Puntos de referencia del cuerpo
    const at = (f) => slice(H * f) || slice(H * f + 0.01) || slice(H * f - 0.01);
    let armpit = H * 0.74;
    for (let y = H * 0.84; y > H * 0.6; y -= 0.005) { const s = slice(y); if (s && s.arm && s.rx < 0.26) { armpit = y; break; } }
    let waist = H * 0.62, wr = 9;
    for (let y = H * 0.56; y < Math.min(H * 0.68, armpit - 0.08); y += 0.005) { const s = slice(y); if (s && s.rx < wr) { wr = s.rx; waist = y; } }
    let crotch = H * 0.47;
    for (let y = waist - 0.05; y > H * 0.35; y -= 0.004) { const s = slice(y); if (s && s.split) { crotch = y; break; } }
    let hip = (waist + crotch) / 2, hr = 0;
    for (let y = crotch + 0.01; y < waist; y += 0.005) { const s = slice(y); if (s && s.rx > hr) { hr = s.rx; hip = y; } }
    const B = { type, geo, H, slice, at, armpit, waist, crotch, hip, knee: H * 0.28, ankle: H * 0.055 };
    REAL.cache[type] = B;
    return B;
  }

  // Malla de anillos (cada fila: altura, medio ancho, profundidad delante y detrás, centro)
  function ringMesh(rows, { folds = 0, amp = () => 0, seg = 112, n = 2.5, th0 = 0, thL = Math.PI * 2 } = {}) {
    const T = THREE, P = [], UV = [], I = [];
    rows.forEach((r, j) => {
      const t = j / Math.max(1, rows.length - 1), w0 = amp(t, r);
      for (let k = 0; k <= seg; k++) {
        const th = th0 + (k / seg) * thL, s = Math.sin(th), c = Math.cos(th);
        const sx = Math.sign(s) * Math.pow(Math.abs(s), 2 / n), sz = Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
        const w = 1 + w0 * Math.sin(folds * th + Math.sin(th * 3) * 0.6);
        if (r.polar) {
          const NB = r.polar.length, f = ((((th / (Math.PI * 2)) * NB) % NB) + NB) % NB, i0 = Math.floor(f) % NB, i1 = (i0 + 1) % NB, rr = r.polar[i0] + (r.polar[i1] - r.polar[i0]) * (f - Math.floor(f));
          P.push((r.cx || 0) + s * rr * w, r.y, (r.cz0 || 0) + c * rr * w);
        } else P.push((r.cx || 0) + sx * r.rx * w, r.y, (r.cz || 0) + sz * (sz > 0 ? r.zf : r.zb) * w);
        UV.push((k / seg) * 4, t * 3);
      }
    });
    for (let j = 0; j < rows.length - 1; j++) for (let k = 0; k < seg; k++) { const a = j * (seg + 1) + k, b = a + seg + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(P, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(UV, 2));
    g.setIndex(I);
    g.computeVertexNormals();
    return g;
  }
  const ringPt = (r, th, out = 0.01) => {
    if (r.polar) { const NB = r.polar.length, i = ((Math.round((th / (Math.PI * 2)) * NB) % NB) + NB) % NB, rr = r.polar[i] + out; return new THREE.Vector3(Math.sin(th) * rr, r.y, (r.cz0 || 0) + Math.cos(th) * rr); } const s = Math.sin(th), c = Math.cos(th), n = 2.5; const sx = Math.sign(s) * Math.pow(Math.abs(s), 2 / n), sz = Math.sign(c) * Math.pow(Math.abs(c), 2 / n); return new THREE.Vector3((r.cx || 0) + sx * (r.rx + out), r.y, (r.cz || 0) + sz * ((sz > 0 ? r.zf : r.zb) + out)); };

  // Filas medidas sobre el cuerpo entre dos alturas (con holgura)
  function measured(B, y1, y0, m, step = 0.012, pick = (s) => s) {
    const rows = [];
    for (let y = y1; y >= y0 - 1e-6; y -= step) { const s = B.slice(y); if (!s) continue; const q = pick(s); if (!q) continue; rows.push({ y, rx: q.rx + m, zf: q.zf + m, zb: q.zb + m, cx: q.cx || 0, cz: q.cz || 0, polar: q.polar ? (s.split ? q.hull : q.polar).map((r) => r + m) : null, cz0: q.cz0 || 0 }); }
    // Suaviza con la mediana de cada tres filas para que no haya escalones
    const med = (a, b, c) => a + b + c - Math.max(a, b, c) - Math.min(a, b, c);
    return rows.map((r, i) => { const p = rows[i - 1] || r, q = rows[i + 1] || r; return { ...r, rx: med(p.rx, r.rx, q.rx), zf: med(p.zf, r.zf, q.zf), zb: med(p.zb, r.zb, q.zb), cx: med(p.cx, r.cx, q.cx), polar: r.polar && p.polar && q.polar ? r.polar.map((v, k) => med(p.polar[k], v, q.polar[k])) : r.polar }; });
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  // De una fila a una falda que se abre hasta el bajo
  function flare(from, yHem, rHem, steps = 14, curve = 1.6) {
    const rows = [];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, e = Math.pow(t, curve);
      rows.push({ y: lerp(from.y, yHem, t), rx: lerp(from.rx, rHem, e), zf: lerp(from.zf, rHem, e), zb: lerp(from.zb, rHem, e), cz0: lerp(from.cz0 || 0, 0, e), polar: from.polar ? from.polar.map((v) => lerp(v, rHem, e)) : null });
    }
    return rows;
  }
  const legRow = (s) => s.split ? { rx: s.leg.rx, zf: s.leg.zf, zb: s.leg.zb, cx: s.leg.cx } : null;
  const armRow = (s) => s.arm ? { rx: s.arm.rx, zf: s.arm.rz, zb: s.arm.rz, cx: s.arm.cx, cz: s.arm.cz } : null;
  const mirror = (rows) => rows.map((r) => ({ ...r, cx: -(r.cx || 0) }));

  function realGarment(B, spec) {
    const T = THREE, g = new T.Group(), H = B.H, k = H / 1.89;
    const mat = fabric(spec.tela, spec.color);
    const surfaces = [];
    const add = (geo, m = mat, surf = true) => { const me = new T.Mesh(geo, m); me.castShadow = true; g.add(me); if (surf) surfaces.push(me); return me; };
    const top = B.armpit - 0.008;
    const tight = (y0, m = 0.014) => measured(B, top, y0, m);
    let hemRow = null, topRow = null, waistRow = null, sheer = false;
    const tube = (rows, o = {}) => { add(ringMesh(rows, o)); return rows; };
    switch (spec.shape) {
      case "gown": {
        const r = tight(B.waist); const sk = flare(r[r.length - 1], 0.02, 0.6 * k, 16, 1.5);
        tube([...r, ...sk], { folds: 13, amp: (t, row) => (row.y < B.waist ? 0.09 * Math.pow((B.waist - row.y) / B.waist, 1.4) : 0) });
        hemRow = sk[sk.length - 1]; topRow = r[0]; waistRow = r[r.length - 1]; break;
      }
      case "mermaid": {
        const r = measured(B, top, B.knee + 0.04, 0.016); const sk = flare(r[r.length - 1], 0.02, 0.42 * k, 10, 1.4);
        tube([...r, ...sk], { folds: 11, amp: (t, row) => (row.y < B.knee + 0.05 ? 0.14 * Math.min(1, (B.knee + 0.05 - row.y) / B.knee) : 0) });
        hemRow = sk[sk.length - 1]; topRow = r[0]; waistRow = r.find((x) => x.y <= B.waist) || r[0]; break;
      }
      case "mini": {
        const r = tight(B.hip); const sk = flare(r[r.length - 1], B.crotch - 0.14 * k, r[r.length - 1].rx * 1.45, 8, 1);
        tube([...r, ...sk], { folds: 10, amp: (t, row) => (row.y < B.hip ? 0.06 : 0) });
        hemRow = sk[sk.length - 1]; topRow = r[0]; waistRow = r.find((x) => x.y <= B.waist) || r[0]; break;
      }
      case "flamenca": {
        const r = measured(B, top, B.knee + 0.12 * k, 0.016); tube(r);
        let prev = r[r.length - 1];
        for (let i = 0; i < 3; i++) {
          const y0 = prev.y + 0.03, y1 = i === 2 ? 0.02 : prev.y - 0.2 * k, rr = prev.rx + 0.12 * k + i * 0.04;
          const tier = [{ ...prev, y: y0 }, ...flare({ ...prev, y: y0 }, y1, rr, 6, 0.8)];
          tube(tier, { folds: 22, amp: (t) => 0.14 * t });
          prev = { y: y1 + 0.02, rx: rr * 0.82, zf: rr * 0.82, zb: rr * 0.82 };
        }
        hemRow = { y: 0.02, rx: prev.rx / 0.82, zf: prev.rx / 0.82, zb: prev.rx / 0.82 }; topRow = r[0]; waistRow = r.find((x) => x.y <= B.waist) || r[0]; break;
      }
      case "jumpsuit": case "suit": {
        const suit = spec.shape === "suit";
        const r = suit ? measured(B, B.armpit - 0.01, B.crotch - 0.05, 0.03) : tight(B.crotch - 0.04, 0.016);
        tube(r, { folds: 0 });
        const lm = suit ? mat.clone() : mat; if (suit) lm.color = darken(mat.color, 0.25);
        const legs = measured(B, B.crotch, B.ankle, 0.02, 0.015, legRow).map((row, i, a) => suit ? row : { ...row, rx: row.rx + 0.05 * (i / a.length), zf: row.zf + 0.05 * (i / a.length), zb: row.zb + 0.05 * (i / a.length) });
        [legs, mirror(legs)].forEach((L) => add(ringMesh(L, { n: 2.2 }), lm));
        if (suit) {
          const sh = B.slice(B.armpit - 0.01) || { rx: 0.17 };
          [-1, 1].forEach((s) => { const p = new T.Mesh(new T.BoxGeometry(0.1 * k, 0.04, 0.15 * k), mat); p.position.set(s * (sh.rx + 0.02), B.armpit + 0.03, 0); p.rotation.z = -0.25 * s; g.add(p); });
        }
        hemRow = r[r.length - 1]; topRow = r[0]; waistRow = r.find((x) => x.y <= B.waist) || r[0]; break;
      }
      case "bodysuit": case "cape": {
        const r = tight(B.crotch + 0.01); tube(r); sheer = true;
        if (spec.shape === "cape") {
          const s = B.slice(B.armpit + 0.06) || { rx: 0.2, zf: 0.1, zb: 0.1 };
          const c0 = { y: B.armpit + 0.06, rx: s.rx + 0.02, zf: s.zf + 0.02, zb: s.zb + 0.04 };
          add(ringMesh([c0, ...flare(c0, 0.02, 0.8 * k, 16, 1.3)], { folds: 9, amp: (t) => 0.07 * t, th0: Math.PI * 0.55, thL: Math.PI * 0.9 }), mat, false);
          hemRow = { y: 0.03, rx: 0.8 * k, zf: 0.8 * k, zb: 0.8 * k };
        } else hemRow = r[r.length - 1];
        topRow = r[0]; waistRow = r.find((x) => x.y <= B.waist) || r[0]; break;
      }
    }
    // Medias para el body y la capa
    if (sheer) {
      const legs = measured(B, B.crotch + 0.01, 0.06, 0.004, 0.015, legRow);
      const sm = new T.MeshPhysicalMaterial({ color: "#2b2024", roughness: 0.45, transparent: true, opacity: 0.78, sheen: 0.7, side: T.DoubleSide });
      [legs, mirror(legs)].forEach((L) => add(ringMesh(L, { n: 2.1 }), sm, false));
    }
    // Zapatos de tacón
    const foot = B.slice(0.02);
    if (foot && foot.split) {
      const sm = new T.MeshPhysicalMaterial({ color: "#111", roughness: 0.15, clearcoat: 1 });
      [-1, 1].forEach((s) => {
        const sh = new T.Mesh(new T.BoxGeometry(foot.leg.rx * 2 + 0.02, 0.05, foot.leg.zf + foot.leg.zb + 0.02), sm);
        sh.position.set(s * foot.leg.cx, 0.025, (foot.leg.zf - foot.leg.zb) / 2); g.add(sh);
      });
    }
    // ---- Adornos
    const trims = spec.trims || [];
    const inst = (geo, m, n, place) => { const im = new T.InstancedMesh(geo, m, n); const o = new T.Object3D(); for (let i = 0; i < n; i++) { place(o, i); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } g.add(im); return im; };
    // Punto al azar sobre la tela (entre dos alturas)
    const tris = [];
    surfaces.forEach((me) => { const p = me.geometry.attributes.position, ix = me.geometry.index.array; for (let i = 0; i < ix.length; i += 3) tris.push([p, ix[i], ix[i + 1], ix[i + 2]]); });
    const va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), nn = new T.Vector3();
    function onFabric(y0 = 0, y1 = 9) {
      for (let tries = 0; tries < 60; tries++) {
        const [p, a, b, c] = tris[Math.floor(Math.random() * tris.length)];
        va.fromBufferAttribute(p, a); vb.fromBufferAttribute(p, b); vc.fromBufferAttribute(p, c);
        let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
        const pt = va.clone().addScaledVector(vb.clone().sub(va), u).addScaledVector(vc.clone().sub(va), v);
        if (pt.y < y0 || pt.y > y1) continue;
        nn.copy(vb).sub(va).cross(vc.clone().sub(va)).normalize();
        if (nn.x * pt.x + nn.z * pt.z < 0) nn.negate();
        return { p: pt.addScaledVector(nn, 0.005), n: nn.clone() };
      }
      return { p: new T.Vector3(0, -5, 0), n: new T.Vector3(0, 0, 1) };
    }
    const face = (o, q) => { o.position.copy(q.p); o.lookAt(q.p.clone().add(q.n)); };
    const yLo = Math.max(hemRow ? hemRow.y : 0, 0.05);
    if (!tris.length) return g;
    if (trims.includes("pedreria")) inst(new T.OctahedronGeometry(0.009), new T.MeshPhysicalMaterial({ color: "#ffffff", metalness: 1, roughness: 0.05, emissive: "#ffffff", emissiveIntensity: 0.15 }), 280, (o) => { face(o, onFabric(yLo, top)); o.rotateZ(rnd(0, 3)); o.scale.setScalar(rnd(0.7, 1.4)); });
    if (trims.includes("leds")) inst(new T.SphereGeometry(0.009, 10, 8), new T.MeshStandardMaterial({ color: "#7ff9ff", emissive: "#5ff2ff", emissiveIntensity: 3 }), 90, (o) => face(o, onFabric(yLo, top)));
    if (trims.includes("escamas")) inst(new T.CircleGeometry(0.018, 12, 0, Math.PI), new T.MeshPhysicalMaterial({ color: lighten(spec.color, 0.3), metalness: 0.9, roughness: 0.2, iridescence: 1, side: T.DoubleSide }), 420, (o) => { face(o, onFabric(yLo, B.waist)); o.rotateZ(Math.PI); });
    if (trims.includes("tachuelas")) inst(new T.ConeGeometry(0.008, 0.022, 10), new T.MeshPhysicalMaterial({ color: "#d0d4da", metalness: 1, roughness: 0.15 }), 90, (o, i) => { const r = i < 45 ? topRow : waistRow; const p = ringPt(r, ((i % 45) / 45) * Math.PI * 2, 0.008); o.position.copy(p); o.lookAt(p.x * 3, p.y, p.z * 3); o.rotateX(Math.PI / 2); });
    if (trims.includes("flecos") && waistRow) inst(new T.CylinderGeometry(0.0022, 0.0022, 1, 4), new T.MeshPhysicalMaterial({ color: lighten(spec.color, 0.35), metalness: 0.4, roughness: 0.3 }), 170, (o, i) => { const L = rnd(0.16, 0.22) * k, p = ringPt(waistRow, (i / 170) * Math.PI * 2, 0.012); o.position.set(p.x, p.y - L / 2, p.z); o.scale.set(1, L, 1); });
    if (trims.includes("plumas") && hemRow) {
      const fm = new T.MeshPhysicalMaterial({ color: lighten(spec.color, 0.25), roughness: 1, sheen: 1, sheenColor: lighten(spec.color, 0.7) });
      inst(new T.SphereGeometry(1, 10, 8), fm, 120, (o, i) => { const up = i < 34, r = up ? topRow : hemRow, th = (i / (up ? 34 : 86)) * Math.PI * 2 + rnd(-0.05, 0.05); const p = ringPt(r, th, 0.02); p.y += up ? rnd(0, 0.02) : 0.03; o.position.copy(p); o.lookAt(p.x * 3, p.y + (up ? 0.2 : -0.5), p.z * 3); o.scale.set(0.018, 0.012, rnd(0.06, 0.09)); });
    }
    if (trims.includes("volantes") && hemRow) { const h = hemRow, rr = { ...h, y: h.y + 0.1 }; add(ringMesh([rr, { y: Math.max(0.02, h.y - 0.01), rx: h.rx + 0.1, zf: h.zf + 0.1, zb: h.zb + 0.1 }], { folds: 28, amp: () => 0.16 }), new T.MeshPhysicalMaterial({ color: lighten(spec.color, 0.65), roughness: 0.5, side: T.DoubleSide, sheen: 0.5 }), false); }
    if (trims.includes("lazos") && waistRow) {
      const bm = new T.MeshPhysicalMaterial({ color: lighten(spec.color, 0.45), roughness: 0.35, sheen: 0.8 });
      const p = ringPt(waistRow, 0, 0.02);
      [-1, 1].forEach((s) => { const c = new T.Mesh(new T.ConeGeometry(0.05, 0.11, 24), bm); c.position.set(p.x + 0.05 * s, p.y, p.z); c.rotation.z = (Math.PI / 2) * s; c.scale.set(1, 1, 0.45); g.add(c); });
      const kn = new T.Mesh(new T.SphereGeometry(0.022, 16, 12), bm); kn.position.copy(p); g.add(kn);
    }
    return g;
  }
  function realFigure(sp) {
    const T = THREE, B = bodyOf(sp.cuerpo || "alta"), g = new T.Group();
    const sk = new T.MeshPhysicalMaterial({ color: sp.skin || "#d39a72", roughness: 0.55, sheen: 0.3, sheenColor: new T.Color("#ffd9c4") });
    const bm = new T.Mesh(B.geo, sk); bm.castShadow = true; bm.userData.keep = true; g.add(bm);
    g.add(realGarment(B, sp));
    // Peluca colocada sobre la cabeza medida
    const hs = B.slice(B.H - 0.09) || { rx: 0.08, zf: 0.1, zb: 0.1 };
    const s = hs.rx / 0.086, w = wig(sp.tag || "Glamour");
    w.scale.setScalar(s);
    w.position.set(0, B.H - 0.115 * s - 1.745 * s + 0.02, (hs.zf - hs.zb) / 2);
    g.add(w);
    return g;
  }

  // ---------- Visor ----------
  function mount(el, spec) {
    const T = THREE;
    const W = el.clientWidth || 260, H = el.clientHeight || 380;
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(W, H);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    el.append(renderer.domElement);
    const scene = new T.Scene();
    // Entorno de estudio para los reflejos (paneles de luz)
    const pm = new T.PMREMGenerator(renderer);
    const env = new T.Scene();
    env.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: "#2a1b30", side: T.BackSide })));
    [[0, 6, 6, "#ffffff", 12], [-7, 3, 0, "#ffd6ec", 8], [7, 3, -2, "#d6e8ff", 8], [0, 8, -6, "#ffffff", 6]].forEach(([x, y, z, c, s]) => { const pl = new T.Mesh(new T.PlaneGeometry(s, s * 0.6), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); pl.position.set(x, y, z); pl.lookAt(0, 1, 0); env.add(pl); });
    scene.environment = pm.fromScene(env, 0.04).texture;
    scene.add(new T.HemisphereLight("#fff4fa", "#3b2440", 0.6));
    const key = new T.DirectionalLight("#ffffff", 1.6); key.position.set(1.5, 3, 2.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
    const rim = new T.SpotLight("#ff8fd0", 18, 8, 0.6, 0.6); rim.position.set(-1.5, 2.5, -2); rim.target.position.set(0, 1, 0); scene.add(rim, rim.target);
    const floor = new T.Mesh(new T.CircleGeometry(0.9, 64), new T.MeshPhysicalMaterial({ color: "#f3e7ef", roughness: 0.35, clearcoat: 0.6 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const cam = new T.PerspectiveCamera(30, W / H, 0.1, 50);
    cam.position.set(0, 1.05, 4.1); cam.lookAt(0, 0.98, 0);
    const fig = new T.Group(); scene.add(fig);
    let cur = null, rotY = 0.35, vel = 0, drag = false, lastX = 0, idle = 0, raf = 0, dead = false;
    function disposeGroup(o) { o.traverse((m) => { if (m.geometry && !(m.userData && m.userData.keep)) m.geometry.dispose(); if (m.material) [].concat(m.material).forEach((x) => { ["map", "alphaMap"].forEach((k) => x[k] && x[k].dispose()); x.dispose(); }); }); }
    function set(sp) {
      if (cur) { fig.remove(cur); disposeGroup(cur); }
      cur = new T.Group();
      if (REAL) {
        try { cur.add(realFigure(sp)); cur.traverse((m) => { if (m.isMesh) m.castShadow = true; }); fig.add(cur); return; }
        catch (e) { console.warn("cuerpo 3D", e); cur = new T.Group(); }
      }
      const gm = garment(sp);
      cur.add(body(sp.skin || "#d39a72", gm.legs === "sheer"));
      cur.add(gm.g);
      cur.add(wig(sp.tag || "Glamour"));
      cur.traverse((m) => { if (m.isMesh) { m.castShadow = true; } });
      fig.add(cur);
    }
    set(spec);
    const c = renderer.domElement;
    c.style.touchAction = "none";
    c.addEventListener("pointerdown", (e) => { drag = true; lastX = e.clientX; c.setPointerCapture(e.pointerId); });
    c.addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; rotY += dx * 0.012; vel = dx * 0.012; idle = 0; });
    const up = () => (drag = false);
    c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
    let last = performance.now();
    function loop(t) {
      if (dead) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (!drag) { idle += dt; vel *= 0.92; rotY += vel; if (idle > 1.5) rotY += dt * 0.5; }
      fig.rotation.y = rotY;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    function snap() {
      const r0 = fig.rotation.y; fig.rotation.y = 0.35;
      renderer.render(scene, cam);
      let url = null;
      try {
        const k = document.createElement("canvas"); const w = 300, h = Math.round((c.height / c.width) * w); k.width = w; k.height = h;
        const g2 = k.getContext("2d"); const grd = g2.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#fff6fb"); grd.addColorStop(1, "#f1dbe9"); g2.fillStyle = grd; g2.fillRect(0, 0, w, h);
        g2.drawImage(c, 0, 0, w, h); url = k.toDataURL("image/jpeg", 0.82);
      } catch (e) {}
      fig.rotation.y = r0;
      return url;
    }
    function dispose() { dead = true; cancelAnimationFrame(raf); if (cur) disposeGroup(cur); pm.dispose(); renderer.dispose(); c.remove(); }
    return { set, snap, dispose, el: c };
  }
  return { load, mount, hasBody: () => !!REAL };
})();
