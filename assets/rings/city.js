/* The ring city: one instanced box per file ever tracked in the repo. Classic script; window.RingCity.
 * update(c, t, vtc) is a pure function of the commit index c, the video time t and the commit→video-time table. */
(function () {
  const T = window.THREE;
  const HMAX = 16;
  const GROW = 0.6; // seconds a building takes to reach a new height
  const W0 = 0.78; // footprint
  const lin = (hex) => { const c = new T.Color(hex); return [c.r, c.g, c.b]; };

  function hgt(n, bin) {
    return bin ? 0.1 : Math.min(HMAX, 0.18 + 0.1 * Math.sqrt(n));
  }
  const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
  const easeOutBack = (k) => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

  function build(D, scene, P) {
    const B = D.b, N = B.x.length;
    const evc = D.ev.c, evn = D.ev.n, off = B.off;
    const ca = new Float32Array(N), sa = new Float32Array(N), jit = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      ca[i] = Math.cos(B.a[i]); sa[i] = Math.sin(B.a[i]);
      let h = (i * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13;
      jit[i] = (h >>> 0) / 4294967296;
    }

    // ---- ground ----
    const ground = new T.Mesh(new T.CircleGeometry(1400, 96), new T.MeshStandardMaterial({ color: P.ground, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ---- ring lines (month) and ring roads (year) ----
    const rings = [];
    function ringMesh(r, w, color, y) {
      const m = new T.Mesh(new T.RingGeometry(Math.max(0.01, r - w / 2), r + w / 2, 256, 1),
        new T.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = y;
      m.renderOrder = 1;
      scene.add(m);
      return m;
    }
    for (const mo of D.months) {
      if (mo.line == null) continue;
      rings.push({ mesh: ringMesh(mo.line, mo.year ? P.roadW : 0.07, mo.year ? P.road : P.ringLine, mo.year ? 0.012 : 0.016), c: mo.c1, max: mo.year ? 1 : 0.9 });
    }

    // ---- buildings ----
    const geo = new T.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const bodyMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
    const roofMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0 });
    const body = new T.InstancedMesh(geo, bodyMat, N);
    const roof = new T.InstancedMesh(geo, roofMat, N);
    body.castShadow = true; body.receiveShadow = true;
    roof.castShadow = false; roof.receiveShadow = true;
    body.frustumCulled = false; roof.frustumCulled = false;
    body.instanceColor = new T.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    roof.instanceColor = new T.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    body.instanceMatrix.setUsage(T.DynamicDrawUsage); roof.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(body, roof);
    const bm = body.instanceMatrix.array, rm = roof.instanceMatrix.array;
    const bc = body.instanceColor.array, rc = roof.instanceColor.array;
    bm.fill(0); rm.fill(0);

    const BODY = [lin(P.bodyA), lin(P.bodyB)];
    const HOT = lin(P.hot), HOTR = lin(P.hotRoof), RUIN = lin(P.ruin);
    const MOD = D.modules.map((m) => lin(m.color));
    const MODB = D.modules.map((m) => { const c = new T.Color(m.color); c.offsetHSL(0, -0.03, 0.055); return [c.r, c.g, c.b]; });

    function setM(arr, o, i, x, z, sx, sy, y) {
      const c = ca[i], s = sa[i];
      arr[o] = sx * c; arr[o + 1] = 0; arr[o + 2] = -sx * s; arr[o + 3] = 0;
      arr[o + 4] = 0; arr[o + 5] = sy; arr[o + 6] = 0; arr[o + 7] = 0;
      arr[o + 8] = sx * s; arr[o + 9] = 0; arr[o + 10] = sx * c; arr[o + 11] = 0;
      arr[o + 12] = x; arr[o + 13] = y; arr[o + 14] = z; arr[o + 15] = 1;
    }
    function hide(arr, o) { arr[o] = 0; arr[o + 5] = 0; arr[o + 10] = 0; arr[o + 15] = 1; arr[o + 12] = 0; arr[o + 13] = -50; arr[o + 14] = 0; }

    const heights = new Float32Array(N); // current height, for labels

    // ---- embers: a small dot rises from every building that was just touched ----
    const SPK = 9000;
    const spPos = new Float32Array(SPK * 3), spA = new Float32Array(SPK);
    const spGeo = new T.BufferGeometry();
    spGeo.setAttribute("position", new T.BufferAttribute(spPos, 3).setUsage(T.DynamicDrawUsage));
    spGeo.setAttribute("alpha", new T.BufferAttribute(spA, 1).setUsage(T.DynamicDrawUsage));
    const spMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { cIn: { value: new T.Color(P.sparkIn) }, cOut: { value: new T.Color(P.sparkOut) }, scale: { value: 2015 }, world: { value: 0.62 } },
      vertexShader: `attribute float alpha; varying float vA; uniform float scale; uniform float world;
        void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(world * scale / -mv.z, 2.6, 13.0) * (0.6 + 0.4 * alpha); }`,
      fragmentShader: `uniform vec3 cIn; uniform vec3 cOut; varying float vA;
        void main(){ float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.3, r) * vA; if (a < 0.01) discard;
          gl_FragColor = vec4(mix(cIn, cOut, smoothstep(0.05, 0.42, r)), a); }`,
    });
    const sparks = new T.Points(spGeo, spMat);
    sparks.frustumCulled = false; sparks.renderOrder = 6;
    scene.add(sparks);

    function update(c, t, vtc, opt) {
      const heatTau = (opt && opt.heatTau) || 0.45, heatGain = opt && opt.heatGain != null ? opt.heatGain : 1;
      let hot = 0, ns = 0;
      for (let i = 0; i < N; i++) {
        const o = i * 16, o3 = i * 3;
        if (B.birth[i] > c) { hide(bm, o); hide(rm, o); heights[i] = 0; continue; }
        let lo = off[i], hi = off[i + 1] - 1;
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (evc[mid] <= c) lo = mid; else hi = mid - 1; }
        let j = lo;
        let first = j === off[i];
        let age = t - (vtc[evc[j]] + jit[i] * (first ? 0.45 : 0.1));
        if (age < 0) {
          if (first) { hide(bm, o); hide(rm, o); heights[i] = 0; continue; }
          j -= 1; first = j === off[i]; age = 10; // show the state before this event
        }
        const bin = B.bin[i] === 1;
        const dead = B.death[i] >= 0 && evc[j] === B.death[i] && j === off[i + 1] - 1;
        const hc = dead ? 0 : hgt(evn[j], bin);
        const hp = first ? 0 : hgt(evn[j - 1], bin);
        const k = age >= GROW ? 1 : age / GROW;
        const e = first ? easeOutBack(k) : easeOutCubic(k);
        let h = hp + (hc - hp) * e;
        if (h < 0) h = 0;
        const x = B.x[i], z = B.z[i];
        let heat = Math.exp(-age / (first ? heatTau * 1.6 : heatTau)) * heatGain;
        if (heat > 1) heat = 1;
        if (dead && k >= 1) {
          setM(bm, o, i, x, z, W0, 0.03, 0); hide(rm, o);
          bc[o3] = RUIN[0]; bc[o3 + 1] = RUIN[1]; bc[o3 + 2] = RUIN[2];
          heights[i] = 0;
          continue;
        }
        if (heat > 0.25) hot++;
        if (age < 1.5 && ns < SPK) {
          const q = ns * 3;
          spPos[q] = x; spPos[q + 1] = h + 0.3 + 2.8 * (1 - Math.exp(-age / 0.55)); spPos[q + 2] = z;
          spA[ns] = Math.exp(-age / 0.5) * Math.min(1, age / 0.06);
          ns++;
        }
        setM(bm, o, i, x, z, W0, Math.max(h, 0.02), 0);
        setM(rm, o, i, x, z, W0 + 0.05, 0.09, Math.max(h, 0.02));
        heights[i] = h;
        const b0 = BODY[B.k[i] & 1], m0 = (B.k[i] & 1 ? MODB : MOD)[B.m[i]];
        const hb = heat * 0.92;
        bc[o3] = b0[0] + (HOT[0] - b0[0]) * hb; bc[o3 + 1] = b0[1] + (HOT[1] - b0[1]) * hb; bc[o3 + 2] = b0[2] + (HOT[2] - b0[2]) * hb;
        rc[o3] = m0[0] + (HOTR[0] - m0[0]) * heat; rc[o3 + 1] = m0[1] + (HOTR[1] - m0[1]) * heat; rc[o3 + 2] = m0[2] + (HOTR[2] - m0[2]) * heat;
      }
      spGeo.setDrawRange(0, ns);
      spGeo.attributes.position.needsUpdate = true; spGeo.attributes.alpha.needsUpdate = true;
      body.instanceMatrix.needsUpdate = true; roof.instanceMatrix.needsUpdate = true;
      body.instanceColor.needsUpdate = true; roof.instanceColor.needsUpdate = true;
      for (const r of rings) {
        const tv = vtc[Math.min(vtc.length - 1, r.c)];
        const a = Math.max(0, Math.min(1, (t - tv) / 1.2));
        r.mesh.material.opacity = a * r.max;
        r.mesh.visible = a > 0;
      }
      return hot;
    }

    return { update, heights, N, body, roof, ground };
  }

  window.RingCity = { build, hgt };
})();
