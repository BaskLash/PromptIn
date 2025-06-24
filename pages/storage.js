const TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB Gesamtspeicher

function renderStorageUI(
  usedMB,
  remainingMB,
  totalMB,
  usedPercentage,
  avgDaily,
  daysLeft,
  today,
  loadTimeMs,
  dailyChangesData // Neue Daten für Prognose
) {
  const container = document.getElementById("storage-container");

  // Warnung für hohen Speicherverbrauch
  let warning = "";
  const barColor =
    usedPercentage > 80
      ? "#f44336"
      : usedPercentage > 50
      ? "#ff9800"
      : "#4caf50";
  if (usedPercentage > 80 || daysLeft < 7) {
    warning = `
      <div class="warning" style="color: red; margin-top: 10px; padding: 10px; border: 1px solid #f44336; border-radius: 5px;">
        <p><strong>Warnung:</strong> Der Speicher ist fast voll (${usedPercentage.toFixed(
          1
        )}% verwendet, ca. ${Math.ceil(
      daysLeft
    )} Tage verbleibend). Erwäge ein Login, um Daten in die Cloud zu sichern!</p>
        <button onclick="startLogin()" style="background: #4caf50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
          Jetzt Login erstellen
        </button>
      </div>
    `;
  }

  // Tabelle für tägliche Änderungen
  let dailyChangesHTML = `
    <div class="daily-changes" style="margin-top: 20px;">
      <h3>Daily storage increases</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 8px; border: 1px solid #ddd;">Date</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Growth (MB)</th>
          </tr>
        </thead>
        <tbody>
  `;
  dailyChangesData.forEach(({ date, delta }) => {
    dailyChangesHTML += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${delta.toFixed(
          2
        )}</td>
      </tr>
    `;
  });
  dailyChangesHTML += `
        </tbody>
      </table>
    </div>
  `;

  // HTML für die Speicher-UI
  container.innerHTML = `
    <div class="storage-section">
      <h2>Memory utilization</h2>
      <div class="storage-bar" style="position: relative; background: #eee; height: 25px; border-radius: 5px; overflow: hidden;">
        <div class="used-bar" style="background: ${barColor}; height: 100%; width: ${usedPercentage}%;"></div>
        <span class="percentage-text" style="position: absolute; left: 50%; top: 0; transform: translateX(-50%); color: black; font-weight: bold;">
          ${usedPercentage.toFixed(1)}%
        </span>
      </div>
      <div class="details" style="margin-top: 10px;">
        <p>Uses: <strong>${usedMB.toFixed(2)}</strong> MB</p>
        <p>Available: <strong>${remainingMB.toFixed(2)}</strong> MB</p>
        <p>Total: <strong>${totalMB.toFixed(2)}</strong> MB</p>
        <p>Loading time: <strong>${loadTimeMs}</strong> ms</p>
      </div>
    </div>

    <div class="analysis" style="margin-top: 20px;">
      <h3>Analysis</h3>
      <p>Average per day: <strong>${avgDaily.toFixed(2)}</strong> MB</p>
      <p>Estimated days to full: <strong>${
        isFinite(daysLeft) ? Math.ceil(daysLeft) : "∞"
      }</strong></p>
      <p>Last update: <strong>${today}</strong></p>
    </div>

    ${dailyChangesHTML}

    <div class="chart-section" style="margin-top: 20px;">
      <h3>Daily memory usage</h3>
      <canvas id="storageChart"></canvas>
    </div>

    <div class="forecast-chart-section" style="margin-top: 20px;">
      <h3>Forecast storage utilization (Nächste 30 Tage)</h3>
      <canvas id="forecastChart"></canvas>
    </div>

    ${warning}
  `;

  // Chart.js Diagramm für historische Nutzung
  chrome.storage.local.get({ usageHistory: [] }, function (result) {
    const history = result.usageHistory || [];
    const dates = [];
    const values = [];

    // Gruppiere Daten nach Tag
    const dailyData = {};
    history.forEach((entry) => {
      const date = new Date(entry.timestamp).toISOString().split("T")[0];
      if (!dailyData[date] || entry.timestamp > dailyData[date].timestamp) {
        dailyData[date] = entry;
      }
    });

    Object.keys(dailyData)
      .sort()
      .forEach((date) => {
        dates.push(date);
        values.push(dailyData[date].usedMB);
      });

    const ctx = document.getElementById("storageChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Memory utilization (MB)",
            data: values,
            borderColor: "#4caf50",
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Date" } },
          y: {
            title: { display: true, text: "Memory used (MB)" },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: { display: true },
          title: { display: true, text: "Daily memory usage" },
        },
      },
    });

    // Prognose-Diagramm
    const forecastDates = [];
    const forecastValues = [];
    const todayDate = new Date();
    for (let i = 0; i <= 30; i++) {
      const futureDate = new Date(todayDate);
      futureDate.setDate(todayDate.getDate() + i);
      forecastDates.push(futureDate.toISOString().split("T")[0]);
      forecastValues.push(Math.min(usedMB + avgDaily * i, totalMB));
    }

    const forecastCtx = document
      .getElementById("forecastChart")
      .getContext("2d");
    new Chart(forecastCtx, {
      type: "line",
      data: {
        labels: forecastDates,
        datasets: [
          {
            label: "Forecasted storage consumption (MB)",
            data: forecastValues,
            borderColor: "#2196f3",
            backgroundColor: "rgba(33, 150, 243, 0.2)",
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Date" } },
          y: {
            title: { display: true, text: "Memory used (MB)" },
            beginAtZero: true,
            max: totalMB,
          },
        },
        plugins: {
          legend: { display: true },
          title: { display: true, text: "Forecast storage utilization" },
        },
      },
    });
  });
}

let isUpdating = false; // Flag zur Vermeidung von Endlosschleifen

function updateStorageInfo() {
  if (isUpdating) return; // Verhindere Mehrfachausführung
  isUpdating = true;

  const start = performance.now();
  const totalMB = TOTAL_BYTES / (1024 * 1024);
  const today = new Date().toISOString().split("T")[0];

  chrome.storage.local.getBytesInUse(null, function (bytesInUse) {
    const usedMB = bytesInUse / (1024 * 1024);
    const remainingMB = (TOTAL_BYTES - bytesInUse) / (1024 * 1024);
    const usedPercentage = (bytesInUse / TOTAL_BYTES) * 100;

    // Historie aktualisieren
    chrome.storage.local.get({ usageHistory: [] }, function (result) {
      let history = Array.isArray(result.usageHistory)
        ? result.usageHistory
        : []; // Sicherstellen, dass history ein Array ist
      const now = Date.now();

      // Neuer Eintrag
      history.push({ timestamp: now, usedMB });

      // Datenbereinigung: Entferne Einträge älter als 30 Tage
      const cutoff = now - 30 * 24 * 60 * 60 * 1000;
      history = history.filter((entry) => entry.timestamp >= cutoff);

      // Analyse
      const dailyChanges = [];
      const dailyData = {};
      history.forEach((entry) => {
        const date = new Date(entry.timestamp).toISOString().split("T")[0];
        if (!dailyData[date] || entry.timestamp > dailyData[date].timestamp) {
          dailyData[date] = entry;
        }
      });

      const sortedDates = Object.keys(dailyData).sort();
      const dailyChangesData = []; // Für die UI-Tabelle
      for (let i = 1; i < sortedDates.length; i++) {
        const delta =
          dailyData[sortedDates[i]].usedMB -
          dailyData[sortedDates[i - 1]].usedMB;
        if (delta >= 0) {
          dailyChanges.push(delta);
          dailyChangesData.push({ date: sortedDates[i], delta });
        }
      }

      const avgDaily =
        dailyChanges.length > 0
          ? dailyChanges.reduce((a, b) => a + b, 0) / dailyChanges.length
          : 0;

      const daysLeft = avgDaily > 0 ? (totalMB - usedMB) / avgDaily : Infinity;

      // Benachrichtigung bei hohem Verbrauch
      if (usedPercentage > 80 && !localStorage.getItem("storageWarningShown")) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Speicher fast voll!",
          message:
            "Dein lokaler Speicher ist fast voll. Erwäge ein Login, um Daten zu sichern.",
        });
        localStorage.setItem("storageWarningShown", "true");
      }

      // Historie speichern
      chrome.storage.local.set({ usageHistory: history }, () => {
        // UI rendern
        renderStorageUI(
          usedMB,
          remainingMB,
          totalMB,
          usedPercentage,
          avgDaily,
          daysLeft,
          today,
          (performance.now() - start).toFixed(2),
          dailyChangesData
        );
        isUpdating = false; // Flag zurücksetzen
      });
    });
  });
}

// Platzhalter für Login-Funktion
function startLogin() {
  alert("Login-Funktion wird in Kürze verfügbar sein!");
}

// Zeigt den View und aktualisiert
function initializeStorage() {
  document.getElementById("storage-view").style.display = "block";
  updateStorageInfo();
  setInterval(updateStorageInfo, 86400000); // Tägliches Update

  // Listener für Speicheränderungen
  chrome.storage.local.onChanged.addListener((changes, namespace) => {
    if (changes.usageHistory) return; // Ignoriere Änderungen an usageHistory
    updateStorageInfo();
  });
}
