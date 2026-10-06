/* ---------------- M-02  Signal Lock (binary search) ---------------- */
const Signal = {
  id: "signal", name: "Signal Lock", topic: "Binary search · decrease and conquer",
  blurb: "A beacon is transmitting from one of a sorted row of sectors. Every ping costs fuel. Lock on to it at or under par.",
  hint: "Click a sector to ping it. The best ping always cuts the remaining candidates in half.",
  takeaway: "Each good ping halves what is left, so n sectors need at most ⌊log₂n⌋ + 1 pings, whether the beacon is there or not. That is why binary search is Θ(log n).",
  art: `<svg class="a-scan" viewBox="0 0 120 60" fill="none" stroke="currentColor"><path d="M8.0 24v12" stroke-opacity=".45"/><path d="M15.4 24v12" stroke-opacity=".45"/><path d="M22.8 24v12" stroke-opacity=".45"/><path d="M30.2 24v12" stroke-opacity=".45"/><path d="M37.6 24v12" stroke-opacity=".45"/><path d="M45.0 24v12" stroke-opacity=".45"/><path d="M52.4 24v12" stroke-opacity=".45"/><path d="M59.8 24v12" stroke-opacity=".45"/><path d="M67.2 24v12" stroke-opacity=".45"/><path d="M74.6 24v12" stroke-opacity=".45"/><path d="M82.0 24v12" stroke-opacity=".45"/><path d="M89.4 24v12" stroke-opacity=".45"/><path d="M96.8 24v12" stroke-opacity=".45"/><path d="M104.2 24v12" stroke-opacity=".45"/><path d="M111.6 24v12" stroke-opacity=".45"/><rect class="br" x="4" y="14" width="112" height="32"/><circle class="dot" cx="82" cy="30" r="3.5" fill="currentColor" stroke="none"/></svg>`,
  sizes: [11, 15, 21, 31], size: 15,
  pseudo: [
    "BINARY-SEARCH(A, t)",
    "  lo = 0;  hi = n - 1",
    "  while lo <= hi:",
    "    mid = floor((lo + hi) / 2)",
    "    if A[mid] == t: return mid",
    "    if A[mid] < t:  lo = mid + 1",
    "    else:           hi = mid - 1",
    "  return NOT-FOUND",
  ],
  fresh(n) {                      // spacing pattern and target position change every round; sometimes the target is absent
    const gaps = pickOne([[1, 3], [2, 9], [5, 40], [1, 60]]), a = []; let v = rnd(1, 60);
    for (let i = 0; i < n; i++) { a.push(v); v += rnd(gaps[0], gaps[1]); }
    let t = a[pickOne([0, n - 1, rnd(0, n - 1), rnd(0, n - 1), rnd(0, n - 1), rnd(0, n - 1)])];
    if (Math.random() < .18) { const holes = []; for (let i = 0; i < n - 1; i++) if (a[i + 1] - a[i] > 1) holes.push(a[i] + 1); if (holes.length) t = pickOne(holes); }
    return { a, t };
  },
  par: R => Math.floor(Math.log2(R.a.length)) + 1,
  build(R) {
    const a = R.a, t = R.t, steps = [], fl = {}; let lo = 0, hi = a.length - 1, p = 0;
    const snap = o => steps.push(Object.assign({ a, t, lo, hi, mid: -1, found: -1, flipped: { ...fl }, decision: null,
      hud: [["Pings", p], ["Candidates", Math.max(hi - lo + 1, 0)]] }, o));
    snap({ line: 1, phase: "Start", msg: `${a.length} sorted sectors, values hidden. Looking for ${t}. Every index from 0 to ${hi} is a candidate.` });
    let hit = false;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      snap({ line: 3, mid: m, phase: "Pick the middle", msg: `mid = floor((${lo} + ${hi}) / 2) = ${m}. Ping the middle sector.` });
      fl[m] = a[m]; p++;
      if (a[m] === t) {
        hit = true;
        snap({ line: 4, mid: m, found: m, phase: "Found", done: true, msg: `A[${m}] = ${t}. Locked on in ${p} ping${p > 1 ? "s" : ""}. A left-to-right scan would have needed ${m + 1}.` });
        break;
      }
      const less = a[m] < t;
      snap({ line: less ? 5 : 6, mid: m, phase: "Compare", msg: `A[${m}] = ${a[m]} is ${less ? "smaller" : "larger"} than ${t}. The row is sorted, so ${t} cannot be at index ${m} or anywhere to its ${less ? "left" : "right"}.` });
      if (less) lo = m + 1; else hi = m - 1;
      const c = hi - lo + 1;
      if (c > 0) snap({ line: 2, phase: "Halve", msg: `That half is discarded. ${c} candidate${c > 1 ? "s" : ""} left, index ${lo} to ${hi}.` });
    }
    if (!hit) snap({ line: 7, phase: "Not found", done: true, msg: `lo (${lo}) has passed hi (${hi}), so no candidates are left. ${t} is not in the row, proven in ${p} pings instead of checking all ${a.length}.` });
    return steps;
  },
  playInit(R) {
    return { a: R.a, t: R.t, lo: 0, hi: R.a.length - 1, mid: -1, found: -1, over: false, flipped: {}, line: 2, phase: "Your move", allMid: true, decision: null,
      msg: `Ping a sector to look for ${R.t}. Par is ${Signal.par(R)} pings. The beacon may not be here at all.`, hud: [["Candidates", R.a.length]] };
  },
  playPick(s, v, st) {
    const i = +v;
    if (s.over || i < s.lo || i > s.hi || i in s.flipped) return false;
    const size = s.hi - s.lo + 1, m1 = (s.lo + s.hi) >> 1, m2 = (s.lo + s.hi + 1) >> 1, isMid = i === m1 || i === m2;
    const risk = Math.max(i - s.lo, s.hi - i);
    st.you++; s.flipped[i] = s.a[i]; s.mid = i;
    if (!isMid) { s.allMid = false; st.streak = 0; } else { st.streak++; st.best = Math.max(st.best, st.streak); }
    if (s.a[i] === s.t) {
      s.found = i; s.over = true; s.phase = "Found"; s.line = 4;
      s.msg = `A[${i}] = ${s.t}. Locked on in ${st.you} ping${st.you > 1 ? "s" : ""}.` + (isMid ? "" : " That one was luck rather than halving.");
    } else {
      const less = s.a[i] < s.t;
      if (less) s.lo = i + 1; else s.hi = i - 1;
      const c = s.hi - s.lo + 1;
      s.phase = "Compare"; s.line = less ? 5 : 6;
      s.msg = `A[${i}] = ${s.a[i]} is ${less ? "smaller" : "larger"} than ${s.t}, so everything on its ${less ? "left" : "right"} is out. ` +
        (c > 0 ? `${c} candidate${c > 1 ? "s" : ""} left.` + (isMid ? "" : ` That ping could have left ${risk}; the middle sector guarantees at most ${Math.floor(size / 2)}.`)
               : `No candidates are left: ${s.t} is not in this row. Proven absent in ${st.you} pings.`);
      if (c <= 0) { s.over = true; s.phase = "Not found"; s.line = 7; }
    }
    s.hud = [["Candidates", s.found >= 0 ? 1 : Math.max(s.hi - s.lo + 1, 0)]];
    return isMid;
  },
  grade: (st, s) => st.you <= st.par ? (s.allMid ? "S" : "A") : st.you === st.par + 1 ? "B" : "C",
  draw(s, ask) {
    return `<div class="target"><div class="radar ${s.found >= 0 ? "lock" : ""}"></div><div><span>Lock on to</span><b>${s.t}</b><span>${s.a.length} sorted sectors</span></div></div><div class="prow">` + s.a.map((v, i) => {
      const out = i < s.lo || i > s.hi, fl = i in s.flipped;
      const cls = ["pc", out && i !== s.found && "out", fl && "fl", i === s.mid && "mid", i === s.found && "hit"].filter(Boolean).join(" ");
      const tag = out ? "" : i === s.lo && i === s.hi ? "" : i === s.lo ? "lo" : i === s.hi ? "hi" : "";
      return `<div class="${cls}" ${ask && !out && !fl ? `data-pick="${i}"` : ""}><em>${tag}</em><b>${fl ? v : ""}</b><small>${i}</small></div>`;
    }).join("") + `</div>`;
  },
};
