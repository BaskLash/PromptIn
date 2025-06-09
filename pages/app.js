document.addEventListener("DOMContentLoaded", () => {
  // Sidebar-Breite aus localStorage wiederherstellen
  const savedWidth = localStorage.getItem("sidebarWidth");
  const sidebar = document.querySelector("aside");
  if (savedWidth) {
    sidebar.style.width = `${savedWidth}px`;
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${savedWidth}px`
    );
  }

  // Accordion-Mechanik
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", (event) => {
      if (!event.target.classList.contains("add-folder-header-btn")) {
        const content = header.nextElementSibling;
        content.classList.toggle("open");
      }
    });
  });

  // Folder-Suchfeld einblenden bei mehr als 5 Einträgen
  const folderList = document.querySelector(".folder-list");
  const folderSearchInput = document.querySelector(".folder-search");
  const folderItems = folderList.querySelectorAll("li");

  if (folderItems.length > 5) {
    folderSearchInput.style.display = "block";
  } else {
    folderSearchInput.style.display = "none";
  }

  folderSearchInput.addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    folderItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(filter) ? "" : "none";
    });
  });

  // Sidebar-Resizer
  const resizer = document.getElementById("sidebar-resizer");
  let isResizing = false;
  let animationFrameId = null;
  let currentX = 0;

  const minWidth = 150;
  const maxWidth = 500;

  const resizeSidebar = () => {
    const newWidth = Math.min(Math.max(currentX, minWidth), maxWidth);
    sidebar.style.width = `${newWidth}px`;
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${newWidth}px`
    );
    animationFrameId = null;
  };

  const onPointerMove = (e) => {
    if (!isResizing) return;
    currentX = e.clientX;
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(resizeSidebar);
    }
  };

  const onPointerUp = () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = "default";
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);

    const finalWidth = sidebar.offsetWidth;
    localStorage.setItem("sidebarWidth", finalWidth.toString());
  };

  resizer.addEventListener("pointerdown", (e) => {
    isResizing = true;
    currentX = e.clientX;
    document.body.style.cursor = "col-resize";
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    e.preventDefault();
  });

  // Inject CSS styles dynamically
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
    .prompt-actions {
      display: flex;
      align-items: center;
    }
    .prompt-type {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }
    .prompt-type label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: normal;
    }
    .action-btn {
      background: #1e90ff;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 8px;
    }
    .action-btn:hover {
      background: #187bcd;
    }
    .menu-btn {
      font-weight: bold;
    }
    .dropdown-menu {
      display: none;
      position: absolute;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      min-width: 150px;
      right: 0;
    }
    .dropdown-item {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 0.9em;
      color: #333;
    }
    .dropdown-item:hover {
      background: #f0f0f0;
    }
    .details-sidebar {
      position: fixed;
      right: 0;
      top: 0;
      width: 350px;
      height: 100%;
      background: #fff;
      border-left: 1px solid #ddd;
      box-shadow: -2px 0 8px rgba(0,0,0,0.1);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      z-index: 1000;
      overflow-y: auto;
    }
    .details-sidebar.open {
      transform: translateX(0);
    }
    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #ddd;
    }
    .sidebar-header h2 {
      margin: 0;
      font-size: 1.5em;
    }
    .close-sidebar {
      cursor: pointer;
      font-size: 24px;
      color: #aaa;
    }
    .close-sidebar:hover {
      color: #000;
    }
    .sidebar-content {
      padding: 20px;
    }
    .sidebar-content label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
    }
    .sidebar-content input,
    .sidebar-content textarea,
    .sidebar-content select {
      width: 100%;
      padding: 8px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .sidebar-content textarea {
      min-height: 100px;
    }
    .sidebar-content .step-list {
      list-style: none;
      padding: 0;
    }
    .sidebar-content .step-item {
      margin-bottom: 10px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .edit-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .edit-btn:hover {
      background: #218838;
    }
    .save-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
    }
    .save-btn:hover {
      background: #218838;
    }
    .cancel-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .cancel-btn:hover {
      background: #c82333;
    }
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }
    .modal-content {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      width: 100%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      position: relative;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.5em;
      color: var(--primary-color);
    }
    .modal .close {
      cursor: pointer;
      font-size: 24px;
      color: #aaa;
      transition: color 0.2s ease;
    }
    .modal .close:hover {
      color: var(--primary-color);
    }
    .modal-body {
      padding: 10px 0;
    }
    .modal-body label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: var(--primary-color);
    }
    .modal-body input,
    .modal-body textarea,
    .modal-body select {
      width: 100%;
      padding: 8px;
      margin-bottom: 15px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 14px;
    }
    .modal-body textarea {
      min-height: 100px;
      resize: vertical;
    }
    .modal-body select[multiple] {
      height: 120px;
      padding: 5px;
    }
    .modal-body .checkbox-group {
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 15px;
    }
    .modal-body .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: normal;
      cursor: pointer;
    }
    .modal-body .checkbox-group input[type="checkbox"] {
      width: auto;
      margin: 0;
    }
    .modal-body .action-btn {
      background: #1e90ff;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
      display: block;
      width: 100%;
    }
    .modal-body .action-btn:hover {
      background: #187bcd;
    }
    .sidebar-content .checkbox-group {
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 15px;
    }
    .sidebar-content .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: normal;
      cursor: pointer;
    }
    .sidebar-content .checkbox-group input[type="checkbox"] {
      width: auto;
      margin: 0;
    }
    @media (max-width: 600px) {
      .modal-content {
        width: 90%;
        max-height: 90vh;
      }
      .modal-body select[multiple] {
        height: 80px;
      }
      .modal-body .checkbox-group {
        max-height: 100px;
      }
      .sidebar-content .checkbox-group {
        max-height: 100px;
      }
    }
  `;
    document.head.appendChild(style);
  }

  // Call injectStyles
  injectStyles();

  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

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

    const form = document.createElement("form");
    form.innerHTML = `
      <label>Titel:</label>
      <input type="text" id="prompt-title" placeholder="Titel eingeben" required>
      <label>Beschreibung:</label>
      <textarea id="prompt-description" placeholder="Beschreibung eingeben"></textarea>
      <label>Inhalt:</label>
      <textarea id="prompt-content" placeholder="Prompt-Text eingeben" required></textarea>
      <label>Typ:</label>
      <select id="prompt-type" required>
        <option value="" disabled selected>Typ auswählen</option>
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
      <label>Kompatible Modelle:</label>
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
      <label>Inkompatible Modelle:</label>
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
        <label><input type="checkbox" name="tags" value="SEO"> SEO</label>
        <label><input type="checkbox" name="tags" value="Marketing"> Marketing</label>
        <label><input type="checkbox" name="tags" value="Social Media"> Social Media</label>
        <label><input type="checkbox" name="tags" value="Advertisement"> Advertisement</label>
        <label><input type="checkbox" name="tags" value="Copywriting"> Copywriting</label>
        <label><input type="checkbox" name="tags" value="Productivity"> Productivity</label>
        <label><input type="checkbox" name="tags" value="E-Commerce"> E-Commerce</label>
        <label><input type="checkbox" name="tags" value="Education"> Education</label>
        <label><input type="checkbox" name="tags" value="Tech"> Tech</label>
        <label><input type="checkbox" name="tags" value="Healthcare"> Healthcare</label>
        <label><input type="checkbox" name="tags" value="HR"> HR</label>
      </div>
      <label>Favorit:</label>
      <div class="checkbox-group">
        <label><input type="checkbox" id="prompt-favorite" name="favorite"> Als Favorit markieren</label>
      </div>
      <label>Ordner:</label>
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
        }>Kein Ordner</option>
      </select>
      <button type="submit" class="action-btn">Create Prompt</button>
    `;

    // Lade verfügbare Ordner in das Dropdown
    chrome.storage.local.get(null, (data) => {
      const folderSelect = form.querySelector("#prompt-folder");
      const folders = Object.entries(data)
        .filter(
          ([, topic]) => topic.prompts && !topic.isHidden && !topic.isTrash
        )
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

    form.addEventListener("submit", (e) => {
      e.preventDefault();

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

      // Ermittle folderName aus dem ausgewählten Ordner
      let folderName = "Single Prompt"; // Standard für Einzelprompts
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
        compatibleModels: compatibleModels.join(", "),
        incompatibleModels: incompatibleModels.join(", "),
        tags: tags.join(", "),
        isFavorite,
        folderId: folderId || null,
        folderName,
        createdAt: Date.now(),
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
      };

      saveNewPrompt(newPrompt, folderId);
      modal.remove();
      handleCategoryClick(category); // Bleibe in der aktuellen Kategorie
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

  function saveNewPrompt(prompt, folderId) {
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
        topic.prompts.push({ ...prompt, folderName });
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
                          .filter(
                            (p) => p.content && /\{[^}]+\}/.test(p.content)
                          )
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
          prompts: [{ ...prompt, folderName }],
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
                          .filter(
                            (p) => p.content && /\{[^}]+\}/.test(p.content)
                          )
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

  function renderPrompts(prompts) {
    const tbody = document.querySelector(".table-container tbody");
    tbody.innerHTML = ""; // Clear existing rows

    prompts.forEach((prompt, index) => {
      const row = document.createElement("tr");
      row.dataset.index = index;
      row.innerHTML = `
        <td><input type="checkbox" /></td>
        <td>${prompt.title || "N/A"}</td>
        <td>${prompt.type || "N/A"}</td>
        <td>${prompt.compatibleModels || "N/A"}</td>
        <td>${prompt.incompatibleModels || "N/A"}</td>
        <td>${prompt.tags || "N/A"}</td>
        <td>${prompt.folderName || "N/A"}</td>
        <td>${
          prompt.lastUsed
            ? new Date(prompt.lastUsed).toLocaleDateString("de-DE")
            : "N/A"
        }</td>
        <td>${
          prompt.createdAt
            ? new Date(prompt.createdAt).toLocaleDateString("de-DE")
            : "N/A"
        }</td>
        <td>
          <div class="prompt-actions">
            <button class="action-btn menu-btn" aria-label="Prompt actions">...</button>
            <div class="dropdown-menu">
              <div class="dropdown-item" data-action="copy">Copy Prompt</div>
              <div class="dropdown-item" data-action="rename">Rename</div>
              <div class="dropdown-item" data-action="delete">Delete</div>
            </div>
          </div>
        </td>
      `;
      // Event-Listener für Dropdown
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

      // Event-Listener für Dropdown-Aktionen
      row.querySelectorAll(".dropdown-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          const action = item.dataset.action;
          if (action === "copy") {
            copyPrompt(prompt, prompt.folderId);
          } else if (action === "rename") {
            renamePrompt(prompt, prompt.folderId, row);
          } else if (action === "delete") {
            deletePrompt(prompt, prompt.folderId, row);
          }
          dropdown.style.display = "none";
        });
      });

      // Event-Listener für Klick auf die Zeile
      row.addEventListener("click", (e) => {
        if (!e.target.closest(".prompt-actions")) {
          showDetailsSidebar(prompt, prompt.folderId);
        }
      });

      tbody.appendChild(row);
    });

    // Schließe Dropdowns bei Klick außerhalb
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".prompt-actions")) {
        document.querySelectorAll(".dropdown-menu").forEach((menu) => {
          menu.style.display = "none";
        });
      }
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
          topic.prompts[promptIndex].title = newName;
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

  function showDetailsSidebar(item, folderId) {
    const sidebar = document.getElementById("details-sidebar");
    const sidebarContent = sidebar.querySelector(".sidebar-content");
    sidebarContent.innerHTML = "";
    sidebar.classList.add("open");

    if (item.type === "Workflow") {
      chrome.storage.local.get(null, (data) => {
        const workflow = data[folderId];
        if (!workflow) {
          sidebarContent.innerHTML = "<p>Error: Workflow not found.</p>";
          return;
        }

        // Für jeden Schritt den Prompt-Titel und Inhalt abrufen
        const stepDetails = workflow.steps.map((step, index) => {
          if (!step.promptId) {
            return `
            <li class="step-item">
              <strong>Step ${index + 1}: ${
              step.title || "Untitled Step"
            }</strong><br>
              Prompt: N/A<br>
              Parameters: <pre>${JSON.stringify(
                step.parameters || {},
                null,
                2
              )}</pre>
            </li>
          `;
          }

          // Den letzten Unterstrich als Trenner verwenden
          const lastUnderscoreIndex = step.promptId.lastIndexOf("_");
          const promptFolderId = step.promptId.substring(
            0,
            lastUnderscoreIndex
          );
          const promptIndex = step.promptId.substring(lastUnderscoreIndex + 1);
          const topic = data[promptFolderId];

          if (!topic || !topic.prompts || !topic.prompts[promptIndex]) {
            return `
            <li class="step-item">
              <strong>Step ${index + 1}: ${
              step.title || "Untitled Step"
            }</strong><br>
              Prompt: Not found (ID: ${step.promptId})<br>
              Parameters: <pre>${JSON.stringify(
                step.parameters || {},
                null,
                2
              )}</pre>
            </li>
          `;
          }

          const prompt = topic.prompts[promptIndex];
          return `
          <li class="step-item">
            <strong>Step ${index + 1}: ${
            step.title || "Untitled Step"
          }</strong><br>
            Prompt: ${prompt.title || "N/A"}<br>
            Parameters: <pre>${JSON.stringify(
              step.parameters || {},
              null,
              2
            )}</pre>
          </li>
        `;
        });

        sidebarContent.innerHTML = `
        <label>Name</label>
        <input type="text" value="${workflow.name || "N/A"}" readonly>
        <label>AI Model</label>
        <input type="text" value="${workflow.aiModel || "N/A"}" readonly>
        <label>Steps</label>
        <ul class="step-list">${stepDetails.join("")}</ul>
        <label>Created At</label>
        <input type="text" value="${
          workflow.createdAt
            ? new Date(workflow.createdAt).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <label>Last Used</label>
        <input type="text" value="${
          workflow.lastUsed
            ? new Date(workflow.lastUsed).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <button class="edit-btn">Edit Workflow</button>
      `;

        const editBtn = sidebarContent.querySelector(".edit-btn");
        editBtn.addEventListener("click", () => {
          editWorkflowDetails(folderId, workflow, sidebarContent);
        });
      });
    } else {
      // Prüfen, ob item gültige Prompt-Daten enthält
      if (!item || !item.title || !item.content) {
        sidebarContent.innerHTML = "<p>Error: Invalid prompt data.</p>";
        return;
      }

      chrome.storage.local.get(folderId, (data) => {
        const topic = data[folderId];
        if (!topic || !topic.prompts) {
          sidebarContent.innerHTML = "<p>Error: Prompt not found.</p>";
          return;
        }

        const promptIndex = topic.prompts.findIndex(
          (p) => p.title === item.title && p.content === item.content
        );
        if (promptIndex === -1) {
          sidebarContent.innerHTML = "<p>Error: Prompt not found.</p>";
          return;
        }

        const prompt = topic.prompts[promptIndex];
        sidebarContent.innerHTML = `
        <label>Title</label>
        <input type="text" value="${prompt.title || "N/A"}" readonly>
        <label>Description</label>
        <textarea readonly>${prompt.description || "N/A"}</textarea>
        <label>Content</label>
        <textarea readonly>${prompt.content || "N/A"}</textarea>
        <label>Type</label>
        <input type="text" value="${prompt.type || "N/A"}" readonly>
        <label>Compatible Models</label>
        <input type="text" value="${prompt.compatibleModels || "N/A"}" readonly>
        <label>Incompatible Models</label>
        <input type="text" value="${
          prompt.incompatibleModels || "N/A"
        }" readonly>
        <label>Tags</label>
        <input type="text" value="${prompt.tags || "N/A"}" readonly>
        <label>Folder</label>
        <input type="text" value="${prompt.folderName || "N/A"}" readonly>
        <label>Favorite</label>
        <input type="text" value="${prompt.isFavorite ? "Yes" : "No"}" readonly>
        <label>Created At</label>
        <input type="text" value="${
          prompt.createdAt
            ? new Date(prompt.createdAt).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <label>Last Used</label>
        <input type="text" value="${
          prompt.lastUsed
            ? new Date(prompt.lastUsed).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <button class="edit-btn">Edit Prompt</button>
      `;

        const editBtn = sidebarContent.querySelector(".edit-btn");
        editBtn.addEventListener("click", () => {
          editPromptDetails(folderId, promptIndex, prompt, sidebarContent);
        });
      });
    }

    const closeBtn = sidebar.querySelector(".close-sidebar");
    closeBtn.addEventListener("click", () => {
      sidebar.classList.remove("open");
    });
  }

  function editPromptDetails(folderId, promptIndex, prompt, sidebarContent) {
    sidebarContent.innerHTML = `
    <label>Title</label>
    <input type="text" value="${prompt.title || ""}" id="edit-title">
    <label>Description</label>
    <textarea id="edit-description">${prompt.description || ""}</textarea>
    <label>Content</label>
    <textarea id="edit-content">${prompt.content || ""}</textarea>
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
            `<label><input type="checkbox" name="compatible" value="${model}" ${
              prompt.compatibleModels?.includes(model) ? "checked" : ""
            }> ${model}</label>`
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
            `<label><input type="checkbox" name="incompatible" value="${model}" ${
              prompt.incompatibleModels?.includes(model) ? "checked" : ""
            }> ${model}</label>`
        )
        .join("")}
    </div>

    <label>Tags</label>
    <div class="checkbox-group" id="edit-tags">
      ${[
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
      ]
        .map(
          (tag) =>
            `<label><input type="checkbox" name="tags" value="${tag}" ${
              prompt.tags?.includes(tag) ? "checked" : ""
            }> ${tag}</label>`
        )
        .join("")}
    </div>

    <label>Favorite</label>
    <div class="checkbox-group">
      <label><input type="checkbox" id="edit-favorite" ${
        prompt.isFavorite ? "checked" : ""
      }> Als Favorit markieren</label>
    </div>

    <label>Folder</label>
    <select id="edit-folder">
      <option value="" ${
        !prompt.folderId ? "selected" : ""
      }>Kein Ordner</option>
    </select>

    <button class="save-btn">Speichern</button>
    <button class="cancel-btn">Abbrechen</button>
  `;

    chrome.storage.local.get(null, (data) => {
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
        const topic = data[folderId];
        if (!topic || !topic.prompts) return;

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
          sidebarContent.querySelectorAll(
            "#edit-tags input[name='tags']:checked"
          )
        ).map((cb) => cb.value);

        const updatedPrompt = {
          ...prompt,
          title: sidebarContent.querySelector("#edit-title").value.trim(),
          description:
            sidebarContent.querySelector("#edit-description")?.value.trim() ||
            "",
          content: sidebarContent.querySelector("#edit-content").value.trim(),
          type: sidebarContent.querySelector("#edit-type").value,
          compatibleModels,
          incompatibleModels,
          tags,
          isFavorite: sidebarContent.querySelector("#edit-favorite").checked,
          folderId: newFolderId || null,
          folderName: newFolderName,
        };

        const hasChanges =
          (prompt.title || "") !== updatedPrompt.title ||
          (prompt.description || "") !== updatedPrompt.description ||
          (prompt.content || "") !== updatedPrompt.content ||
          (prompt.type || "") !== updatedPrompt.type ||
          JSON.stringify(prompt.compatibleModels || []) !==
            JSON.stringify(compatibleModels) ||
          JSON.stringify(prompt.incompatibleModels || []) !==
            JSON.stringify(incompatibleModels) ||
          JSON.stringify(prompt.tags || []) !== JSON.stringify(tags) ||
          (prompt.isFavorite || false) !== updatedPrompt.isFavorite ||
          (prompt.folderId || "") !== (updatedPrompt.folderId || "");

        if (hasChanges) {
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

        if (newFolderId !== folderId) {
          topic.prompts.splice(promptIndex, 1);
          chrome.storage.local.set({ [folderId]: topic }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Fehler beim Entfernen der Prompt:",
                chrome.runtime.lastError
              );
              alert("Fehler beim Verschieben des Prompts.");
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
                  "Fehler beim Speichern im neuen Ordner:",
                  chrome.runtime.lastError
                );
                alert("Fehler beim Speichern des Prompts.");
              } else {
                showDetailsSidebar(updatedPrompt, newFolderId);
                const category =
                  document.querySelector(".main-header h1").textContent;
                handleCategoryClick(category);
              }
            });
          });
        } else {
          topic.prompts[promptIndex] = updatedPrompt;
          chrome.storage.local.set({ [folderId]: topic }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Fehler beim Speichern der Prompt:",
                chrome.runtime.lastError
              );
              alert("Fehler beim Speichern des Prompts.");
            } else {
              showDetailsSidebar(updatedPrompt, folderId);
              const category =
                document.querySelector(".main-header h1").textContent;
              handleCategoryClick(category);
            }
          });
        }
      });
    });

    sidebarContent
      .querySelector(".cancel-btn")
      .addEventListener("click", () => {
        showDetailsSidebar(prompt, folderId);
      });
  }

  function editWorkflowDetails(workflowId, workflow, sidebarContent) {
    const aiOptions = {
      grok: { name: "Grok" },
      gemini: { name: "Gemini" },
      chatgpt: { name: "ChatGPT" },
      claude: { name: "Claude" },
      blackbox: { name: "BlackBox" },
      githubCopilot: { name: "GitHub Copilot" },
      microsoftCopilot: { name: "Microsoft Copilot" },
      mistral: { name: "Mistral" },
      duckduckgo: { name: "DuckDuckGo" },
      perplexity: { name: "Perplexity" },
      deepseek: { name: "DeepSeek" },
      deepai: { name: "Deepai" },
      qwenAi: { name: "Qwen AI" },
    };

    sidebarContent.innerHTML = `
    <label>Name</label>
    <input type="text" value="${workflow.name || ""}" id="edit-name">
    <label>AI Model</label>
    <select id="edit-ai-model">
      ${Object.keys(aiOptions)
        .map(
          (key) => `
          <option value="${key}" ${
            workflow.aiModel === key ? "selected" : ""
          }>${aiOptions[key].name}</option>
        `
        )
        .join("")}
    </select>
    <label>Steps</label>
    <div id="edit-steps"></div>
    <button class="action-btn" id="add-step">Add Step</button>
    <button class="save-btn">Save</button>
    <button class="cancel-btn">Cancel</button>
  `;

    const stepsContainer = sidebarContent.querySelector("#edit-steps");
    let steps = workflow.steps.map((step) => ({ ...step }));

    steps.forEach((step, index) => {
      addStepToEdit(step, index, stepsContainer, steps);
    });

    const addStepBtn = sidebarContent.querySelector("#add-step");
    addStepBtn.addEventListener("click", () => {
      addStepToEdit({}, steps.length, stepsContainer, steps);
    });

    const saveBtn = sidebarContent.querySelector(".save-btn");
    const cancelBtn = sidebarContent.querySelector(".cancel-btn");

    saveBtn.addEventListener("click", () => {
      const updatedWorkflow = {
        ...workflow,
        name: sidebarContent.querySelector("#edit-name").value.trim(),
        aiModel: sidebarContent.querySelector("#edit-ai-model").value,
        steps: steps.map((step, index) => {
          const stepDiv = stepsContainer.querySelector(
            `[data-step-index="${index}"]`
          );
          try {
            const isDynamic =
              stepDiv.querySelector(
                `input[name="prompt-type-${index}"]:checked`
              )?.value === "dynamic";
            const promptId = stepDiv.querySelector(".step-prompt").value;

            // Validierung der promptId
            if (
              !promptId &&
              !stepDiv
                .querySelector(".step-prompt option:checked")
                .textContent.includes("Select a prompt")
            ) {
              alert(`Please select a valid prompt for step ${index + 1}.`);
              throw new Error(`Invalid prompt for step ${index + 1}`);
            }

            return {
              ...step,
              title:
                stepDiv.querySelector(".step-title").value.trim() ||
                `Step ${index + 1}`,
              promptId: promptId || null,
              parameters: isDynamic
                ? JSON.parse(
                    stepDiv.querySelector(".step-params").value.trim() || "{}"
                  )
                : {},
              isDynamic,
            };
          } catch (e) {
            if (e.message.includes("Invalid prompt")) {
              throw e; // Abbruch, wenn kein Prompt ausgewählt
            }
            alert(
              `Invalid JSON in parameters for step ${index + 1}: ${e.message}`
            );
            throw e;
          }
        }),
      };

      chrome.storage.local.set({ [workflowId]: updatedWorkflow }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving workflow:", chrome.runtime.lastError);
          alert("Error saving workflow.");
        } else {
          // Korrektes Objekt für showDetailsSidebar
          showDetailsSidebar(
            { type: "Workflow", folderId: workflowId },
            workflowId
          );
          // Refresh the table
          handleCategoryClick("Workflows");
        }
      });
    });

    cancelBtn.addEventListener("click", () => {
      showDetailsSidebar(
        { type: "Workflow", folderId: workflowId },
        workflowId
      );
    });
  }

  function addStepToEdit(stepData, index, stepsContainer, steps) {
    const stepDiv = document.createElement("div");
    stepDiv.className = "step-item";
    stepDiv.dataset.stepIndex = index;

    // Standardmäßig dynamisch, falls nicht anders angegeben
    const isDynamic = stepData.isDynamic !== false;

    stepDiv.innerHTML = `
    <label>Step Title</label>
    <input type="text" class="step-title" value="${
      stepData.title || ""
    }" placeholder="Enter step title">
    <label>Prompt Type</label>
    <div class="prompt-type">
      <label><input type="radio" name="prompt-type-${index}" value="static" ${
      !isDynamic ? "checked" : ""
    }> Static</label>
      <label><input type="radio" name="prompt-type-${index}" value="dynamic" ${
      isDynamic ? "checked" : ""
    }> Dynamic</label>
    </div>
    <label>Select Prompt</label>
    <select class="step-prompt"></select>
    <label class="params-label" style="display: ${
      isDynamic ? "block" : "none"
    }">Parameters (JSON)</label>
    <textarea class="step-params" style="display: ${
      isDynamic ? "block" : "none"
    }" placeholder='{"key": "value"}'>${JSON.stringify(
      stepData.parameters || {},
      null,
      2
    )}</textarea>
    <button class="action-btn remove-step">Remove Step</button>
  `;

    const promptSelect = stepDiv.querySelector(".step-prompt");
    const paramsTextarea = stepDiv.querySelector(".step-params");
    const paramsLabel = stepDiv.querySelector(".params-label");
    const radioButtons = stepDiv.querySelectorAll(
      'input[name="prompt-type-' + index + '"]'
    );

    // Funktion zum Laden der Prompts basierend auf dem Typ
    const loadPrompts = (type) => {
      chrome.storage.local.get(null, (data) => {
        promptSelect.innerHTML = ""; // Leere das Select-Feld
        const prompts = [];

        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && Array.isArray(topic.prompts)) {
            topic.prompts.forEach((prompt, idx) => {
              const isDynamicPrompt =
                typeof prompt.content === "string" &&
                /\{[^}]+\}/.test(prompt.content);
              if (
                (type === "dynamic" && isDynamicPrompt) ||
                (type === "static" && !isDynamicPrompt)
              ) {
                prompts.push({
                  id: `${id}_${idx}`,
                  title: prompt.title || `Prompt ${idx + 1}`,
                  content: prompt.content,
                });
              }
            });
          }
        });

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select a prompt";
        promptSelect.appendChild(defaultOption);

        prompts.forEach((prompt) => {
          const option = document.createElement("option");
          option.value = prompt.id;
          option.textContent = prompt.title;
          if (stepData.promptId === prompt.id) {
            option.selected = true;
          }
          promptSelect.appendChild(option);
        });
      });
    };

    // Initiale Prompt-Liste laden
    loadPrompts(isDynamic ? "dynamic" : "static");

    // Event-Listener für Radio-Buttons
    radioButtons.forEach((radio) => {
      radio.addEventListener("change", () => {
        const selectedType = radio.value;
        paramsLabel.style.display =
          selectedType === "dynamic" ? "block" : "none";
        paramsTextarea.style.display =
          selectedType === "dynamic" ? "block" : "none";
        if (selectedType === "static") {
          paramsTextarea.value = JSON.stringify({}, null, 2); // JSON zurücksetzen
        }
        loadPrompts(selectedType);
      });
    });

    // Event-Listener für Prompt-Auswahl
    promptSelect.addEventListener("change", () => {
      const selectedPromptId = promptSelect.value;
      if (selectedPromptId && isDynamic) {
        chrome.storage.local.get(null, (data) => {
          const prompts = [];
          Object.entries(data).forEach(([id, topic]) => {
            if (topic.prompts && Array.isArray(topic.prompts)) {
              topic.prompts.forEach((prompt, idx) => {
                if (
                  typeof prompt.content === "string" &&
                  /\{[^}]+\}/.test(prompt.content)
                ) {
                  prompts.push({
                    id: `${id}_${idx}`,
                    content: prompt.content,
                  });
                }
              });
            }
          });

          const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
          if (selectedPrompt && selectedPrompt.content) {
            // Extrahiere Platzhalter
            const placeholders = [
              ...selectedPrompt.content.matchAll(/\{([^}]+)\}/g),
            ].map((match) => match[1]);
            // Erstelle JSON-Objekt
            const params = placeholders.reduce((obj, key) => {
              obj[key] = "";
              return obj;
            }, {});
            paramsTextarea.value = JSON.stringify(params, null, 2);
          }
        });
      } else {
        paramsTextarea.value = JSON.stringify({}, null, 2);
      }
    });

    // Trigger change event if a prompt is already selected
    if (stepData.promptId && !stepData.parameters && isDynamic) {
      promptSelect.dispatchEvent(new Event("change"));
    }

    const removeBtn = stepDiv.querySelector(".remove-step");
    removeBtn.addEventListener("click", () => {
      stepsContainer.removeChild(stepDiv);
      steps.splice(index, 1);
      // Update indices of remaining steps
      stepsContainer.querySelectorAll(".step-item").forEach((div, idx) => {
        div.dataset.stepIndex = idx;
      });
    });

    stepsContainer.appendChild(stepDiv);
    steps[index] = { ...stepData, stepDiv, isDynamic };
  }

  function loadFolders() {
    const folderList = document.querySelector(".folder-list");
    chrome.storage.local.get(null, function (data) {
      folderList.innerHTML = ""; // Clear existing folder list

      const folders = Object.entries(data).filter(
        ([id, topic]) => topic.prompts && !topic.isHidden && !topic.isTrash
      );

      if (folders.length === 0) {
        folderList.innerHTML = "<li>Keine Ordner verfügbar</li>";
        return;
      }

      folders.forEach(([id, topic]) => {
        const li = document.createElement("li");
        li.innerHTML = `
          📁 ${topic.name}
          <span class="folder-actions">
            <button class="folder-action" title="Aktionen">⚙️</button>
          </span>
        `;
        li.addEventListener("click", (event) => {
          if (event.target.classList.contains("folder-action")) return;
          handleFolderClick(topic.name);
        });
        folderList.appendChild(li);
      });

      // Update folder search visibility
      const folderSearchInput = document.querySelector(".folder-search");
      if (folders.length > 5) {
        folderSearchInput.style.display = "block";
      } else {
        folderSearchInput.style.display = "none";
      }
    });
  }

  function initializePrompts() {
    chrome.storage.local.get(null, function (data) {
      const allPrompts = Object.entries(data)
        .filter(
          ([id, topic]) => topic.prompts && !topic.isHidden && !topic.isTrash
        )
        .flatMap(([id, topic]) =>
          topic.prompts.map((prompt) => ({
            ...prompt,
            folderId: id,
            folderName: topic.name,
          }))
        );
      renderPrompts(allPrompts);
      document.querySelector(".main-header h1").textContent = "All Prompts";
    });
  }

  document.querySelectorAll(".accordion-content li").forEach((item) => {
    item.addEventListener("click", () => {
      const category = item.textContent.trim();
      handleCategoryClick(category);
    });
  });

  function handleCategoryClick(category) {
    chrome.storage.local.get(null, function (data) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const isVisibleTopic = (topic) =>
        topic.prompts && !topic.isHidden && !topic.isTrash;

      const isHiddenTopic = (topic) =>
        topic.prompts && topic.isHidden && !topic.isTrash;

      const isTrashTopic = (topic) => topic.prompts && topic.isTrash;

      const getPromptObjects = (topic, id) =>
        (topic.prompts || []).map((prompt) => ({
          ...prompt,
          folderId: id,
          folderName: topic.name || "N/A",
        }));

      let filteredPrompts = [];

      switch (category) {
        case "All Prompts":
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => isVisibleTopic(topic))
            .flatMap(([id, topic]) => getPromptObjects(topic, id));
          break;

        case "Favorites":
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => isVisibleTopic(topic))
            .flatMap(([id, topic]) =>
              topic.prompts
                .filter((p) => p.isFavorite)
                .map((prompt) => ({
                  ...prompt,
                  folderId: id,
                  folderName: topic.name || "N/A",
                }))
            );
          break;

        case "Single Prompts":
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => isHiddenTopic(topic))
            .flatMap(([id, topic]) => getPromptObjects(topic, id));
          break;

        case "Categorised Prompts":
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => isVisibleTopic(topic))
            .flatMap(([id, topic]) => getPromptObjects(topic, id));
          break;

        case "Trash":
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => isTrashTopic(topic))
            .flatMap(([id, topic]) => getPromptObjects(topic, id));
          break;

        case "Dynamic Prompts":
          filteredPrompts = Object.entries(data).flatMap(([id, topic]) =>
            (topic.prompts || [])
              .filter((p) => p.content && /\{[^}]+\}/.test(p.content))
              .map((prompt) => ({
                ...prompt,
                folderId: id,
                folderName: topic.name || "N/A",
              }))
          );
          break;

        case "Static Prompts":
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => isVisibleTopic(topic))
            .flatMap(([id, topic]) =>
              topic.prompts
                .filter((p) => p.content && !/\{[^}]+\}/.test(p.content))
                .map((prompt) => ({
                  ...prompt,
                  folderId: id,
                  folderName: topic.name || "N/A",
                }))
            );
          break;

        case "Unused Prompts":
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => isVisibleTopic(topic))
            .flatMap(([id, topic]) =>
              topic.prompts
                .filter((p) => !p.lastUsed || p.lastUsed < thirtyDaysAgo)
                .map((prompt) => ({
                  ...prompt,
                  folderId: id,
                  folderName: topic.name || "N/A",
                }))
            );
          break;

        case "Workflows":
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => topic.steps)
            .map(([id, topic]) => ({
              title: topic.name || "Unnamed Workflow",
              type: "Workflow",
              compatibleModels: topic.aiModel || "N/A",
              incompatibleModels: "N/A",
              tags: "N/A",
              folderName: "Workflows",
              folderId: id,
              lastUsed: topic.lastUsed
                ? new Date(topic.lastUsed).toLocaleDateString("de-DE")
                : "N/A",
              createdAt: topic.createdAt
                ? new Date(topic.createdAt).toLocaleDateString("de-DE")
                : "N/A",
            }));
          break;

        default:
          // Assume it's a folder name
          filteredPrompts = Object.entries(data)
            .filter(
              ([, topic]) =>
                topic?.name?.toLowerCase() === category.toLowerCase() &&
                !topic.isHidden &&
                !topic.isTrash
            )
            .flatMap(([id, topic]) => getPromptObjects(topic, id));
          break;
      }

      renderPrompts(filteredPrompts);
      document.querySelector(".main-header h1").textContent = category;
    });
  }

  function handleFolderClick(folder) {
    chrome.storage.local.get(null, function (data) {
      const filteredPrompts = Object.entries(data)
        .filter(
          ([id, topic]) =>
            topic &&
            typeof topic.name === "string" &&
            topic.name.toLowerCase() === folder.toLowerCase() &&
            !topic.isHidden &&
            !topic.isTrash
        )
        .flatMap(([id, topic]) =>
          (topic.prompts || []).map((prompt) => ({
            ...prompt,
            folderId: id,
            folderName: topic.name,
          }))
        );

      renderPrompts(filteredPrompts);
      document.querySelector(".main-header h1").textContent = folder;
    });
  }

  document.querySelectorAll(".folder-list li").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.target.classList.contains("folder-action")) return;
      const folder = item.textContent.replace("📁", "").trim().split(" ")[0];
      handleFolderClick(folder);
    });
  });

  // Initialisiere die Ordnerliste
  loadFolders();

  // Initialisiere die Prompts
  initializePrompts();

  document.getElementById("addItemBtn").addEventListener("click", () => {
    const category = document.querySelector(".main-header h1").textContent;
    showCreatePromptModal(category);
  });
});
