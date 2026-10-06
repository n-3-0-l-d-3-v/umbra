/* =====================================================================
   Each mission runs its algorithm once and records a snapshot per action.
   A snapshot may carry a `decision`: on Autopilot it is simply explained,
   on Manual the engine stops there and waits for the pilot's pick.
   ===================================================================== */

/* ---------------- M-01  Convoy (merge sort) ---------------- */
const Convoy = {
  id: "convoy", name: "Convoy", topic: "Merge sort · divide and conquer",
  blurb: "A scrambled line of cargo pods. Cut it down to single pods, then merge two sorted lanes into one convoy, lightest pod first.",
  hint: "Click the pod that launches next, or press ← for the left lane and → for the right. For a cut, click a gap.",
  takeaway: "Merging k pods never took more than k − 1 decisions, and there are only ⌈log₂n⌉ levels of merging. That is where Θ(n log n) comes from.",
  art: `<svg class="a-sort" viewBox="0 0 120 60" fill="currentColor"><rect x="6" y="28" width="8" height="30" style="--i:0;--to:56"/><rect x="20" y="46" width="8" height="12" style="--i:1;--to:0"/><rect x="34" y="14" width="8" height="44" style="--i:2;--to:56"/><rect x="48" y="38" width="8" height="20" style="--i:3;--to:-14"/><rect x="62" y="6" width="8" height="52" style="--i:4;--to:42"/><rect x="76" y="50" width="8" height="8" style="--i:5;--to:-70"/><rect x="90" y="22" width="8" height="36" style="--i:6;--to:-14"/><rect x="104" y="32" width="8" height="26" style="--i:7;--to:-56"/></svg>`,
  sizes: [6, 8, 10, 12], size: 8, keys: { ArrowLeft: "L", ArrowRight: "R" },
  pseudo: [
    "MERGE-SORT(A, l, r)",
    "  if l >= r: return",
    "  m = floor((l + r) / 2)",
    "  MERGE-SORT(A, l, m)",
    "  MERGE-SORT(A, m + 1, r)",
    "  MERGE(A, l, m, r)",
    "",
    "MERGE(A, l, m, r)",
    "  L = A[l..m];  R = A[m+1..r]",
    "  while L and R both have pods:",
    "    if L[i] <= R[j]: take L[i]",
    "    else:            take R[j]",
    "  copy the leftovers across",
  ],
  fresh(n) {                      // a different input pattern every round
    const asc = (lo, hi) => Array.from({ length: n }, () => rnd(lo, hi)).sort((x, y) => x - y);
    const pats = {
      "scrambled": () => Array.from({ length: n }, () => rnd(1, 99)),
      "wide range": () => Array.from({ length: n }, () => rnd(100, 999)),
      "nearly sorted": () => { const a = asc(1, 99); for (let k = 0; k < 2; k++) { const i = rnd(0, n - 2); [a[i], a[i + 1]] = [a[i + 1], a[i]]; } return a; },
      "reversed": () => asc(1, 99).reverse(),
      "many duplicates": () => { const v = [rnd(1, 20), rnd(21, 45), rnd(46, 70), rnd(71, 99)]; return Array.from({ length: n }, () => pickOne(v)); },
      "two sorted halves": () => { const a = asc(1, 99), h = n >> 1; return shuffle(a.slice()).slice(0, h).sort((x, y) => x - y).concat(shuffle(a.slice()).slice(0, n - h).sort((x, y) => x - y)); },
      "sawtooth": () => Array.from({ length: n }, (_, i) => (i % 3) * 30 + rnd(1, 25)),
    };
    const pat = pickOne(Object.keys(pats));
    return { a: pats[pat](), pat };
  },
  parse(txt) {
    const p = txt.split(/[\s,]+/).filter(Boolean);
    if (p.length < 2 || p.length > 12) throw "Enter between 2 and 12 numbers.";
    return { pat: "custom", a: p.map(x => { const v = Number(x); if (!Number.isInteger(v) || v < 0 || v > 999) throw `"${x}" is not a whole number from 0 to 999.`; return v; }) };
  },
  build(R) {
    const A = R.a.slice(), n = A.length, nodes = {}, steps = [], maxd = Math.ceil(Math.log2(n));
    let cmps = 0, writes = 0, depth = 0;
    const key = (l, r) => l + "-" + r;
    const snap = o => steps.push(Object.assign({ n, maxd, nodes: JSON.parse(JSON.stringify(nodes)), merge: null, cut: null, decision: null,
      hud: [["Comparisons", cmps], ["Writes", writes], ["Depth", depth]] }, o));
    nodes[key(0, n - 1)] = { l: 0, r: n - 1, d: 0, s: "wait", v: A.slice() };
    snap({ line: -1, phase: "Initial array", msg: `Unsorted array of ${n} pods (${R.pat}): ${fmt(A)}.`, pause: 1100 });

    const sort = (l, r, d, callLine) => {
      const k = key(l, r); depth = d; nodes[k].s = "active";
      if (l === r) {
        nodes[k].s = "done";
        snap({ line: 1, phase: "Base case", msg: `${A[l]} is on its own. A single element is already sorted, so this call returns.`, pause: 420 });
        return;
      }
      const m = (l + r) >> 1, seg = A.slice(l, r + 1), left = A.slice(l, m + 1), right = A.slice(m + 1, r + 1);
      if (r - l >= 2) snap({ line: 2, phase: "Divide", cut: { v: seg, l, m },
        msg: `MERGE-SORT(${l}, ${r}) on ${fmt(seg)}. Cut at the middle: m = floor((${l} + ${r}) / 2) = ${m}.`,
        decision: { correct: m, prompt: `Where does merge sort cut ${fmt(seg)}? Click a gap.`,
          why: `Merge sort always cuts at the middle: m = floor((${l} + ${r}) / 2) = ${m}. The left half gets ${m - l + 1} pods and the right gets ${r - m}.` } });
      nodes[key(l, m)] = { l, r: m, d: d + 1, s: "wait", v: left };
      nodes[key(m + 1, r)] = { l: m + 1, r, d: d + 1, s: "wait", v: right };
      nodes[k].s = "split";
      snap({ line: callLine, phase: d ? "Recursive subdivision" : "Divide", msg: `Split into ${fmt(left)} and ${fmt(right)}. The left half is sorted first.` });
      sort(l, m, d + 1, 3); sort(m + 1, r, d + 1, 4);
      depth = d; merge(l, m, r, k);
    };

    const merge = (l, m, r, k) => {
      const L = A.slice(l, m + 1), Rr = A.slice(m + 1, r + 1); let i = 0, j = 0, t = l;
      const ws = x => Object.assign({ L, R: Rr, i, j, size: r - l + 1, out: A.slice(l, t) }, x);
      nodes[k].s = "merging";
      snap({ line: 8, phase: "Merge", merge: ws(), msg: `Both halves are sorted: ${fmt(L)} and ${fmt(Rr)}. Merge them.` });
      while (i < L.length && j < Rr.length) {
        cmps++;
        const takeL = L[i] <= Rr[j], a = L[i], b = Rr[j];
        const why = a === b ? `They are equal, so the left one goes first. That keeps equal pods in their original order (stability).`
                            : `${Math.min(a, b)} is smaller than ${Math.max(a, b)}, so it goes first.`;
        snap({ line: takeL ? 10 : 11, phase: "Compare", merge: ws({ cmp: true }),
          msg: `Compare ${a} (left) with ${b} (right). ${why}`,
          decision: { correct: takeL ? "L" : "R", prompt: "Which front pod launches next?", why } });
        A[t++] = takeL ? L[i++] : Rr[j++]; writes++;
        snap({ line: takeL ? 10 : 11, phase: "Merge", merge: ws({ fresh: 1 }), msg: `${A[t - 1]} is written into position ${t - 1}.`, pause: 520 });
      }
      if (i < L.length || j < Rr.length) {
        const fromL = i < L.length, rest = fromL ? L.slice(i) : Rr.slice(j);
        for (const v of rest) { A[t++] = v; writes++; }
        if (fromL) i = L.length; else j = Rr.length;
        snap({ line: 12, phase: "Merge", merge: ws({ fresh: rest.length }),
          msg: `The ${fromL ? "right" : "left"} lane is empty. The leftover ${fmt(rest)} is already sorted, so it is copied across with no comparisons.`, pause: 950 });
      }
      nodes[k].v = A.slice(l, r + 1); nodes[k].s = "done";
      snap({ line: 5, phase: "Merge", msg: `Positions ${l} to ${r} now hold ${fmt(A.slice(l, r + 1))}, sorted.` });
    };

    sort(0, n - 1, 0, 0); depth = 0;
    const worst = n * maxd - 2 ** maxd + 1;
    snap({ line: -1, phase: "Sorted", done: true, msg: `Sorted: ${fmt(A)}. ${cmps} comparisons (worst case for n = ${n} is ${worst}) and ${writes} writes.` });
    return steps;
  },
  draw(s, ask) {
    const rowH = 40;
    let h = `<div class="tree" style="height:${(s.maxd + 1) * rowH}px">` + Object.values(s.nodes).map(nd =>
      `<div class="nd ${nd.s}" style="left:${nd.l / s.n * 100}%;width:${(nd.r - nd.l + 1) / s.n * 100}%;top:${nd.d * rowH}px"><div class="bx">${nd.v.map(v => `<i>${v}</i>`).join("")}</div></div>`).join("") + `</div><div class="arena">`;
    if (s.cut) {
      const c = s.cut;
      h += `<small class="lb cap">${ask ? "Choose the cut" : "The cut"}</small><div class="cut">` + c.v.map((v, x) => {
        const idx = c.l + x, last = x === c.v.length - 1;
        return `<div class="pod">${v}</div>` + (last ? "" : `<button class="gap ${!ask && idx === c.m ? "on" : ""}" ${ask ? `data-pick="${idx}"` : "disabled"} aria-label="Cut after index ${idx}"></button>`);
      }).join("") + `</div>`;
    } else if (s.merge) {
      const m = s.merge;
      const run = (arr, p, side) => arr.map((v, x) =>
        `<div class="pod ${x < p ? "used" : x === p ? "head" + (m.cmp && !ask ? " cmp" : "") : ""}" ${x === p && ask ? `data-pick="${side}"` : ""}>${v}</div>`).join("");
      let out = "";
      for (let x = 0; x < m.size; x++) out += x < m.out.length
        ? `<div class="pod ${m.fresh && x >= m.out.length - m.fresh ? "fresh" : ""}">${m.out[x]}</div>` : `<div class="pod empty"></div>`;
      h += `<div class="duel"><div><small class="lb">Left lane</small><div class="pods">${run(m.L, m.i, "L")}</div></div><div class="vs">${ask ? "?" : "VS"}</div>` +
           `<div><small class="lb">Right lane</small><div class="pods">${run(m.R, m.j, "R")}</div></div></div>` +
           `<div class="out"><small class="lb">Merged convoy</small><div class="pods">${out}</div></div>`;
    } else h += `<p class="idle">${s.done ? "CONVOY ASSEMBLED" : "LANES OPEN ONCE TWO SORTED HALVES ARE READY"}</p>`;
    return h + `</div>`;
  },
};
