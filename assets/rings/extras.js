/* Pins on the rings (LMSYS blog posts, big events) and the ecosystem towns around the city. window.RingExtras.
 * update() is a pure function of its arguments. */
(function () {
  const T = window.THREE;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const easeOutBack = (k) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
  const lin = (hex) => { const c = new T.Color(hex); return [c.r, c.g, c.b]; };

  function build(D, scene, P) {
    // ---------- pins ----------
    const NB = D.bpins.length, NE = D.events.length, NP = NB + NE;
    const box = new T.BoxGeometry(1, 1, 1);
    box.translate(0, 0.5, 0);
    const poles = new T.InstancedMesh(box, new T.MeshStandardMaterial({ color: P.pin, roughness: 0.7 }), NP);
    const heads = new T.InstancedMesh(new T.SphereGeometry(1, 18, 12), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), NP);
    heads.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NP * 3), 3);
    for (const m of [poles, heads]) { m.castShadow = true; m.frustumCulled = false; m.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(m); }
    const cb = lin(P.pin), ce = lin(P.pinEvent);
    const px = new Float32Array(NP), pz = new Float32Array(NP), ph = new Float32Array(NP), pw = new Float32Array(NP), pr = new Float32Array(NP);
    for (let i = 0; i < NP; i++) {
      const ev = i >= NB;
      const src = ev ? D.events[i - NB] : null;
      px[i] = ev ? src.x : D.bpins[i][0]; pz[i] = ev ? src.z : D.bpins[i][1];
      ph[i] = ev ? 7.2 : 2.7; pw[i] = ev ? 0.16 : 0.085; pr[i] = ev ? 0.82 : 0.36;
      const c = ev ? ce : cb;
      heads.instanceColor.array.set(c, i * 3);
    }
    heads.instanceColor.needsUpdate = true;
    const pm = poles.instanceMatrix.array, hm = heads.instanceMatrix.array;
    pm.fill(0); hm.fill(0);
    function setS(arr, o, x, y, z, sx, sy, sz) { arr[o] = sx; arr[o + 5] = sy; arr[o + 10] = sz; arr[o + 12] = x; arr[o + 13] = y; arr[o + 14] = z; arr[o + 15] = 1; }

    // a flat orange ring on the ground around every big event, plus an expanding pulse
    const ringGeo = new T.RingGeometry(1.75, 2.3, 48, 1), pulseGeo = new T.RingGeometry(0.86, 1.0, 48, 1);
    const marks = D.events.map((e) => {
      const ring = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: P.pinRing, transparent: true, opacity: 0, depthWrite: false }));
      const pulse = new T.Mesh(pulseGeo, new T.MeshBasicMaterial({ color: P.pinRing, transparent: true, opacity: 0, depthWrite: false }));
      for (const m of [ring, pulse]) { m.rotation.x = -Math.PI / 2; m.position.set(e.x, 0.05, e.z); m.renderOrder = 3; scene.add(m); }
      pulse.position.y = 0.06;
      return { ring, pulse };
    });

    // ---------- ecosystem towns ----------
    let NS = 0;
    for (const s of D.sats) NS += s.x.length;
    const body = new T.InstancedMesh(box, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), NS);
    const roof = new T.InstancedMesh(box, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), NS);
    body.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NS * 3), 3);
    roof.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NS * 3), 3);
    body.castShadow = true; body.receiveShadow = true; roof.receiveShadow = true;
    for (const m of [body, roof]) { m.frustumCulled = false; m.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(m); }
    const sx = new Float32Array(NS), sz = new Float32Array(NS), sh = new Float32Array(NS), sj = new Float32Array(NS), ss = new Uint8Array(NS);
    const bodyC = lin(P.bodyA);
    let q = 0;
    D.sats.forEach((s, si) => {
      const rc = lin(s.color);
      for (let i = 0; i < s.x.length; i++, q++) {
        sx[q] = s.x[i]; sz[q] = s.z[i]; sh[q] = s.h[i]; ss[q] = si;
        let h = (q * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13;
        sj[q] = (h >>> 0) / 4294967296;
        body.instanceColor.array.set(bodyC, q * 3);
        roof.instanceColor.array.set(rc, q * 3);
      }
    });
    body.instanceColor.needsUpdate = true; roof.instanceColor.needsUpdate = true;
    const bm = body.instanceMatrix.array, rm = roof.instanceMatrix.array;
    bm.fill(0); rm.fill(0);
    const SW = 0.78;

    /* tp: time used for the pins; ptau[i]: when pin i appears; etau2[j]: second pulse of event j (its label in the tableau);
       te: time used for the towns; stau[s]: when town s starts to rise */
    function update(tp, ptau, etau2, te, stau) {
      for (let i = 0; i < NP; i++) {
        const o = i * 16, age = tp - ptau[i];
        if (age < 0) { setS(pm, o, 0, -50, 0, 0, 0, 0); setS(hm, o, 0, -50, 0, 0, 0, 0); continue; }
        const k = age >= 0.55 ? 1 : easeOutBack(age / 0.55);
        const h = ph[i] * k;
        setS(pm, o, px[i], 0, pz[i], pw[i], h, pw[i]);
        setS(hm, o, px[i], h + pr[i] * 0.55, pz[i], pr[i] * k, pr[i] * k, pr[i] * k);
      }
      poles.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
      for (let j = 0; j < NE; j++) {
        const m = marks[j], age = tp - ptau[NB + j];
        if (age < 0) { m.ring.visible = false; m.pulse.visible = false; continue; }
        const k = easeOutCubic(clamp(age / 0.6, 0, 1));
        m.ring.visible = true; m.ring.scale.setScalar(0.3 + 0.7 * k); m.ring.material.opacity = 0.95 * k;
        const a2 = tp - etau2[j];
        const pa = a2 >= 0 && a2 < 1.5 ? a2 : age < 1.5 ? age : -1;
        if (pa >= 0) { const p = pa / 1.5; m.pulse.visible = true; m.pulse.scale.setScalar(2.2 + 7.5 * easeOutCubic(p)); m.pulse.material.opacity = 0.75 * (1 - p); }
        else m.pulse.visible = false;
      }
      for (let i = 0; i < NS; i++) {
        const o = i * 16, age = te - (stau[ss[i]] + sj[i] * 0.9);
        if (age < 0) { setS(bm, o, 0, -50, 0, 0, 0, 0); setS(rm, o, 0, -50, 0, 0, 0, 0); continue; }
        const k = age >= 0.55 ? 1 : easeOutBack(age / 0.55);
        const h = Math.max(0.02, sh[i] * k);
        setS(bm, o, sx[i], 0, sz[i], SW, h, SW);
        setS(rm, o, sx[i], h, sz[i], SW + 0.05, 0.09, SW + 0.05);
      }
      body.instanceMatrix.needsUpdate = true; roof.instanceMatrix.needsUpdate = true;
    }
    return { update, NB, NE, pinTop: (j) => ph[NB + j] + 1.0 };
  }

  window.RingExtras = { build };
})();
