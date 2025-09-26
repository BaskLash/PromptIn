// === Benchmarking Dashboard Refactored ===
// This file contains 13 modular functions to manage the dashboard:
// - 1 function for the overall dashboard UI and layout
// - 12 functions for individual views, each handling data loading, rendering, and modal interactions

// === Helper Functions ===
function calculateVersionImpacts(prompt) {
  // Calculates the impact of each version change on prompt usage
  const results = [];
  const { versions, usageHistory } = prompt;

  for (let i = 1; i < versions.length; i++) {
    const prev = versions[i - 1];
    const curr = versions[i];

    const usageBefore = usageHistory
      .filter(
        (u) => u.timestamp >= prev.timestamp && u.timestamp < curr.timestamp
      )
      .reduce((sum, u) => sum + u.count, 0);

    const usageAfter = usageHistory
      .filter((u) => u.timestamp >= curr.timestamp)
      .reduce((sum, u) => sum + u.count, 0);

    let changePercent =
      usageBefore === 0
        ? usageAfter > 0
          ? 100
          : 0
        : Math.round(((usageAfter - usageBefore) / usageBefore) * 100);

    results.push({
      versionId: curr.versionId,
      timestamp: curr.timestamp,
      content: curr.content,
      changePercent,
      usageBefore,
      usageAfter,
    });
  }
  return results;
}

function calculateSimilarity(text1, text2) {
  // Calculates Levenshtein distance-based similarity between two texts
  const matrix = Array(text2.length + 1)
    .fill()
    .map(() => Array(text1.length + 1).fill(0));

  for (let i = 0; i <= text1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= text2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= text2.length; j++) {
    for (let i = 1; i <= text1.length; i++) {
      const indicator = text1[i - 1] === text2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const maxLen = Math.max(text1.length, text2.length);
  return maxLen === 0 ? 1 : 1 - matrix[text2.length][text1.length] / maxLen;
}

function calculateUsagePerDay(history) {
  // Aggregates usage history by day
  const safeHistory = Array.isArray(history) ? history : [];
  const usageByDay = {};

  safeHistory.forEach(({ timestamp, count }) => {
    const date = new Date(timestamp).toLocaleDateString("de-DE");
    usageByDay[date] = (usageByDay[date] || 0) + count;
  });

  return Object.entries(usageByDay).map(([date, count]) => ({ date, count }));
}

function calculateUsageChange(prompt, startDate, endDate) {
  // Calculates percentage change in usage between two periods
  const history = Array.isArray(prompt?.usageHistory)
    ? prompt.usageHistory
    : [];
  const usageInPeriod = history.filter((u) => {
    const ts = u.timestamp;
    return (!startDate || ts >= startDate) && (!endDate || ts < endDate);
  }).length;

  let usageBefore = 0;
  if (startDate && endDate) {
    const duration = endDate - startDate;
    const beforeStart = startDate - duration;
    const beforeEnd = startDate;
    usageBefore = history.filter(
      (u) => u.timestamp >= beforeStart && u.timestamp < beforeEnd
    ).length;
  }

  return usageBefore === 0
    ? usageInPeriod > 0
      ? 100
      : 0
    : Math.round(((usageInPeriod - usageBefore) / usageBefore) * 100);
}

function generateUUID() {
  // Generates a UUID for versioning
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// === Dashboard Layout Function ===
function renderDashboardLayout() {
  // Initializes the overall dashboard UI and layout
  const benchmarkingView = document.getElementById("benchmarking-view");
  if (benchmarkingView) benchmarkingView.style.display = "block";

  const container = document.getElementById("benchmarking-container");
  if (!container) return;

  container.innerHTML = `
    <style>
      .kpi-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      .kpi-card {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        text-align: center;
      }
      .kpi-card h3 {
        font-size: 16px;
        color: #555;
        margin-bottom: 10px;
      }
      .kpi-card p {
        font-size: 24px;
        font-weight: bold;
        color: #2c3e50;
      }
      .highlight-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      .highlight-card {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .highlight-card h3 {
        font-size: 18px;
        margin-bottom: 15px;
      }
      .highlight-card ul {
        list-style: none;
        padding: 0;
      }
      .highlight-card li {
        padding: 10px 0;
        border-bottom: 1px solid #eee;
        cursor: pointer;
      }
      .highlight-card li:last-child {
        border-bottom: none;
      }
      .highlight-card .gain { color: #27ae60; }
      .highlight-card .loss { color: #c0392b; }
      .prompt-selector {
        margin-bottom: 20px;
      }
      .prompt-selector select {
        width: 100%;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #fff;
      }
      .version-table {
        width: 100%;
        border-collapse: collapse;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .version-table th, .version-table td {
        padding: 15px;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
      .version-table th {
        background-color: #2c3e50;
        color: white;
      }
      .version-table .positive { color: #27ae60; }
      .version-table .negative { color: #c0392b; }
      .export-btn, .improve-btn, .delete-btn {
        display: inline-block;
        padding: 10px 20px;
        background-color: #2c3e50;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 20px;
        cursor: pointer;
      }
      .improve-btn { background-color: #27ae60; margin-left: 10px; }
      .delete-btn { background-color: #c0392b; margin-left: 10px; }
      .export-btn:hover { background-color: #34495e; }
      .improve-btn:hover { background-color: #2ecc71; }
      .delete-btn:hover { background-color: #e74c3c; }
      .modalDashboard {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
        z-index: 1000;
        overflow: auto;
      }
      .modal-contentDashboard {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 90vw;
        max-height: 90vh;
        width: 100%;
        box-sizing: border-box;
        overflow-y: auto;
      }
      .modal-contentDashboard h3 {
        margin-bottom: 15px;
      }
      .modal-contentDashboard p {
        margin-bottom: 20px;
      }
      .close-btn {
        float: right;
        cursor: pointer;
        font-size: 20px;
      }
      .chart-container {
        width: 100%;
        max-width: 100%;
        overflow: hidden;
      }
      #promptChart {
        width: 100%;
        height: 300px;
        display: block;
      }
      .news-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;
        width: 100%;
        box-sizing: border-box;
      }
      .news-card {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 12px;
        width: 250px;
        max-width: calc(100% - 24px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-size: 14px;
        transition: border 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
        box-sizing: border-box;
      }
      .news-card.active {
        border: 2px solid blue;
        transform: scale(1.02);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      .news-source { font-weight: bold; color: #555; }
      .news-date { font-size: 12px; color: #888; }
      .news-text { margin: 6px 0; }
      .news-change.up { color: green; font-weight: bold; }
      .news-change.down { color: red; font-weight: bold; }
      .line { fill: none; stroke: green; stroke-width: 2; }
      .marker { fill: darkgreen; cursor: pointer; transition: r 0.2s ease-in-out; }
      .marker:hover { r: 9; }
      .news-logo { cursor: pointer; transition: fill 0.2s ease-in-out; }
      .news-logo:hover path { fill: blue; }
      .marker-line { stroke: #999; stroke-dasharray: 4, 4; transition: stroke 0.2s ease-in-out, stroke-width 0.2s ease-in-out; }
      .highlight { stroke: blue !important; stroke-width: 2 !important; fill: blue !important; }
      @media (max-width: 768px) {
        .modal-contentDashboard { width: 95%; }
        .news-card { width: 100%; }
        .highlight-section { grid-template-columns: 1fr; }
      }
    </style>

    <section class="kpi-section">
      <div class="kpi-card">
        <h3>Total number of prompts</h3>
        <p id="totalPrompts">0</p>
      </div>
      <div class="kpi-card">
        <h3>Improved prompts</h3>
        <p id="improvedPrompts">0%</p>
      </div>
      <div class="kpi-card">
        <h3>Deteriorated prompts</h3>
        <p id="declinedPrompts">0%</p>
      </div>
      <div class="kpi-card">
        <h3>Average usage</h3>
        <p id="avgUsage">0</p>
      </div>
    </section>

    <section class="highlight-section">
      <div class="highlight-card" id="1">
        <h3>Top Gainers (Today)</h3>
        <ul id="topGainers"></ul>
      </div>
      <div class="highlight-card" id="2">
        <h3>Top Losers (Today)</h3>
        <ul id="topLosers"></ul>
      </div>
      <div class="highlight-card" id="3">
        <h3>Top Gainers (7 days after last change)</h3>
        <ul id="topGainers7Days"></ul>
      </div>
      <div class="highlight-card" id="4">
        <h3>Top Losers (7 days after last change)</h3>
        <ul id="topLosers7Days"></ul>
      </div>
      <div class="highlight-card" id="5">
        <h3>Workflows per Model</h3>
        <ul id="workflowsPerModel"></ul>
      </div>
      <div class="highlight-card" id="6">
        <h3>Prompts with lower usage (peak moment lost)</h3>
        <ul id="lowUsagePrompts"></ul>
      </div>
      <div class="highlight-card" id="7">
        <h3>Most similar prompts</h3>
        <ul id="similarPrompts"></ul>
      </div>
    </section>

    <section>
      <h3>Versioning Analysis</h3>
      <div class="prompt-selector">
        <select id="promptSelect">
          <option value="">Select a prompt...</option>
        </select>
      </div>
      <table class="version-table">
        <thead>
          <tr>
            <th>Version</th>
            <th>Date</th>
            <th>Change</th>
            <th>Usage Before</th>
            <th>Usage After</th>
            <th>% Change</th>
          </tr>
        </thead>
        <tbody id="versionTable"></tbody>
      </table>
    </section>

    <a href="#" class="export-btn" id="btnDownloadReport">Download Report (CSV)</a>

    <div id="benchmarkModal" class="modalDashboard">
      <div class="modal-contentDashboard">
        <span class="close-btn">&times;</span>
        <h3>Prompt Details</h3>
        <p id="modalPrompt"></p>
        <p id="modalModel"></p>
        <p id="modalDetails"></p>
        <p id="modalPerformance"></p>
        <p id="modalRecommendation"></p>
        <p id="modalDailyChange"></p>
        <div id="modalButtons">
          <button class="improve-btn" id="improveBtn" style="display: none;">Improve prompt</button>
          <button class="delete-btn" id="deleteBtn" style="display: none;">Delete prompt</button>
        </div>
        <h4>Statistics / Version History</h4>
        <div class="chart-container">
          <svg id="promptChart"></svg>
        </div>
        <div class="news-container" id="promptNews"></div>
      </div>
    </div>
  `;
}

// === View Functions ===
// Each function is self-contained, handling data loading, rendering, and modal interactions

function renderTotalPromptsView() {
  // Displays the total number of prompts
  chrome.storage.local.get("prompts", (result) => {
    const promptList = Object.values(result.prompts || {});
    document.getElementById("totalPrompts").textContent = promptList.length;
  });
}

function renderImprovedPromptsView() {
  // Displays the percentage of prompts with improved usage after last change
  chrome.storage.local.get("prompts", (result) => {
    const promptList = Object.values(result.prompts || {});
    let improved = 0;

    promptList.forEach((prompt) => {
      const lastVersion = prompt.versions[prompt.versions.length - 1];
      const lastChangeTimestamp = lastVersion.timestamp;
      const history = Array.isArray(prompt.usageHistory)
        ? prompt.usageHistory
        : [];

      const usageBefore = history
        .filter((u) => u.timestamp < lastChangeTimestamp)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      const usageAfter = history
        .filter((u) => u.timestamp >= lastChangeTimestamp)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      if (usageAfter > usageBefore) improved++;
    });

    document.getElementById("improvedPrompts").textContent = promptList.length
      ? `${Math.round((improved / promptList.length) * 100)}%`
      : "0%";
  });
}

function renderDeterioratedPromptsView() {
  // Displays the percentage of prompts with deteriorated usage after last change
  chrome.storage.local.get("prompts", (result) => {
    const promptList = Object.values(result.prompts || {});
    let declined = 0;

    promptList.forEach((prompt) => {
      const lastVersion = prompt.versions[prompt.versions.length - 1];
      const lastChangeTimestamp = lastVersion.timestamp;
      const history = Array.isArray(prompt.usageHistory)
        ? prompt.usageHistory
        : [];

      const usageBefore = history
        .filter((u) => u.timestamp < lastChangeTimestamp)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      const usageAfter = history
        .filter((u) => u.timestamp >= lastChangeTimestamp)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      if (usageAfter < usageBefore) declined++;
    });

    document.getElementById("declinedPrompts").textContent = promptList.length
      ? `${Math.round((declined / promptList.length) * 100)}%`
      : "0%";
  });
}

function renderAverageUsageView() {
  // Displays the average usage across all prompts
  chrome.storage.local.get("prompts", (result) => {
    const promptList = Object.values(result.prompts || {});
    const totalUsage = promptList.reduce(
      (sum, p) => sum + (p.usageCount || 0),
      0
    );
    document.getElementById("avgUsage").textContent = promptList.length
      ? Math.round(totalUsage / promptList.length)
      : 0;
  });
}

function renderTopGainersTodayView() {
  // Displays top 3 prompts with highest usage increase today
  chrome.storage.local.get("prompts", (result) => {
    const promptList = Object.values(result.prompts || {});
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const gainers = promptList
      .map((prompt) => ({
        prompt,
        change: calculateUsageChange(prompt, todayStart.getTime(), Date.now()),
      }))
      .filter((p) => p.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);

    document.getElementById("topGainers").innerHTML = gainers
      .map(
        (p) => `
        <li data-prompt="${p.prompt.title}" 
            data-prompt-id="${p.prompt.promptId}" 
            data-model="${p.prompt.compatibleModels.join(", ") || "Unknown"}" 
            data-details="Change detected">
          <span class="gain">${p.prompt.title}: +${p.change}% (${
          p.prompt.compatibleModels.join(", ") || "Unknown"
        })</span>
        </li>
      `
      )
      .join("");

    // Modal interaction
    document.querySelectorAll("#topGainers li").forEach((item) => {
      item.addEventListener("click", () => {
        const prompt = item.getAttribute("data-prompt");
        const promptId = item.getAttribute("data-prompt-id");
        const model = item.getAttribute("data-model");
        const details = item.getAttribute("data-details");

        document.getElementById(
          "modalPrompt"
        ).textContent = `Prompt: ${prompt}`;
        document.getElementById("modalModel").textContent = `Modell: ${model}`;
        document.getElementById(
          "modalDetails"
        ).textContent = `Details: ${details}`;
        document.getElementById("modalPerformance").textContent = "";
        document.getElementById("modalRecommendation").textContent = "";
        document.getElementById("modalDailyChange").textContent =
          calculateUsageChange(
            result.prompts[promptId],
            todayStart.getTime(),
            Date.now()
          ) < 0
            ? `Daily change: ${calculateUsageChange(
                result.prompts[promptId],
                todayStart.getTime(),
                Date.now()
              )}%`
            : "";
        document.getElementById("improveBtn").style.display = "none";
        document.getElementById("deleteBtn").style.display = "none";
        document.getElementById("benchmarkModal").style.display = "flex";

        showPromptStatistics(promptId, null, "1");
      });
    });
  });
}

function renderTopLosersTodayView() {
  // Displays top 3 prompts with highest usage decrease today
  chrome.storage.local.get("prompts", (result) => {
    const promptList = Object.values(result.prompts || {});
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const losers = promptList
      .map((prompt) => ({
        prompt,
        change: calculateUsageChange(prompt, todayStart.getTime(), Date.now()),
      }))
      .filter((p) => p.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 3);

    document.getElementById("topLosers").innerHTML = losers
      .map(
        (p) => `
        <li data-prompt="${p.prompt.title}" 
            data-prompt-id="${p.prompt.promptId}" 
            data-model="${p.prompt.compatibleModels.join(", ") || "Unknown"}" 
            data-details="Change detected">
          <span class="loss">${p.prompt.title}: ${p.change}% (${
          p.prompt.compatibleModels.join(", ") || "Unknown"
        })</span>
        </li>
      `
      )
      .join("");

    // Modal interaction
    document.querySelectorAll("#topLosers li").forEach((item) => {
      item.addEventListener("click", () => {
        const prompt = item.getAttribute("data-prompt");
        const promptId = item.getAttribute("data-prompt-id");
        const model = item.getAttribute("data-model");
        const details = item.getAttribute("data-details");

        document.getElementById(
          "modalPrompt"
        ).textContent = `Prompt: ${prompt}`;
        document.getElementById("modalModel").textContent = `Modell: ${model}`;
        document.getElementById(
          "modalDetails"
        ).textContent = `Details: ${details}`;
        document.getElementById("modalPerformance").textContent = "";
        document.getElementById("modalRecommendation").textContent = "";
        document.getElementById("modalDailyChange").textContent =
          calculateUsageChange(
            result.prompts[promptId],
            todayStart.getTime(),
            Date.now()
          ) < 0
            ? `Daily change: ${calculateUsageChange(
                result.prompts[promptId],
                todayStart.getTime(),
                Date.now()
              )}%`
            : "";
        document.getElementById("improveBtn").style.display = "none";
        document.getElementById("deleteBtn").style.display = "none";
        document.getElementById("benchmarkModal").style.display = "flex";

        showPromptStatistics(promptId, null, "2");
      });
    });
  });
}

function renderTopGainers7DaysView() {
  // Displays top 3 prompts with highest usage increase 7 days after last change
  chrome.storage.local.get("prompts", (result) => {
    const promptList = Object.values(result.prompts || {});
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();

    const gainers = promptList
      .filter(
        (prompt) =>
          prompt.versions[prompt.versions.length - 1].timestamp >=
          sevenDaysAgoTimestamp
      )
      .map((prompt) => ({
        prompt,
        change: calculateUsageChangeBoost7DaysAfterChange(
          prompt,
          prompt.versions[prompt.versions.length - 1].timestamp
        ),
      }))
      .filter((p) => p.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);

    document.getElementById("topGainers7Days").innerHTML = gainers
      .map(
        (p) => `
        <li data-prompt="${p.prompt.title}" 
            data-prompt-id="${p.prompt.promptId}" 
            data-model="${p.prompt.compatibleModels.join(", ") || "Unknown"}" 
            data-details="Change detected">
          <span class="gain">${p.prompt.title}: +${p.change}% (${
          p.prompt.compatibleModels.join(", ") || "Unknown"
        })</span>
        </li>
      `
      )
      .join("");

    // Modal interaction
    document.querySelectorAll("#topGainers7Days li").forEach((item) => {
      item.addEventListener("click", () => {
        const prompt = item.getAttribute("data-prompt");
        const promptId = item.getAttribute("data-prompt-id");
        const model = item.getAttribute("data-model");
        const details = item.getAttribute("data-details");

        document.getElementById(
          "modalPrompt"
        ).textContent = `Prompt: ${prompt}`;
        document.getElementById("modalModel").textContent = `Modell: ${model}`;
        document.getElementById(
          "modalDetails"
        ).textContent = `Details: ${details}`;
        document.getElementById("modalPerformance").textContent = "";
        document.getElementById("modalRecommendation").textContent = "";
        document.getElementById("modalDailyChange").textContent = "";
        document.getElementById("improveBtn").style.display = "none";
        document.getElementById("deleteBtn").style.display = "none";
        document.getElementById("benchmarkModal").style.display = "flex";

        showPromptStatistics(promptId, null, "3");
      });
    });
  });

  function calculateUsageChangeBoost7DaysAfterChange(prompt, changeTimestamp) {
    // Helper: Calculates usage change 7 days after last change
    const history = Array.isArray(prompt?.usageHistory)
      ? prompt.usageHistory
      : [];
    const usageBefore = history
      .filter((u) => u.timestamp < changeTimestamp)
      .reduce((sum, u) => sum + (u.count || 1), 0);
    const usageAfter = history
      .filter((u) => u.timestamp >= changeTimestamp)
      .reduce((sum, u) => sum + (u.count || 1), 0);

    return usageBefore === 0
      ? usageAfter > 0
        ? 100
        : 0
      : Math.round(((usageAfter - usageBefore) / usageBefore) * 100);
  }
}

function renderTopLosers7DaysView() {
  // Displays top 3 prompts with highest usage decrease 7 days after last change
  chrome.storage.local.get("prompts", (result) => {
    const promptList = Object.values(result.prompts || {});
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();

    const losers = promptList
      .filter(
        (prompt) =>
          prompt.versions[prompt.versions.length - 1].timestamp >=
          sevenDaysAgoTimestamp
      )
      .map((prompt) => ({
        prompt,
        change: calculateUsageChangeDecline7DaysAfterChange(
          prompt,
          prompt.versions[prompt.versions.length - 1].timestamp
        ),
      }))
      .filter((p) => p.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 3);

    document.getElementById("topLosers7Days").innerHTML = losers
      .map(
        (p) => `
        <li data-prompt="${p.prompt.title}" 
            data-prompt-id="${p.prompt.promptId}" 
            data-model="${p.prompt.compatibleModels.join(", ") || "Unknown"}" 
            data-details="Change detected">
          <span class="loss">${p.prompt.title}: ${p.change}% (${
          p.prompt.compatibleModels.join(", ") || "Unknown"
        })</span>
        </li>
      `
      )
      .join("");

    // Modal interaction
    document.querySelectorAll("#topLosers7Days li").forEach((item) => {
      item.addEventListener("click", () => {
        const prompt = item.getAttribute("data-prompt");
        const promptId = item.getAttribute("data-prompt-id");
        const model = item.getAttribute("data-model");
        const details = item.getAttribute("data-details");

        document.getElementById(
          "modalPrompt"
        ).textContent = `Prompt: ${prompt}`;
        document.getElementById("modalModel").textContent = `Modell: ${model}`;
        document.getElementById(
          "modalDetails"
        ).textContent = `Details: ${details}`;
        document.getElementById("modalPerformance").textContent = "";
        document.getElementById("modalRecommendation").textContent = "";
        document.getElementById("modalDailyChange").textContent =
          calculateUsageChange(
            result.prompts[promptId],
            new Date().setHours(0, 0, 0, 0),
            Date.now()
          ) < 0
            ? `Daily change: ${calculateUsageChange(
                result.prompts[promptId],
                new Date().setHours(0, 0, 0, 0),
                Date.now()
              )}%`
            : "";
        document.getElementById("improveBtn").style.display = "none";
        document.getElementById("deleteBtn").style.display = "none";
        document.getElementById("benchmarkModal").style.display = "flex";

        showPromptStatistics(promptId, null, "4");
      });
    });
  });

  function calculateUsageChangeDecline7DaysAfterChange(
    prompt,
    changeTimestamp
  ) {
    // Helper: Calculates usage decline 7 days after last change
    const history = Array.isArray(prompt?.usageHistory)
      ? prompt.usageHistory
      : [];
    const usageBefore = history
      .filter((u) => u.timestamp < changeTimestamp)
      .reduce((sum, u) => sum + (u.count || 1), 0);
    const usageAfter = history
      .filter((u) => u.timestamp >= changeTimestamp)
      .reduce((sum, u) => sum + (u.count || 1), 0);

    return usageBefore === 0
      ? 0
      : Math.round(((usageAfter - usageBefore) / usageBefore) * 100);
  }
}

function renderWorkflowsPerModelView() {
  // Displays workflows grouped by model
  chrome.storage.local.get(null, (result) => {
    const workflows = Object.fromEntries(
      Object.entries(result).filter(([key]) => key.startsWith("workflow_"))
    );

    const workflowsByModel = {};
    Object.values(workflows).forEach((workflow) => {
      workflow.steps.forEach((step) => {
        const model = step.aiModel || "Unknown";
        workflowsByModel[model] = workflowsByModel[model] || {};
        workflowsByModel[model][workflow.name] =
          (workflowsByModel[model][workflow.name] || 0) + 1;
      });
    });

    document.getElementById("workflowsPerModel").innerHTML = Object.entries(
      workflowsByModel
    )
      .map(([model, workflows]) => {
        const mostPopular = Object.entries(workflows).sort(
          (a, b) => b[1] - a[1]
        )[0];
        return `<li>${model}: ${
          mostPopular ? mostPopular[0] : "No Workflows"
        } (${mostPopular ? mostPopular[1] : 0} Use)</li>`;
      })
      .join("");
  });
}

function renderLowUsagePromptsView() {
  // Displays prompts with lower usage compared to their peak
  chrome.storage.local.get("prompts", (result) => {
    const promptList = Object.values(result.prompts || {});
    const lowUsage = promptList
      .map((prompt) => {
        const safeHistory = Array.isArray(prompt?.usageHistory)
          ? prompt.usageHistory
          : [];
        const peakUsage = Math.max(
          ...calculateUsagePerDay(safeHistory).map((u) => u.count),
          prompt.usageCount || 0
        );
        const currentUsage = safeHistory
          .filter(
            (u) =>
              u.timestamp >=
              prompt.versions[prompt.versions.length - 1].timestamp
          )
          .reduce((sum, u) => sum + u.count, 0);
        const changePercent =
          peakUsage === 0
            ? 0
            : Math.round(((currentUsage - peakUsage) / peakUsage) * 100);
        return { prompt, changePercent, peakUsage, currentUsage };
      })
      .filter((p) => p.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 3);

    document.getElementById("lowUsagePrompts").innerHTML = lowUsage
      .map(
        (p) => `
        <li data-prompt="${p.prompt.title}" 
            data-prompt-id="${p.prompt.promptId}" 
            data-model="${p.prompt.compatibleModels.join(", ") || "Unknown"}" 
            data-details="Usage declined">
          ${p.prompt.title}: ${p.changePercent}% (Peak: ${
          p.peakUsage
        }, Current: ${p.currentUsage}) (${
          p.prompt.compatibleModels.join(", ") || "Unknown"
        })
        </li>
      `
      )
      .join("");

    // Modal interaction with improve button
    document.querySelectorAll("#lowUsagePrompts li").forEach((item) => {
      item.addEventListener("click", () => {
        const prompt = item.getAttribute("data-prompt");
        const promptId = item.getAttribute("data-prompt-id");
        const model = item.getAttribute("data-model");
        const details = item.getAttribute("data-details");

        document.getElementById(
          "modalPrompt"
        ).textContent = `Prompt: ${prompt}`;
        document.getElementById("modalModel").textContent = `Modell: ${model}`;
        document.getElementById(
          "modalDetails"
        ).textContent = `Details: ${details}`;
        document.getElementById("modalPerformance").textContent = "";
        document.getElementById("modalRecommendation").textContent = "";
        document.getElementById("modalDailyChange").textContent = "";
        document.getElementById("improveBtn").style.display = "inline-block";
        document.getElementById("deleteBtn").style.display = "none";
        document.getElementById("benchmarkModal").style.display = "flex";

        // Improve button logic
        document.getElementById("improveBtn").onclick = () => {
          const promptData = result.prompts[promptId];
          if (
            !promptData ||
            !promptData.versions ||
            promptData.versions.length < 2
          ) {
            alert("Keine vorherige Version verfügbar, um zurückzusetzen.");
            return;
          }

          const impacts = calculateVersionImpacts(promptData);
          let bestVersion = promptData.versions[0];
          let maxUsageAfter = 0;
          impacts.forEach((impact, index) => {
            if (impact.usageAfter > maxUsageAfter) {
              maxUsageAfter = impact.usageAfter;
              bestVersion = promptData.versions[index + 1];
            }
          });

          if (
            bestVersion.versionId ===
            promptData.versions[promptData.versions.length - 1].versionId
          ) {
            alert("Die aktuelle Version ist bereits die leistungsstärkste.");
            return;
          }

          const newVersion = {
            versionId: `${Date.now()}_${generateUUID()}`,
            title: bestVersion.title,
            description: bestVersion.description,
            content: bestVersion.content,
            timestamp: Date.now(),
          };

          const updatedPrompt = {
            ...promptData,
            title: bestVersion.title,
            description: bestVersion.description,
            content: bestVersion.content,
            updatedAt: Date.now(),
            versions: [...promptData.versions, newVersion],
            metaChangeLog: [
              ...promptData.metaChangeLog,
              {
                timestamp: Date.now(),
                changes: {
                  title: { from: promptData.title, to: bestVersion.title },
                  description: {
                    from: promptData.description,
                    to: bestVersion.description,
                  },
                  content: {
                    from: promptData.content,
                    to: bestVersion.content,
                  },
                },
                note: `Rollback zur Version mit höchster Performance (VersionId: ${bestVersion.versionId})`,
              },
            ],
          };

          result.prompts[promptId] = updatedPrompt;
          chrome.storage.local.set({ prompts: result.prompts }, () => {
            renderLowUsagePromptsView();
            showPromptStatistics(promptId, null, "6");
            alert(
              `Prompt "${prompt}" wurde auf die leistungsstärkste Version zurückgesetzt.`
            );
          });
        };

        showPromptStatistics(promptId, null, "6");
      });
    });
  });
}

function renderSimilarPromptsView() {
  // Displays the most similar prompts based on content similarity
  chrome.storage.local.get("prompts", (result) => {
    const promptList = Object.values(result.prompts || {});
    const similar = [];

    for (let i = 0; i < promptList.length; i++) {
      for (let j = i + 1; j < promptList.length; j++) {
        const p1 = promptList[i];
        const p2 = promptList[j];
        const similarity = calculateSimilarity(p1.content, p2.content);
        if (similarity > 0.75) {
          similar.push({
            prompt1: p1,
            prompt2: p2,
            similarity,
            performance1: calculateUsageChange(p1),
            performance2: calculateUsageChange(p2),
          });
        }
      }
    }
    similar.sort((a, b) => b.similarity - a.similarity);

    document.getElementById("similarPrompts").innerHTML = similar
      .slice(0, 3)
      .map((s) => {
        const models1 = Array.isArray(s.prompt1?.compatibleModels)
          ? s.prompt1.compatibleModels.join(", ")
          : "Unknown";
        const models2 = Array.isArray(s.prompt2?.compatibleModels)
          ? s.prompt2.compatibleModels.join(", ")
          : "Unknown";
        const totalUsage1 = (s.prompt1.usageHistory || []).reduce(
          (sum, u) => sum + (u.count || 1),
          0
        );
        const totalUsage2 = (s.prompt2.usageHistory || []).reduce(
          (sum, u) => sum + (u.count || 1),
          0
        );

        return `
          <li data-prompt1="${s.prompt1.title}" 
              data-prompt-id1="${s.prompt1.promptId}"
              data-prompt2="${s.prompt2.title}" 
              data-prompt-id2="${s.prompt2.promptId}"
              data-model="${models1}" 
              data-similarity="${Math.round(s.similarity * 100)}%" 
              data-performance1="${s.performance1 > 0 ? "+" : ""}${
          s.performance1
        }%" 
              data-performance2="${s.performance2 > 0 ? "+" : ""}${
          s.performance2
        }%" 
              data-total-usage1="${totalUsage1}"
              data-total-usage2="${totalUsage2}"
              data-recommendation="Recommendation: ${
                s.performance1 > s.performance2
                  ? s.prompt2.title
                  : s.prompt1.title
              } löschen">
            ${s.prompt1.title} & ${s.prompt2.title}: ${Math.round(
          s.similarity * 100
        )}% Similarity (${models1} / ${models2}) | Use: ${totalUsage1} vs. ${totalUsage2}
          </li>
        `;
      })
      .join("");

    // Modal interaction with delete button
    document.querySelectorAll("#similarPrompts li").forEach((item) => {
      item.addEventListener("click", () => {
        const prompt1 = item.getAttribute("data-prompt1");
        const promptId1 = item.getAttribute("data-prompt-id1");
        const prompt2 = item.getAttribute("data-prompt2");
        const promptId2 = item.getAttribute("data-prompt-id2");
        const model = item.getAttribute("data-model");
        const similarity = item.getAttribute("data-similarity");
        const performance1 = item.getAttribute("data-performance1");
        const performance2 = item.getAttribute("data-performance2");
        const recommendation = item.getAttribute("data-recommendation");

        document.getElementById(
          "modalPrompt"
        ).textContent = `Prompts: ${prompt1} & ${prompt2}`;
        document.getElementById("modalModel").textContent = `Modell: ${model}`;
        document.getElementById("modalDetails").textContent = "";
        document.getElementById(
          "modalPerformance"
        ).textContent = `Performance: ${prompt1}: ${performance1}, ${prompt2}: ${performance2}, Ähnlichkeit: ${similarity}`;
        document.getElementById("modalRecommendation").textContent =
          recommendation;
        document.getElementById("modalDailyChange").textContent = "";
        document.getElementById("improveBtn").style.display = "none";
        document.getElementById("deleteBtn").style.display = "inline-block";
        document.getElementById("benchmarkModal").style.display = "flex";

        // Delete button logic
        document.getElementById("deleteBtn").onclick = () => {
          const promptToDelete = recommendation.includes(prompt1)
            ? prompt1
            : prompt2;
          alert(`Prompt "${promptToDelete}" wird gelöscht...`);
          // Note: Actual deletion logic would depend on storage implementation
        };

        showPromptStatistics(promptId1, promptId2, "7");
      });
    });
  });
}

function renderVersioningAnalysisView() {
  // Displays versioning analysis with prompt selection and CSV download
  chrome.storage.local.get("prompts", (result) => {
    const promptSelect = document.getElementById("promptSelect");
    const prompts = result.prompts || {};

    // Populate dropdown
    Object.values(prompts).forEach((prompt) => {
      const option = document.createElement("option");
      option.value = prompt.promptId;
      option.textContent = prompt.title || `Prompt ${prompt.promptId}`;
      promptSelect.appendChild(option);
    });

    // Update version table on selection
    promptSelect.addEventListener("change", () => {
      const promptId = promptSelect.value;
      if (!promptId) {
        document.getElementById("versionTable").innerHTML = "";
        return;
      }

      const prompt = prompts[promptId];
      if (!prompt) return;

      const impacts = calculateVersionImpacts(prompt);
      document.getElementById("versionTable").innerHTML = impacts
        .map(
          (v) => `
          <tr>
            <td>${v.versionId}</td>
            <td>${new Date(v.timestamp).toLocaleString("de-DE")}</td>
            <td>${v.content}</td>
            <td>${v.usageBefore}</td>
            <td>${v.usageAfter}</td>
            <td class="${v.changePercent >= 0 ? "positive" : "negative"}">${
            v.changePercent > 0 ? "+" : ""
          }${v.changePercent}%</td>
          </tr>
        `
        )
        .join("");
    });

    // Download report
    document
      .getElementById("btnDownloadReport")
      .addEventListener("click", () => {
        const promptId = promptSelect.value;
        if (!promptId) {
          alert("Bitte wählen Sie einen Prompt aus.");
          return;
        }
        const prompt = prompts[promptId];
        if (!prompt) {
          alert("Fehler: Prompt nicht gefunden.");
          return;
        }

        const usageData = calculateUsagePerDay(prompt.usageHistory);
        const versionImpacts = calculateVersionImpacts(prompt);
        const data = [
          [
            "Version",
            "Date",
            "Change",
            "Use before",
            "Use afterwards",
            "% Change",
          ],
          ...versionImpacts.map((v) => [
            v.versionId,
            new Date(v.timestamp).toLocaleString("de-DE"),
            v.content,
            v.usageBefore,
            v.usageAfter,
            `${v.changePercent > 0 ? "+" : ""}${v.changePercent}%`,
          ]),
        ];
        const csv = data.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `prompt_${prompt.promptId}_report.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  });
}

// === Chart and Statistics Function ===
function showPromptStatistics(promptId, promptId2 = null, cardId = null) {
  // Displays prompt statistics with SVG chart and news events
  const svg = document.getElementById("promptChart");
  const newsContainer = document.getElementById("promptNews");
  svg.innerHTML = "";
  newsContainer.innerHTML = "";

  chrome.storage.local.get("prompts", (result) => {
    const prompts = result.prompts || {};
    const prompt = prompts[promptId];
    if (!prompt) {
      newsContainer.innerHTML = "<p>No prompt found.</p>";
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    if (cardId === "7" && promptId2) {
      // Comparison of two prompts
      const prompt2 = prompts[promptId2];
      if (!prompt2) {
        newsContainer.innerHTML = "<p>Second prompt not found.</p>";
        return;
      }

      const usageMap1 = {};
      (prompt.usageHistory || []).forEach((entry) => {
        if (!entry.timestamp) return;
        const d = new Date(entry.timestamp);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        usageMap1[key] = (usageMap1[key] || 0) + 1;
      });

      const usageMap2 = {};
      (prompt2.usageHistory || []).forEach((entry) => {
        if (!entry.timestamp) return;
        const d = new Date(entry.timestamp);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        usageMap2[key] = (usageMap2[key] || 0) + 1;
      });

      const usageData1 = [];
      const usageData2 = [];
      const dates = [];
      for (
        let d = new Date(thirtyDaysAgo);
        d <= today;
        d.setDate(d.getDate() + 1)
      ) {
        const key = d.toISOString().slice(0, 10);
        dates.push(key);
        usageData1.push({ date: key, count: usageMap1[key] || 0 });
        usageData2.push({ date: key, count: usageMap2[key] || 0 });
      }

      const data1 = usageData1.map((e) => e.count);
      const data2 = usageData2.map((e) => e.count);

      if (!data1.some((val) => val > 0) && !data2.some((val) => val > 0)) {
        newsContainer.innerHTML =
          "<p>Keine Nutzungsdaten für die letzten 30 Tage verfügbar.</p>";
        return;
      }

      renderChart(
        data1,
        data2,
        dates,
        prompt.versions,
        prompt2.versions,
        cardId
      );
    } else {
      // Single prompt statistics
      const versions = (prompt.versions || []).filter(
        (v) => typeof v.timestamp === "number" && !isNaN(v.timestamp)
      );
      if (!versions.length) {
        newsContainer.innerHTML = "<p>Keine Versionen verfügbar.</p>";
        return;
      }

      const usageMap = {};
      (prompt.usageHistory || []).forEach((entry) => {
        if (!entry.timestamp) return;
        const d = new Date(entry.timestamp);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        usageMap[key] = (usageMap[key] || 0) + 1;
      });

      const usageData = [];
      for (
        let d = new Date(thirtyDaysAgo);
        d <= today;
        d.setDate(d.getDate() + 1)
      ) {
        const key = d.toISOString().slice(0, 10);
        usageData.push({ date: key, count: usageMap[key] || 0 });
      }

      const data = usageData.map((e) => e.count);
      const dates = usageData.map((e) => e.date);

      if (!data.some((val) => val > 0)) {
        newsContainer.innerHTML =
          "<p>Keine Nutzungsdaten für die letzten 30 Tage verfügbar.</p>";
        return;
      }

      let adjustedData = data;
      let adjustedVersions = versions;
      let adjustedDates = dates;
      if (data.length === 1) {
        adjustedData = [0, data[0]];
        adjustedDates = [
          new Date(new Date(dates[0]).getTime() - 86400000)
            .toISOString()
            .slice(0, 10),
          dates[0],
        ];
        adjustedVersions = [
          { ...versions[0], timestamp: versions[0].timestamp - 86400000 },
          versions[0],
        ];
      }

      renderChart(
        adjustedData,
        null,
        adjustedDates,
        adjustedVersions,
        null,
        cardId
      );
    }

    function renderChart(data1, data2, dates, versions1, versions2, cardId) {
      const width = 600;
      const height = 300;
      const padding = 40;
      const maxVal = Math.max(...data1, ...(data2 || []), 1);
      const minVal = 0;

      const xScale = (i) =>
        data1.length <= 1
          ? width / 2
          : padding + i * ((width - 2 * padding) / (data1.length - 1));
      const yScale = (val) =>
        height -
        padding -
        ((val - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);

      // Y-Axis
      const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "g");
      yAxis.setAttribute("class", "y-axis");
      const yTicks = Math.min(maxVal, 10);
      for (let i = 0; i <= yTicks; i++) {
        const val = (i / yTicks) * maxVal;
        const y = yScale(val);
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        text.setAttribute("x", padding - 10);
        text.setAttribute("y", y + 5);
        text.setAttribute("text-anchor", "end");
        text.setAttribute("fill", "#333");
        text.textContent = Math.round(val);
        yAxis.appendChild(text);

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", padding);
        line.setAttribute("y1", y);
        line.setAttribute("x2", width - padding);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "#ccc");
        line.setAttribute("stroke-width", 1);
        yAxis.appendChild(line);
      }
      const yLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      yLabel.setAttribute("x", padding - 30);
      yLabel.setAttribute("y", height / 2);
      yLabel.setAttribute("text-anchor", "middle");
      yLabel.setAttribute(
        "transform",
        `rotate(-90, ${padding - 30}, ${height / 2})`
      );
      yLabel.setAttribute("fill", "#333");
      yLabel.setAttribute("font-size", "14");
      yLabel.textContent = "Usage Count";
      yAxis.appendChild(yLabel);
      svg.appendChild(yAxis);

      // X-Axis
      const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "g");
      xAxis.setAttribute("class", "x-axis");
      const tickInterval = Math.ceil(data1.length / 6);
      for (let i = 0; i < data1.length; i += tickInterval) {
        const x = xScale(i);
        const date = new Date(dates[i]);
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        text.setAttribute("x", x);
        text.setAttribute("y", height - padding + 20);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#333");
        text.textContent = date.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
        });
        xAxis.appendChild(text);

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", x);
        line.setAttribute("y1", height - padding);
        line.setAttribute("x2", x);
        line.setAttribute("y2", padding);
        line.setAttribute("stroke", "#ccc");
        line.setAttribute("stroke-width", 1);
        xAxis.appendChild(line);
      }
      const xLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      xLabel.setAttribute("x", width / 2);
      xLabel.setAttribute("y", height - 5);
      xLabel.setAttribute("text-anchor", "middle");
      xLabel.setAttribute("fill", "#333");
      xLabel.setAttribute("font-size", "14");
      xLabel.textContent = "Date";
      xAxis.appendChild(xLabel);
      svg.appendChild(xAxis);

      // Plot lines
      if (data1) {
        let pathData1 = "";
        data1.forEach((val, i) => {
          const x = xScale(i);
          const y = yScale(val);
          if (!isNaN(x) && !isNaN(y))
            pathData1 += (i === 0 ? "M" : "L") + x + "," + y;
        });
        if (pathData1) {
          const path1 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          path1.setAttribute("d", pathData1);
          path1.setAttribute(
            "stroke",
            data2
              ? "#1e90ff"
              : cardId === "3"
              ? "#27ae60"
              : cardId === "4"
              ? "#c0392b"
              : "#ff4500"
          );
          path1.setAttribute("stroke-width", 2);
          path1.setAttribute("fill", "none");
          svg.appendChild(path1);
        }
      }

      if (data2) {
        let pathData2 = "";
        data2.forEach((val, i) => {
          const x = xScale(i);
          const y = yScale(val);
          if (!isNaN(x) && !isNaN(y))
            pathData2 += (i === 0 ? "M" : "L") + x + "," + y;
        });
        if (pathData2) {
          const path2 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          path2.setAttribute("d", pathData2);
          path2.setAttribute("stroke", "#ff4500");
          path2.setAttribute("stroke-width", 2);
          path2.setAttribute("fill", "none");
          svg.appendChild(path2);
        }
      }

      // Events
      const events = data2
        ? [
            ...(versions1 || []).map((v, idx) => ({
              timestamp: v.timestamp,
              source: `Prompt 1 Version ${idx + 1}`,
              title: v.title || "Keine Beschreibung verfügbar",
            })),
            ...(versions2 || []).map((v, idx) => ({
              timestamp: v.timestamp,
              source: `Prompt 2 Version ${idx + 1}`,
              title: v.title || "Keine Beschreibung verfügbar",
            })),
          ].sort((a, b) => a.timestamp - b.timestamp)
        : versions1
            .map((v, idx) => ({
              timestamp: v.timestamp,
              source: `Version ${
                idx + 1 - (data1.length - (prompt.usageHistory || []).length)
              }`,
              title: v.title || "Keine Beschreibung verfügbar",
            }))
            .sort((a, b) => a.timestamp - b.timestamp);

      // Highlight function
      function highlight(idx, state) {
        document.querySelectorAll(".news-card").forEach((card) => {
          card.classList.toggle(
            "active",
            state && card.getAttribute("data-index") === String(idx)
          );
        });
        document.querySelectorAll(".marker-line").forEach((l) => {
          if (l.getAttribute("data-index") === String(idx))
            l.classList.toggle("highlight", state);
        });
        document.querySelectorAll(".marker").forEach((m) => {
          if (m.getAttribute("data-index") === String(idx))
            m.classList.toggle("highlight", state);
        });
        document.querySelectorAll(".news-logo").forEach((n) => {
          if (n.getAttribute("data-index") === String(idx))
            n.classList.toggle("highlight", state);
        });
      }

      // Event markers
      events.forEach((ev, idx) => {
        const eventDate = new Date(ev.timestamp);
        eventDate.setHours(0, 0, 0, 0);
        const dateStr = eventDate.toISOString().slice(0, 10);
        const dataIndex = dates.indexOf(dateStr);
        if (dataIndex === -1) return;
        const x = xScale(dataIndex);
        const y = yScale(
          data2 && ev.source.includes("Prompt 1")
            ? data1[dataIndex]
            : data2
            ? data2[dataIndex]
            : data1[dataIndex]
        );

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", x);
        line.setAttribute("y1", height - padding);
        line.setAttribute("x2", x);
        line.setAttribute("y2", padding);
        line.setAttribute(
          "stroke",
          data2 && ev.source.includes("Prompt 1")
            ? "#1e90ff"
            : cardId === "3"
            ? "#27ae60"
            : cardId === "4"
            ? "#c0392b"
            : "#ff4500"
        );
        line.setAttribute("stroke-width", 2);
        line.setAttribute("stroke-dasharray", "5,5");
        line.setAttribute("class", "marker-line");
        line.setAttribute("data-index", idx);
        svg.appendChild(line);

        const hitLine = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        hitLine.setAttribute("x1", x);
        hitLine.setAttribute("y1", height - padding);
        hitLine.setAttribute("x2", x);
        hitLine.setAttribute("y2", padding);
        hitLine.setAttribute("stroke", "transparent");
        hitLine.setAttribute("stroke-width", 12);
        hitLine.setAttribute("data-index", idx);
        svg.appendChild(hitLine);

        const circle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 6);
        circle.setAttribute(
          "fill",
          data2 && ev.source.includes("Prompt 1")
            ? "#1e90ff"
            : cardId === "3"
            ? "#27ae60"
            : cardId === "4"
            ? "#c0392b"
            : "#ff4500"
        );
        circle.setAttribute("class", "marker");
        circle.setAttribute("data-index", idx);
        svg.appendChild(circle);

        const logo = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        logo.setAttribute("x", x - 12);
        logo.setAttribute("y", height - padding - 12);
        logo.setAttribute("width", 24);
        logo.setAttribute("height", 24);
        logo.setAttribute("class", "news-logo");
        logo.setAttribute("data-index", idx);
        logo.innerHTML = `<path d="M4 4h16v2H4V4zm0 4h16v12H4V8zm2 2h2v8H6v-8zm4 0h8v2h-8v-2zm0 4h8v2h-8v-2zm0 4h4v2h-4v-2z" fill="#555"/>`;
        svg.appendChild(logo);

        const card = document.createElement("div");
        card.className = "news-card";
        card.setAttribute("data-index", idx);
        card.innerHTML = `
          <div class="news-source">${
            ev.source
          } · <span class="news-date">${eventDate.toLocaleDateString(
          "de-DE"
        )}</span></div>
          <div class="news-text">${ev.title}</div>
        `;
        newsContainer.appendChild(card);

        [circle, logo, hitLine].forEach((element) => {
          element.addEventListener("mouseover", () => highlight(idx, true));
          element.addEventListener("mouseout", () => highlight(idx, false));
        });

        card.addEventListener("mouseover", () => highlight(idx, true));
        card.addEventListener("mouseout", () => highlight(idx, false));
      });
    }
  });
}

// === Initialization Function ===
function initializeBenchmarking() {
  console.log("Benchmarking Dashboard Initialized");

  // Render dashboard layout
  renderDashboardLayout();

  // Render all views
  renderTotalPromptsView();
  renderImprovedPromptsView();
  renderDeterioratedPromptsView();
  renderAverageUsageView();
  renderTopGainersTodayView();
  renderTopLosersTodayView();
  renderTopGainers7DaysView();
  renderTopLosers7DaysView();
  renderWorkflowsPerModelView();
  renderLowUsagePromptsView();
  renderSimilarPromptsView();
  renderVersioningAnalysisView();

  // Setup modal close button
  document.querySelector(".close-btn").addEventListener("click", () => {
    document.getElementById("benchmarkModal").style.display = "none";
  });
}
// TODO: Wenn z.B. erkannt wird, das eine Prompt für ein bestimmtes Kompatibles model sehr häufig verwendet wird, dann soll es unter den compatible Models diesen Eintrag auch automatisch finden
