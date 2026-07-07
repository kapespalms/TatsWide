const tatsEl = document.getElementById("duel-tats");
const wideassEl = document.getElementById("duel-wideass");

if (tatsEl) tatsEl.innerHTML = mascotSVG("tats");
if (wideassEl) wideassEl.innerHTML = mascotSVG("wideass");

document.querySelector(".header-enter-btn")?.addEventListener("click", () => {
  window.location.href = "/wideass-tats-game-arena";
});
