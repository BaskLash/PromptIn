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
  const analyticsContainer = document.getElementById("analytics-container");
  if (!analyticsContainer) {
    console.error("Analytics container not found");
    return;
  }

  // Clear existing content in analytics-container
  analyticsContainer.innerHTML = "";
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

  // Am häufigsten verwendeter Prompt
  const mostUsedPrompt = calculateMostUsedPrompt(prompts);
  const mostUsedPromptSection = createMostUsedPromptSection(mostUsedPrompt);
  container.appendChild(mostUsedPromptSection);

  // Punktediagramm für Top-5-Prompts
  const topPromptsUsage = calculateTopPromptsUsageOverTime(prompts);
  const topPromptsSection = createTopPromptsUsageSection(topPromptsUsage);
  container.appendChild(topPromptsSection);

  // Änderungshistorie
  const changeHistory = calculateChangeHistory(prompts);
  const historySection = createHistorySection(changeHistory);
  container.appendChild(historySection);

  // Tag-Verwendung
  const tagUsage = calculateTagUsage(prompts);
  const tagSection = createTagSection(tagUsage);
  container.appendChild(tagSection);

  // Append new container to analytics-container
  analyticsContainer.appendChild(container);
  console.log("Berechnete Daten für Nutzung:", calculateUsageByTime(prompts));
  console.log("Berechnete Daten für Modelle:", calculateUsageByModel(prompts));
  console.log("Berechnete Daten für Tags:", calculateTagUsage(prompts));
  console.log(
    "Berechnete Daten für meistgenutzten Prompt:",
    calculateMostUsedPrompt(prompts)
  );
}

function createMostUsedPromptSection(mostUsedPrompt) {
  const section = document.createElement("div");
  section.className = "analytics-section";
  section.innerHTML = `
    <h2>Am häufigsten verwendeter Prompt</h2>
    <p>${
      mostUsedPrompt.mostUsed
        ? `Meistgenutzter Prompt: ${escapeHTML(mostUsedPrompt.mostUsed)} (${
            mostUsedPrompt.maxUsage
          } Nutzungen)`
        : "Keine Daten verfügbar"
    }</p>
    <p>${
      mostUsedPrompt.peakUsageDate
        ? `Höchste Nutzung am: ${mostUsedPrompt.peakUsageDate}`
        : ""
    }</p>
    <div class="chart-container" style="height: 300px;">
      <canvas id="mostUsedPromptChart"></canvas>
    </div>
  `;

  const labels = Object.keys(mostUsedPrompt.usage)
    .sort(
      (a, b) => mostUsedPrompt.usage[b].count - mostUsedPrompt.usage[a].count
    )
    .slice(0, 10);
  const data = labels.map((key) => mostUsedPrompt.usage[key].count);

  const chartConfig = {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Prompt-Nutzung",
          data: data,
          backgroundColor: "#1cc88a",
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

  const canvas = section.querySelector("#mostUsedPromptChart");
  new Chart(canvas, chartConfig);

  return section;
}

// Neue Funktion zur Berechnung der Nutzung der Top-5-Prompts über die Zeit
function calculateTopPromptsUsageOverTime(prompts) {
  // Hole die Top-5-Prompts basierend auf usageCount
  const sortedPrompts = prompts
    .filter((prompt) => prompt.title && prompt.usageCount)
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, 5);

  const usageOverTime = {};
  const allDates = new Set();

  sortedPrompts.forEach((prompt) => {
    const promptKey = prompt.title;
    usageOverTime[promptKey] = {};

    // Nutze usageHistory, falls vorhanden, sonst lastUsed
    if (prompt.usageHistory && Array.isArray(prompt.usageHistory)) {
      prompt.usageHistory.forEach((usage) => {
        const date = new Date(usage.timestamp).toISOString().split("T")[0];
        usageOverTime[promptKey][date] = (usageOverTime[promptKey][date] || 0) + 1;
        allDates.add(date);
      });
    } else if (prompt.lastUsed && prompt.usageCount) {
      const date = new Date(prompt.lastUsed).toISOString().split("T")[0];
      usageOverTime[promptKey][date] = prompt.usageCount;
      allDates.add(date);
    }
  });

  // Sortiere die Daten für die Darstellung
  const sortedDates = Array.from(allDates).sort();
  return { usageOverTime, dates: sortedDates, prompts: sortedPrompts.map(p => p.title) };
}

// Neue Funktion zur Erstellung des Punktediagramms für Top-5-Prompts
function createTopPromptsUsageSection(topPromptsUsage) {
  const section = document.createElement("div");
  section.className = "analytics-section";
  section.innerHTML = `
    <h2>Nutzung der Top-5-Prompts über die Zeit</h2>
    <div class="chart-container" style="height: 300px;">
      <canvas id="topPromptsChart"></canvas>
    </div>
  `;

  // Prüfe, ob Daten vorhanden sind
  if (!topPromptsUsage.dates.length || !topPromptsUsage.prompts.length) {
    section.innerHTML = `<h2>Nutzung der Top-5-Prompts über die Zeit</h2><p>Keine Nutzungsdaten verfügbar.</p>`;
    console.warn("Keine Daten für Top-Prompts-Chart verfügbar.");
    return section;
  }

  const colors = ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b"];
  const datasets = topPromptsUsage.prompts.map((prompt, index) => ({
    label: prompt,
    data: topPromptsUsage.dates.map((date) => topPromptsUsage.usageOverTime[prompt][date] || 0),
    borderColor: colors[index % colors.length],
    backgroundColor: colors[index % colors.length],
    fill: false,
    tension: 0.4, // Glättet die Linie für bessere Lesbarkeit
    pointRadius: 5,
    pointHoverRadius: 8,
  }));

  const chartConfig = {
    type: "line",
    data: {
      labels: topPromptsUsage.dates,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "category",
          labels: topPromptsUsage.dates,
          title: {
            display: true,
            text: "Datum",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Nutzungen",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw} Nutzungen am ${context.label}`;
            },
          },
        },
      },
    },
  };

  try {
    const canvas = section.querySelector("#topPromptsChart");
    if (!canvas) {
      console.error("Canvas-Element für topPromptsChart nicht gefunden.");
      section.innerHTML = `<h2>Nutzung der Top-5-Prompts über die Zeit</h2><p>Fehler: Diagramm konnte nicht erstellt werden.</p>`;
      return section;
    }
    if (typeof Chart === "undefined") {
      console.error("Chart.js ist nicht geladen.");
      section.innerHTML = `<h2>Nutzung der Top-5-Prompts über die Zeit</h2><p>Fehler: Chart.js ist nicht verfügbar.</p>`;
      return section;
    }
    new Chart(canvas, chartConfig);
  } catch (error) {
    console.error("Fehler beim Initialisieren des Top-Prompts-Charts:", error);
    section.innerHTML = `<h2>Nutzung der Top-5-Prompts über die Zeit</h2><p>Fehler beim Rendern des Diagramms: ${error.message}</p>`;
  }

  return section;
}

function calculateMostUsedPrompt(prompts) {
  const promptUsage = {};
  let maxUsage = 0;
  let mostUsedPrompt = null;
  let peakUsageDate = null;

  prompts.forEach((prompt) => {
    if (!prompt.title || !prompt.usageCount) return;
    const promptKey = prompt.title;
    promptUsage[promptKey] = {
      count: prompt.usageCount,
      dates: {},
    };

    // Aggregiere Nutzung nach Datum aus usageHistory, falls vorhanden
    if (prompt.usageHistory && Array.isArray(prompt.usageHistory)) {
      prompt.usageHistory.forEach((usage) => {
        const date = new Date(usage.timestamp).toISOString().split("T")[0];
        promptUsage[promptKey].dates[date] =
          (promptUsage[promptKey].dates[date] || 0) + 1;
      });
    } else if (prompt.lastUsed) {
      // Fallback: Nutze lastUsed
      const date = new Date(prompt.lastUsed).toISOString().split("T")[0];
      promptUsage[promptKey].dates[date] = prompt.usageCount;
    }

    if (promptUsage[promptKey].count > maxUsage) {
      maxUsage = promptUsage[promptKey].count;
      mostUsedPrompt = promptKey;
      peakUsageDate = Object.entries(promptUsage[promptKey].dates).reduce(
        (maxDate, [date, count]) =>
          count > (promptUsage[promptKey].dates[maxDate] || 0) ? date : maxDate,
        Object.keys(promptUsage[promptKey].dates)[0] || null
      );
    }
  });

  return {
    usage: promptUsage,
    mostUsed: mostUsedPrompt,
    maxUsage,
    peakUsageDate,
  };
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

    let models = prompt.compatibleModels;
    if (typeof models === "string") {
      models = models
        .split(",")
        .map((model) => model.trim())
        .filter((model) => model);
    } else if (!Array.isArray(models)) {
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

  const canvas = section.querySelector("#tagChart");
  new Chart(canvas, chartConfig);

  return section;
}
// Hilfsfunktion zum Escapen von HTML
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
