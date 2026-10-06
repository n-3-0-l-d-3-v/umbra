// reading progress, section tracking for the table of contents, and scroll reveals
const bar = document.getElementById("bar");
if (bar) {
  let tick = false;
  const upd = () => { const h = document.documentElement; bar.style.transform = `scaleX(${h.scrollTop / Math.max(h.scrollHeight - innerHeight, 1)})`; tick = false; };
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
}
const links = [...document.querySelectorAll(".toc a")];
if (links.length) {
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.hash === "#" + e.target.id));
  }), { rootMargin: "-10% 0px -75% 0px" });
  document.querySelectorAll("article h2[id]").forEach(h => spy.observe(h));
}
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
document.querySelectorAll(".rv").forEach(el => io.observe(el));
