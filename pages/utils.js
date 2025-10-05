function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
function generatePromptId(folderId, promptIndex) {
  return `${folderId}_${promptIndex}`;
}
function parsePromptId(promptId) {
  const lastUnderscoreIndex = promptId.lastIndexOf("_");
  if (lastUnderscoreIndex === -1) return null;
  return {
    folderId: promptId.substring(0, lastUnderscoreIndex),
    promptIndex: parseInt(promptId.substring(lastUnderscoreIndex + 1)),
  };
}
function savePrompt(
  promptData,
  {
    folderId = null,
    overwritePromptId = null,
    onSuccess,
    showInUI = false,
  } = {}
) {
  chrome.storage.local.get(["prompts", "folders"], (data) => {
    const prompts = data.prompts || {};
    const folders = data.folders || {};
    const now = Date.now();

    const id =
      overwritePromptId ||
      promptData.promptId ||
      `${Date.now()}_${generateUUID()}`;

    const existing = prompts[id] || {};

    const newPrompt = {
      ...existing,
      promptId: id,
      title: promptData.title || "Untitled Prompt",
      description: promptData.description || "",
      content: promptData.content || "",
      types: promptData.type || "text",
      isFavorite: promptData.isFavorite || false,
      tags: promptData.tags || [],
      notes: promptData.notes || "",
      folderId: folderId,
      createdAt: existing.createdAt || now,
      updatedAt: now,
      compatibleModels: promptData.compatibleModels || "",
      incompatibleModels: promptData.incompatibleModels || "",

      usageCount: 0,
      lastUsed: null,
      usageHistory: [],
      isTrash: false,
      deletedAt: null,
      trashedAt: null,

      versions: existing.versions || [],
      metaChangeLog: existing.metaChangeLog || [],
      performanceHistory: existing.performanceHistory || [],
    };

    // Neue Version anhängen
    if (!overwritePromptId || promptData.forceNewVersion) {
      newPrompt.versions.push({
        versionId: `${Date.now()}_${generateUUID()}`,
        title: newPrompt.title,
        description: newPrompt.description,
        content: newPrompt.content,
        timestamp: now,
      });
    }

    // Meta-Änderung loggen
    if (!overwritePromptId) {
      newPrompt.metaChangeLog.push({
        timestamp: now,
        changes: {
          title: { from: null, to: newPrompt.title },
          description: { from: null, to: newPrompt.description },
          content: { from: null, to: newPrompt.content },
          folderId: { from: null, to: folderId },
        },
      });
    }

    prompts[id] = newPrompt;

    // Ordner aktualisieren
    if (folderId) {
      folders[folderId] = folders[folderId] || {
        name: "Unbenannt",
        promptIds: [],
      };
      if (!folders[folderId].promptIds.includes(id)) {
        folders[folderId].promptIds.push(id);
      }
    }

    chrome.storage.local.set({ prompts, folders }, () => {
      if (chrome.runtime.lastError) {
        console.error("Fehler beim Speichern:", chrome.runtime.lastError);
        alert("Fehler beim Speichern.");
      } else {
        if (onSuccess) onSuccess(newPrompt);
        if (showInUI && typeof updateTable === "function") {
          updateTable(newPrompt, folders);
        }
      }
    });
  });
}
