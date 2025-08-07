function initializeAnonymizer() {
  console.log("Anonymizer is on");

  const anonymizerView = document.getElementById("anonymizer-view");
  if (anonymizerView) {
    anonymizerView.style.display = "block";
  }

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

    const allowedFolders = [
      "Users",
      "Downloads",
      "Documents",
      "Desktop",
      "Pictures",
      "Videos",
      "Music",
      "AppData",
      "Program Files",
      "Program Files (x86)",
      "Windows",
      "Projekte",
      "Backups",
      "Kundendaten",
      "Temp",
      "intern",
      "HR",
      "data",
      "Confidential",
      "Personal",
      "logs",
      "AI-Work",
      "OpenAI",
      "ChatGPT",
      "ExportLogs",
      "home",
      "mnt",
    ];

    const nonNameWords = [
      "straße",
      "platz",
      "weg",
      "firma",
      "gmbh",
      "ag",
      "berlin",
      "münchen",
      "deutschland",
      "projekt",
      "daten",
      "system",
      "openai",
      "chatgpt",
      "exportlogs",
      "confidential",
      "personal",
      "logs",
      "ai-work",
      "backup",
      "final",
      "draft",
      "export",
      "sensitive",
      "info",
      "dump",
      "profil",
      "notes",
      "client",
      "session",
      "planung",
      "meeting",
      "version",
      "dokuments",
      "datei",
      "senior",
      "manager",
    ];

    const patterns = [
      // Logeinträge zuerst, um spezifische Formate zu priorisieren
      {
        label: "Benutzer in Logeinträgen",
        regex: /\[LOG\].*Benutzer\s+"([^"]+)"/g,
        replacement: '[LOG] ... Benutzer "[USERNAME]"',
      },
      {
        label: "Pfade in Logeinträgen",
        regex: /\[DEBUG\].*Path:\s*([^\s]+)/g,
        replacement: "[DEBUG] Path: [PATH]",
      },
      // E-Mail-Adressen
      {
        label: "E-Mail",
        regex: /\b[\w._%+-]+@[\w.-]+\.[a-z]{2,}(?:\.[a-z]{2,})?\b/g,
        replacement: "[EMAIL]",
      },
      // Telefonnummern
      {
        label: "Telefonnummern",
        regex: /\b(?:\+49|0)[1-9][0-9\s\-\/]{6,}\b/g,
        replacement: "[PHONE]",
      },
      // Benutzernamen in Pfaden
      {
        label: "Benutzername in Windows-Pfad",
        regex: /([A-Za-z]:\\Users\\)([a-zA-Z0-9._-]+)(\\[^\n\r]*\\)([^\\]+)\b/g,
        replacement: "$1[USERNAME]$3[FILENAME]",
      },
      {
        label: "Benutzername in Unix-Pfad",
        regex: /(\/home\/)([a-zA-Z0-9._-]+)(\/[^\n\r]*\/)([^\/]+)\b/g,
        replacement: "$1[USERNAME]$3[FILENAME]",
      },
      // Allgemeine Namen
      {
        label: "Allgemeiner Vorname Nachname",
        regex: /\b([A-ZÄÖÜ][a-zäöüß]{1,}(?:[\s-][A-ZÄÖÜ][a-zäöüß]{1,})*)\b/g,
        replacement: (match) => {
          const parts = match.split(/\s+/);
          if (parts.some((part) => nonNameWords.includes(part.toLowerCase()))) {
            return match;
          }
          return "[NAME]";
        },
      },
      // Generische Konstruktionen
      {
        label: "Name in generischen Konstruktionen",
        regex:
          /(Name|Benutzername):\s*[A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?/gi,
        replacement: "$1: [NAME]",
      },
      // Benutzernamen
      {
        label: "vorname.nachname",
        regex: /\b[a-zäöüß]{2,}\.[a-zäöüß]{2,}\b/gi,
        replacement: "[USERNAME]",
      },
      {
        label: "Komplexe Benutzernamen",
        regex: /\b([a-zäöüß]+-lead\.[a-zäöüß]+)\b/gi,
        replacement: "[USERNAME]",
      },
      {
        label: "Generische Benutzernamen",
        regex: /\b(admin_user\d+|project-[a-zäöüß]+|[a-zäöüß]+-lead)\b/gi,
        replacement: "[USERNAME]",
      },
      // Dateinamen
      {
        label: "Windows-Dateinamen",
        regex: /\\([^\\]+[_-][^\\]+\.[a-z0-9]+)\b/gi,
        replacement: "\\[FILENAME]",
      },
      {
        label: "Unix-Dateinamen",
        regex: /(\/[^\/]+[_-][^\/]+\.[a-z0-9]+)\b/gi,
        replacement: "/[FILENAME]",
      },
      {
        label: "Dateien in Anführungszeichen",
        regex: /"[^"]+[_-][^"]+\.[a-z0-9]+"/gi,
        replacement: '"[FILENAME]"',
      },
    ];

    function anonymizeText() {
      const input = document.getElementById("inputPrompt").value;
      if (!input.trim()) return;

      lastInput = input;
      let anonymized = input;
      let markedOriginal = input;
      let counts = {};

      patterns.forEach(({ regex, replacement, label }) => {
        const matches = anonymized.match(regex);
        counts[label] = matches ? matches.length : 0;

        anonymized = anonymized.replace(regex, replacement);
        markedOriginal = markedOriginal.replace(
          regex,
          (match) => `<span class="removed">${match}</span>`
        );
      });

      lastOutput = anonymized;

      document.getElementById(
        "originalText"
      ).innerHTML = `Original:\n${markedOriginal}`;
      document.getElementById(
        "anonymizedText"
      ).innerHTML = `Anonymisiert:\n${anonymized.replace(
        /\[([A-Z_]+)\]/g,
        '<span class="added">[$1]</span>'
      )}`;

      const stats =
        Object.entries(counts)
          .filter(([_, count]) => count > 0)
          .map(([label, count]) => `${count}× ${label}`)
          .join(", ") || "Keine sensiblen Daten erkannt.";

      document.getElementById(
        "statusOutput"
      ).textContent = `✅ Ersetzt: ${stats}`;
    }

    function anonymizeSelection() {
      const textarea = document.getElementById("inputPrompt");
      const { selectionStart, selectionEnd } = textarea;

      if (selectionStart === selectionEnd) {
        alert("Bitte wählen Sie einen Textabschnitt aus.");
        return;
      }

      const fullText = textarea.value;
      lastInput = fullText;

      let selection = fullText.slice(selectionStart, selectionEnd);

      patterns.forEach(({ regex, replacement }) => {
        selection = selection.replace(regex, replacement);
      });

      textarea.value =
        fullText.slice(0, selectionStart) +
        selection +
        fullText.slice(selectionEnd);
      lastOutput = textarea.value;

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
