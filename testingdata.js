(function generateTestData() {
  const now = Date.now();
  const promptCount = 30;
  const folderCount = 5;

  const exampleTags = ["productivity", "writing", "ai", "code", "german", "fun", "learning"];
  const exampleTypes = ["text", "code", "utility", "story", "question"];
  const models = ["gpt-4", "gpt-3.5", "claude-2", "mistral-7b"];

  const generateUUID = () => crypto.randomUUID();
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomSubset = (arr, min = 1) =>
    arr.filter(() => Math.random() > 0.5).slice(0, Math.max(min, 1));
  const getRandomPastTimestamp = (withinDays = 30) =>
    now - Math.floor(Math.random() * withinDays * 24 * 60 * 60 * 1000);

  const generateUsageHistory = () => {
    const count = Math.floor(Math.random() * 15);
    return Array.from({ length: count }, () =>
      getRandomPastTimestamp(Math.random() > 0.3 ? 7 : 30)
    );
  };

  // 1️⃣ Folders erstellen
  const folders = {};
  for (let i = 0; i < folderCount; i++) {
    const folderId = `folder-${i + 1}`;
    folders[folderId] = {
      folderId,
      name: `Ordner ${i + 1}`,
      promptIds: [],
      isTrash: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  // 2️⃣ Prompts erstellen
  const prompts = {};
  for (let i = 0; i < promptCount; i++) {
    const promptId = `prompt-${i + 1}`;
    const promptTitle = `Beispiel Prompt #${i + 1}`;
    const promptDescription = `Beschreibung für Prompt #${i + 1}.`;
    const promptContent = `Inhalt von Prompt #${i + 1}.`;

    const usageHistory = generateUsageHistory();
    const usageCount = usageHistory.length;
    const lastUsed = usageCount > 0 ? Math.max(...usageHistory) : null;
    const createdAt = getRandomPastTimestamp(60);

    const types = randomSubset(exampleTypes);
    const tags = randomSubset(exampleTags);
    const compatibleModels = randomSubset(models);
    const incompatibleModels = models.filter((m) => !compatibleModels.includes(m));

    const folderKeys = Object.keys(folders);
    const folderId = randomItem(folderKeys);
    folders[folderId].promptIds.push(promptId); // Prompt dem Folder hinzufügen

    prompts[promptId] = {
      promptId,
      title: promptTitle,
      description: promptDescription,
      content: promptContent,
      notes: `Notizen zu Prompt #${i + 1}`,
      types,
      compatibleModels,
      incompatibleModels,
      tags,
      isFavorite: Math.random() > 0.7,
      folderId,
      createdAt,
      updatedAt: createdAt,
      usageCount,
      lastUsed,
      usageHistory,
      isTrash: Math.random() > 0.9,
      deletedAt: null,
      trashedAt: null,

      versions: [
        {
          versionId: `${createdAt}_${generateUUID()}`,
          title: promptTitle,
          description: promptDescription,
          content: promptContent,
          timestamp: createdAt,
        },
      ],

      metaChangeLog: [
        {
          timestamp: createdAt,
          changes: {
            title: { from: null, to: promptTitle },
            description: { from: null, to: promptDescription },
            content: { from: null, to: promptContent },
            types: { from: null, to: types },
            compatibleModels: { from: null, to: compatibleModels },
            incompatibleModels: { from: null, to: incompatibleModels },
            tags: { from: null, to: tags },
            isFavorite: { from: null, to: false },
            folderId: { from: null, to: folderId },
            notes: { from: null, to: `Notizen zu Prompt #${i + 1}` },
          },
        },
      ],

      performanceHistory: [],
    };
  }

  // 3️⃣ Optional: Dummy-Workflows erzeugen
  const workflows = {};
  const promptIds = Object.keys(prompts);
  for (let i = 0; i < 5; i++) {
    const workflowId = `workflow-${i + 1}`;
    const selectedPromptIds = randomSubset(promptIds, 2);
    const steps = selectedPromptIds.map((pid, idx) => ({
      title: `Step ${idx + 1}`,
      aiModel: randomItem(models),
      promptId: pid,
      isDynamic: false,
      useCustomPrompt: false,
      parameters: {},
      openInNewTab: false,
      isHidden: false,
    }));

    workflows[workflowId] = {
      name: `Workflow #${i + 1}`,
      steps,
      createdAt: now,
      lastUsed: null,
    };
  }

  // 4️⃣ Speichern in chrome.storage.local
  chrome.storage.local.set(
    {
      prompts,
      folders,
      tags: exampleTags,
      types: exampleTypes,
      workflows,
    },
    () => {
      console.log("✅ Testdaten erfolgreich gespeichert:");
      console.log(`📦 Prompts: ${Object.keys(prompts).length}`);
      console.log(`📁 Folders: ${Object.keys(folders).length}`);
      console.log(`🏷️ Tags: ${exampleTags.length}`);
      console.log(`🧩 Types: ${exampleTypes.length}`);
      console.log(`🧠 Workflows: ${Object.keys(workflows).length}`);
    }
  );
})();
