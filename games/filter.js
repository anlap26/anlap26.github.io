(function () {
  const input = document.querySelector("[data-filter]");
  const rows = [...document.querySelectorAll("[data-game]")];
  const hint = document.getElementById("results");
  if (!input || !rows.length) return;
  const params = new URLSearchParams(location.search);
  if (params.get("q")) input.value = params.get("q");
  const apply = () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const row of rows) {
      const match = !q || (row.dataset.game || "").includes(q);
      row.hidden = !match;
      if (match) shown += 1;
    }
    if (hint) {
      hint.textContent = q ? `${shown} games match “${input.value.trim()}”.` : `Showing ${rows.length} games. Use the search box above, or type here.`;
    }
  };
  input.addEventListener("input", apply);
  apply();
})();
