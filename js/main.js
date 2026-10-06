/* A challenge link looks like  index.html#convoy/play/<round>  and reopens the exact same round. */
(function boot() {
  const [id, m, data, step] = location.hash.slice(1).split("/");
  try {
    if (GAMES[id] && data) {
      openGame(id, m === "watch" ? "watch" : "play", JSON.parse(atob(data.replace(/-/g, "+").replace(/_/g, "/"))));
      $("intro").remove(); document.body.classList.add("ready");
      if (step && !live) { stop(); cur = Math.min(+step, steps.length - 1); render(); }
      return;
    }
  } catch (e) {}
  showHome(); runIntro();
})();
