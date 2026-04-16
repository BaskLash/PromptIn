// =================================================================
// Side Panel Script -- All prompt browsing UI lives here.
// Receives state from content script via background relay.
// Sends PROMPT_SELECTED back when user picks a prompt.
// =================================================================

const extPay = ExtPay("promptin");

// --- State ---
let categories = {};
let promptSourceMap = new Map();
let currentFocusElement = null;
let selectedCategoryOrFolder = null;
let isRecommendedUnlocked = false;
let currentQuery = "";
let currentDomain = "";

// --- DOM refs ---
const searchInput = document.getElementById("search-input");
const navPanel = document.getElementById("nav-panel");
const contentPanel = document.getElementById("content-panel");
const panelsContainer = document.getElementById("panels");
const idleMessage = document.getElementById("idle-message");

// --- Domain to model map (mirrors content script) ---
const domainToModelMap = {
  "chatgpt.com": "ChatGPT", "grok.com": "Grok",
  "gemini.google.com": "Gemini", "claude.ai": "Claude",
  "blackbox.ai": "BlackBox", "github.com": "GitHub Copilot",
  "copilot.microsoft.com": "Microsoft Copilot", "chat.mistral.ai": "Mistral",
  "duckduckgo.com": "DuckDuckGo AI Chat", "perplexity.ai": "Perplexity",
  "chat.deepseek.com": "DeepSeek", "deepai.org": "DeepAI",
  "chat.qwen.ai": "Qwen AI",
};

function getCurrentMode() {
  for (const [domain, model] of Object.entries(domainToModelMap)) {
    if (currentDomain.includes(domain)) return model;
  }
  return null;
}

// =================================================================
// Data loading (reads directly from chrome.storage)
// =================================================================
function loadData(callback) {
  chrome.storage.local.get(["prompts", "folders", "workflows"], (data) => {
    if (chrome.runtime.lastError) return;

    const mode = getCurrentMode();
    categories = {
      Recommended: [], "Last Used": [], Favorites: [], Workflows: [],
      "All Prompts": [], "Single Prompts": [], "Categorised Prompts": { all: [] },
    };
    promptSourceMap = new Map();
    const allPrompts = [];

    // Workflows
    const workflows = data.workflows || {};
    for (const [wid, wf] of Object.entries(workflows)) {
      if (!wf.isTrash) {
        categories.Workflows.push(wf.name);
        promptSourceMap.set(`${wf.name}_${wid}`, { category: "Workflows", workflow: wf, workflowId: wid });
      }
    }

    const prompts = data.prompts || {};
    const folders = data.folders || {};
    let recommended = [];

    for (const [pid, p] of Object.entries(prompts)) {
      if (p.isTrash) continue;
      const title = p.title || "Untitled Prompt";
      const folderId = p.folderId || null;
      const folder = folderId && folders[folderId]?.name;
      const key = `${title}_${pid}`;

      allPrompts.push({ title, prompt: p, folderId, promptId: pid, lastUsed: p.lastUsed || 0, folder: folder || null });

      if (mode && Array.isArray(p.compatibleModels) && p.compatibleModels.includes(mode)) {
        recommended.push({ title, usageCount: p.usageCount || 0, key, folder, prompt: p, folderId, promptId: pid });
        promptSourceMap.set(key, { category: "Recommended", folder, prompt: p, folderId, promptId: pid });
      }

      categories["All Prompts"].push(title);
      promptSourceMap.set(key, { category: "All Prompts", folder, prompt: p, folderId, promptId: pid });

      if (folderId === null) {
        categories["Single Prompts"].push(title);
        promptSourceMap.set(key, { category: "Single Prompts", folder: null, prompt: p, folderId, promptId: pid });
      }

      if (folderId && folder) {
        if (!categories["Categorised Prompts"][folder]) categories["Categorised Prompts"][folder] = [];
        categories["Categorised Prompts"][folder].push(title);
        categories["Categorised Prompts"].all.push(`${folder}: ${title}`);
        promptSourceMap.set(key, { category: "Categorised Prompts", folder, prompt: p, folderId, promptId: pid });
      }

      if (p.isFavorite) {
        categories["Favorites"].push(title);
        promptSourceMap.set(key, { category: "Favorites", folder: folder || null, prompt: p, folderId, promptId: pid });
      }
    }

    recommended.sort((a, b) => b.usageCount - a.usageCount);
    categories["Recommended"] = recommended.map(r => r.title);

    allPrompts.sort((a, b) => b.lastUsed - a.lastUsed);
    categories["Last Used"] = [];
    allPrompts.slice(0, 10).forEach(({ title, prompt, folderId, promptId, folder }) => {
      const key = `${title}_${promptId}`;
      categories["Last Used"].push(title);
      promptSourceMap.set(key, { category: "Last Used", folder, prompt, folderId, promptId });
    });

    // Sort
    Object.keys(categories).forEach(k => {
      if (Array.isArray(categories[k]) && k !== "Last Used") categories[k] = [...new Set(categories[k])].sort();
      else if (k === "Categorised Prompts") {
        categories[k].all = [...new Set(categories[k].all)].sort();
        Object.keys(categories[k]).forEach(f => { if (f !== "all") categories[k][f] = [...new Set(categories[k][f])].sort(); });
      }
    });

    if (callback) callback();
  });
}

// =================================================================
// Focus management
// =================================================================
function getDefaultBg(el) {
  if (el.classList.contains("active") && (el.classList.contains("nav-item") || el.classList.contains("folder-item"))) return "#e3e3e3";
  if (el.classList.contains("prompt-item")) return "";
  return "";
}

function setFocus(el) {
  if (currentFocusElement) {
    currentFocusElement.classList.remove("focused");
    currentFocusElement.style.backgroundColor = getDefaultBg(currentFocusElement);
  }
  currentFocusElement = el;
  if (el) {
    el.classList.add("focused");
    el.style.backgroundColor = "#e6f0ff";
    el.scrollIntoView({ block: "nearest" });
  }
}

function clearFocus() {
  if (currentFocusElement) {
    currentFocusElement.classList.remove("focused");
    currentFocusElement.style.backgroundColor = getDefaultBg(currentFocusElement);
    currentFocusElement = null;
  }
}

// =================================================================
// Send prompt selection back to content script
// =================================================================
function selectPrompt(source) {
  const promptContent = source?.prompt
    ? (typeof source.prompt === "string" ? source.prompt : source.prompt.content || "")
    : "";

  chrome.runtime.sendMessage({
    type: "PROMPT_SELECTED",
    promptContent,
    promptId: source.promptId || null,
    category: source.category || "",
    workflowId: source.workflowId || null,
  });
}

// =================================================================
// Rendering
// =================================================================
function renderContentPanel(categoryOrFolder) {
  contentPanel.innerHTML = "";
  let items = [];
  if (categoryOrFolder === "Categorised Prompts") items = categories[categoryOrFolder]?.all || [];
  else if (categories["Categorised Prompts"]?.[categoryOrFolder]) items = categories["Categorised Prompts"][categoryOrFolder];
  else items = categories[categoryOrFolder] || [];

  if (items.length === 0) {
    contentPanel.innerHTML = `<div class="empty-message">${
      categoryOrFolder === "Favorites" ? "No favorite prompts" : "No prompts in this category"
    }</div>`;
    return;
  }

  if (categoryOrFolder === "Last Used") {
    items = items.map(t => {
      const key = Array.from(promptSourceMap.keys()).find(k => k.startsWith(t + "_"));
      return { itemText: t, source: promptSourceMap.get(key) };
    }).sort((a, b) => (b.source?.prompt?.lastUsed || 0) - (a.source?.prompt?.lastUsed || 0)).map(x => x.itemText);
  }

  const isWorkflow = categoryOrFolder === "Workflows";

  items.forEach(itemText => {
    const title = itemText.includes(": ") ? itemText.split(": ")[1] : itemText;
    const key = Array.from(promptSourceMap.keys()).find(k => k.startsWith((isWorkflow ? itemText : title) + "_"));
    const source = promptSourceMap.get(key);

    const el = document.createElement("div");
    el.className = "prompt-item";
    el.tabIndex = 0;

    let displayText = title;
    if (source?.category === "Favorites" && source.folder) displayText = `${title} (in ${source.folder})`;
    else if (source?.category === "Categorised Prompts" && source.folder) displayText = `${title} (${source.folder})`;

    if (categoryOrFolder === "Last Used" && source?.prompt?.lastUsed) {
      displayText += ` - ${new Date(source.prompt.lastUsed).toLocaleString()}`;
    }
    el.textContent = isWorkflow ? itemText : displayText;

    el.addEventListener("click", () => {
      if (source) selectPrompt(source);
    });

    contentPanel.appendChild(el);
  });
}

function renderCategoryNavigation() {
  navPanel.style.display = "block";
  navPanel.innerHTML = "";
  clearFocus();

  Object.keys(categories).forEach(cat => {
    const el = document.createElement("div");
    el.className = "nav-item";
    el.tabIndex = 0;
    const lock = (cat === "Recommended" && !isRecommendedUnlocked) ? " \uD83D\uDD12" : "";
    el.textContent = cat + lock;
    if (cat === "Recommended" && !isRecommendedUnlocked) el.style.cursor = "not-allowed";

    el.addEventListener("click", () => {
      if (cat === "Recommended" && !isRecommendedUnlocked) {
        extPay.openPaymentPage("basicmonthly");
        return;
      }
      navPanel.querySelectorAll(".nav-item, .folder-item").forEach(i => { i.classList.remove("active"); i.style.fontWeight = "normal"; i.style.backgroundColor = ""; });
      el.classList.add("active");
      el.style.fontWeight = "bold";
      el.style.backgroundColor = "#e3e3e3";
      selectedCategoryOrFolder = cat;
      renderContentPanel(cat);
    });

    navPanel.appendChild(el);

    if (cat === "Categorised Prompts") {
      const container = document.createElement("div");
      Object.keys(categories[cat]).sort().filter(k => k !== "all").forEach(folder => {
        const fi = document.createElement("div");
        fi.className = "folder-item";
        fi.tabIndex = 0;
        fi.textContent = folder;
        fi.addEventListener("click", () => {
          navPanel.querySelectorAll(".nav-item, .folder-item").forEach(i => { i.classList.remove("active"); i.style.fontWeight = "normal"; i.style.backgroundColor = ""; });
          fi.classList.add("active");
          fi.style.fontWeight = "bold";
          fi.style.backgroundColor = "#e3e3e3";
          selectedCategoryOrFolder = folder;
          renderContentPanel(folder);
        });
        container.appendChild(fi);
      });
      navPanel.appendChild(container);
    }
  });

  // Auto-select first available
  const first = navPanel.querySelector(".nav-item");
  if (first && (!first.textContent.includes("Recommended") || isRecommendedUnlocked)) first.click();
  else { const second = navPanel.querySelectorAll(".nav-item")[1]; if (second) second.click(); }
}

function renderSearchResults(query) {
  navPanel.style.display = "none";
  contentPanel.innerHTML = "";
  clearFocus();

  const q = query.trim().toLowerCase();
  const results = [];
  promptSourceMap.forEach((source, key) => {
    if (source.workflow) return;
    const title = key.split("_")[0];
    const content = typeof source.prompt === "string" ? source.prompt : source.prompt?.content || "";
    if (title.toLowerCase().includes(q) || content.toLowerCase().includes(q)) {
      results.push({ title, source, folder: source.folder || source.category || "Uncategorized" });
    }
  });

  if (results.length === 0) {
    renderCategoryNavigation();
    return;
  }

  const grouped = new Map();
  for (const r of results) {
    if (!grouped.has(r.folder)) grouped.set(r.folder, []);
    grouped.get(r.folder).push(r);
  }

  for (const [folder, items] of grouped) {
    const header = document.createElement("div");
    header.className = "group-title";
    header.textContent = folder;
    contentPanel.appendChild(header);

    items.forEach(({ title, source }) => {
      const el = document.createElement("div");
      el.className = "prompt-item";
      el.tabIndex = 0;
      el.textContent = title;
      el.addEventListener("click", () => { if (source) selectPrompt(source); });
      contentPanel.appendChild(el);
    });
  }

  const first = contentPanel.querySelector(".prompt-item");
  if (first) setFocus(first);
}

// =================================================================
// Keyboard navigation inside the side panel
// =================================================================
document.addEventListener("keydown", (e) => {
  const navItems = Array.from(navPanel.querySelectorAll(".nav-item, .folder-item"));
  const contentItems = Array.from(contentPanel.querySelectorAll(".prompt-item"));

  function navigateList(items, direction) {
    if (!currentFocusElement) { if (items.length) setFocus(items[0]); return; }
    const idx = items.indexOf(currentFocusElement);
    const next = idx + direction;
    if (next >= 0 && next < items.length) {
      const item = items[next];
      setFocus(item);
      if (item.classList.contains("nav-item") || item.classList.contains("folder-item")) {
        navPanel.querySelectorAll(".nav-item, .folder-item").forEach(i => { i.classList.remove("active"); i.style.fontWeight = "normal"; i.style.backgroundColor = ""; });
        item.classList.add("active");
        item.style.fontWeight = "bold";
        item.style.backgroundColor = "#e3e3e3";
        selectedCategoryOrFolder = item.textContent.replace(" \uD83D\uDD12", "");
        renderContentPanel(selectedCategoryOrFolder);
      }
    }
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    const isNav = currentFocusElement && (currentFocusElement.classList.contains("nav-item") || currentFocusElement.classList.contains("folder-item"));
    navigateList(isNav ? navItems : (contentItems.length ? contentItems : navItems), 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const isNav = currentFocusElement && (currentFocusElement.classList.contains("nav-item") || currentFocusElement.classList.contains("folder-item"));
    navigateList(isNav ? navItems : (contentItems.length ? contentItems : navItems), -1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    if (currentFocusElement && (currentFocusElement.classList.contains("nav-item") || currentFocusElement.classList.contains("folder-item"))) {
      const first = contentPanel.querySelector(".prompt-item");
      if (first) setFocus(first);
    }
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (currentFocusElement && currentFocusElement.classList.contains("prompt-item")) {
      const active = navPanel.querySelector(".nav-item.active, .folder-item.active") || navItems[0];
      if (active) setFocus(active);
    }
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (currentFocusElement && currentFocusElement.classList.contains("prompt-item")) {
      currentFocusElement.click();
    }
  }
});

// =================================================================
// Search input handler
// =================================================================
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  currentQuery = query;
  if (query) {
    renderSearchResults(query);
  } else {
    renderCategoryNavigation();
    if (selectedCategoryOrFolder) renderContentPanel(selectedCategoryOrFolder);
  }
});

// =================================================================
// Message handling from background/content script
// =================================================================
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SIDEPANEL_STATE") {
    currentDomain = message.domain || "";
    const query = message.query || "";
    currentQuery = query;
    searchInput.value = query;

    // Show the main UI
    panelsContainer.style.display = "flex";
    idleMessage.style.display = "none";

    loadData(() => {
      if (query) {
        renderSearchResults(query);
      } else {
        renderCategoryNavigation();
      }
    });
  }

  if (message.type === "SIDEPANEL_HIDE") {
    // Show idle state
    panelsContainer.style.display = "none";
    idleMessage.style.display = "flex";
    searchInput.value = "";
    clearFocus();
  }
});

// =================================================================
// Storage change listener (live updates)
// =================================================================
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    loadData(() => {
      if (currentQuery) renderSearchResults(currentQuery);
      else {
        renderCategoryNavigation();
        if (selectedCategoryOrFolder) renderContentPanel(selectedCategoryOrFolder);
      }
    });
  }
});

// =================================================================
// Initial load -- check payment status, then render
// =================================================================
function checkPayment(cb) {
  try {
    extPay.getUser().then(user => {
      isRecommendedUnlocked = user.paid || (user.trialPeriod && user.trialPeriod.daysLeft > 0);
      cb();
    }).catch(() => { isRecommendedUnlocked = false; cb(); });
  } catch { isRecommendedUnlocked = false; cb(); }
}

// On load: show idle message until content script triggers us
checkPayment(() => {
  loadData(() => {
    // Start with active UI showing all prompts (user may open panel manually)
    panelsContainer.style.display = "flex";
    idleMessage.style.display = "none";
    renderCategoryNavigation();
  });
});
