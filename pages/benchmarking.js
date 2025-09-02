// Initialisiert das Benchmarking-Dashboard
function initializeBenchmarking() {
  console.log("Benchmarking is on");

  let prompts = {};
  let workflows = {};

  // Neue Funktion: Auswirkungen pro Version berechnen
  function calculateVersionImpacts(prompt) {
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

      let changePercent = 0;
      if (usageBefore === 0) changePercent = usageAfter > 0 ? 100 : 0;
      else
        changePercent = Math.round(
          ((usageAfter - usageBefore) / usageBefore) * 100
        );

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

  // Funktion zur Berechnung der Ähnlichkeit (Levenshtein-Distanz)
  function calculateSimilarity(text1, text2) {
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

  // Nutzung pro Tag berechnen
  function calculateUsagePerDay(history) {
    const safeHistory = Array.isArray(history) ? history : [];
    const usageByDay = {};

    safeHistory.forEach(({ timestamp, count }) => {
      const date = new Date(timestamp).toLocaleDateString("de-DE");
      usageByDay[date] = (usageByDay[date] || 0) + count;
    });

    return Object.entries(usageByDay).map(([date, count]) => ({
      date,
      count,
    }));
  }

  // Änderung in Prozent berechnen (für einen bestimmten Zeitraum)
  // 🔹 Helper: usage change zwischen 2 Zeiträumen (Anzahl Events)
  function calculateUsageChange(prompt, startDate, endDate) {
    const history = Array.isArray(prompt?.usageHistory)
      ? prompt.usageHistory
      : [];

    // Nutzungen im Zeitraum [startDate, endDate)
    const usageInPeriod = history.filter((u) => {
      const ts = u.timestamp;
      return (!startDate || ts >= startDate) && (!endDate || ts < endDate);
    }).length;

    // Nutzungen im direkt davorliegenden Zeitraum gleicher Länge
    let usageBefore = 0;
    if (startDate && endDate) {
      const duration = endDate - startDate;
      const beforeStart = startDate - duration;
      const beforeEnd = startDate;

      usageBefore = history.filter((u) => {
        const ts = u.timestamp;
        return ts >= beforeStart && ts < beforeEnd;
      }).length;
    }

    if (usageBefore === 0) return usageInPeriod > 0 ? 100 : 0;
    return Math.round(((usageInPeriod - usageBefore) / usageBefore) * 100);
  }

  // Hauptfunktion zur Aktualisierung der UI mit dynamischen Daten
  function updateDashboard() {
    const promptList = Object.values(prompts);
    const today = new Date().toLocaleDateString("de-DE");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();

    // KPI-Daten aktualisieren
    const totalPrompts = document.getElementById("totalPrompts");
    const improvedPrompts = document.getElementById("improvedPrompts");
    const declinedPrompts = document.getElementById("declinedPrompts");
    const avgUsage = document.getElementById("avgUsage");
    totalPrompts.textContent = promptList.length;
    const totalUsage = promptList.reduce(
      (sum, p) => sum + (p.usageCount || 0),
      0
    );
    avgUsage.textContent = promptList.length
      ? Math.round(totalUsage / promptList.length)
      : 0;

    let improved = 0;
    let declined = 0;

    promptList.forEach((prompt) => {
      const lastVersion = prompt.versions[prompt.versions.length - 1];
      const lastChangeTimestamp = lastVersion.timestamp;

      const history = Array.isArray(prompt.usageHistory)
        ? prompt.usageHistory
        : [];

      // Nutzung vor der letzten Änderung
      const usageBefore = history
        .filter((u) => u.timestamp < lastChangeTimestamp)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      // Nutzung nach der letzten Änderung
      const usageAfter = history
        .filter((u) => u.timestamp >= lastChangeTimestamp)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      // Wenn nachher mehr als vorher, improved
      if (usageAfter > usageBefore) improved++;
      else if (usageAfter < usageBefore) declined++;
    });

    improvedPrompts.textContent = promptList.length
      ? `${Math.round((improved / promptList.length) * 100)}%`
      : "0%";

    declinedPrompts.textContent = promptList.length
      ? `${Math.round((declined / promptList.length) * 100)}%`
      : "0%";

    // 🔹 Funktion: Heutiger prozentualer Nutzungsanstieg (nur heute)
    function calculateUsageChangeTopGainers(prompt, startDate, endDate) {
      const history = Array.isArray(prompt?.usageHistory)
        ? prompt.usageHistory
        : [];

      // Nutzung heute
      const usageToday = history
        .filter((u) => u.timestamp >= startDate && u.timestamp < endDate)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      // Wenn keine Nutzung heute, Rückgabe 0
      if (usageToday === 0) return 0;

      return usageToday; // hier direkt als "Boost" interpretieren
    }

    // 🔹 Top Gainers (Heute)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayGainers = promptList
      .map((prompt) => ({
        prompt,
        change: calculateUsageChangeTopGainers(
          prompt,
          todayStart.getTime(),
          Date.now()
        ),
      }))
      .filter((p) => p.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);

    // 🔹 Top Gainers (Heute)
    document.getElementById("topGainers").innerHTML = todayGainers
      .map(
        (p) =>
          `<li data-prompt="${p.prompt.title}" data-prompt-id="${
            p.prompt.promptId
          }" data-model="${
            p.prompt.compatibleModels.join(", ") || "Unbekannt"
          }" data-details="Änderung erkannt"><span class="gain">${
            p.prompt.title
          }: +${p.change} Nutzung(en) (${
            p.prompt.compatibleModels.join(", ") || "Unbekannt"
          })</span></li>`
      )
      .join("");

    // Top Losers (Heute)
    const todayLosers = promptList
      .map((prompt) => ({
        prompt,
        change: calculateUsageChange(
          prompt,
          new Date().setHours(0, 0, 0, 0),
          Date.now()
        ),
      }))
      .filter((p) => p.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 3);

    // 🔹 Top Losers (Heute)
    document.getElementById("topLosers").innerHTML = todayLosers
      .map(
        (p) =>
          `<li data-prompt="${p.prompt.title}" data-prompt-id="${
            p.prompt.promptId
          }" data-model="${
            p.prompt.compatibleModels.join(", ") || "Unbekannt"
          }" data-details="Änderung erkannt"><span class="loss">${
            p.prompt.title
          }: ${p.change}% (${
            p.prompt.compatibleModels.join(", ") || "Unbekannt"
          })</span></li>`
      )
      .join("");

    // 🔹 Funktion: Nutzung nach letzter Änderung berechnen
    function calculateUsageChangeBoost7DaysAfterChange(
      prompt,
      changeTimestamp
    ) {
      const history = Array.isArray(prompt?.usageHistory)
        ? prompt.usageHistory
        : [];

      // Gesamtnutzung vor der letzten Änderung
      const usageBefore = prompt.usageCountBeforeChange || 0; // fallback, falls gespeichert
      // Alternativ Berechnung aus history:
      const usageBeforeCalc = history
        .filter((u) => u.timestamp < changeTimestamp)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      // Gesamtnutzung nach der letzten Änderung
      const usageAfterCalc = history
        .filter((u) => u.timestamp >= changeTimestamp)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      const usageBeforeFinal = usageBefore || usageBeforeCalc;
      const usageAfterFinal = usageAfterCalc;

      if (usageBeforeFinal === 0) return usageAfterFinal > 0 ? 100 : 0;
      return Math.round(
        ((usageAfterFinal - usageBeforeFinal) / usageBeforeFinal) * 100
      );
    }

    // 🔹 Top Gainers (7 Tage nach letzter Änderung)
    const gainers7Days = promptList
      .filter((prompt) => {
        const lastChange =
          prompt.versions[prompt.versions.length - 1].timestamp;
        return lastChange >= sevenDaysAgoTimestamp;
      })
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

    // 🔹 Top Gainers (7 Tage nach letzter Änderung)
    document.getElementById("topGainers7Days").innerHTML = gainers7Days
      .map(
        (p) =>
          `<li data-prompt="${p.prompt.title}" data-prompt-id="${
            p.prompt.promptId
          }" data-model="${
            p.prompt.compatibleModels.join(", ") || "Unbekannt"
          }" data-details="Änderung erkannt"><span class="gain">${
            p.prompt.title
          }: +${p.change}% (${
            p.prompt.compatibleModels.join(", ") || "Unbekannt"
          })</span></li>`
      )
      .join("");

    // 🔹 Funktion: Nutzung nach letzter Änderung (Rückgang) berechnen
    function calculateUsageChangeDecline7DaysAfterChange(
      prompt,
      changeTimestamp
    ) {
      const history = Array.isArray(prompt?.usageHistory)
        ? prompt.usageHistory
        : [];

      // Gesamtnutzung vor der letzten Änderung
      const usageBefore = prompt.usageCountBeforeChange || 0; // fallback, falls gespeichert
      // Alternativ Berechnung aus history:
      const usageBeforeCalc = history
        .filter((u) => u.timestamp < changeTimestamp)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      // Gesamtnutzung nach der letzten Änderung
      const usageAfterCalc = history
        .filter((u) => u.timestamp >= changeTimestamp)
        .reduce((sum, u) => sum + (u.count || 1), 0);

      const usageBeforeFinal = usageBefore || usageBeforeCalc;
      const usageAfterFinal = usageAfterCalc;

      if (usageBeforeFinal === 0) return usageAfterFinal > 0 ? 0 : 0; // Keine Rückgänge möglich
      return Math.round(
        ((usageAfterFinal - usageBeforeFinal) / usageBeforeFinal) * 100
      );
    }

    // 🔹 Top Losers (7 Tage nach letzter Änderung)
    const losers7Days = promptList
      .filter((prompt) => {
        const lastChange =
          prompt.versions[prompt.versions.length - 1].timestamp;
        return lastChange >= sevenDaysAgoTimestamp;
      })
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

    // 🔹 Top Losers (7 Tage nach letzter Änderung)
    document.getElementById("topLosers7Days").innerHTML = losers7Days
      .map(
        (p) =>
          `<li data-prompt="${p.prompt.title}" data-prompt-id="${
            p.prompt.promptId
          }" data-model="${
            p.prompt.compatibleModels.join(", ") || "Unbekannt"
          }" data-details="Änderung erkannt"><span class="loss">${
            p.prompt.title
          }: ${p.change}% (${
            p.prompt.compatibleModels.join(", ") || "Unbekannt"
          })</span></li>`
      )
      .join("");

    // Workflows pro Modell
    const workflowsByModel = {};
    Object.values(workflows).forEach((workflow) => {
      workflow.steps.forEach((step) => {
        const model = step.aiModel || "Unbekannt";
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
          mostPopular ? mostPopular[0] : "Keine Workflows"
        } (${mostPopular ? mostPopular[1] : 0} Nutzungen)</li>`;
      })
      .join("");

    // Prompts mit geringerer Nutzung (Peak-Moment)
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

    // 🔹 Prompts mit geringer Nutzung (Peak-Moment)
    document.getElementById("lowUsagePrompts").innerHTML = lowUsage
      .map((p) => {
        const models = Array.isArray(p.prompt.compatibleModels)
          ? p.prompt.compatibleModels.join(", ")
          : "Unbekannt";

        return `<li data-prompt="${p.prompt.title}" data-prompt-id="${p.prompt.promptId}" data-model="${models}" data-details="Nutzung gesunken">
      ${p.prompt.title}: ${p.changePercent}% 
      (Peak: ${p.peakUsage}, Aktuell: ${p.currentUsage}) (${models})
    </li>`;
      })
      .join("");

    // Ähnlichste Prompts
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

    // 🔹 Ähnlichste Prompts
    document.getElementById("similarPrompts").innerHTML = similar
      .slice(0, 3)
      .map((s) => {
        const models1 = Array.isArray(s.prompt1?.compatibleModels)
          ? s.prompt1.compatibleModels.join(", ")
          : "Unbekannt";
        const models2 = Array.isArray(s.prompt2?.compatibleModels)
          ? s.prompt2.compatibleModels.join(", ")
          : "Unbekannt";

        return `<li 
      data-prompt1="${s.prompt1.title}" 
      data-prompt-id1="${s.prompt1.promptId}"
      data-prompt2="${s.prompt2.title}" 
      data-prompt-id2="${s.prompt2.promptId}"
      data-model="${models1}" 
      data-similarity="${Math.round(s.similarity * 100)}%" 
      data-performance1="${s.performance1 > 0 ? "+" : ""}${s.performance1}%" 
      data-performance2="${s.performance2 > 0 ? "+" : ""}${s.performance2}%" 
      data-recommendation="Empfehlung: ${
        s.performance1 > s.performance2 ? s.prompt2.title : s.prompt1.title
      } löschen">
        ${s.prompt1.title} & ${s.prompt2.title}: 
        ${Math.round(s.similarity * 100)}% Ähnlichkeit 
        (${models1} / ${models2})
    </li>`;
      })
      .join("");
  }

  // Versionstabelle aktualisieren
  function updateVersionTable(prompt) {
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
  }

  // Modal-Interaktivität einrichten
  function setupModalInteractivity() {
    document.querySelectorAll(".highlight-card li").forEach((item) => {
      item.addEventListener("click", () => {
        const prompt = item.getAttribute("data-prompt");
        const promptId = item.getAttribute("data-prompt-id"); // NEU
        const prompt2 = item.getAttribute("data-prompt2");
        const promptId2 = item.getAttribute("data-prompt-id2"); // NEU
        const model = item.getAttribute("data-model");
        const details = item.getAttribute("data-details");
        const similarity = item.getAttribute("data-similarity");
        const performance1 = item.getAttribute("data-performance1");
        const performance2 = item.getAttribute("data-performance2");
        const recommendation = item.getAttribute("data-recommendation");

        document.getElementById("modalPrompt").textContent = prompt2
          ? `Prompts: ${prompt} & ${prompt2}`
          : `Prompt: ${prompt}`;
        document.getElementById("modalModel").textContent = `Modell: ${model}`;
        document.getElementById("modalDetails").textContent = details
          ? `Details: ${details}`
          : "";
        document.getElementById("modalPerformance").textContent = similarity
          ? `Performance: ${prompt}: ${performance1}, ${prompt2}: ${performance2}, Ähnlichkeit: ${similarity}`
          : "";
        document.getElementById("modalRecommendation").textContent =
          recommendation ? `Empfehlung: ${recommendation}` : "";
        document.getElementById("promptModal").style.display = "flex";

        console.log("Information Data gathered: " + promptId);

        // NEU: promptId an die Statistik-Funktion übergeben
        if (prompt2) {
          // Bei zwei Prompts (ähnliche Prompts)
          showPromptStatistics(promptId, promptId2);
        } else {
          showPromptStatistics(promptId);
        }
      });
    });
  }

  // Bericht herunterladen
  function downloadReport(prompt) {
    const usageData = calculateUsagePerDay(prompt.usageHistory);
    const versionImpacts = calculateVersionImpacts(prompt);
    const data = [
      [
        "Version",
        "Datum",
        "Änderung",
        "Nutzung vorher",
        "Nutzung nachher",
        "% Änderung",
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
  }

  const benchmarkingView = document.getElementById("benchmarking-view");
  if (benchmarkingView) {
    benchmarkingView.style.display = "block";
  }

  const container = document.querySelector("#benchmarking-container");
  if (container) {
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
        }

        .highlight-card li {
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }

        .highlight-card li:last-child {
          border-bottom: none;
        }

        .highlight-card .gain {
          color: #27ae60;
        }

        .highlight-card .loss {
          color: #c0392b;
        }

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
          overflow: hidden;
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

        .version-table .positive {
          color: #27ae60;
        }

        .version-table .negative {
          color: #c0392b;
        }

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

        .improve-btn {
          background-color: #27ae60;
          margin-left: 10px;
        }

        .delete-btn {
          background-color: #c0392b;
          margin-left: 10px;
        }

        .export-btn:hover, .improve-btn:hover, .delete-btn:hover {
          background-color: #34495e;
        }

        .improve-btn:hover {
          background-color: #2ecc71;
        }

        .delete-btn:hover {
          background-color: #e74c3c;
        }

        .modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  overflow: auto;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 90vw; /* Maximal 90% der Viewport-Breite */
  max-height: 90vh; /* Maximal 90% der Viewport-Höhe */
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto; /* Vertikales Scrollen erlauben, falls nötig */
  position: relative;
}

        .modal-content h3 {
          margin-bottom: 15px;
        }

        .modal-content p {
          margin-bottom: 20px;
        }

        .close-btn {
          float: right;
          cursor: pointer;
          font-size: 20px;
        }
          .chart-container {
  width: 100%;
  max-width: 100%; /* Verhindert Überlaufen */
  overflow: hidden; /* Verhindert horizontales Scrollen */
}

#promptChart {
  width: 100%;
  height: 300px; /* Feste Höhe, anpassbar */
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
  max-width: calc(100% - 24px); /* Verhindert Überlaufen auf kleinen Bildschirmen */
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

.news-source {
  font-weight: bold;
  color: #555;
}

.news-date {
  font-size: 12px;
  color: #888;
}

.news-text {
  margin: 6px 0;
}

.news-change.up {
  color: green;
  font-weight: bold;
}

.news-change.down {
  color: red;
  font-weight: bold;
}

.line {
  fill: none;
  stroke: green;
  stroke-width: 2;
}

.marker {
  fill: darkgreen;
  cursor: pointer;
  transition: r 0.2s ease-in-out;
}

.marker:hover {
  r: 9;
}

.news-logo {
  cursor: pointer;
  transition: fill 0.2s ease-in-out;
}

.news-logo:hover path {
  fill: blue;
}

.marker-line {
  stroke: #999;
  stroke-dasharray: 4, 4;
  transition: stroke 0.2s ease-in-out, stroke-width 0.2s ease-in-out;
}

.highlight {
  stroke: blue !important;
  stroke-width: 2 !important;
  fill: blue !important;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
  }
  .news-card {
    width: 100%; /* Volle Breite auf kleinen Bildschirmen */
  }
}

        @media (max-width: 768px) {
          .highlight-section {
            grid-template-columns: 1fr;
          }
        }
      </style>

        <section class="kpi-section">
          <div class="kpi-card">
            <h3>Gesamtanzahl Prompts</h3>
            <p id="totalPrompts">0</p>
          </div>
          <div class="kpi-card">
            <h3>Verbesserte Prompts</h3>
            <p id="improvedPrompts">0%</p>
          </div>
          <div class="kpi-card">
            <h3>Verschlechterte Prompts</h3>
            <p id="declinedPrompts">0%</p>
          </div>
          <div class="kpi-card">
            <h3>Durchschn. Nutzung</h3>
            <p id="avgUsage">0</p>
          </div>
        </section>

        <section class="highlight-section">
          <div class="highlight-card">
            <h3>Top Gainers (Heute)</h3>
            <ul id="topGainers"></ul>
          </div>
          <div class="highlight-card">
            <h3>Top Losers (Heute)</h3>
            <ul id="topLosers"></ul>
          </div>
          <div class="highlight-card">
            <h3>Top Gainers (7 Tage nach letzter Änderung)</h3>
            <ul id="topGainers7Days"></ul>
          </div>
          <div class="highlight-card">
            <h3>Top Losers (7 Tage nach letzter Änderung)</h3>
            <ul id="topLosers7Days"></ul>
          </div>
          <div class="highlight-card">
            <h3>Workflows pro Modell</h3>
            <ul id="workflowsPerModel"></ul>
          </div>
          <div class="highlight-card">
            <h3>Prompts mit geringerer Nutzung (Peak-Moment)</h3>
            <ul id="lowUsagePrompts"></ul>
          </div>
          <div class="highlight-card">
            <h3>Ähnlichste Prompts</h3>
            <ul id="similarPrompts"></ul>
          </div>
        </section>

        <section>
          <h3>Versionierungs-Analyse</h3>
          <div class="prompt-selector">
            <select id="promptSelect">
              <option value="">Prompt auswählen...</option>
            </select>
          </div>
          <table class="version-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Datum</th>
                <th>Änderung</th>
                <th>Nutzung vorher</th>
                <th>Nutzung nachher</th>
                <th>% Änderung</th>
              </tr>
            </thead>
            <tbody id="versionTable"></tbody>
          </table>
        </section>

        <a href="#" class="export-btn" id="btnDownloadReport">Report herunterladen (CSV)</a>

        <div id="promptModal" class="modal">
  <div class="modal-content">
    <span class="close-btn">&times;</span>
    <h3>Prompt-Details</h3>
    <p id="modalPrompt"></p>
    <p id="modalModel"></p>
    <p id="modalDetails"></p>
    <p id="modalPerformance"></p>
    <p id="modalRecommendation"></p>
    <button class="improve-btn" onclick="improvePrompt()">Prompt verbessern</button>
    <button class="delete-btn" onclick="deletePrompt()">Prompt löschen</button>

    <h4>Statistik / Versionsverlauf</h4>
    <div class="chart-container">
      <svg id="promptChart"></svg>
    </div>
    <div class="news-container" id="promptNews"></div>
  </div>
</div>
    `;

    // JavaScript-Logik für die Seite
    const promptSelect = document.getElementById("promptSelect");

    // Prompts und Workflows aus chrome.storage.local laden
    chrome.storage.local.get(null, (result) => {
      prompts = result.prompts || {};
      workflows = Object.fromEntries(
        Object.entries(result).filter(([key]) => key.startsWith("workflow_"))
      );

      // Dropdown befüllen
      Object.values(prompts).forEach((prompt) => {
        const option = document.createElement("option");
        option.value = prompt.promptId;
        option.textContent = prompt.title || `Prompt ${prompt.promptId}`;
        promptSelect.appendChild(option);
      });

      // Dashboard aktualisieren
      updateDashboard();
      setupModalInteractivity();

      // Event-Handler für Auswahl
      promptSelect.addEventListener("change", () => {
        const promptId = promptSelect.value;
        if (!promptId) {
          document.getElementById("versionTable").innerHTML = "";
          return;
        }

        const prompt = prompts[promptId];
        if (!prompt) {
          return;
        }

        updateVersionTable(prompt);
      });

      // Download-Button
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
          downloadReport(prompt);
        });
    });

    // Modal schließen
    let closeBtn = document.querySelector(".close-btn");

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        document.getElementById("promptModal").style.display = "none";
      });
    }

    // Prompt verbessern
    window.improvePrompt = function () {
      const prompt = document
        .getElementById("modalPrompt")
        .textContent.includes("&")
        ? document
            .getElementById("modalPrompt")
            .textContent.split("&")[0]
            .replace("Prompts: ", "")
            .trim()
        : document
            .getElementById("modalPrompt")
            .textContent.replace("Prompt: ", "");
      alert(`Verbesserung für Prompt "${prompt}" wird gestartet...`);
    };

    // Prompt löschen
    window.deletePrompt = function () {
      const prompt = document
        .getElementById("modalPrompt")
        .textContent.includes("&")
        ? document
            .getElementById("modalPrompt")
            .textContent.split("&")[1]
            .trim()
        : document
            .getElementById("modalPrompt")
            .textContent.replace("Prompt: ", "");
      alert(`Prompt "${prompt}" wird gelöscht...`);
    };
  }
  function showPromptStatistics(promptId) {
    const svg = document.getElementById("promptChart");
    const newsContainer = document.getElementById("promptNews");

    // Clear previous content
    svg.innerHTML = "";
    newsContainer.innerHTML = "";

    // Retrieve prompts from chrome.storage.local
    chrome.storage.local.get("prompts", (result) => {
      const prompts = result.prompts || {};
      const prompt = prompts[promptId];
      if (!prompt) {
        newsContainer.innerHTML = "<p>Kein Prompt gefunden.</p>";
        console.log("Kein Prompt gefunden für ID:", promptId);
        return;
      }

      // Version and usage data
      const versions = (prompt.versions || []).filter(
        (v) => typeof v.timestamp === "number" && !isNaN(v.timestamp)
      );
      if (!versions.length) {
        newsContainer.innerHTML = "<p>Keine Versionen verfügbar.</p>";
        console.log("Keine Versionen verfügbar für Prompt:", prompt);
        return;
      }

      // Calculate usage data for the last 30 days (including days with no usage)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Midnight today
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29); // Including today = 30 days

      // Map raw usageHistory to daily counts
      const usageMap = {};
      (prompt.usageHistory || []).forEach((entry) => {
        if (!entry.timestamp) return;
        const d = new Date(entry.timestamp);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
        usageMap[key] = (usageMap[key] || 0) + 1;
      });

      // Generate complete list of the last 30 days
      const usageData = [];
      for (
        let d = new Date(thirtyDaysAgo);
        d <= today;
        d.setDate(d.getDate() + 1)
      ) {
        const key = d.toISOString().slice(0, 10);
        usageData.push({
          date: key,
          count: usageMap[key] || 0,
        });
      }

      const data = usageData.map((e) => e.count);
      const dates = usageData.map((e) => e.date);

      console.log("Daten für Chart:", data, "Daten:", dates);

      // If all values are 0, abort
      if (!data.some((val) => val > 0)) {
        newsContainer.innerHTML =
          "<p>Keine Nutzungsdaten für die letzten 30 Tage verfügbar.</p>";
        console.log("Keine Nutzungsdaten für die letzten 30 Tage verfügbar.");
        return;
      }

      // Handle single data point by adding a dummy point
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
          { ...versions[0], timestamp: versions[0].timestamp - 86400000 }, // One day earlier
          versions[0],
        ];
      }

      const width = parseFloat(svg.getAttribute("width")) || 600;
      const height = parseFloat(svg.getAttribute("height")) || 300;
      const padding = 40;

      const maxVal = Math.max(...adjustedData, 1);
      const minVal = 0; // Always start at 0 for usage count

      // Scaling functions
      const xScale = (i) => {
        if (adjustedData.length <= 1) return width / 2;
        return (
          padding + i * ((width - 2 * padding) / (adjustedData.length - 1))
        );
      };
      const yScale = (val) =>
        height -
        padding -
        ((val - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);

      // Add Y-axis (Usage Count)
      const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "g");
      yAxis.setAttribute("class", "y-axis");
      const yTicks = Math.min(maxVal, 10); // Limit to 10 ticks for readability
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

        // Grid line
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
      // Y-axis label
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

      // Add X-axis (Date)
      const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "g");
      xAxis.setAttribute("class", "x-axis");
      const tickInterval = Math.ceil(adjustedData.length / 6); // Approx 6 ticks
      for (let i = 0; i < adjustedData.length; i += tickInterval) {
        const x = xScale(i);
        const date = new Date(adjustedDates[i]);
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

        // Grid line
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
      // X-axis label
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

      // Create line path
      let pathData = "";
      adjustedData.forEach((val, i) => {
        const x = xScale(i);
        const y = yScale(val);
        if (isNaN(x) || isNaN(y)) {
          console.warn(`Ungültige Koordinaten bei Index ${i}: x=${x}, y=${y}`);
          return;
        }
        pathData += (i === 0 ? "M" : "L") + x + "," + y;
      });

      if (pathData) {
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        path.setAttribute("d", pathData);
        path.setAttribute("stroke", "#1e90ff");
        path.setAttribute("stroke-width", 2);
        path.setAttribute("fill", "none");
        svg.appendChild(path);
      } else {
        console.warn("Kein gültiger Pfad für die Linie erstellt.");
      }

      // Events for versions and news (example news event on 2025-08-18)
      const newsEvents = [
        { timestamp: new Date("2025-08-18").getTime(), title: "News Event" },
      ];
      const events = [
        ...adjustedVersions.map((v, idx) => ({
          timestamp: v.timestamp,
          source: `Version ${idx + 1 - (adjustedData.length - data.length)}`,
          title: v.title || "Keine Beschreibung verfügbar",
        })),
        ...newsEvents.map((n, idx) => ({
          timestamp: n.timestamp,
          source: `News ${idx + 1}`,
          title: n.title,
        })),
      ].sort((a, b) => a.timestamp - b.timestamp);

      // Highlight function
      function highlight(idx, state) {
        document.querySelectorAll(".news-card").forEach((card) => {
          card.classList.toggle(
            "active",
            state && card.getAttribute("data-index") === String(idx)
          );
        });
        document.querySelectorAll(".marker-line").forEach((l) => {
          if (l.getAttribute("data-index") === String(idx)) {
            l.classList.toggle("highlight", state);
          }
        });
        document.querySelectorAll(".marker").forEach((m) => {
          if (m.getAttribute("data-index") === String(idx)) {
            m.classList.toggle("highlight", state);
          }
        });
        document.querySelectorAll(".news-logo").forEach((n) => {
          if (n.getAttribute("data-index") === String(idx)) {
            n.classList.toggle("highlight", state);
          }
        });
      }

      // Event markers
      events.forEach((ev, idx) => {
        const eventDate = new Date(ev.timestamp);
        eventDate.setHours(0, 0, 0, 0);
        const dateStr = eventDate.toISOString().slice(0, 10);
        const dataIndex = adjustedDates.indexOf(dateStr);
        if (dataIndex === -1) return; // Skip if event date is outside range
        const x = xScale(dataIndex);
        const y = yScale(adjustedData[dataIndex] || 0);

        // Dashed line
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", x);
        line.setAttribute("y1", height - padding);
        line.setAttribute("x2", x);
        line.setAttribute("y2", padding);
        line.setAttribute("stroke", "#ff4500");
        line.setAttribute("stroke-width", 2);
        line.setAttribute("stroke-dasharray", "5,5");
        line.setAttribute("class", "marker-line");
        line.setAttribute("data-index", idx);
        svg.appendChild(line);

        // Invisible hover area
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

        // Marker (circle)
        const circle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 6);
        circle.setAttribute("fill", "#ff4500");
        circle.setAttribute("class", "marker");
        circle.setAttribute("data-index", idx);
        svg.appendChild(circle);

        // SVG logo
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
        logo.innerHTML = `
        <path d="M4 4h16v2H4V4zm0 4h16v12H4V8zm2 2h2v8H6v-8zm4 0h8v2h-8v-2zm0 4h8v2h-8v-2zm0 4h4v2h-4v-2z" fill="#555"/>
      `;
        svg.appendChild(logo);

        // News card
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

        // Hover events
        [circle, logo, hitLine].forEach((element) => {
          element.addEventListener("mouseover", () => highlight(idx, true));
          element.addEventListener("mouseout", () => highlight(idx, false));
        });

        card.addEventListener("mouseover", () => highlight(idx, true));
        card.addEventListener("mouseout", () => highlight(idx, false));
      });
    });
  }
}
