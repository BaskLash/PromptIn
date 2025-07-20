function initializeAnonymizer() {
  console.log("Anonymizer is on");

  // Show the anonymizer view
  const anonymizerView = document.getElementById("anonymizer-view");
  if (anonymizerView) {
    anonymizerView.style.display = "block";
  }

  // Populate the anonymizer container with the required content
  const container = document.querySelector(".anonymizer-container");
  if (container) {
    container.innerHTML = `
      <style>
        .anonymizer-container {
          font-family: Arial, sans-serif;
          max-width: 900px;
          margin: 20px auto;
          padding: 20px;
        }
        textarea {
          width: 100%;
          height: 160px;
          margin-bottom: 10px;
        }
        button {
          padding: 10px 15px;
          margin: 5px 3px;
        }
        .diff-container {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
        }
        .diff-box {
          width: 48%;
          padding: 10px;
          border: 1px solid #ccc;
          min-height: 200px;
          white-space: pre-wrap;
        }
        .removed { background-color: #ffcccc; text-decoration: line-through; }
        .added { background-color: #ccffcc; font-weight: bold; }
        .uncertain { background-color: #ffffcc; border-bottom: 1px dotted #333; }
        .status { margin-top: 10px; font-size: 0.95em; color: #333; }
        .info-box {
          background-color: #f5f5f5;
          padding: 10px;
          border-left: 4px solid #888;
          margin-bottom: 10px;
        }
      </style>

      <div class="info-box">
        🔐 <strong>Hinweis:</strong> Die Verarbeitung erfolgt ausschließlich <strong>lokal</strong> in Ihrem Browser. Keine Daten werden gespeichert oder übertragen.
      </div>

      <textarea id="inputPrompt" placeholder="Geben Sie Ihren Prompt hier ein..."></textarea>

      <div>
        <button id="btnAnonymizeText">Text anonymisieren</button>
        <button id="btnAnonymizeSelection">Auswahl anonymisieren</button>
        <button id="btnUndo">Rückgängig</button>
        <button id="btnDownload">Exportieren</button>
      </div>

      <div class="status" id="statusOutput">Bereit zur Anonymisierung.</div>

      <h3>Vorher-Nachher-Vergleich</h3>
      <div class="diff-container">
        <div class="diff-box" id="originalText">Original: (Hier erscheint der Originaltext)</div>
        <div class="diff-box" id="anonymizedText">Anonymisiert: (Hier erscheint der anonymisierte Text)</div>
      </div>
    `;

    let lastInput = "";
    let lastOutput = "";

    const patterns = [
      {
        regex: /\b([A-ZÄÖÜ][a-zäöüß]+(?:[-\s][A-ZÄÖÜ][a-zäöüß]+)+)\b/g,
        replacement: "[NAME]",
        label: "Namen",
      },
      {
        regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
        replacement: "[EMAIL]",
        label: "E-Mails",
      },
      {
        regex: /\b(?:\+49|0)[1-9][0-9\s\-\/]{7,}\b/g,
        replacement: "[PHONE]",
        label: "Telefonnummern",
      },
      {
        regex: /\b[a-zA-Z]{2,}\.[a-zA-Z]{2,}\b/g,
        replacement: "[USERNAME]",
        label: "Benutzernamen",
      },
      {
        regex: /([A-Za-z]:\\Users\\)([a-zA-Z0-9._-]+)(\\[^<>:"|?*]*)/g,
        replacement: "$1[USERNAME]$3",
        label: "Dateipfade",
      },
    ];

    function anonymizeText() {
      const input = document.getElementById("inputPrompt").value;
      if (!input.trim()) return;

      lastInput = input;
      let anonymized = input;
      let originalWithMarks = input;
      let counts = {};

      patterns.forEach((p) => {
        const matches = anonymized.match(p.regex);
        counts[p.label] = matches ? matches.length : 0;
        anonymized = anonymized.replace(p.regex, p.replacement);
        originalWithMarks = originalWithMarks.replace(
          p.regex,
          (m) => `<span class="removed">${m}</span>`
        );
      });

      const uncertainPattern = /\b\w*[._-]\w+\b/g;
      anonymized = anonymized.replace(uncertainPattern, (match) => {
        if (!patterns.some((p) => p.regex.test(match))) {
          originalWithMarks = originalWithMarks.replace(
            match,
            `<span class="uncertain">${match}</span>`
          );
          return "[UNSICHER]";
        }
        return match;
      });

      lastOutput = anonymized;

      document.getElementById(
        "originalText"
      ).innerHTML = `Original:\n${originalWithMarks}`;
      document.getElementById(
        "anonymizedText"
      ).innerHTML = `Anonymisiert:\n${anonymized.replace(
        /\[([A-Z]+)\]/g,
        '<span class="added">[$1]</span>'
      )}`;

      const statsText =
        Object.entries(counts)
          .map(([label, num]) => `${num}× ${label}`)
          .filter((e) => !e.startsWith("0"))
          .join(", ") || "Keine sensiblen Daten erkannt.";

      document.getElementById(
        "statusOutput"
      ).textContent = `✅ Ersetzt: ${statsText}`;
    }

    function anonymizeSelection() {
      const textarea = document.getElementById("inputPrompt");
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end) {
        alert("Bitte wählen Sie einen Textabschnitt aus.");
        return;
      }

      const text = textarea.value;
      lastInput = text;

      let selection = text.slice(start, end);
      patterns.forEach((p) => {
        selection = selection.replace(p.regex, p.replacement);
      });

      selection = selection.replace(/\b\w*[._-]\w+\b/g, (match) => {
        if (!patterns.some((p) => p.regex.test(match))) {
          return "[UNSICHER]";
        }
        return match;
      });

      const newText = text.slice(0, start) + selection + text.slice(end);
      textarea.value = newText;

      lastOutput = newText;
      document.getElementById(
        "statusOutput"
      ).textContent = `✅ Auswahl anonymisiert`;
      document.getElementById("originalText").innerHTML =
        "Original: (Teilweise ersetzt)";
      document.getElementById("anonymizedText").innerHTML =
        "Anonymisiert: (Auswahl angepasst)";
    }

    function undo() {
      if (!lastInput) return;
      document.getElementById("inputPrompt").value = lastInput;
      document.getElementById("statusOutput").textContent =
        "🔁 Letzte Änderung rückgängig gemacht.";
    }

    function downloadAnonymized() {
      const content = document
        .getElementById("anonymizedText")
        .innerText.replace(/^Anonymisiert:\n?/, "");
      const blob = new Blob([content], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "anonymized_prompt.txt";
      link.click();
    }

    // Bind buttons
    document
      .getElementById("btnAnonymizeText")
      .addEventListener("click", anonymizeText);
    document
      .getElementById("btnAnonymizeSelection")
      .addEventListener("click", anonymizeSelection);
    document.getElementById("btnUndo").addEventListener("click", undo);
    document
      .getElementById("btnDownload")
      .addEventListener("click", downloadAnonymized);
  }
}
