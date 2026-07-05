document.getElementById("enterArenaBtn")?.addEventListener("click", () => {
  document.getElementById("arena")?.scrollIntoView({ behavior: "smooth" });
});

document.getElementById("drawChaosBtn")?.addEventListener("click", () => {
  document.getElementById("chaos")?.scrollIntoView({ behavior: "smooth" });
});

document.getElementById("chooseBattleBtn")?.addEventListener("click", () => {
  document.getElementById("games")?.scrollIntoView({ behavior: "smooth" });
});
