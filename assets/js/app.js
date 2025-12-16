// =======================
// CONFIG
// =======================

// GitHub Issues "new issue" URL
const GITHUB_ISSUES_NEW_URL =
  "https://github.com/statsplus/statsplus.github.io/issues/new";

const ADMIN_KEY_HASH = "384ea93f2d079846fe76b3926459d83f681abd10224899f33abea47d6bdd2bfd";

// LocalStorage keys
const LS_PLUGIN_OVERRIDES = "statsplus.pluginOverrides.v1";
const LS_ADMIN_UNLOCKED = "statsplus.adminUnlocked.v1";

// =======================
// HELPERS
// =======================

function $(id) {
  return document.getElementById(id);
}

function safeVal(el) {
  return (el?.value || "").trim();
}

// SHA-256 using Web Crypto API
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// =======================
// BUG REPORT -> GITHUB ISSUE
// =======================

function buildBugReportText(data) {
  return [
    `**Severity:** ${data.severity}`,
    `**Page/URL:** ${data.page || "(not provided)"}`,
    `**Browser:** ${data.browser || "(not provided)"}`,
    `**Device:** ${data.device || "(not provided)"}`,
    "",
    "## Steps to reproduce",
    data.steps || "(not provided)",
    "",
    "## Expected behavior",
    data.expected || "(not provided)",
    "",
    "## Actual behavior",
    data.actual || "(not provided)",
    "",
    "## Extra info",
    data.extra || "(not provided)"
  ].join("\n");
}

function openGitHubIssue(title, body) {
  if (!GITHUB_ISSUES_NEW_URL.includes("github.com")) {
    alert("GitHub issue URL is not configured correctly.");
    return;
  }

  const url = new URL(GITHUB_ISSUES_NEW_URL);
  url.searchParams.set("title", title);
  url.searchParams.set("body", body);

  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

function setupBugForm() {
  const form = $("bugForm");
  if (!form) return;

  // Autofill helpers
  if ($("page") && !$("page").value) {
    $("page").value = window.location.href.replace(/\/bugreport\.html.*$/, "/");
  }

  if ($("browser") && !$("browser").value) {
    $("browser").value = navigator.userAgent;
  }

  if ($("device") && !$("device").value) {
    $("device").value =
      navigator.userAgentData?.platform ||
      navigator.platform ||
      "Unknown";
  }

  form.addEventListener("submit", e => {
    e.preventDefault();

    const data = {
      title: safeVal($("title")),
      severity: safeVal($("severity")) || "medium",
      page: safeVal($("page")),
      steps: safeVal($("steps")),
      expected: safeVal($("expected")),
      actual: safeVal($("actual")),
      browser: safeVal($("browser")),
      device: safeVal($("device")),
      extra: safeVal($("extra"))
    };

    const body = buildBugReportText(data);
    openGitHubIssue(`[Bug] ${data.title} (${data.severity})`, body);
  });

  $("copyBtn")?.addEventListener("click", async () => {
    const data = {
      title: safeVal($("title")),
      severity: safeVal($("severity")) || "medium",
      page: safeVal($("page")),
      steps: safeVal($("steps")),
      expected: safeVal($("expected")),
      actual: safeVal($("actual")),
      browser: safeVal($("browser")),
      device: safeVal($("device")),
      extra: safeVal($("extra"))
    };

    const text =
      `Title: ${data.title}\n\n` + buildBugReportText(data);

    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard.");
    } catch {
      prompt("Copy manually:", text);
    }
  });
}

// =======================
// PLUGINS (STATIC + LOCAL OVERRIDES)
// =======================

async function fetchPlugins() {
  const res = await fetch("./plugins.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load plugins.json");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("plugins.json must be an array");
  return data;
}

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(LS_PLUGIN_OVERRIDES) || "{}");
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  localStorage.setItem(LS_PLUGIN_OVERRIDES, JSON.stringify(overrides));
}

function isUnlocked() {
  return localStorage.getItem(LS_ADMIN_UNLOCKED) === "1";
}

function setUnlocked(val) {
  localStorage.setItem(LS_ADMIN_UNLOCKED, val ? "1" : "0");
}

function renderPlugins(plugins) {
  const list = $("pluginList");
  if (!list) return;

  const overrides = loadOverrides();
  list.innerHTML = "";

  plugins.forEach(p => {
    const ov = overrides[p.id] || {};
    const enabled = (ov.enabled ?? p.enabled) !== false;
    const removed = ov.removed === true;

    const li = document.createElement("li");
    li.className = "plugin-item";
    if (removed) li.style.opacity = "0.55";

    const meta = document.createElement("div");
    meta.className = "plugin-meta";

    const name = document.createElement("strong");
    name.textContent = p.name;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = removed
      ? "Removed (local)"
      : enabled
      ? "Enabled"
      : "Disabled";

    const desc = document.createElement("span");
    desc.className = "muted";
    desc.textContent = p.description || "";

    meta.append(name, badge, desc);

    const actions = document.createElement("div");
    actions.className = "plugin-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn small warn";
    toggleBtn.textContent = enabled ? "Disable" : "Enable";
    toggleBtn.disabled = !isUnlocked();

    toggleBtn.onclick = () => {
      const next = loadOverrides();
      next[p.id] = { ...(next[p.id] || {}), enabled: !enabled, removed: false };
      saveOverrides(next);
      renderPlugins(plugins);
    };

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn small danger";
    removeBtn.textContent = "Remove";
    removeBtn.disabled = !isUnlocked();

    removeBtn.onclick = () => {
      const next = loadOverrides();
      next[p.id] = { ...(next[p.id] || {}), removed: true };
      saveOverrides(next);
      renderPlugins(plugins);
    };

    actions.append(toggleBtn, removeBtn);
    li.append(meta, actions);
    list.appendChild(li);
  });
}

function updateAdminUI() {
  $("adminLockedNote")?.classList.toggle("hidden", isUnlocked());
  $("adminArea")?.classList.toggle("hidden", !isUnlocked());
}

async function setupAdminPanel() {
  const unlockBtn = $("unlockBtn");
  const lockBtn = $("lockBtn");
  const resetBtn = $("resetLocalBtn");
  const reloadBtn = $("reloadPluginsBtn");

  let pluginsCache = [];

  async function loadAndRender() {
    pluginsCache = await fetchPlugins();
    renderPlugins(pluginsCache);
  }

  unlockBtn?.addEventListener("click", async () => {
    const key = safeVal($("adminKey"));
    if (!key) {
      alert("Enter admin key.");
      return;
    }

    const hash = await sha256(key);
    if (hash !== ADMIN_KEY_HASH) {
      alert("Wrong admin key.");
      return;
    }

    setUnlocked(true);
    updateAdminUI();
    await loadAndRender();
  });

  lockBtn?.addEventListener("click", () => {
    setUnlocked(false);
    updateAdminUI();
  });

  resetBtn?.addEventListener("click", () => {
    if (!confirm("Reset local plugin changes?")) return;
    localStorage.removeItem(LS_PLUGIN_OVERRIDES);
    renderPlugins(pluginsCache);
  });

  reloadBtn?.addEventListener("click", loadAndRender);

  updateAdminUI();
  await loadAndRender();
}

// =======================
// INIT
// =======================

document.addEventListener("DOMContentLoaded", () => {
  setupBugForm();
  setupAdminPanel();
});
