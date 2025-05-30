document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const folderId = urlParams.get("folderId");
  const promptIndex = urlParams.get("promptIndex");
  const wordCount = document.getElementById("word-count");
  const charCount = document.getElementById("char-count");
  const lineCount = document.getElementById("line-count");
  const textarea = document.getElementById("prompt-textarea");

  // Funktion zur Textanalyse
  function updateAnalysis() {
    const text = textarea.value;
    wordCount.textContent = text
      .trim()
      .split(/\s+/)
      .filter((word) => word).length;
    charCount.textContent = text.length;
    lineCount.textContent = text.split("\n").length;
  }

  // Hole den Prompt-Text aus chrome.storage.local
  chrome.storage.local.get(folderId, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }

    const folder = data[folderId];
    if (folder && folder.prompts && folder.prompts[promptIndex] !== undefined) {
      const promptText = folder.prompts[promptIndex];
      textarea.value = promptText;

      console.log("Folder ID:", folderId);
      console.log("Prompt Index:", promptIndex);
      console.log("Prompt Text:", promptText);

      // Führe die Analyse durch, sobald der gespeicherte Text geladen ist
      updateAnalysis();
    } else {
      console.error(
        "Prompt nicht gefunden für Folder ID:",
        folderId,
        "Index:",
        promptIndex
      );
      textarea.value = "Prompt nicht gefunden";
      updateAnalysis(); // Auch hier eine Analyse durchführen
    }
  });

  // Speicherlogik für den Save-Button
  document.getElementById("save-button").addEventListener("click", function () {
    const updatedPromptText = textarea.value.trim();
    if (!updatedPromptText) {
      alert("Prompt cannot be empty!");
      return;
    }

    chrome.storage.local.get(folderId, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      const folder = data[folderId];
      if (folder && folder.prompts[promptIndex] !== undefined) {
        folder.prompts[promptIndex] = updatedPromptText;
        chrome.storage.local.set({ [folderId]: folder }, function () {
          if (chrome.runtime.lastError) {
            console.error("Error saving data:", chrome.runtime.lastError);
          } else {
            console.log("Prompt updated:", updatedPromptText);
            window.close(); // Schließe den Tab nach dem Speichern
          }
        });
      }
    });
  });

  // Initiale Analyse für den Fall, dass bereits Inhalt im Textfeld steht
  updateAnalysis();

  // Event-Listener für Änderungen
  textarea.addEventListener("input", updateAnalysis);
});
