/* ============================== site motion ============================== */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
function watchReveals() { document.querySelectorAll(".rv:not(.in)").forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + "ms"; io.observe(el); }); }
function wipe(fn) {              // page transition: a white sheet rises, the view swaps underneath, the sheet lifts away
  const c = $("curtain");
  if (calm) return fn();
  c.className = "in";
  setTimeout(() => { fn(); scrollTo(0, 0); c.className = "out"; setTimeout(() => c.className = "", 620); }, 520);
}
function runIntro() {
  const el = $("intro"); if (!el) return;
  if (calm) { el.remove(); document.body.classList.add("ready"); return; }
  const t0 = performance.now(), tick = t => {
    const p = Math.min((t - t0) / 1100, 1);
    $("introN").textContent = Math.round(100 * (1 - Math.pow(1 - p, 3)));
    if (p < 1) return requestAnimationFrame(tick);
    el.classList.add("gone"); document.body.classList.add("ready"); setTimeout(() => el.remove(), 1000);
  };
  requestAnimationFrame(tick);
}
{ // cursor dot, hero parallax, mission clock: everything is eased inside one animation frame loop
  const dot = $("cursor"), orb = document.querySelector(".orb"), hero = document.querySelector(".hero");
  let tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty, sc = 1, hot = false, ox = 0, oy = 0, sy = -1;
  addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; hot = !!e.target.closest("[data-open], [data-pick], button, a"); }, { passive: true });
  (function loop() {
    cx += (tx - cx) * .25; cy += (ty - cy) * .25; sc += ((hot ? 4.6 : 1) - sc) * .18;
    dot.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
    if (!$("home").hidden) {
      const gx = (tx / innerWidth * 2 - 1) * 20, gy = (ty / innerHeight * 2 - 1) * 20;
      if (Math.abs(gx - ox) + Math.abs(gy - oy) > .05) {
        ox += (gx - ox) * .05; oy += (gy - oy) * .05;
        orb.style.setProperty("--ox", ox.toFixed(2)); orb.style.setProperty("--oy", oy.toFixed(2));
      }
      if (scrollY !== sy && scrollY < innerHeight * 1.2) { sy = scrollY; hero.style.setProperty("--sy", sy); }
    }
    requestAnimationFrame(loop);
  })();
  const t0 = Date.now(), two = n => String(n).padStart(2, "0");
  setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); $("clock").textContent = `MET ${two(Math.floor(s / 3600))}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}`; }, 1000);
}
