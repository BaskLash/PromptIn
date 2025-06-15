function showCreatePromptModal(category) {
  const modal = document.createElement("div");
  modal.className = "modal";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";

  const closeSpan = document.createElement("span");
  closeSpan.className = "close";
  closeSpan.innerHTML = "×";

  const headerTitle = document.createElement("h2");
  headerTitle.textContent = "Create New Prompt";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  const formContainer = document.createElement("div");
  formContainer.className = "form-container";

  formContainer.innerHTML = `
      <label>Title:</label>
      <input type="text" id="prompt-title" placeholder="Title eingeben" required>
      <label>Description:</label>
      <textarea id="prompt-description" placeholder="Enter a description"></textarea>
      <label>Content:</label>
      <textarea id="prompt-content" placeholder="Enter prompt content" required></textarea>
      <label>Type:</label>
      <select id="prompt-type" required>
        <option value="" disabled selected>Select type</option>
        <option value="System">Textgeneration</option>
        <option value="User">Zusammenfassung</option>
        <option value="User">Umschreiben</option>
        <option value="User">Übersetzen</option>
        <option value="User">Codegenerierung</option>
        <option value="User">Analyse</option>
        <option value="User">Ideenfindung</option>
        <option value="User">Werbetexte</option>
        <option value="User">Prompt Engineering</option>
        <option value="Assistant">Assistant</option>
      </select>
      <label>Compatible Models:</label>
      <div class="checkbox-group" id="prompt-compatible">
        <label><input type="checkbox" name="compatible" value="Grok"> Grok</label>
        <label><input type="checkbox" name="compatible" value="Gemini"> Gemini</label>
        <label><input type="checkbox" name="compatible" value="ChatGPT"> ChatGPT</label>
        <label><input type="checkbox" name="compatible" value="Claude"> Claude</label>
        <label><input type="checkbox" name="compatible" value="BlackBox"> BlackBox</label>
        <label><input type="checkbox" name="compatible" value="GitHub Copilot"> GitHub Copilot</label>
        <label><input type="checkbox" name="compatible" value="Microsoft Copilot"> Microsoft Copilot</label>
        <label><input type="checkbox" name="compatible" value="Mistral"> Mistral</label>
        <label><input type="checkbox" name="compatible" value="DuckDuckGo"> DuckDuckGo</label>
        <label><input type="checkbox" name="compatible" value="Perplexity"> Perplexity</label>
        <label><input type="checkbox" name="compatible" value="DeepSeek"> DeepSeek</label>
        <label><input type="checkbox" name="compatible" value="Deepai"> Deepai</label>
        <label><input type="checkbox" name="compatible" value="Qwen AI"> Qwen AI</label>
      </div>
      <label>Incompatible Models:</label>
      <div class="checkbox-group" id="prompt-incompatible">
        <label><input type="checkbox" name="incompatible" value="Grok"> Grok</label>
        <label><input type="checkbox" name="incompatible" value="Gemini"> Gemini</label>
        <label><input type="checkbox" name="incompatible" value="ChatGPT"> ChatGPT</label>
        <label><input type="checkbox" name="incompatible" value="Claude"> Claude</label>
        <label><input type="checkbox" name="incompatible" value="BlackBox"> BlackBox</label>
        <label><input type="checkbox" name="incompatible" value="GitHub Copilot"> GitHub Copilot</label>
        <label><input type="checkbox" name="incompatible" value="Microsoft Copilot"> Microsoft Copilot</label>
        <label><input type="checkbox" name="incompatible" value="Mistral"> Mistral</label>
        <label><input type="checkbox" name="incompatible" value="DuckDuckGo"> DuckDuckGo</label>
        <label><input type="checkbox" name="incompatible" value="Perplexity"> Perplexity</label>
        <label><input type="checkbox" name="incompatible" value="DeepSeek"> DeepSeek</label>
        <label><input type="checkbox" name="incompatible" value="Deepai"> Deepai</label>
        <label><input type="checkbox" name="incompatible" value="Qwen AI"> Qwen AI</label>
      </div>
      <label>Tags:</label>
      <div class="checkbox-group" id="prompt-tags">
      </div>
      <div class="tag-input-group">
        <input type="text" id="new-tag" placeholder="New Tag">
        <button type="button" class="action-btn" id="add-tag-btn">Add new Tag</button>
      </div>
      <label>Favorite:</label>
      <div class="checkbox-group">
        <label><input type="checkbox" id="prompt-favorite" name="favorite"> Mark as favorite</label>
      </div>
      <label>Folder:</label>
      <select id="prompt-folder">
        <option value="" ${
          !category ||
          category === "All Prompts" ||
          category === "Favorites" ||
          category === "Single Prompts" ||
          category === "Categorised Prompts" ||
          category === "Trash" ||
          category === "Dynamic Prompts" ||
          category === "Static Prompts" ||
          category === "Unused Prompts"
            ? "selected"
            : ""
        }>No Folder</option>
      </select>
      <button type="button" class="action-btn" id="create-prompt-btn">Create Prompt</button>
    `;

  // Lade verfügbare Tags
  chrome.storage.local.get("tags", (data) => {
    const tagContainer = formContainer.querySelector("#prompt-tags");
    const tags = data.tags || [
      "SEO",
      "Marketing",
      "Social Media",
      "Advertisement",
      "Copywriting",
      "Productivity",
      "E-Commerce",
      "Education",
      "Tech",
      "Healthcare",
      "HR",
    ];
    tags.forEach((tag) => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" name="tags" value="${tag}"> ${tag}`;
      tagContainer.appendChild(label);
    });
  });

  // Lade verfügbare Ordner in das Dropdown
  chrome.storage.local.get(null, (data) => {
    const folderSelect = formContainer.querySelector("#prompt-folder");
    const folders = Object.entries(data)
      .filter(([, topic]) => topic.prompts && !topic.isHidden && !topic.isTrash)
      .map(([id, topic]) => ({ id, name: topic.name }));

    folders.forEach((folder) => {
      const option = document.createElement("option");
      option.value = folder.id;
      option.textContent = folder.name;
      if (category && folder.name.toLowerCase() === category.toLowerCase()) {
        option.selected = true;
      }
      folderSelect.appendChild(option);
    });
  });

  // Tag hinzufügen
  formContainer.querySelector("#add-tag-btn").addEventListener("click", () => {
    const newTagInput = formContainer.querySelector("#new-tag");
    const newTag = newTagInput.value.trim();
    if (
      newTag &&
      !formContainer.querySelector(`#prompt-tags input[value="${newTag}"]`)
    ) {
      chrome.storage.local.get("tags", (data) => {
        const tags = data.tags || [];
        if (!tags.includes(newTag)) {
          tags.push(newTag);
          chrome.storage.local.set({ tags }, () => {
            const tagContainer = formContainer.querySelector("#prompt-tags");
            const label = document.createElement("label");
            label.innerHTML = `<input type="checkbox" name="tags" value="${newTag}" checked> ${newTag}`;
            tagContainer.appendChild(label);
            newTagInput.value = "";
          });
        } else {
          alert("Tag existiert bereits!");
        }
      });
    } else if (!newTag) {
      alert("Tag darf nicht leer sein!");
    }
  });

  // Event-Listener für den "Create Prompt"-Button
  formContainer
    .querySelector("#create-prompt-btn")
    .addEventListener("click", () => {
      const title = document.getElementById("prompt-title").value.trim();
      const description = document
        .getElementById("prompt-description")
        .value.trim();
      const content = document.getElementById("prompt-content").value.trim();
      const type = document.getElementById("prompt-type").value;
      const compatibleModels = Array.from(
        document.querySelectorAll(
          "#prompt-compatible input[name='compatible']:checked"
        )
      ).map((checkbox) => checkbox.value);
      const incompatibleModels = Array.from(
        document.querySelectorAll(
          "#prompt-incompatible input[name='incompatible']:checked"
        )
      ).map((checkbox) => checkbox.value);
      const tags = Array.from(
        document.querySelectorAll("#prompt-tags input[name='tags']:checked")
      ).map((checkbox) => checkbox.value);
      const isFavorite = document.getElementById("prompt-favorite").checked;
      const folderId = document.getElementById("prompt-folder").value;

      let folderName = "Single Prompt";
      if (folderId) {
        const selectedOption = document.querySelector(
          `#prompt-folder option[value="${folderId}"]`
        );
        folderName = selectedOption ? selectedOption.textContent : folderName;
      }

      const newPrompt = {
        title,
        description,
        content,
        type,
        compatibleModels: compatibleModels,
        incompatibleModels: incompatibleModels,
        tags: tags,
        isFavorite,
        folderId: folderId || null,
        folderName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastUsed: null,
        versions: [
          {
            versionId: generateUUID(),
            title,
            description,
            content,
            timestamp: Date.now(),
          },
        ],
        metaChangeLog: [],
      };

      saveNewPrompt(newPrompt, folderId);
      modal.remove();
      handleCategoryClick(category);
    });

  modalHeader.appendChild(closeSpan);
  modalHeader.appendChild(headerTitle);
  modalBody.appendChild(formContainer);
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  closeSpan.onclick = () => modal.remove();
  window.onclick = (event) => {
    if (event.target === modal) modal.remove();
  };
}
function saveNewPrompt(prompt, folderId) {
  if (!prompt.id) {
    prompt.id = generateUUID(); // Korrigierter Tippfehler
  }
  chrome.storage.local.get(null, (data) => {
    let targetFolderId = folderId;
    let folderName = prompt.folderName || "Single Prompt";

    // Prüfe, ob ein existierender Ordner vorhanden ist
    const folderEntry = folderId
      ? Object.entries(data).find(
          ([id, topic]) =>
            id === folderId &&
            topic.prompts &&
            !topic.isHidden &&
            !topic.isTrash
        )
      : null;

    if (folderEntry) {
      // Speichere im existierenden Ordner
      targetFolderId = folderEntry[0];
      const topic = folderEntry[1];
      folderName = topic.name;
      topic.prompts = topic.prompts || [];

      topic.prompts.push({
        ...prompt,
        folderId: targetFolderId, // Setze folderId explizit
        folderName,
        compatibleModels: prompt.compatibleModels || [],
        incompatibleModels: prompt.incompatibleModels || [],
        tags: prompt.tags || [],
        metaChangeLog: prompt.metaChangeLog || [],
      });

      chrome.storage.local.set({ [targetFolderId]: topic }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving prompt:", chrome.runtime.lastError);
          alert("Fehler beim Speichern des Prompts.");
        } else {
          // Aktualisiere die Tabelle sofort
          const updatedPrompts = topic.prompts.map((p) => ({
            ...p,
            folderId: targetFolderId,
            folderName: topic.name,
          }));
          const category =
            document.querySelector(".main-header h1").textContent;
          if (
            category === "All Prompts" ||
            category === topic.name ||
            (category === "Favorites" && prompt.isFavorite) ||
            (category === "Single Prompts" && !folderId) ||
            (category === "Dynamic Prompts" &&
              prompt.content &&
              /\{[^}]+\}/.test(prompt.content)) ||
            (category === "Static Prompts" &&
              prompt.content &&
              !/\{[^}]+\}/.test(prompt.content)) ||
            (category === "Unused Prompts" && !prompt.lastUsed)
          ) {
            // Hole die aktuellen Prompts für die Kategorie
            chrome.storage.local.get(null, (updatedData) => {
              let filteredPrompts = [];
              const isVisibleTopic = (t) =>
                t.prompts && !t.isHidden && !t.isTrash;
              const getPromptObjects = (t, id) =>
                (t.prompts || []).map((p) => ({
                  ...p,
                  folderId: id,
                  folderName: t.name || "N/A",
                }));

              switch (category) {
                case "All Prompts":
                  filteredPrompts = Object.entries(updatedData)
                    .filter(([, t]) => isVisibleTopic(t))
                    .flatMap(([id, t]) => getPromptObjects(t, id));
                  break;
                case "Favorites":
                  filteredPrompts = Object.entries(updatedData)
                    .filter(([, t]) => isVisibleTopic(t))
                    .flatMap(([id, t]) =>
                      t.prompts
                        .filter((p) => p.isFavorite)
                        .map((p) => ({
                          ...p,
                          folderId: id,
                          folderName: t.name || "N/A",
                        }))
                    );
                  break;
                case "Single Prompts":
                  filteredPrompts = Object.entries(updatedData)
                    .filter(([, t]) => t.prompts && t.isHidden && !t.isTrash)
                    .flatMap(([id, t]) => getPromptObjects(t, id));
                  break;
                case "Dynamic Prompts":
                  filteredPrompts = Object.entries(updatedData).flatMap(
                    ([id, t]) =>
                      (t.prompts || [])
                        .filter((p) => p.content && /\{[^}]+\}/.test(p.content))
                        .map((p) => ({
                          ...p,
                          folderId: id,
                          folderName: t.name || "N/A",
                        }))
                  );
                  break;
                case "Static Prompts":
                  filteredPrompts = Object.entries(updatedData)
                    .filter(([, t]) => isVisibleTopic(t))
                    .flatMap(([id, t]) =>
                      t.prompts
                        .filter(
                          (p) => p.content && !/\{[^}]+\}/.test(p.content)
                        )
                        .map((p) => ({
                          ...p,
                          folderId: id,
                          folderName: t.name || "N/A",
                        }))
                    );
                  break;
                case "Unused Prompts":
                  filteredPrompts = Object.entries(updatedData)
                    .filter(([, t]) => isVisibleTopic(t))
                    .flatMap(([id, t]) =>
                      t.prompts
                        .filter((p) => !p.lastUsed)
                        .map((p) => ({
                          ...p,
                          folderId: id,
                          folderName: t.name || "N/A",
                        }))
                    );
                  break;
                default:
                  filteredPrompts = Object.entries(updatedData)
                    .filter(
                      ([, t]) =>
                        t?.name?.toLowerCase() === category.toLowerCase() &&
                        !t.isHidden &&
                        !t.isTrash
                    )
                    .flatMap(([id, t]) => getPromptObjects(t, id));
                  break;
              }
              renderPrompts(filteredPrompts);
            });
          }
        }
      });
    } else {
      // Einzelprompt ohne Ordner
      targetFolderId = `single_prompt_${Date.now()}`;
      folderName = "Single Prompt";
      const newTopic = {
        name: folderName,
        prompts: [
          {
            ...prompt,
            folderId: targetFolderId, // Setze folderId explizit
            folderName,
            compatibleModels: prompt.compatibleModels || [],
            incompatibleModels: prompt.incompatibleModels || [],
            tags: prompt.tags || [],
            metaChangeLog: prompt.metaChangeLog || [],
          },
        ],
        isHidden: true,
        isTrash: false,
      };
      chrome.storage.local.set({ [targetFolderId]: newTopic }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving prompt:", chrome.runtime.lastError);
          alert("Fehler beim Speichern des Prompts.");
        } else {
          // Aktualisiere die Tabelle sofort
          const category =
            document.querySelector(".main-header h1").textContent;
          if (
            category === "All Prompts" ||
            category === "Single Prompts" ||
            (category === "Favorites" && prompt.isFavorite) ||
            (category === "Dynamic Prompts" &&
              prompt.content &&
              /\{[^}]+\}/.test(prompt.content)) ||
            (category === "Static Prompts" &&
              prompt.content &&
              !/\{[^}]+\}/.test(prompt.content)) ||
            (category === "Unused Prompts" && !prompt.lastUsed)
          ) {
            // Hole die aktuellen Prompts für die Kategorie
            chrome.storage.local.get(null, (updatedData) => {
              let filteredPrompts = [];
              const isVisibleTopic = (t) =>
                t.prompts && !t.isHidden && !t.isTrash;
              const isHiddenTopic = (t) =>
                t.prompts && t.isHidden && !t.isTrash;
              const getPromptObjects = (t, id) =>
                (t.prompts || []).map((p) => ({
                  ...p,
                  folderId: id,
                  folderName: t.name || "N/A",
                }));

              switch (category) {
                case "All Prompts":
                  filteredPrompts = Object.entries(updatedData)
                    .filter(([, t]) => isVisibleTopic(t))
                    .flatMap(([id, t]) => getPromptObjects(t, id));
                  break;
                case "Favorites":
                  filteredPrompts = Object.entries(updatedData)
                    .filter(([, t]) => isVisibleTopic(t) || isHiddenTopic(t))
                    .flatMap(([id, t]) =>
                      t.prompts
                        .filter((p) => p.isFavorite)
                        .map((p) => ({
                          ...p,
                          folderId: id,
                          folderName: t.name || "N/A",
                        }))
                    );
                  break;
                case "Single Prompts":
                  filteredPrompts = Object.entries(updatedData)
                    .filter(([, t]) => isHiddenTopic(t))
                    .flatMap(([id, t]) => getPromptObjects(t, id));
                  break;
                case "Dynamic Prompts":
                  filteredPrompts = Object.entries(updatedData).flatMap(
                    ([id, t]) =>
                      (t.prompts || [])
                        .filter((p) => p.content && /\{[^}]+\}/.test(p.content))
                        .map((p) => ({
                          ...p,
                          folderId: id,
                          folderName: t.name || "N/A",
                        }))
                  );
                  break;
                case "Static Prompts":
                  filteredPrompts = Object.entries(updatedData)
                    .filter(([, t]) => isVisibleTopic(t))
                    .flatMap(([id, t]) =>
                      t.prompts
                        .filter(
                          (p) => p.content && !/\{[^}]+\}/.test(p.content)
                        )
                        .map((p) => ({
                          ...p,
                          folderId: id,
                          folderName: t.name || "N/A",
                        }))
                    );
                  break;
                case "Unused Prompts":
                  filteredPrompts = Object.entries(updatedData)
                    .filter(([, t]) => isVisibleTopic(t) || isHiddenTopic(t))
                    .flatMap(([id, t]) =>
                      t.prompts
                        .filter((p) => !p.lastUsed)
                        .map((p) => ({
                          ...p,
                          folderId: id,
                          folderName: t.name || "N/A",
                        }))
                    );
                  break;
              }
              renderPrompts(filteredPrompts);
            });
          }
        }
      });
    }
  });
}
function moveToFolder(prompt, folderId, row) {
  const modal = document.createElement("div");
  modal.className = "modal";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";

  const closeSpan = document.createElement("span");
  closeSpan.className = "close";
  closeSpan.innerHTML = "×";

  const headerTitle = document.createElement("h2");
  headerTitle.textContent = "Prompt in Ordner verschieben";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  const form = document.createElement("form");
  form.innerHTML = `
    <label>Zielordner:</label>
    <select id="target-folder" required>
      <option value="">Kein Ordner</option>
    </select>
    <button type="submit" class="action-btn">Verschieben</button>
  `;

  chrome.storage.local.get(null, (data) => {
    const folderSelect = form.querySelector("#target-folder");
    const folders = Object.entries(data)
      .filter(
        ([id, topic]) =>
          topic.prompts && !topic.isHidden && !topic.isTrash && id !== folderId
      )
      .map(([id, topic]) => ({ id, name: topic.name }));

    folders.forEach((folder) => {
      const option = document.createElement("option");
      option.value = folder.id;
      option.textContent = folder.name;
      folderSelect.appendChild(option);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newFolderId = form.querySelector("#target-folder").value;

    chrome.storage.local.get(
      [folderId, newFolderId, "trash_folder"],
      (data) => {
        const topic = data[folderId];
        if (!topic || !topic.prompts) return;

        const promptIndex = topic.prompts.findIndex(
          (p) => p.title === prompt.title && p.content === prompt.content
        );
        if (promptIndex === -1) return;

        const [movedPrompt] = topic.prompts.splice(promptIndex, 1);
        let targetTopic;
        let targetFolderId = newFolderId;
        let folderName = "Single Prompt";

        if (newFolderId) {
          targetTopic = data[newFolderId] || {
            name: data[newFolderId]?.name || "Unbenannt",
            prompts: [],
            isHidden: false,
            isTrash: false,
          };
          folderName = targetTopic.name;
        } else {
          targetFolderId = `single_prompt_${Date.now()}`;
          targetTopic = {
            name: "Single Prompt",
            prompts: [],
            isHidden: true,
            isTrash: false,
          };
        }

        movedPrompt.folderId = targetFolderId;
        movedPrompt.folderName = folderName;
        targetTopic.prompts.push(movedPrompt);

        chrome.storage.local.set(
          { [folderId]: topic, [targetFolderId]: targetTopic },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Fehler beim Verschieben der Prompt:",
                chrome.runtime.lastError
              );
              alert("Fehler beim Verschieben der Prompt.");
            } else {
              row.remove();
              const category =
                document.querySelector(".main-header h1").textContent;
              handleCategoryClick(category);
              modal.remove();
            }
          }
        );
      }
    );
  });

  modalHeader.appendChild(closeSpan);
  modalHeader.appendChild(headerTitle);
  modalBody.appendChild(form);
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  closeSpan.onclick = () => modal.remove();
  window.onclick = (event) => {
    if (event.target === modal) modal.remove();
  };
}
function moveToTrash(prompt, folderId, row) {
  if (
    !confirm("Möchtest du diese Prompt wirklich in den Papierkorb verschieben?")
  )
    return;

  chrome.storage.local.get([folderId, "trash_folder"], (data) => {
    const topic = data[folderId];
    const trashFolder = data["trash_folder"] || {
      name: "Papierkorb",
      prompts: [],
      isTrash: true,
      isHidden: false,
    };

    if (!topic || !topic.prompts) return;

    const promptIndex = topic.prompts.findIndex(
      (p) => p.title === prompt.title && p.content === prompt.content
    );
    if (promptIndex === -1) return;

    const [movedPrompt] = topic.prompts.splice(promptIndex, 1);
    movedPrompt.folderId = "trash_folder";
    movedPrompt.folderName = "Papierkorb";
    trashFolder.prompts.push(movedPrompt);

    chrome.storage.local.set(
      { [folderId]: topic, trash_folder: trashFolder },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Fehler beim Verschieben in den Papierkorb:",
            chrome.runtime.lastError
          );
          alert("Fehler beim Verschieben der Prompt in den Papierkorb.");
        } else {
          row.remove();
          const category =
            document.querySelector(".main-header h1").textContent;
          handleCategoryClick(category);
        }
      }
    );
  });
}
function sharePrompt(prompt) {
  if (navigator.share) {
    navigator
      .share({
        title: prompt.title,
        text: prompt.content,
      })
      .catch((err) => {
        console.error("Failed to share prompt:", err);
      });
  } else {
    alert("Sharing is not supported in this browser.");
  }
}

function exportPrompt(prompt, folderId) {
  chrome.storage.local.get(folderId, (data) => {
    const topic = data[folderId];
    if (!topic || !topic.prompts) {
      alert("Fehler: Prompt nicht gefunden.");
      return;
    }

    const promptIndex = topic.prompts.findIndex(
      (p) => p.title === prompt.title && p.content === prompt.content
    );
    if (promptIndex === -1) {
      alert("Fehler: Prompt nicht gefunden.");
      return;
    }

    const fullPrompt = topic.prompts[promptIndex];
    const exportData = {
      ...fullPrompt,
      exportedAt: Date.now(), // Zeitstempel des Exports
    };

    // JSON erstellen und Datei herunterladen
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt_${fullPrompt.title.replace(
      /[^a-z0-9]/gi,
      "_"
    )}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
function copyPrompt(prompt, folderId) {
  const textToCopy = prompt.content || prompt.title || "";
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      alert("Prompt copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy prompt:", err);
      alert("Failed to copy prompt.");
    });
}
function renamePrompt(prompt, folderId, row) {
  chrome.storage.local.get(folderId, (data) => {
    const topic = data[folderId];
    if (!topic || !topic.prompts) return;

    const promptIndex = topic.prompts.findIndex(
      (p) => p.title === prompt.title && p.content === prompt.content
    );
    if (promptIndex === -1) return;

    const titleCell = row.querySelector("td:nth-child(2)");
    const originalTitle = titleCell.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalTitle;
    input.style.width = "100%";
    titleCell.innerHTML = "";
    titleCell.appendChild(input);
    input.focus();

    const saveNewName = () => {
      const newName = input.value.trim();
      if (newName && newName !== originalTitle) {
        const updatedPrompt = {
          ...topic.prompts[promptIndex],
          title: newName,
          updatedAt: Date.now(),
          versions: topic.prompts[promptIndex].versions || [],
        };
        updatedPrompt.versions.push({
          versionId: generateUUID(),
          title: newName,
          description: updatedPrompt.description || "",
          content: updatedPrompt.content || "",
          timestamp: Date.now(),
        });
        if (updatedPrompt.versions.length > 50) {
          updatedPrompt.versions.shift();
        }
        topic.prompts[promptIndex] = updatedPrompt;
        chrome.storage.local.set({ [folderId]: topic }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error renaming prompt:", chrome.runtime.lastError);
            alert("Error renaming prompt.");
          } else {
            titleCell.textContent = newName;
            prompt.title = newName; // Update local prompt object
          }
        });
      } else {
        titleCell.textContent = originalTitle;
      }
    };

    input.addEventListener("blur", saveNewName);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveNewName();
    });
  });
}

function toggleFavorite(prompt, folderId, row) {
  chrome.storage.local.get(folderId, (data) => {
    const topic = data[folderId];
    if (!topic || !topic.prompts) return;

    const promptIndex = topic.prompts.findIndex(
      (p) => p.title === prompt.title && p.content === prompt.content
    );
    if (promptIndex === -1) return;

    const updatedPrompt = {
      ...topic.prompts[promptIndex],
      isFavorite: !topic.prompts[promptIndex].isFavorite,
      updatedAt: Date.now(),
      metaChangeLog: topic.prompts[promptIndex].metaChangeLog || [],
    };

    updatedPrompt.metaChangeLog.push({
      timestamp: Date.now(),
      changes: {
        isFavorite: {
          from: topic.prompts[promptIndex].isFavorite,
          to: updatedPrompt.isFavorite,
        },
      },
    });
    if (updatedPrompt.metaChangeLog.length > 50) {
      updatedPrompt.metaChangeLog.shift();
    }

    topic.prompts[promptIndex] = updatedPrompt;
    chrome.storage.local.set({ [folderId]: topic }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error toggling favorite:", chrome.runtime.lastError);
        alert("Error toggling favorite.");
      } else {
        prompt.isFavorite = updatedPrompt.isFavorite; // Update local prompt
        row.querySelector('[data-action="add-to-favorites"]').textContent =
          updatedPrompt.isFavorite
            ? "Remove from Favorites"
            : "Add to Favorites";
        const category = document.querySelector(".main-header h1").textContent;
        handleCategoryClick(category);
      }
    });
  });
}

function deletePrompt(prompt, folderId, row) {
  if (!confirm("Are you sure you want to move this prompt to trash?")) return;

  chrome.storage.local.get([folderId, "trash_folder"], (data) => {
    const topic = data[folderId];
    const trashFolder = data["trash_folder"] || {
      prompts: [],
      isTrash: true,
    };

    if (!topic || !topic.prompts) return;

    const promptIndex = topic.prompts.findIndex(
      (p) => p.title === prompt.title && p.content === prompt.content
    );
    if (promptIndex === -1) return;

    const [deletedPrompt] = topic.prompts.splice(promptIndex, 1);
    trashFolder.prompts.push(deletedPrompt);

    chrome.storage.local.set(
      { [folderId]: topic, trash_folder: trashFolder },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error moving prompt to trash:",
            chrome.runtime.lastError
          );
          alert("Error moving prompt to trash.");
        } else {
          row.remove();
        }
      }
    );
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function editPromptDetails(folderId, promptIndex, prompt, sidebarContent) {
  // Validierung der Eingaben
  if (!folderId || promptIndex < 0 || !prompt || !sidebarContent) {
    console.error("Invalid parameters in editPromptDetails");
    return;
  }

  sidebarContent.innerHTML = `
    <label>Title</label>
    <input type="text" value="${escapeHTML(
      prompt.title || ""
    )}" id="edit-title">
    <label>Description</label>
    <textarea id="edit-description">${escapeHTML(
      prompt.description || ""
    )}</textarea>
    <label>Content</label>
    <textarea id="edit-content">${escapeHTML(prompt.content || "")}</textarea>
    <label>Type</label>
    <select id="edit-type">
      <option value="System" ${
        prompt.type === "System" ? "selected" : ""
      }>System (Textgeneration)</option>
      <option value="Zusammenfassung" ${
        prompt.type === "Zusammenfassung" ? "selected" : ""
      }>User (Zusammenfassung)</option>
      <option value="Umschreiben" ${
        prompt.type === "Umschreiben" ? "selected" : ""
      }>User (Umschreiben)</option>
      <option value="Übersetzen" ${
        prompt.type === "Übersetzen" ? "selected" : ""
      }>User (Übersetzen)</option>
      <option value="Codegenerierung" ${
        prompt.type === "Codegenerierung" ? "selected" : ""
      }>User (Codegenerierung)</option>
      <option value="Analyse" ${
        prompt.type === "Analyse" ? "selected" : ""
      }>User (Analyse)</option>
      <option value="Ideenfindung" ${
        prompt.type === "Ideenfindung" ? "selected" : ""
      }>User (Ideenfindung)</option>
      <option value="Werbetexte" ${
        prompt.type === "Werbetexte" ? "selected" : ""
      }>User (Werbetexte)</option>
      <option value="Prompt Engineering" ${
        prompt.type === "Prompt Engineering" ? "selected" : ""
      }>User (Prompt Engineering)</option>
      <option value="Assistant" ${
        prompt.type === "Assistant" ? "selected" : ""
      }>Assistant</option>
    </select>

    <label>Compatible Models</label>
    <div class="checkbox-group" id="edit-compatible">
      ${[
        "Grok",
        "Gemini",
        "ChatGPT",
        "Claude",
        "BlackBox",
        "GitHub Copilot",
        "Microsoft Copilot",
        "Mistral",
        "DuckDuckGo",
        "Perplexity",
        "DeepSeek",
        "Deepai",
        "Qwen AI",
      ]
        .map(
          (model) =>
            `<label><input type="checkbox" name="compatible" value="${escapeHTML(
              model
            )}" ${
              prompt.compatibleModels?.includes(model) ? "checked" : ""
            }> ${escapeHTML(model)}</label>`
        )
        .join("")}
    </div>

    <label>Incompatible Models</label>
    <div class="checkbox-group" id="edit-incompatible">
      ${[
        "Grok",
        "Gemini",
        "ChatGPT",
        "Claude",
        "BlackBox",
        "GitHub Copilot",
        "Microsoft Copilot",
        "Mistral",
        "DuckDuckGo",
        "Perplexity",
        "DeepSeek",
        "Deepai",
        "Qwen AI",
      ]
        .map(
          (model) =>
            `<label><input type="checkbox" name="incompatible" value="${escapeHTML(
              model
            )}" ${
              prompt.incompatibleModels?.includes(model) ? "checked" : ""
            }> ${escapeHTML(model)}</label>`
        )
        .join("")}
    </div>

    <label>Tags</label>
    <div class="checkbox-group" id="edit-tags">
    </div>
    <div class="tag-input-group">
      <input type="text" id="new-tag" placeholder="New Tag">
      <button type="button" class="action-btn" id="add-tag-btn">Add Tag</button>
    </div>

    <label>Favorite</label>
    <div class="checkbox-group">
      <label><input type="checkbox" id="edit-favorite" ${
        prompt.isFavorite ? "checked" : ""
      }> Mark as Favorite</label>
    </div>

    <label>Folder</label>
    <select id="edit-folder">
      <option value="" ${!prompt.folderId ? "selected" : ""}>No Folder</option>
    </select>

    <button class="save-btn">Save</button>
    <button class="cancel-btn">Cancel</button>
  `;

  // Lade Tags
  chrome.storage.local.get("tags", (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading tags:", chrome.runtime.lastError);
      return;
    }

    const tagContainer = sidebarContent.querySelector("#edit-tags");
    const tags = data.tags || [];
    tags.forEach((tag) => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" name="tags" value="${escapeHTML(
        tag
      )}" ${prompt.tags?.includes(tag) ? "checked" : ""}> ${escapeHTML(tag)}`;
      tagContainer.appendChild(label);
    });
  });

  // Tag hinzufügen
  sidebarContent.querySelector("#add-tag-btn").addEventListener("click", () => {
    const newTagInput = sidebarContent.querySelector("#new-tag");
    const newTag = newTagInput.value.trim();

    if (!newTag) {
      alert("Tag cannot be empty!");
      return;
    }

    if (
      sidebarContent.querySelector(
        `#edit-tags input[value="${escapeHTML(newTag)}"]`
      )
    ) {
      alert("Tag already exists!");
      return;
    }

    chrome.storage.local.get("tags", (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting tags:", chrome.runtime.lastError);
        return;
      }

      const tags = data.tags || [];
      tags.push(newTag);
      chrome.storage.local.set({ tags }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving tags:", chrome.runtime.lastError);
          return;
        }

        const tagContainer = sidebarContent.querySelector("#edit-tags");
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" name="tags" value="${escapeHTML(
          newTag
        )}" checked> ${escapeHTML(newTag)}`;
        tagContainer.appendChild(label);
        newTagInput.value = "";
      });
    });
  });

  chrome.storage.local.get(null, (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading folders:", chrome.runtime.lastError);
      return;
    }

    const folderSelect = sidebarContent.querySelector("#edit-folder");
    const folders = Object.entries(data)
      .filter(
        ([id, topic]) => topic.prompts && !topic.isHidden && !topic.isTrash
      )
      .map(([id, topic]) => ({ id, name: topic.name }));

    folders.forEach((folder) => {
      const option = document.createElement("option");
      option.value = folder.id;
      option.textContent = folder.name;
      if (folderId === folder.id) option.selected = true;
      folderSelect.appendChild(option);
    });
  });

  sidebarContent.querySelector(".save-btn").addEventListener("click", () => {
    chrome.storage.local.get(null, (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error loading data:", chrome.runtime.lastError);
        alert("Error loading data.");
        return;
      }

      const topic = data[folderId];
      if (!topic || !topic.prompts) {
        alert("Invalid folder or prompts data.");
        return;
      }

      let newFolderId = sidebarContent.querySelector("#edit-folder").value;
      const newFolderName = newFolderId
        ? data[newFolderId]?.name || "Single Prompt"
        : "Single Prompt";

      const compatibleModels = Array.from(
        sidebarContent.querySelectorAll(
          "#edit-compatible input[name='compatible']:checked"
        )
      ).map((cb) => cb.value);

      const incompatibleModels = Array.from(
        sidebarContent.querySelectorAll(
          "#edit-incompatible input[name='incompatible']:checked"
        )
      ).map((cb) => cb.value);

      const tags = Array.from(
        sidebarContent.querySelectorAll("#edit-tags input[name='tags']:checked")
      ).map((cb) => cb.value);

      const title = sidebarContent.querySelector("#edit-title").value.trim();
      if (!title) {
        alert("Title cannot be empty!");
        return;
      }

      const updatedPrompt = {
        ...prompt,
        title,
        description:
          sidebarContent.querySelector("#edit-description")?.value.trim() || "",
        content: sidebarContent.querySelector("#edit-content").value.trim(),
        type: sidebarContent.querySelector("#edit-type").value,
        compatibleModels,
        incompatibleModels,
        tags,
        isFavorite: sidebarContent.querySelector("#edit-favorite").checked,
        folderId: newFolderId || null,
        folderName: newFolderName,
        updatedAt: Date.now(),
        metaChangeLog: prompt.metaChangeLog || [],
      };

      // Prüfen, ob inhaltliche Änderungen (Titel, Beschreibung, Inhalt) vorliegen
      const hasContentChanges =
        (prompt.title || "") !== updatedPrompt.title ||
        (prompt.description || "") !== updatedPrompt.description ||
        (prompt.content || "") !== updatedPrompt.content;

      // Neue Version nur bei inhaltlichen Änderungen erstellen
      if (hasContentChanges) {
        updatedPrompt.versions = updatedPrompt.versions || [];
        updatedPrompt.versions.push({
          versionId: generateUUID(),
          title: updatedPrompt.title,
          description: updatedPrompt.description,
          content: updatedPrompt.content,
          timestamp: Date.now(),
        });
        if (updatedPrompt.versions.length > 50) {
          updatedPrompt.versions.shift();
        }
      }

      // Prüfen, ob Metadatenänderungen vorliegen und diese protokollieren
      const metaChanges = {};
      if ((prompt.type || "") !== updatedPrompt.type) {
        metaChanges.type = {
          from: prompt.type || "",
          to: updatedPrompt.type,
        };
      }
      if (
        JSON.stringify(prompt.compatibleModels || []) !==
        JSON.stringify(compatibleModels)
      ) {
        metaChanges.compatibleModels = {
          from: prompt.compatibleModels || [],
          to: compatibleModels,
        };
      }
      if (
        JSON.stringify(prompt.incompatibleModels || []) !==
        JSON.stringify(incompatibleModels)
      ) {
        metaChanges.incompatibleModels = {
          from: prompt.incompatibleModels || [],
          to: incompatibleModels,
        };
      }
      if (JSON.stringify(prompt.tags || []) !== JSON.stringify(tags)) {
        metaChanges.tags = { from: prompt.tags || [], to: tags };
      }
      if ((prompt.isFavorite || false) !== updatedPrompt.isFavorite) {
        metaChanges.isFavorite = {
          from: prompt.isFavorite || false,
          to: updatedPrompt.isFavorite,
        };
      }
      if ((prompt.folderId || "") !== (updatedPrompt.folderId || "")) {
        metaChanges.folderId = {
          from: prompt.folderId || "",
          to: updatedPrompt.folderId || "",
        };
      }

      // Meta-Änderungen protokollieren, wenn es welche gibt
      if (Object.keys(metaChanges).length > 0) {
        updatedPrompt.metaChangeLog.push({
          timestamp: Date.now(),
          changes: metaChanges,
        });
        if (updatedPrompt.metaChangeLog.length > 50) {
          updatedPrompt.metaChangeLog.shift();
        }
      }

      if (newFolderId !== folderId) {
        topic.prompts.splice(promptIndex, 1);
        chrome.storage.local.set({ [folderId]: topic }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error removing prompt:", chrome.runtime.lastError);
            alert("Error moving prompt.");
            return;
          }

          let targetTopic;
          if (newFolderId) {
            targetTopic = data[newFolderId] || {
              name: newFolderName,
              prompts: [],
              isHidden: false,
              isTrash: false,
            };
            targetTopic.prompts.push(updatedPrompt);
          } else {
            const singlePromptId = `single_prompt_${Date.now()}`;
            targetTopic = {
              name: "Single Prompt",
              prompts: [updatedPrompt],
              isHidden: true,
              isTrash: false,
            };
            newFolderId = singlePromptId;
          }

          chrome.storage.local.set({ [newFolderId]: targetTopic }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error saving to new folder:",
                chrome.runtime.lastError
              );
              alert("Error saving prompt.");
            } else {
              showDetailsSidebar(updatedPrompt, newFolderId);
              const category =
                document.querySelector(".main-header h1")?.textContent || "";
              handleCategoryClick(category);
            }
          });
        });
      } else {
        topic.prompts[promptIndex] = updatedPrompt;
        chrome.storage.local.set({ [folderId]: topic }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error saving prompt:", chrome.runtime.lastError);
            alert("Error saving prompt.");
          } else {
            showDetailsSidebar(updatedPrompt, folderId);
            const category =
              document.querySelector(".main-header h1")?.textContent || "";
            handleCategoryClick(category);
          }
        });
      }
    });
  });

  sidebarContent.querySelector(".cancel-btn").addEventListener("click", () => {
    showDetailsSidebar(prompt, folderId);
  });
}
