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
      <style>
        .dynamic-notice {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 5px;
          margin-bottom: 15px;
          font-size: 14px;
          color: #555;
        }
        .dynamic-notice span {
          flex-grow: 1;
        }
        .dynamic-notice button {
          padding: 5px 10px;
          font-size: 14px;
        }
      </style>
      <label>Title:</label>
      <input type="text" id="prompt-title" placeholder="Title eingeben" required>
      <label>Description:</label>
      <textarea id="prompt-description" placeholder="Enter a description"></textarea>
      <label>Content:</label>
      <textarea id="prompt-content" placeholder="Enter prompt content" required></textarea>
      <div class="dynamic-notice">
        <span>Any value written in the format {{variable}} will be treated as a dynamic parameter and used during workflow execution.</span>
        <button type="button" class="action-btn" id="insert-variable-btn">{{Set Variable}}</button>
      </div>
      <label>Type:</label>
      <select id="prompt-type" required>
        <option value="" disabled selected>Wähle Typ</option>
        <!-- Generative Aufgaben -->
        <option value="textgen">Textgeneration</option>
        <option value="rewrite">Umschreiben</option>
        <option value="summarize">Zusammenfassen</option>
        <option value="translate">Übersetzen</option>
        <option value="ideation">Ideenfindung</option>
        <option value="adcopy">Werbetexten</option>
        <option value="storytelling">Storytelling</option>
        <!-- Analytische Aufgaben -->
        <option value="analyze">Analyse</option>
        <option value="classify">Klassifikation</option>
        <option value="extract">Informationsextraktion</option>
        <option value="compare">Vergleichen / Bewerten</option>
        <!-- Technische Aufgaben -->
        <option value="codegen">Codegenerierung</option>
        <option value="debug">Fehleranalyse</option>
        <option value="refactor">Code-Umschreiben</option>
        <option value="explain-code">Code erklären</option>
        <!-- Prompt-spezifische Aufgaben -->
        <option value="prompt-engineering">Prompt Engineering</option>
        <option value="meta-prompt">Meta-Prompt</option>
        <!-- Sonstige -->
        <option value="assistant">Assistant</option>
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

  // Insert variable button functionality
  formContainer
    .querySelector("#insert-variable-btn")
    .addEventListener("click", () => {
      const promptContent = formContainer.querySelector("#prompt-content");
      const startPos = promptContent.selectionStart;
      const endPos = promptContent.selectionEnd;
      const text = promptContent.value;
      const variableText = "{{variable}}";
      promptContent.value =
        text.substring(0, startPos) + variableText + text.substring(endPos);
      promptContent.focus();
      promptContent.setSelectionRange(
        startPos + variableText.length,
        startPos + variableText.length
      );
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
        usageCount: 0,
        lastUsed: null,
        notes: "",
        versions: [
          {
            versionId: generateUUID(),
            title,
            description,
            content,
            timestamp: Date.now(),
          },
        ],
        metaChangeLog: [
          {
            timestamp: Date.now(),
            changes: {
              title: { from: null, to: title },
              description: { from: null, to: description },
              content: { from: null, to: content },
              type: { from: null, to: type },
              compatibleModels: { from: [], to: compatibleModels },
              incompatibleModels: { from: [], to: incompatibleModels },
              tags: { from: [], to: tags },
              isFavorite: { from: false, to: isFavorite },
              folderId: { from: null, to: folderId || null },
              folderName: { from: null, to: folderName },
              notes: { from: null, to: "" },
            },
          },
        ],
        performanceHistory: [],
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
    prompt.id = generateUUID();
  }
  chrome.storage.local.get(null, (data) => {
    let targetFolderId = folderId;
    let folderName = prompt.folderName || "Single Prompt";
    let isHidden = false;

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

      const newPrompt = {
        ...prompt,
        folderId: targetFolderId,
        folderName,
        compatibleModels: prompt.compatibleModels || [],
        incompatibleModels: prompt.incompatibleModels || [],
        tags: prompt.tags || [],
        metaChangeLog: prompt.metaChangeLog || [],
      };

      topic.prompts.push(newPrompt);

      chrome.storage.local.set({ [targetFolderId]: topic }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving prompt:", chrome.runtime.lastError);
          alert("Fehler beim Speichern des Prompts.");
        } else {
          // Aktualisiere die Tabelle sofort im DOM, wenn passend
          updateTable(newPrompt, targetFolderId, folderName, isHidden);
        }
      });
    } else {
      // Einzelprompt ohne Ordner
      targetFolderId = `single_prompt_${Date.now()}`;
      folderName = "Single Prompt";
      isHidden = true;
      const newTopic = {
        name: folderName,
        prompts: [
          {
            ...prompt,
            folderId: targetFolderId,
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
          // Aktualisiere die Tabelle sofort im DOM, wenn passend
          updateTable(
            newTopic.prompts[0],
            targetFolderId,
            folderName,
            isHidden
          );
        }
      });
    }
  });

  function updateTable(newPrompt, targetFolderId, folderName, isHidden) {
    const tableBody = document.querySelector(".table-container tbody");
    const header = document.querySelector("#prompts-header");
    const category = header ? header.dataset.category : "All Prompts"; // Fallback auf "All Prompts"
    const isFolderPrompt =
      !isHidden &&
      targetFolderId &&
      !targetFolderId.startsWith("single_prompt_");

    // Prüfe, ob die Prompt in der aktuellen Kategorie angezeigt werden soll
    const shouldDisplay =
      category === "All Prompts" ||
      (category === folderName && isFolderPrompt) ||
      (category === "Favorites" && newPrompt.isFavorite) ||
      (category === "Single Prompts" &&
        (!targetFolderId || targetFolderId.startsWith("single_prompt_"))) ||
      (category === "Categorised Prompts" && isFolderPrompt) ||
      (category === "Dynamic Prompts" &&
        newPrompt.content &&
        /\{[^}]+\}/.test(newPrompt.content)) ||
      (category === "Static Prompts" &&
        newPrompt.content &&
        !/\{[^}]+\}/.test(newPrompt.content)) ||
      (category === "Unused Prompts" && !newPrompt.lastUsed);

    if (tableBody && shouldDisplay) {
      const row = document.createElement("tr");
      row.dataset.index = newPrompt.id;
      row.innerHTML = `
        <td><input type="checkbox" id="prompt-checkbox-${
          newPrompt.id
        }" name="prompt-checkbox" /></td>
        <td>${escapeHTML(newPrompt.title || "N/A")}</td>
        <td>${escapeHTML(newPrompt.type || "N/A")}</td>
        <td>${
          Array.isArray(newPrompt.compatibleModels)
            ? escapeHTML(newPrompt.compatibleModels.join(", "))
            : escapeHTML(newPrompt.compatibleModels || "")
        }</td>
        <td>${
          Array.isArray(newPrompt.incompatibleModels)
            ? escapeHTML(newPrompt.incompatibleModels.join(", "))
            : escapeHTML(newPrompt.incompatibleModels || "N/A")
        }</td>
        <td>${
          Array.isArray(newPrompt.tags)
            ? escapeHTML(newPrompt.tags.join(", "))
            : escapeHTML(newPrompt.tags || "")
        }</td>
        <td>${escapeHTML(folderName || "")}</td>
        <td>${
          newPrompt.lastUsed
            ? new Date(newPrompt.lastUsed).toLocaleDateString("de-DE")
            : "N/A"
        }</td>
        <td>${
          newPrompt.createdAt
            ? new Date(newPrompt.createdAt).toLocaleDateString("de-DE")
            : "N/A"
        }</td>
        <td>
          <div class="prompt-actions">
            <button class="action-btn menu-btn" aria-label="Prompt actions">...</button>
            <div class="dropdown-menu">
              <div class="dropdown-item" data-action="copy">Copy Prompt</div>
              <div class="dropdown-item" data-action="rename">Rename</div>
              <div class="dropdown-item" data-action="move-to-folder">Move to Folder</div>
              <div class="dropdown-item" data-action="share">Share</div>
              <div class="dropdown-item" data-action="add-to-favorites">${
                newPrompt.isFavorite
                  ? "Remove from Favorites"
                  : "Add to Favorites"
              }</div>
              <div class="dropdown-item" data-action="show-versions">Show Versions</div>
              <div class="dropdown-item" data-action="export">Export Prompt</div>
              <div class="dropdown-item" data-action="move-to-trash">Move to Trash</div>
            </div>
          </div>
        </td>
      `;

      // Füge Event-Listener für die Dropdown-Menü-Aktionen hinzu
      const menuBtn = row.querySelector(".menu-btn");
      const dropdown = row.querySelector(".dropdown-menu");
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".dropdown-menu").forEach((menu) => {
          if (menu !== dropdown) menu.style.display = "none";
        });
        dropdown.style.display =
          dropdown.style.display === "block" ? "none" : "block";
      });

      row.querySelectorAll(".dropdown-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          const action = item.dataset.action;
          if (action === "copy") {
            copyPrompt(newPrompt, targetFolderId);
          } else if (action === "rename") {
            renamePrompt(newPrompt, targetFolderId, row);
          } else if (action === "move-to-folder") {
            moveToFolder(newPrompt, targetFolderId, row);
          } else if (action === "share") {
            sharePrompt(newPrompt);
          } else if (action === "add-to-favorites") {
            toggleFavorite(newPrompt, targetFolderId, row);
          } else if (action === "show-versions") {
            chrome.storage.local.get(targetFolderId, (data) => {
              const topic = data[targetFolderId];
              if (!topic || !topic.prompts) return;
              const promptIndex = topic.prompts.findIndex(
                (p) => p.id === newPrompt.id
              );
              if (promptIndex !== -1) {
                showPromptVersions(targetFolderId, promptIndex, row);
              }
            });
          } else if (action === "export") {
            exportPrompt(newPrompt, targetFolderId);
          } else if (action === "move-to-trash") {
            moveToTrash(newPrompt, targetFolderId, row);
          }
          dropdown.style.display = "none";
        });
      });

      // Füge Event-Listener für Klick auf die Zeile hinzu (Details-Sidebar)
      row.addEventListener("click", (e) => {
        if (!e.target.closest(".prompt-actions")) {
          showDetailsSidebar(newPrompt, targetFolderId);
        }
      });

      tableBody.appendChild(row);
    }

    // Aktualisiere die gesamte Tabelle für Konsistenz
    handleCategoryClick(category);
  }
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
      // Update lastUsed
      chrome.storage.local.get(folderId, (data) => {
        const topic = data[folderId];
        if (!topic || !topic.prompts) return;
        const promptIndex = topic.prompts.findIndex(
          (p) => p.title === prompt.title && p.content === prompt.content
        );
        if (promptIndex === -1) return;
        topic.prompts[promptIndex].lastUsed = Date.now();
        chrome.storage.local.set({ [folderId]: topic });
      });
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

/**
 * Öffnet das Edit-Formular für einen Prompt, erlaubt Änderungen
 * (inkl. neuem Notizfeld) und speichert alles zurück in chrome.storage.local.
 *
 * @param {string}  folderId        – ID des aktuellen Ordners
 * @param {number}  promptIndex     – Index des Prompts im Ordner-Array
 * @param {object}  prompt          – Das zu bearbeitende Prompt-Objekt
 * @param {HTMLElement} sidebarContent – Container für das Edit-Formular
 */
function editPromptDetails(folderId, promptIndex, prompt, sidebarContent) {
  // --- Basis-Validierung ----------------------------------------------------
  if (!folderId || promptIndex < 0 || !prompt || !sidebarContent) {
    console.error("Invalid parameters in editPromptDetails");
    return;
  }

  // --- Formular-HTML --------------------------------------------------------
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

    <!-- ▸▸ NEU: Freie Notizen ◂◂ -->
    <label>Notes</label>
    <textarea id="edit-notes" placeholder="Add here more details about the model and how this prompt should be used for example …">${escapeHTML(
      prompt.notes || ""
    )}</textarea>

    <label>Type</label>
<select id="edit-type">
  <option value="" ${!prompt.type ? "selected" : ""}>Wähle Typ</option>

  <!-- Generative Aufgaben -->
  <option value="textgen" ${
    prompt.type === "textgen" ? "selected" : ""
  }>Textgeneration</option>
  <option value="rewrite" ${
    prompt.type === "rewrite" ? "selected" : ""
  }>Umschreiben</option>
  <option value="summarize" ${
    prompt.type === "summarize" ? "selected" : ""
  }>Zusammenfassen</option>
  <option value="translate" ${
    prompt.type === "translate" ? "selected" : ""
  }>Übersetzen</option>
  <option value="ideation" ${
    prompt.type === "ideation" ? "selected" : ""
  }>Ideenfindung</option>
  <option value="adcopy" ${
    prompt.type === "adcopy" ? "selected" : ""
  }>Werbetexten</option>
  <option value="storytelling" ${
    prompt.type === "storytelling" ? "selected" : ""
  }>Storytelling</option>

  <!-- Analytische Aufgaben -->
  <option value="analyze" ${
    prompt.type === "analyze" ? "selected" : ""
  }>Analyse</option>
  <option value="classify" ${
    prompt.type === "classify" ? "selected" : ""
  }>Klassifikation</option>
  <option value="extract" ${
    prompt.type === "extract" ? "selected" : ""
  }>Informationsextraktion</option>
  <option value="compare" ${
    prompt.type === "compare" ? "selected" : ""
  }>Vergleichen / Bewerten</option>

  <!-- Technische Aufgaben -->
  <option value="codegen" ${
    prompt.type === "codegen" ? "selected" : ""
  }>Codegenerierung</option>
  <option value="debug" ${
    prompt.type === "debug" ? "selected" : ""
  }>Fehleranalyse</option>
  <option value="refactor" ${
    prompt.type === "refactor" ? "selected" : ""
  }>Code-Umschreiben</option>
  <option value="explain-code" ${
    prompt.type === "explain-code" ? "selected" : ""
  }>Code erklären</option>

  <!-- Prompt-spezifische Aufgaben -->
  <option value="prompt-engineering" ${
    prompt.type === "prompt-engineering" ? "selected" : ""
  }>Prompt Engineering</option>
  <option value="meta-prompt" ${
    prompt.type === "meta-prompt" ? "selected" : ""
  }>Meta-Prompt</option>

  <!-- Sonstige -->
  <option value="assistant" ${
    prompt.type === "assistant" ? "selected" : ""
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
    <div class="checkbox-group" id="edit-tags"></div>

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

  // --------------------------------------------------------------------------
  // TAGS LADEN
  // --------------------------------------------------------------------------
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

  // Neuer Tag hinzufügen
  sidebarContent.querySelector("#add-tag-btn").addEventListener("click", () => {
    const newTagInput = sidebarContent.querySelector("#new-tag");
    const newTag = newTagInput.value.trim();

    if (!newTag) {
      alert("Tag cannot be empty!");
      return;
    }

    // Prüfen, ob Tag bereits existiert
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

  // --------------------------------------------------------------------------
  // FOLDER DROPDOWN LADEN
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // SPEICHERN
  // --------------------------------------------------------------------------
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

      // -------- Formulardaten auslesen --------
      const newFolderId = sidebarContent.querySelector("#edit-folder").value;
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

      // -------- Prompt-Objekt aktualisieren --------
      const updatedPrompt = {
        ...prompt,
        title,
        description:
          sidebarContent.querySelector("#edit-description")?.value.trim() || "",
        content: sidebarContent.querySelector("#edit-content").value.trim(),
        notes: sidebarContent.querySelector("#edit-notes").value.trim(), // ◄◄  NEU
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

      // -------- Versionslogik (inkl. Notes) --------
      const hasContentChanges =
        (prompt.title || "") !== updatedPrompt.title ||
        (prompt.description || "") !== updatedPrompt.description ||
        (prompt.content || "") !== updatedPrompt.content ||
        (prompt.notes || "") !== updatedPrompt.notes;

      if (hasContentChanges) {
        updatedPrompt.versions = updatedPrompt.versions || [];
        updatedPrompt.versions.push({
          versionId: generateUUID(),
          title: updatedPrompt.title,
          description: updatedPrompt.description,
          content: updatedPrompt.content,
          notes: updatedPrompt.notes,
          timestamp: Date.now(),
        });
        if (updatedPrompt.versions.length > 50) {
          updatedPrompt.versions.shift();
        }
      }

      // -------- Meta-Change-Log --------
      const metaChanges = {};
      if ((prompt.type || "") !== updatedPrompt.type) {
        metaChanges.type = { from: prompt.type || "", to: updatedPrompt.type };
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
      if ((prompt.notes || "") !== updatedPrompt.notes) {
        // ◄◄  NEU
        metaChanges.notes = {
          from: prompt.notes || "",
          to: updatedPrompt.notes,
        };
      }

      if (Object.keys(metaChanges).length > 0) {
        updatedPrompt.metaChangeLog.push({
          timestamp: Date.now(),
          changes: metaChanges,
        });
        if (updatedPrompt.metaChangeLog.length > 50) {
          updatedPrompt.metaChangeLog.shift();
        }
      }

      // -------- Abspeichern (ggf. Folder-Wechsel) --------
      if (newFolderId !== folderId) {
        // Prompt aus altem Ordner entfernen
        topic.prompts.splice(promptIndex, 1);
        chrome.storage.local.set({ [folderId]: topic }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error removing prompt:", chrome.runtime.lastError);
            alert("Error moving prompt.");
            return;
          }

          // Ziel-Ordner vorbereiten
          let targetTopic;
          let targetId = newFolderId;

          if (newFolderId) {
            targetTopic = data[newFolderId] || {
              name: newFolderName,
              prompts: [],
              isHidden: false,
              isTrash: false,
            };
            targetTopic.prompts.push(updatedPrompt);
          } else {
            // Wenn kein Folder ausgewählt, Single-Prompt-Ordner anlegen
            targetId = `single_prompt_${Date.now()}`;
            targetTopic = {
              name: "Single Prompt",
              prompts: [updatedPrompt],
              isHidden: true,
              isTrash: false,
            };
          }

          // Speichern im Ziel-Ordner
          chrome.storage.local.set({ [targetId]: targetTopic }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error saving to new folder:",
                chrome.runtime.lastError
              );
              alert("Error saving prompt.");
            } else {
              showDetailsSidebar(updatedPrompt, targetId);
              const category =
                document.querySelector(".main-header h1")?.textContent || "";
              handleCategoryClick(category);
            }
          });
        });
      } else {
        // Im selben Ordner aktualisieren
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

  // --------------------------------------------------------------------------
  // CANCEL-BUTTON
  // --------------------------------------------------------------------------
  sidebarContent.querySelector(".cancel-btn").addEventListener("click", () => {
    showDetailsSidebar(prompt, folderId);
  });
}
