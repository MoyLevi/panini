const STORAGE_KEY = "panini_wc26";
const APP_VERSION = "1.2";
const THEME_KEY = "panini_wc26_theme";

const groups = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"]
};

const teamNames = {
  MEX: "México", RSA: "Sudáfrica", KOR: "Corea República", CZE: "Chequia",
  CAN: "Canadá", BIH: "Bosnia y Herzegovina", QAT: "Qatar", SUI: "Suiza",
  BRA: "Brasil", MAR: "Marruecos", HAI: "Haití", SCO: "Escocia",
  USA: "Estados Unidos", PAR: "Paraguay", AUS: "Australia", TUR: "Turquía",
  GER: "Alemania", CUW: "Curazao", CIV: "Costa de Marfil", ECU: "Ecuador",
  NED: "Países Bajos", JPN: "Japón", SWE: "Suecia", TUN: "Túnez",
  BEL: "Bélgica", EGY: "Egipto", IRN: "Irán", NZL: "Nueva Zelanda",
  ESP: "España", CPV: "Cabo Verde", KSA: "Arabia Saudita", URU: "Uruguay",
  FRA: "Francia", SEN: "Senegal", IRQ: "Irak", NOR: "Noruega",
  ARG: "Argentina", ALG: "Argelia", AUT: "Austria", JOR: "Jordania",
  POR: "Portugal", COD: "Congo RD", UZB: "Uzbekistán", COL: "Colombia",
  ENG: "Inglaterra", CRO: "Croacia", GHA: "Ghana", PAN: "Panamá",
  FWC: "Extras FWC"
};

const flags = {
  MEX: "🇲🇽", RSA: "🇿🇦", KOR: "🇰🇷", CZE: "🇨🇿",
  CAN: "🇨🇦", BIH: "🇧🇦", QAT: "🇶🇦", SUI: "🇨🇭",
  BRA: "🇧🇷", MAR: "🇲🇦", HAI: "🇭🇹", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  USA: "🇺🇸", PAR: "🇵🇾", AUS: "🇦🇺", TUR: "🇹🇷",
  GER: "🇩🇪", CUW: "🇨🇼", CIV: "🇨🇮", ECU: "🇪🇨",
  NED: "🇳🇱", JPN: "🇯🇵", SWE: "🇸🇪", TUN: "🇹🇳",
  BEL: "🇧🇪", EGY: "🇪🇬", IRN: "🇮🇷", NZL: "🇳🇿",
  ESP: "🇪🇸", CPV: "🇨🇻", KSA: "🇸🇦", URU: "🇺🇾",
  FRA: "🇫🇷", SEN: "🇸🇳", IRQ: "🇮🇶", NOR: "🇳🇴",
  ARG: "🇦🇷", ALG: "🇩🇿", AUT: "🇦🇹", JOR: "🇯🇴",
  POR: "🇵🇹", COD: "🇨🇩", UZB: "🇺🇿", COL: "🇨🇴",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", CRO: "🇭🇷", GHA: "🇬🇭", PAN: "🇵🇦",
  FWC: "🏆"
};

let stickers = [];
let owned = new Set();
let deferredInstallPrompt = null;
let lastTradeText = "";

const $ = (selector) => document.querySelector(selector);

function buildStickerList() {
  const list = [];

  for (let i = 0; i <= 8; i++) {
    list.push({ id: `FWC${i}`, section: "Extras inicio", group: "EXTRAS", team: "FWC", name: "Extra" });
  }

  Object.entries(groups).forEach(([group, teams]) => {
    teams.forEach((team) => {
      for (let n = 1; n <= 20; n++) {
        list.push({
          id: `${team}${n}`,
          section: `Grupo ${group}`,
          group,
          team,
          name: teamNames[team] || team
        });
      }
    });
  });

  for (let i = 9; i <= 19; i++) {
    list.push({ id: `FWC${i}`, section: "Extras final", group: "EXTRAS", team: "FWC", name: "Extra" });
  }

  return list;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    owned = new Set(Array.isArray(saved) ? saved : []);
  } catch {
    owned = new Set();
  }

  const theme = localStorage.getItem(THEME_KEY);
  if (theme === "light") document.body.classList.add("light");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...owned]));
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

function parseStickerIds(text) {
  const raw = String(text || "")
    .toUpperCase()
    .split(/[\s,;|]+/)
    .map(normalizeId)
    .filter(Boolean);

  return [...new Set(raw)];
}

function stickerExists(id) {
  return stickers.some((s) => s.id === id);
}

function toggleSticker(id) {
  id = normalizeId(id);
  if (!stickerExists(id)) return false;

  if (owned.has(id)) owned.delete(id);
  else owned.add(id);

  saveState();
  renderAll();
  return true;
}

function getTeamStats() {
  return Object.entries(teamNames)
    .filter(([team]) => team !== "FWC")
    .map(([team, name]) => {
      const items = stickers.filter((s) => s.team === team);
      const have = items.filter((s) => owned.has(s.id)).length;
      const total = items.length;
      const group = items[0]?.group || "";
      const pct = total ? Math.round((have / total) * 100) : 0;

      return { team, name, group, have, total, pct };
    });
}

function getGroupStats() {
  return Object.keys(groups).map((group) => {
    const items = stickers.filter((s) => s.group === group);
    const have = items.filter((s) => owned.has(s.id)).length;
    const total = items.length;
    const pct = total ? Math.round((have / total) * 100) : 0;

    return { group, have, total, pct };
  });
}

function renderStats() {
  const total = stickers.length;
  const have = owned.size;
  const missing = total - have;
  const pct = total ? Math.round((have / total) * 100) : 0;
  const completeTeams = getTeamStats().filter((t) => t.have === t.total).length;

  $("#progressText").textContent = `${have} / ${total}`;
  $("#missingText").textContent = `Faltan ${missing}`;
  $("#progressPercent").textContent = `${pct}%`;
  $("#progressFill").style.width = `${pct}%`;
  $("#statTengo").textContent = have;
  $("#statFaltan").textContent = missing;
  $("#statCompleteTeams").textContent = `${completeTeams}/48`;
}

function renderTopTeams() {
  const teams = getTeamStats()
    .sort((a, b) => b.have - a.have || a.team.localeCompare(b.team))
    .slice(0, 6);

  $("#topTeamsList").innerHTML = teams.map((t) => `
    <div class="rank-item">
      <div class="rank-line">
        <span class="rank-name">${flags[t.team] || ""} ${t.name} ${t.have === t.total ? "🏆" : ""}</span>
        <span>${t.have}/${t.total}</span>
      </div>
      <div class="mini-bar"><div class="mini-fill" style="width:${t.pct}%"></div></div>
    </div>
  `).join("");
}

function renderGroupStats() {
  const stats = getGroupStats();
  const best = [...stats].sort((a, b) => b.pct - a.pct || b.have - a.have)[0];
  const worst = [...stats].sort((a, b) => a.pct - b.pct || a.have - b.have)[0];

  $("#bestWorstGroup").textContent = `Más avanzado: Grupo ${best.group} · Menos avanzado: Grupo ${worst.group}`;

  $("#groupProgressList").innerHTML = stats.map((g) => `
    <div class="group-item">
      <div class="group-line">
        <span class="group-name">Grupo ${g.group}</span>
        <span>${g.have}/${g.total} · ${g.pct}%</span>
      </div>
      <div class="mini-bar"><div class="mini-fill" style="width:${g.pct}%"></div></div>
    </div>
  `).join("");
}

function renderGroupFilter() {
  const select = $("#groupFilter");
  if (select.options.length > 1) return;

  select.insertAdjacentHTML("beforeend", `<option value="EXTRAS">Extras FWC</option>`);
  Object.keys(groups).forEach((g) => {
    select.insertAdjacentHTML("beforeend", `<option value="${g}">Grupo ${g}</option>`);
  });
}

function getFilteredStickers() {
  const query = normalizeId($("#searchInput").value);
  const group = $("#groupFilter").value;
  const status = $("#statusFilter").value;

  return stickers.filter((s) => {
    const searchable = [
      s.id,
      s.team,
      s.name,
      s.group ? `GRUPO${s.group}` : "",
      s.section
    ].join(" ").toUpperCase();

    const matchesQuery = !query || searchable.replace(/\s+/g, "").includes(query);
    const matchesGroup = group === "todos" || s.group === group;
    const isOwned = owned.has(s.id);

    const matchesStatus =
      status === "todos" ||
      (status === "tengo" && isOwned) ||
      (status === "faltan" && !isOwned);

    return matchesQuery && matchesGroup && matchesStatus;
  });
}

function renderAlbum() {
  const container = $("#albumContainer");
  const filtered = getFilteredStickers();

  if (!filtered.length) {
    container.innerHTML = `<p class="muted">No encontré estampas con esos filtros.</p>`;
    return;
  }

  const grouped = new Map();

  filtered.forEach((s) => {
    const key = s.team === "FWC" ? s.section : `${s.section} · ${s.team}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(s);
  });

  container.innerHTML = "";

  grouped.forEach((items, key) => {
    const team = items[0].team;
    const have = items.filter((s) => owned.has(s.id)).length;
    const total = items.length;
    const pct = Math.round((have / total) * 100);
    const complete = have === total;
    const title = team === "FWC"
      ? key
      : `${flags[team] || ""} ${teamNames[team] || team} (${team})`;

    const section = document.createElement("section");
    section.className = "team-section";
    section.innerHTML = `
      <div class="team-header">
        <div>
          <h3>${title} ${complete ? `<span class="badge">🏆 Completo</span>` : ""}</h3>
          <span>${key.split(" · ")[0]}</span>
        </div>
        <div class="team-meta">
          <span>${have} / ${total} · ${pct}%</span>
          <div class="team-progress"><div class="mini-fill" style="width:${pct}%"></div></div>
        </div>
      </div>
      <div class="sticker-grid"></div>
    `;

    const grid = section.querySelector(".sticker-grid");

    items.forEach((s) => {
      const btn = document.createElement("button");
      const hasIt = owned.has(s.id);
      btn.className = `sticker ${hasIt ? "owned" : ""}`;
      btn.innerHTML = `<strong>${hasIt ? "🟩" : "⬜"} ${s.id}</strong><small>${hasIt ? "Tengo" : "Falta"}</small>`;
      btn.addEventListener("click", () => toggleSticker(s.id));
      grid.appendChild(btn);
    });

    container.appendChild(section);
  });
}

function buildMissingText() {
  const missing = stickers.filter((s) => !owned.has(s.id));
  const bySection = new Map();

  missing.forEach((s) => {
    const key = s.team === "FWC" ? s.section : `${s.section} - ${s.team} ${teamNames[s.team] || ""}`;
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key).push(s.id);
  });

  let text = `Me faltan ${missing.length} estampas del álbum Panini WC26:\n\n`;

  bySection.forEach((ids, section) => {
    text += `${section}\n${ids.join(", ")}\n\n`;
  });

  return text.trim();
}

function renderMissing() {
  $("#missingList").value = buildMissingText();
}

function analyzeTrade() {
  const ids = parseStickerIds($("#tradeInput").value);
  const missing = [];
  const alreadyOwned = [];
  const invalid = [];

  ids.forEach((id) => {
    if (!stickerExists(id)) invalid.push(id);
    else if (owned.has(id)) alreadyOwned.push(id);
    else missing.push(id);
  });

  lastTradeText =
    `Resultado de intercambio Panini WC26\n\n` +
    `Me sirven (${missing.length}):\n${missing.join(", ") || "Ninguna"}\n\n` +
    `Ya las tengo (${alreadyOwned.length}):\n${alreadyOwned.join(", ") || "Ninguna"}\n\n` +
    `No reconocidas (${invalid.length}):\n${invalid.join(", ") || "Ninguna"}`;

  $("#tradeResult").innerHTML = `
    <div class="trade-box">
      <h3>✅ Te sirven / te faltan (${missing.length})</h3>
      <p>${missing.join(", ") || "Ninguna"}</p>
    </div>
    <div class="trade-box">
      <h3>🟩 Ya las tienes (${alreadyOwned.length})</h3>
      <p>${alreadyOwned.join(", ") || "Ninguna"}</p>
    </div>
    <div class="trade-box">
      <h3>⚠️ No reconocidas (${invalid.length})</h3>
      <p>${invalid.join(", ") || "Ninguna"}</p>
    </div>
  `;
}

function copyText(text, button, originalLabel) {
  navigator.clipboard.writeText(text).then(() => {
    button.textContent = "Copiado";
    setTimeout(() => (button.textContent = originalLabel), 1200);
  }).catch(() => {
    alert("No se pudo copiar automáticamente. Selecciona el texto y cópialo manualmente.");
  });
}

function renderAll() {
  renderStats();
  renderTopTeams();
  renderGroupStats();
  renderAlbum();
  renderMissing();

  if ($("#tradeInput")?.value.trim()) analyzeTrade();
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      tab.classList.add("active");
      $(`#${tab.dataset.screen}`).classList.add("active");
      renderAll();
    });
  });

  $("#searchInput").addEventListener("input", renderAlbum);
  $("#groupFilter").addEventListener("change", renderAlbum);
  $("#statusFilter").addEventListener("change", renderAlbum);

  $("#quickToggleBtn").addEventListener("click", () => {
    const id = normalizeId($("#quickInput").value);
    const ok = toggleSticker(id);
    $("#quickResult").textContent = ok
      ? `${id} actualizado.`
      : `No existe la estampa "${id}". Revisa la clave.`;
  });

  $("#quickInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") $("#quickToggleBtn").click();
  });

  $("#copyMissingBtn").addEventListener("click", () => {
    copyText($("#missingList").value, $("#copyMissingBtn"), "Copiar");
  });

  $("#analyzeTradeBtn").addEventListener("click", analyzeTrade);

  $("#clearTradeBtn").addEventListener("click", () => {
    $("#tradeInput").value = "";
    $("#tradeResult").innerHTML = "";
    lastTradeText = "";
  });

  $("#copyTradeBtn").addEventListener("click", () => {
    if (!lastTradeText) analyzeTrade();
    copyText(lastTradeText, $("#copyTradeBtn"), "Copiar resultado");
  });

  $("#exportBtn").addEventListener("click", () => {
    const data = {
      app: "Panini Tracker WC26",
      version: "1.1",
      date: new Date().toISOString(),
      owned: [...owned]
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "panini-wc26-respaldo.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  $("#importInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.owned)) throw new Error("Formato inválido");

        owned = new Set(
          data.owned
            .map(normalizeId)
            .filter((id) => stickerExists(id))
        );

        saveState();
        renderAll();
        alert("Respaldo importado correctamente.");
      } catch {
        alert("No pude importar ese archivo. Parece que no es un respaldo válido.");
      }
    };

    reader.readAsText(file);
  });

  $("#resetBtn").addEventListener("click", () => {
    const ok = confirm("¿Seguro que quieres borrar todo tu progreso?");
    if (!ok) return;

    owned.clear();
    saveState();
    renderAll();
  });

  $("#themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem(THEME_KEY, document.body.classList.contains("light") ? "light" : "dark");
    $("#themeBtn").textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  });

  $("#installBtn").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $("#installBtn").classList.add("hidden");
  });
}

function setupPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
      console.warn("No se pudo registrar el service worker.");
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    $("#installBtn").classList.remove("hidden");
  });
}

function init() {
  stickers = buildStickerList();
  loadState();
  renderGroupFilter();
  bindEvents();
  setupPWA();
  renderAll();

  $("#themeBtn").textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  console.log(`Panini Tracker V1.1 listo: ${stickers.length} estampas.`);
}

init();
