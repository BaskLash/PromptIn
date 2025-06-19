// statistics.js
function initializeAnalytics() {
  console.log("Analytics wird initialisiert");
  chrome.storage.local.get(null, (data) => {
    const prompts = Object.entries(data)
      .filter(([key, topic]) => topic.prompts && !topic.isTrash)
      .flatMap(([key, topic]) =>
        topic.prompts.map((prompt) => ({
          ...prompt,
          folderId: key,
          folderName: topic.name || "Single Prompt",
        }))
      );
    console.log("Geladene Prompts:", prompts);
    renderAnalytics(prompts);
  });
}

function renderAnalytics(prompts) {
  const analyticsView = document.getElementById("analytics-view");
  // Clear existing content in analytics-view
  const container = document.createElement("div");
  container.className = "analytics-container";
  container.style.padding = "20px";

  // Nutzungshäufigkeit nach Zeitraum
  const usageByTime = calculateUsageByTime(prompts);
  const usageSection = createUsageSection(usageByTime);
  container.appendChild(usageSection);

  // Nutzung nach Modell
  const usageByModel = calculateUsageByModel(prompts);
  const modelSection = createModelSection(usageByModel);
  container.appendChild(modelSection);

  // Änderungshistorie
  const changeHistory = calculateChangeHistory(prompts);
  const historySection = createHistorySection(changeHistory);
  container.appendChild(historySection);

  // Tag-Verwendung
  const tagUsage = calculateTagUsage(prompts);
  const tagSection = createTagSection(tagUsage);
  container.appendChild(tagSection);

  // Clear existing content and append new container
  analyticsView.innerHTML = ""; // Clear previous content
  analyticsView.appendChild(container);
  console.log("Berechnete Daten für Nutzung:", calculateUsageByTime(prompts));
  console.log("Berechnete Daten für Modelle:", calculateUsageByModel(prompts));
  console.log("Berechnete Daten für Tags:", calculateTagUsage(prompts));
}

function calculateUsageByTime(prompts) {
  const daily = {},
    monthly = {},
    yearly = {};
  prompts.forEach((prompt) => {
    if (!prompt.lastUsed) return;
    const date = new Date(prompt.lastUsed);
    const dayKey = date.toISOString().split("T")[0];
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const yearKey = date.getFullYear().toString();

    daily[dayKey] = (daily[dayKey] || 0) + 1;
    monthly[monthKey] = (monthly[monthKey] || 0) + 1;
    yearly[yearKey] = (yearly[yearKey] || 0) + 1;
  });

  return { daily, monthly, yearly };
}

function calculateUsageByModel(prompts) {
  const modelUsage = {};
  prompts.forEach((prompt) => {
    if (!prompt.lastUsed || !prompt.compatibleModels) return;

    // Sicherstellen, dass compatibleModels ein Array ist
    let models = prompt.compatibleModels;
    if (typeof models === "string") {
      // Konvertiere String in Array (z. B. "model1, model2" → ["model1", "model2"])
      models = models
        .split(",")
        .map((model) => model.trim())
        .filter((model) => model);
    } else if (!Array.isArray(models)) {
      // Überspringe, wenn es kein Array ist (z. B. Objekt oder andere Typen)
      return;
    }

    models.forEach((model) => {
      modelUsage[model] = (modelUsage[model] || 0) + 1;
    });
  });
  return modelUsage;
}

function calculateChangeHistory(prompts) {
  const history = [];
  prompts.forEach((prompt) => {
    if (!prompt.metaChangeLog) return;
    prompt.metaChangeLog.forEach((change) => {
      history.push({
        promptTitle: prompt.title,
        timestamp: change.timestamp,
        changes: change.changes,
      });
    });
  });
  return history.sort((a, b) => b.timestamp - a.timestamp);
}

function calculateTagUsage(prompts) {
  const tagUsage = {};
  prompts.forEach((prompt) => {
    if (!prompt.tags) return;
    prompt.tags.forEach((tag) => {
      tagUsage[tag] = (tagUsage[tag] || 0) + 1;
    });
  });
  return tagUsage;
}

function createUsageSection(usageByTime) {
  const section = document.createElement("div");
  section.className = "analytics-section";
  section.innerHTML = `
    <h2>Nutzungshäufigkeit</h2>
    <div class="chart-container" style="height: 300px;">
      <canvas id="usageChart"></canvas>
    </div>
  `;

  const labels = Object.keys(usageByTime.monthly).sort();
  const data = labels.map((key) => usageByTime.monthly[key]);

  const chartConfig = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Prompt-Nutzung pro Monat",
          data: data,
          borderColor: "#4e73df",
          backgroundColor: "rgba(78, 115, 223, 0.2)",
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  };

  // Initialisiere den Chart
  const canvas = section.querySelector("#usageChart");
  new Chart(canvas, chartConfig);

  return section;
}

function createModelSection(usageByModel) {
  const section = document.createElement("div");
  section.className = "analytics-section";
  section.innerHTML = `
    <h2>Nutzung nach Modell</h2>
    <div class="chart-container" style="height: 300px;">
      <canvas id="modelChart"></canvas>
    </div>
  `;

  const labels = Object.keys(usageByModel);
  const data = labels.map((key) => usageByModel[key]);

  const chartConfig = {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Prompt-Nutzung nach Modell",
          data: data,
          backgroundColor: "#36b9cc",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  };

  // Initialisiere den Chart
  const canvas = section.querySelector("#modelChart");
  new Chart(canvas, chartConfig);

  return section;
}

function createHistorySection(changeHistory) {
  const section = document.createElement("div");
  section.className = "analytics-section";
  section.innerHTML = `
    <h2>Änderungshistorie</h2>
    <div class="history-list" style="max-height: 300px; overflow-y: auto;">
      ${changeHistory
        .slice(0, 50)
        .map(
          (entry) => `
        <div class="history-item">
          <strong>${new Date(entry.timestamp).toLocaleString("de-DE")}</strong>
          <p>Prompt: ${escapeHTML(entry.promptTitle)}</p>
          <ul>
            ${Object.entries(entry.changes)
              .map(
                ([key, change]) => `
              <li>${key}: ${change.from} → ${change.to}</li>
            `
              )
              .join("")}
          </ul>
        </div>
      `
        )
        .join("")}
    </div>
  `;
  return section;
}

function createTagSection(tagUsage) {
  const section = document.createElement("div");
  section.className = "analytics-section";
  section.innerHTML = `
    <h2>Tag-Verwendung</h2>
    <div class="chart-container" style="height: 300px;">
      <canvas id="tagChart"></canvas>
    </div>
  `;

  const labels = Object.keys(tagUsage);
  const data = labels.map((key) => tagUsage[key]);

  const chartConfig = {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#4e73df",
            "#1cc88a",
            "#36b9cc",
            "#f6c23e",
            "#e74a3b",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  };

  // Initialisiere den Chart
  const canvas = section.querySelector("#tagChart");
  new Chart(canvas, chartConfig);

  return section;
}
