/* ============================== sky + effects ============================== */
const sky = $("sky").getContext("2d"), fxc = $("fx").getContext("2d");
const calm = false;   // motion is the point of this site, so it always runs
let W, H, stars = [], parts = [], comet = null;
function resize() {
  W = $("sky").width = $("fx").width = innerWidth; H = $("sky").height = $("fx").height = innerHeight;
  stars = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), t: Math.random() * 6.3 }));
  if (calm) frame(0);
}
let odd = false, fxLive = false;
function frame(t) {
  if (odd = !odd) {                       // the sky drifts slowly, so 30 fps is plenty
    sky.clearRect(0, 0, W, H); sky.fillStyle = "#ecebe6";
    for (const s of stars) {
      s.x -= .06 + s.z * .3; if (s.x < -2) s.x = W + 2;
      const r = s.z > .94 ? 2 : s.z * 1.2 + .3;
      sky.globalAlpha = (.2 + .8 * s.z) * (.6 + .4 * Math.sin(t / 800 + s.t));
      sky.fillRect(s.x, s.y, r, r);
    }
    sky.globalAlpha = 1;
    if (!comet && Math.random() < .005) comet = { x: Math.random() * W, y: Math.random() * H * .5, l: 1 };
    if (comet) {
      const g = sky.createLinearGradient(comet.x, comet.y, comet.x + 130, comet.y - 46);
      g.addColorStop(0, `rgba(255,255,255,${comet.l})`); g.addColorStop(1, "rgba(255,255,255,0)");
      sky.strokeStyle = g; sky.lineWidth = 1.5; sky.beginPath(); sky.moveTo(comet.x, comet.y); sky.lineTo(comet.x + 130, comet.y - 46); sky.stroke();
      comet.x -= 18; comet.y += 6.4; comet.l -= .04; if (comet.l <= 0) comet = null;
    }
  }
  if (parts.length || fxLive) {           // the effects layer is only touched while particles are alive
    fxc.clearRect(0, 0, W, H);
    parts = parts.filter(p => p.l > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vx *= .97; p.vy = p.vy * .97 + .05; p.l -= .022;
      fxc.globalAlpha = Math.max(p.l, 0); fxc.fillStyle = p.c; fxc.fillRect(p.x, p.y, p.s, p.s);
    }
    fxc.globalAlpha = 1; fxLive = parts.length > 0;
  }
  if (!calm) requestAnimationFrame(frame);
}
function burst(x, y, c, n = 20, power = 4) {
  if (calm) return;
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, v = Math.random() * power + 1; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, c, s: Math.random() * 3 + 1.5 }); }
}
addEventListener("resize", resize); resize(); if (!calm) requestAnimationFrame(frame);
