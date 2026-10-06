/* ---------------- M-03  Starlane (Dijkstra) ---------------- */
const STARS = ["Vega", "Rigel", "Altair", "Deneb", "Sirius", "Castor", "Mira", "Atlas", "Lyra", "Naos", "Spica", "Pollux", "Izar", "Maia", "Kaus", "Sabik", "Alya", "Okab", "Hadar", "Mimosa", "Electra", "Tarazed"];
const Starlane = {
  id: "starlane", name: "Starlane", topic: "Dijkstra's algorithm · greedy on graphs",
  blurb: "A fresh star map with fuel costs on every jump lane. Chart the cheapest route from the home star to every system.",
  hint: "Click the unsettled star with the smallest number. The number inside each star is its cheapest known distance from the source.",
  takeaway: "Every star was settled exactly once, always the closest one left, and each lane was relaxed once. With a min-heap that costs O((V + E) log V).",
  art: `<svg class="a-path" viewBox="0 0 120 60" fill="none" stroke="currentColor"><path d="M8 48 36 14l28 26 24-30 24 36M36 14l52-4M64 40l48 6M8 48l56-8" stroke-opacity=".35"/><path class="rt" d="M8 48 36 14l28 26 48 6" stroke-width="2"/><g fill="currentColor" stroke="none"><circle cx="8" cy="48" r="4"/><circle cx="36" cy="14" r="3"/><circle cx="64" cy="40" r="3"/><circle cx="88" cy="10" r="3"/><circle cx="112" cy="46" r="3"/></g></svg>`,
  pseudo: [
    "DIJKSTRA(G, s)",
    "  dist[all] = ∞;  dist[s] = 0",
    "  while unsettled nodes remain:",
    "    u = closest unsettled node",
    "    settle u",
    "    for each unsettled neighbour v:",
    "      if dist[u] + w < dist[v]:",
    "        dist[v] = dist[u] + w",
  ],
  fresh() {                       // new layout, new lanes, new costs; re-rolled until no turn has a tie
    for (;;) {
      const cols = pickOne([[1, 2, 2, 1], [1, 2, 3, 1], [2, 3, 2], [1, 3, 2, 1], [2, 2, 2], [1, 2, 2, 2], [2, 3, 3], [1, 3, 3, 1], [2, 2, 3], [1, 2, 3, 2]]);
      if (rnd(0, 1)) cols.reverse();
      const names = shuffle(STARS.slice()), n = [], e = [], layers = [];
      cols.forEach((k, c) => {
        const x = 70 + c * (490 / (cols.length - 1)), ids = [];
        for (let r = 0; r < k; r++) {
          const y = k === 1 ? 175 + rnd(-45, 45) : 60 + r * (230 / (k - 1)) + rnd(-14, 14);
          ids.push(n.length); n.push({ name: names[n.length], x: Math.round(x + rnd(-20, 20)), y: Math.round(y) });
        }
        layers.push(ids);
        for (let r = 0; r + 1 < k; r++) if (Math.random() < .55) e.push([ids[r], ids[r + 1], rnd(1, 9)]);
      });
      for (let c = 0; c + 1 < layers.length; c++) {          // ladder walk: connects every star, never crosses lanes
        const A = layers[c], B = layers[c + 1]; let i = 0, j = 0;
        for (;;) {
          e.push([A[i], B[j], rnd(1, 9)]);
          const ai = i === A.length - 1, bj = j === B.length - 1;
          if (ai && bj) break;
          if (ai) j++; else if (bj) i++; else { const r = rnd(0, 2); if (r !== 1) i++; if (r !== 0) j++; }
        }
      }
      const R = { n, e, src: rnd(0, n.length - 1) };
      if (Starlane.build(R)) return R;
    }
  },
  build(R) {
    const N = R.n, ids = N.map((_, i) => i), nm = i => N[i].name, dist = [], prev = {}, settled = [], steps = [];
    ids.forEach(i => dist[i] = Infinity); dist[R.src] = 0;
    const D = x => x === Infinity ? "∞" : x;
    const snap = o => steps.push(Object.assign({ R, dist: dist.slice(), prev: { ...prev }, settled: settled.slice(), cur: -1, edge: -1, fresh: -1, decision: null,
      hud: [["Settled", settled.length + " / " + N.length]] }, o));
    snap({ line: 1, phase: "Initialise", msg: `The source is ${nm(R.src)}, at distance 0. Every other star starts at ∞ because no route to it is known yet.`, pause: 1300 });
    while (settled.length < N.length) {
      const open = ids.filter(i => !settled.includes(i) && dist[i] < Infinity);
      if (!open.length) return null;
      const u = open.reduce((a, b) => dist[b] < dist[a] ? b : a);
      if (open.filter(i => dist[i] === dist[u]).length > 1) return null;
      const dn = dist.slice(), sn = settled.slice();
      snap({ line: 3, cur: u, phase: "Choose",
        msg: `Reached but not settled: ${open.map(i => `${nm(i)} (${dist[i]})`).join(", ")}. ${nm(u)} is the closest, so it is settled next.`,
        decision: { correct: u, prompt: "Which star does Dijkstra settle next? Click it.",
          why: p => sn.includes(+p) ? `${nm(p)} is already settled. Its distance is final.`
                 : dn[p] === Infinity ? `${nm(p)} has not been reached yet, so its distance is still ∞.`
                 : `${nm(p)} is at ${dn[p]}, but ${nm(u)} is closer at ${dn[u]}. Dijkstra always settles the closest unsettled node.` } });
      settled.push(u);
      snap({ line: 4, cur: u, fresh: u, phase: "Settle", pause: 1150,
        msg: `${nm(u)} is settled at ${dist[u]}. Nothing can beat that: every other unsettled star is already further away, and lane costs are never negative.` });
      R.e.forEach(([a, b, w], k) => {
        const v = a === u ? b : b === u ? a : -1;
        if (v < 0 || settled.includes(v)) return;
        const nd = dist[u] + w, old = dist[v];
        if (nd < old) { dist[v] = nd; prev[v] = u; }
        snap({ line: nd < old ? 7 : 6, cur: u, edge: k, phase: "Relax", pause: 1000,
          msg: nd < old ? `Lane ${nm(u)}–${nm(v)}: ${dist[u]} + ${w} = ${nd}, better than ${D(old)}. ${nm(v)} drops to ${nd}.`
                        : `Lane ${nm(u)}–${nm(v)}: ${dist[u]} + ${w} = ${nd}, no better than ${old}. ${nm(v)} stays at ${old}.` });
      });
    }
    snap({ line: -1, phase: "Done", done: true, msg: `All stars are settled. The green lanes form the shortest-path tree from ${nm(R.src)}.` });
    return steps;
  },
  draw(s, ask) {
    const N = s.R.n;
    let h = `<svg class="graph" viewBox="0 0 630 350" role="img" aria-label="Weighted graph of star systems">`;
    s.R.e.forEach(([u, v, w], k) => {
      const a = N[u], b = N[v], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const cls = k === s.edge ? "relax" : (s.prev[u] === v || s.prev[v] === u) ? "tree" : "";
      h += `<g class="edge ${cls}"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/><rect x="${mx - 11}" y="${my - 10}" width="22" height="20" rx="10"/><text x="${mx}" y="${my + 4.5}">${w}</text></g>`;
    });
    N.forEach((p, id) => {
      const d = s.dist[id], set = s.settled.includes(id);
      const cls = [set ? "set" : d < Infinity ? "seen" : "", id === s.cur && !ask ? "cur" : "", id === s.fresh ? "new" : "", id === s.R.src ? "src" : ""].join(" ");
      h += `<g class="node ${cls}" ${ask ? `data-pick="${id}"` : ""}><circle class="halo" cx="${p.x}" cy="${p.y}" r="22"/><circle class="core" cx="${p.x}" cy="${p.y}" r="22"/>` +
           `<text class="ds" x="${p.x}" y="${p.y + 5.5}">${d === Infinity ? "∞" : d}</text><text class="nm" x="${p.x}" y="${p.y + 40}">${id === s.R.src ? "◆ " : ""}${p.name}</text></g>`;
    });
    return h + `</svg>`;
  },
};
