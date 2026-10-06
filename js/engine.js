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
