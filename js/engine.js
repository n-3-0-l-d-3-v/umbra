/* ============================== engine ============================== */
const GAMES = { convoy: Convoy, signal: Signal, starlane: Starlane };
const RANK = { S: "Commander", A: "Pilot", B: "Navigator", C: "Cadet" };
let G, mode, round, steps = [], cur = 0, timer = null, live = null, done = false, fb = null, hist = [], st = {}, at = null, lastYou = 0;

const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
                set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

function showHome() {
  stop(); G = null;
  $("game").hidden = true; $("home").hidden = false;
  history.replaceState(null, "", location.pathname);
  $("cards").innerHTML = Object.values(GAMES).map((g, i) => {
    const best = store.get("rank-" + g.id);
    return `<article class="mr rv" data-open="${g.id}" data-m="play"><span class="no">0${i + 1}</span><h3>${g.name}</h3><div class="art">${g.art}</div>
      <div class="info"><span class="alg lbl">${g.topic}</span><p>${g.blurb}</p></div>
      <div class="acts"><span class="best lbl">${best ? `Best ${best} · ${RANK[best]}` : "Not flown"}</span>
      <button class="go" data-open="${g.id}" data-m="play">Launch ↗</button><button data-open="${g.id}" data-m="watch">Autopilot</button></div></article>`;
  }).join("");
  watchReveals();
}

function openGame(id, m, r) {
  G = GAMES[id]; mode = m;
  $("home").hidden = true; $("game").hidden = false;
  $("gName").textContent = G.name; $("gTopic").textContent = G.topic;
  $("size").hidden = !G.sizes; $("custom").hidden = !G.parse; $("custom").value = "";
  if (G.sizes) $("size").innerHTML = G.sizes.map(n => `<option value="${n}" ${n === G.size ? "selected" : ""}>${n} items</option>`).join("");
  $("code").innerHTML = G.pseudo.map(t => `<span>${t.replace(/</g, "&lt;") || " "}</span>`).join("");
  $("hint").textContent = G.hint;
  begin(r);
}

function begin(r) {
  stop();
  round = r || G.fresh(G.sizes ? +$("size").value : 0);
  steps = G.build(round); cur = 0; done = false; fb = null; hist = []; lastYou = 0;
  st = { you: 0, streak: 0, best: 0, par: G.par ? G.par(round) : steps.filter(s => s.decision).length };
  live = mode === "play" && G.playInit ? G.playInit(round) : null;
  $("end").hidden = true; $("scrub").max = steps.length - 1; $("stage").innerHTML = "";
  document.querySelectorAll("#modeSeg button").forEach(b => b.classList.toggle("on", b.dataset.mode === mode));
  history.replaceState(null, "", "#" + G.id + "/" + mode + "/" + btoa(JSON.stringify(round)).replace(/\+/g, "-").replace(/\//g, "_"));
  render();
  if (mode === "play" && !live) auto();
}

const asking = () => mode === "play" && !done && (live ? !live.over : !!steps[cur].decision);

/* The stage is patched in place: existing elements keep their identity, so CSS transitions
   run between states and one-shot animations only fire on the element that actually changed. */
const scratch = document.createElement("div");
function morph(a, b) {
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) return a.replaceWith(b.cloneNode(true));
  if (a.nodeType === 3) { if (a.data !== b.data) a.data = b.data; return; }
  for (const at of [...a.attributes]) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
  for (const at of b.attributes) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
  morphKids(a, b);
}
function morphKids(a, b) {
  const ac = [...a.childNodes], bc = [...b.childNodes];
  for (let i = 0; i < bc.length; i++) ac[i] ? morph(ac[i], bc[i]) : a.appendChild(bc[i].cloneNode(true));
  for (let i = bc.length; i < ac.length; i++) ac[i].remove();
}
function paint(html) {
  const el = $("stage");
  if (!el.firstChild) { el.innerHTML = html; return; }
  scratch.innerHTML = html; morphKids(el, scratch);
}

function render() {
  const s = live || steps[cur], ask = asking();
  paint(G.draw(s, ask));
  const text = fb || (ask && s.decision ? s.decision.prompt : s.msg);
  $("say").className = "say" + (fb ? " bad" : "");
  $("say").innerHTML = `<span class="tag">${fb ? "Off course" : s.phase}</span>`;
  $("say").append(text);
  if (hist[hist.length - 1] !== text) hist.push(text);

  const cells = mode === "play"
    ? [["Par", st.par, "key"], ["You", st.you, st.you !== lastYou ? "bump" : ""], ["Streak", st.streak]]
    : [["Step", cur + " / " + (steps.length - 1), "key"]];
  lastYou = st.you;
  $("hud").innerHTML = cells.concat(s.hud).map(([k, v, c]) => `<div class="${c || ""}">${k}<b>${v}</b></div>`).join("");

  [...$("code").children].forEach((el, i) => el.classList.toggle("hl", i === s.line));
  const items = mode === "watch" ? steps.slice(Math.max(0, cur - 7), cur + 1).map(x => x.msg) : hist.slice(-8);
  $("log").innerHTML = ""; items.reverse().forEach(t => { const li = document.createElement("li"); li.textContent = t; $("log").append(li); });

  $("watchCtl").hidden = mode !== "watch"; $("playCtl").hidden = mode !== "play";
  $("scrub").value = cur;
  $("back").disabled = $("first").disabled = cur === 0;
  $("fwd").disabled = $("last").disabled = cur === steps.length - 1;
}

/* ---- autopilot ---- */
function stop() { clearTimeout(timer); clearInterval(timer); timer = null; $("play").textContent = "▶ Run"; }
function go(k) { cur = Math.max(0, Math.min(steps.length - 1, k)); render(); if (cur === steps.length - 1) stop(); }
function togglePlay() {
  if (timer) return stop();
  if (cur === steps.length - 1) cur = 0;
  $("play").textContent = "⏸ Hold";
  timer = setInterval(() => go(cur + 1), 1500 - $("speed").value * 135);
}

/* ---- manual ---- */
function auto() {                // run forward until the next decision, then wait for the pilot
  clearTimeout(timer);
  if (mode !== "play" || live || done) return;
  const s = steps[cur];
  if (s.decision) return;
  if (cur === steps.length - 1) { timer = setTimeout(finish, 1000); return; }
  timer = setTimeout(() => { cur++; render(); auto(); }, s.pause || 700);
}
function where() {               // where to draw the particle burst: last click, or the middle of the stage for key presses
  if (at) return at;
  const r = $("stagewrap").getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];
}
function wrong() {
  for (const [el, c] of [[$("stage"), "shake"], [$("stagewrap"), "flash"]]) { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); }
  burst(...where(), "#ecebe6", 12, 3);
}
function pick(v) {
  if (mode !== "play" || done) return;
  if (live) {
    const good = G.playPick(live, v, st);
    if (good === false) return;
    burst(...where(), live.found >= 0 ? "#ecebe6" : good ? "#ecebe6" : "#ecebe6", live.found >= 0 ? 46 : 16);
    if (!good && !live.over) wrong();
    render();
    if (live.over) timer = setTimeout(finish, 1200);
    return;
  }
  const d = steps[cur].decision;
  if (!d) return;
  st.you++;
  if (String(v) === String(d.correct)) {
    st.streak++; st.best = Math.max(st.best, st.streak); fb = null;
    burst(...where(), "#ecebe6", 14 + Math.min(st.streak, 12) * 2);
    cur++; render(); auto();
  } else {
    st.streak = 0; fb = typeof d.why === "function" ? d.why(v) : d.why; render(); wrong();
  }
  at = null;
}

function finish() {
  done = true;
  const acc = st.par / Math.max(st.you, 1);
  const g = G.grade ? G.grade(st, live) : st.you === st.par ? "S" : acc >= .9 ? "A" : acc >= .75 ? "B" : "C";
  const old = store.get("rank-" + G.id);
  if (!old || "SABC".indexOf(g) < "SABC".indexOf(old)) store.set("rank-" + G.id, g);
  const diff = st.you - st.par;
  $("end").innerHTML = `<div><div class="ring"><b>${g}</b></div><div class="rk">${RANK[g]}</div>
    <div class="sc">Par ${st.par} · You ${st.you} · ${diff === 0 ? "on par" : diff < 0 ? `${-diff} under` : `${diff} over`} · best streak ${st.best}</div>
    <p>${G.takeaway}</p>
    <div class="acts"><button class="go" data-end="new">New round</button><button data-end="retry">Fly it again</button>
    <button data-end="watch">Watch the autopilot</button><button data-end="link">Copy challenge link</button></div></div>`;
  $("end").hidden = false;
  render();
  const r = $("stagewrap").getBoundingClientRect(), n = g === "S" ? 5 : g === "A" ? 3 : 1;
  for (let k = 0; k < n; k++) setTimeout(() => burst(r.left + r.width * (.25 + Math.random() * .5), r.top + r.height * (.25 + Math.random() * .4), pickOne(["#ecebe6", "#ecebe6", "#ecebe6", "#ecebe6"]), 40, 6), k * 220);
}

/* ---- wiring ---- */
$("cards").onclick = e => { const b = e.target.closest("[data-open]"); if (b) wipe(() => openGame(b.dataset.open, b.dataset.m)); };
$("cards").onmousemove = e => { const c = e.target.closest(".mc"); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px"); };
$("stage").onclick = e => { const t = e.target.closest("[data-pick]"); if (t) { at = [e.clientX, e.clientY]; pick(t.dataset.pick); } };
$("end").onclick = e => {
  const a = e.target.dataset.end;
  if (a === "new") begin();
  if (a === "retry") begin(round);
  if (a === "watch") { mode = "watch"; begin(round); }
  if (a === "link") {
    const ok = () => e.target.textContent = "Link copied";
    try { navigator.clipboard.writeText(location.href).then(ok, () => prompt("Copy this link:", location.href)); }
    catch (err) { prompt("Copy this link:", location.href); }
  }
};
$("homeBtn").onclick = () => wipe(showHome);
$("newBtn").onclick = () => begin();
$("size").onchange = () => begin();
$("focusBtn").onclick = () => $("layout").classList.toggle("focus");
$("modeSeg").onclick = e => { const m = e.target.dataset.mode; if (m && m !== mode) { mode = m; begin(round); } };
$("custom").onkeydown = e => {
  if (e.key !== "Enter") return;
  try { begin(G.parse($("custom").value)); }
  catch (err) { fb = String(err); render(); fb = null; }
};
$("first").onclick = () => { stop(); go(0); };
$("last").onclick = () => { stop(); go(steps.length - 1); };
$("back").onclick = () => { stop(); go(cur - 1); };
$("fwd").onclick = () => { stop(); go(cur + 1); };
$("play").onclick = togglePlay;
$("speed").oninput = () => { if (timer) { stop(); togglePlay(); } };
$("scrub").oninput = e => { stop(); go(+e.target.value); };
document.addEventListener("keydown", e => {
  if (!G || e.target.id === "custom") return;
  if (e.key === "Escape") return wipe(showHome);
  if (mode === "play") { if (G.keys && G.keys[e.key]) { e.preventDefault(); at = null; pick(G.keys[e.key]); } return; }
  if (e.key === "ArrowRight") { stop(); go(cur + 1); }
  else if (e.key === "ArrowLeft") { stop(); go(cur - 1); }
  else if (e.key === " ") { e.preventDefault(); togglePlay(); }
  else if (e.key === "Home") { stop(); go(0); }
  else if (e.key === "End") { stop(); go(steps.length - 1); }
});
