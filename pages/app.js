document.addEventListener("DOMContentLoaded", () => {
  // Search functionality
  const searchInput = document.getElementById("searchInput");
  const goalsList = document.querySelector(".table-container tbody");
  const folderList = document.querySelector(".folder-list");
  const accordionItems = document.querySelectorAll(".accordion-content li");
  const faqBtn = document.getElementById("faq-btn");
  const addFolderBtn = document.getElementById("addFolderBtn");

  addFolderBtn.addEventListener("click", () => {
    // Modal erstellen
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
    headerTitle.textContent = "Neuen Ordner erstellen";

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    const form = document.createElement("form");
    form.innerHTML = `
        <label>Ordnername:</label>
        <input type="text" id="new-folder-name" placeholder="Neuer Ordnername" required>
        <button type="submit" class="action-btn">Erstellen</button>
        <button type="button" class="cancel-btn">Abbrechen</button>
    `;

    // Event-Listener für das Formular
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const folderName = form.querySelector("#new-folder-name").value.trim();

      if (folderName) {
        const folderId = `folder_${Date.now()}_${generateUUID()}`;
        const newFolder = {
          name: folderName,
          prompts: [],
          isHidden: false,
          isTrash: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        chrome.storage.local.set({ [folderId]: newFolder }, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Fehler beim Erstellen des Ordners:",
              chrome.runtime.lastError
            );
            alert("Fehler beim Erstellen des Ordners.");
          } else {
            // Ordnerliste sofort aktualisieren
            loadFolders();
            modal.remove();
          }
        });
      } else {
        alert("Der Ordnername darf nicht leer sein!");
      }
    });

    // Abbrechen-Button
    form.querySelector(".cancel-btn").addEventListener("click", () => {
      modal.remove();
    });

    // Modal zusammenbauen
    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalBody.appendChild(form);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Schließen-Button
    closeSpan.onclick = () => modal.remove();
    window.onclick = (event) => {
      if (event.target === modal) modal.remove();
    };
  });

  // FAQ
  faqBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("faq.html") });
  });

  let folderSearchInput = document.querySelector("#folder-search");

  folderSearchInput.addEventListener("input", filterFolders);

  function filterFolders() {
    const filter = folderSearchInput.value.toLowerCase().trim();
    const folders = Array.from(folderList.getElementsByTagName("li"));

    if (!filter) {
      // No input: Reset to original state
      folders.forEach((folder) => {
        folder.style.display = "";
        folder.classList.remove("highlight");
      });
      folders.forEach((folder) => folderList.appendChild(folder));
      return;
    }

    // Calculate Levenshtein distance for folders
    const scoredFolders = folders.map((folder) => {
      const folderText = folder.textContent
        .toLowerCase()
        .replace("📁", "")
        .trim()
        .split(" ")[0]; // Extract folder name, remove emoji and actions
      const distance = levenshteinDistance(folderText, filter);
      return { item: folder, distance };
    });

    // Sort by distance
    scoredFolders.sort((a, b) => a.distance - b.distance);

    // Clear current display
    folders.forEach((folder) => (folder.style.display = "none"));

    // Apply sorted order and display
    scoredFolders.forEach(({ item, distance }, index) => {
      item.style.display = "";
      // Highlight top 3 results
      if (index < 3 && distance !== Infinity) {
        item.classList.add("highlight");
      } else {
        item.classList.remove("highlight");
      }
      folderList.appendChild(item);
    });
  }

  searchInput.addEventListener("input", filterGoals);

  function filterGoals() {
    const filter = searchInput.value.toLowerCase().trim();
    const rows = Array.from(goalsList.getElementsByTagName("tr"));
    const folders = Array.from(folderList.getElementsByTagName("li"));
    const categories = Array.from(accordionItems);

    if (!filter) {
      // No input: Reset to original state
      rows.forEach((row) => {
        row.style.display = "";
        row.classList.remove("highlight");
      });
      folders.forEach((folder) => {
        folder.style.display = "";
        folder.classList.remove("highlight");
      });
      categories.forEach((category) => {
        category.style.display = "";
        category.classList.remove("highlight");
      });
      // Restore original order
      rows.forEach((row) => goalsList.appendChild(row));
      folders.forEach((folder) => folderList.appendChild(folder));
      return;
    }

    // Calculate Levenshtein distance for prompts
    const scoredRows = rows.map((row) => {
      const goalCell = row.getElementsByTagName("td")[1]; // Title column
      if (!goalCell) return { item: row, distance: Infinity, type: "prompt" };
      const goalText = goalCell.textContent.toLowerCase();
      const distance = levenshteinDistance(goalText, filter);
      return { item: row, distance, type: "prompt" };
    });

    // Calculate Levenshtein distance for folders
    const scoredFolders = folders.map((folder) => {
      const folderText = folder.textContent
        .toLowerCase()
        .replace("📁", "")
        .trim()
        .split(" ")[0]; // Extract folder name, remove emoji and actions
      const distance = levenshteinDistance(folderText, filter);
      return { item: folder, distance, type: "folder" };
    });

    // Calculate Levenshtein distance for categories
    const scoredCategories = categories.map((category) => {
      const categoryText = category.textContent.toLowerCase().trim();
      const distance = levenshteinDistance(categoryText, filter);
      return { item: category, distance, type: "category" };
    });

    // Combine and sort all results
    const allScoredItems = [
      ...scoredRows,
      ...scoredFolders,
      ...scoredCategories,
    ].sort((a, b) => a.distance - b.distance);

    // Clear current display
    rows.forEach((row) => (row.style.display = "none"));
    folders.forEach((folder) => (folder.style.display = "none"));
    categories.forEach((category) => (category.style.display = "none"));

    // Apply sorted order and display
    allScoredItems.forEach(({ item, distance, type }, index) => {
      item.style.display = "";
      // Highlight top 3 results
      if (index < 3 && distance !== Infinity) {
        item.classList.add("highlight");
      } else {
        item.classList.remove("highlight");
      }
      // Re-append to respective container to reflect sorted order
      if (type === "prompt") {
        goalsList.appendChild(item);
      } else if (type === "folder") {
        folderList.appendChild(item);
      } else if (type === "category") {
        item.parentElement.appendChild(item); // Re-append to accordion-content
      }
    });

    // Ensure folder search input visibility
    folderSearchInput = document.querySelector(".folder-search");
    if (folderList.children.length > 5) {
      folderSearchInput.style.display = "block";
    } else {
      folderSearchInput.style.display = "none";
    }
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
  folderSearchInput = document.querySelector(".folder-search");
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

  // Inject CSS styles dynamically
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
    /* Highlight for top search results */
    .highlight {
      background-color: #e6f3ff;
      border-left: 3px solid #1e90ff;
    }

    /* Ensure accordion items and folder list items are styled appropriately */
    .accordion-content li.highlight,
    .folder-list li.highlight {
      padding-left: 5px;
    }
    /* Bestehende Stile */
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
    .execute-workflow-step {
      margin-bottom: 15px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .execute-workflow-step label {
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
    }
    .execute-workflow-step textarea {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      min-height: 80px;
    }
    .execute-workflow-step button {
      margin-right: 10px;
    }
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
      font-weight: bold;
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
      font-weight: bold;
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
    .dropdown-menu {
      max-height: 300px;
      overflow-y: auto;
    }
    .step-list pre {
      white-space: pre-wrap;
      word-break: break-word;
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
        compatibleModels: compatibleModels, // Als Array speichern, nicht als String
        incompatibleModels: incompatibleModels, // Als Array speichern
        tags: tags, // Als Array speichern
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
        metaChangeLog: [], // Initial leer
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

  function showCreateWorkflowModal() {
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
    headerTitle.textContent = "Create New Workflow";

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    const form = document.createElement("form");

    const aiOptions = {
      grok: "Grok",
      gemini: "Gemini",
      chatgpt: "ChatGPT",
      claude: "Claude",
      blackbox: "BlackBox",
      githubCopilot: "GitHub Copilot",
      microsoftCopilot: "Microsoft Copilot",
      mistral: "Mistral",
      duckduckgo: "DuckDuckGo",
      perplexity: "Perplexity",
      deepseek: "DeepSeek",
      deepai: "Deepai",
      qwenAi: "Qwen AI",
    };

    const aiModelOptions = Object.entries(aiOptions)
      .map(([key, name]) => `<option value="${key}">${name}</option>`)
      .join("");

    form.innerHTML = `
    <label>Name:</label>
    <input type="text" id="workflow-name" placeholder="Workflow name" required>
    <label>AI Model:</label>
    <select id="workflow-ai-model" required>
      <option value="" disabled selected>Choose a model</option>
      ${aiModelOptions}
    </select>
    <label>Steps:</label>
    <div id="workflow-steps"></div>
    <button type="button" class="action-btn" id="add-step-btn">Add Step</button>
    <button type="submit" class="action-btn">Create Workflow</button>
  `;

    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalBody.appendChild(form);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const stepsContainer = form.querySelector("#workflow-steps");
    let steps = [];

    const addStep = (stepData = {}, index) => {
      const stepDiv = document.createElement("div");
      stepDiv.className = "step-item";
      stepDiv.dataset.stepIndex = index;

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
        `input[name="prompt-type-${index}"]`
      );

      const loadPrompts = (type) => {
        chrome.storage.local.get(null, (data) => {
          promptSelect.innerHTML = "";
          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.textContent = "Select a prompt";
          promptSelect.appendChild(defaultOption);

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
                  const option = document.createElement("option");
                  option.value = generatePromptId(id, idx);
                  option.textContent = prompt.title || `Prompt ${idx + 1}`;
                  if (stepData.promptId === option.value)
                    option.selected = true;
                  promptSelect.appendChild(option);
                }
              });
            }
          });
        });
      };

      loadPrompts(isDynamic ? "dynamic" : "static");

      radioButtons.forEach((radio) => {
        radio.addEventListener("change", () => {
          const selectedType = radio.value;
          const dynamic = selectedType === "dynamic";
          paramsLabel.style.display = dynamic ? "block" : "none";
          paramsTextarea.style.display = dynamic ? "block" : "none";
          if (!dynamic) {
            paramsTextarea.value = JSON.stringify({}, null, 2);
          }
          loadPrompts(selectedType);
        });
      });

      promptSelect.addEventListener("change", () => {
        const selectedPromptId = promptSelect.value;
        if (!selectedPromptId) return;
        const dynamicChecked =
          stepDiv.querySelector(`input[name="prompt-type-${index}"]:checked`)
            ?.value === "dynamic";

        if (!dynamicChecked) return;

        chrome.storage.local.get(null, (data) => {
          let selectedPromptContent = null;

          Object.entries(data).forEach(([id, topic]) => {
            if (topic.prompts && Array.isArray(topic.prompts)) {
              topic.prompts.forEach((prompt, idx) => {
                if (generatePromptId(id, idx) === selectedPromptId) {
                  selectedPromptContent = prompt.content;
                }
              });
            }
          });

          if (selectedPromptContent) {
            const placeholders = [
              ...selectedPromptContent.matchAll(/\{([^}]+)\}/g),
            ].map((m) => m[1]);
            const params = {};
            placeholders.forEach((key) => (params[key] = ""));
            paramsTextarea.value = JSON.stringify(params, null, 2);
          }
        });
      });

      stepDiv.querySelector(".remove-step").addEventListener("click", () => {
        stepsContainer.removeChild(stepDiv);
        steps.splice(index, 1);
        // Reindexierung
        [...stepsContainer.children].forEach((div, idx) => {
          div.dataset.stepIndex = idx;
        });
      });

      stepsContainer.appendChild(stepDiv);
      steps[index] = { ...stepData, stepDiv, isDynamic };
    };

    addStep({}, 0);

    form.querySelector("#add-step-btn").addEventListener("click", () => {
      addStep({}, steps.length);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = form.querySelector("#workflow-name").value.trim();
      const aiModel = form.querySelector("#workflow-ai-model").value;

      try {
        const workflowSteps = steps.map((_, index) => {
          const stepDiv = stepsContainer.querySelector(
            `[data-step-index="${index}"]`
          );
          const title = stepDiv.querySelector(".step-title").value.trim();
          const promptId = stepDiv.querySelector(".step-prompt").value;
          const isDynamic =
            stepDiv.querySelector(`input[name="prompt-type-${index}"]:checked`)
              .value === "dynamic";
          const params = isDynamic
            ? JSON.parse(
                stepDiv.querySelector(".step-params").value.trim() || "{}"
              )
            : {};

          if (!promptId) {
            throw new Error(`Step ${index + 1}: No prompt selected`);
          }

          return {
            title: title || `Step ${index + 1}`,
            promptId,
            parameters: params,
            isDynamic,
          };
        });

        const workflowId = `workflow_${Date.now()}`;
        const newWorkflow = {
          name,
          aiModel,
          steps: workflowSteps,
          createdAt: Date.now(),
          lastUsed: null,
        };

        chrome.storage.local.set({ [workflowId]: newWorkflow }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error saving workflow:", chrome.runtime.lastError);
            alert("Fehler beim Speichern.");
          } else {
            modal.remove();
            handleCategoryClick("Workflows");
          }
        });
      } catch (err) {
        alert(`Fehler: ${err.message}`);
      }
    });

    closeSpan.onclick = () => modal.remove();
    window.onclick = (e) => {
      if (e.target === modal) modal.remove();
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

        topic.prompts.push({
          ...prompt,
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
          prompts: [
            {
              ...prompt,
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
            topic.prompts &&
            !topic.isHidden &&
            !topic.isTrash &&
            id !== folderId
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
      !confirm(
        "Möchtest du diese Prompt wirklich in den Papierkorb verschieben?"
      )
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

  function renderPrompts(prompts) {
    const tbody = document.querySelector(".table-container tbody");
    tbody.innerHTML = "";

    prompts.forEach((prompt, index) => {
      const row = document.createElement("tr");
      row.dataset.index = index;
      row.innerHTML = `
      <td><input type="checkbox" /></td>
      <td>${prompt.title || "N/A"}</td>
      <td>${prompt.type || "N/A"}</td>
      <td>${
        Array.isArray(prompt.compatibleModels)
          ? prompt.compatibleModels.join(", ")
          : prompt.compatibleModels || ""
      }</td>
      <td>${
        Array.isArray(prompt.incompatibleModels)
          ? prompt.incompatibleModels.join(", ")
          : prompt.incompatibleModels || "N/A"
      }</td>
      <td>${
        Array.isArray(prompt.tags) ? prompt.tags.join(", ") : prompt.tags || ""
      }</td>
      <td>${prompt.folderName || ""}</td>
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
            ${
              prompt.type === "Workflow"
                ? '<div class="dropdown-item" data-action="execute-workflow">Execute Workflow</div>'
                : '<div class="dropdown-item" data-action="copy">Copy Prompt</div>'
            }
            <div class="dropdown-item" data-action="rename">Rename</div>
            <div class="dropdown-item" data-action="move-to-folder">Move to Folder</div>
            <div class="dropdown-item" data-action="share">Share</div>
            <div class="dropdown-item" data-action="add-to-favorites">${
              prompt.isFavorite ? "Remove from Favorites" : "Add to Favorites"
            }</div>
            <div class="dropdown-item" data-action="show-versions">Show Versions</div>
            <div class="dropdown-item" data-action="export">Export Prompt</div>
            <div class="dropdown-item" data-action="move-to-trash">Move to Trash</div>
          </div>
        </div>
      </td>
    `;

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
            copyPrompt(prompt, prompt.folderId);
          } else if (action === "execute-workflow") {
            executeWorkflow(prompt.folderId);
          } else if (action === "rename") {
            renamePrompt(prompt, prompt.folderId, row);
          } else if (action === "move-to-folder") {
            moveToFolder(prompt, prompt.folderId, row);
          } else if (action === "share") {
            sharePrompt(prompt);
          } else if (action === "add-to-favorites") {
            toggleFavorite(prompt, prompt.folderId, row);
          } else if (action === "show-versions") {
            chrome.storage.local.get(prompt.folderId, (data) => {
              const topic = data[prompt.folderId];
              if (!topic || !topic.prompts) return;
              const promptIndex = topic.prompts.findIndex(
                (p) => p.title === prompt.title && p.content === prompt.content
              );
              if (promptIndex !== -1) {
                showPromptVersions(prompt.folderId, promptIndex, row);
              }
            });
          } else if (action === "export") {
            exportPrompt(prompt, prompt.folderId);
          } else if (action === "move-to-trash") {
            moveToTrash(prompt, prompt.folderId, row);
          }
          dropdown.style.display = "none";
        });
      });

      row.addEventListener("click", (e) => {
        if (!e.target.closest(".prompt-actions")) {
          showDetailsSidebar(prompt, prompt.folderId);
        }
      });

      tbody.appendChild(row);
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".prompt-actions")) {
        document.querySelectorAll(".dropdown-menu").forEach((menu) => {
          menu.style.display = "none";
        });
      }
    });
  }

  function executeWorkflow(workflowId) {
    chrome.storage.local.get(workflowId, (data) => {
      const workflow = data[workflowId];
      if (!workflow || !workflow.steps) {
        console.error(`Workflow mit ID ${workflowId} nicht gefunden.`);
        alert("Fehler: Workflow nicht gefunden.");
        return;
      }

      console.log("Geladener Workflow:", JSON.stringify(workflow, null, 2));

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
      headerTitle.textContent = `Execute Workflow: ${workflow.name}`;
      const modalBody = document.createElement("div");
      modalBody.className = "modal-body";

      let currentStep = 0;
      let previousOutput = "";
      const stepOutputs = Array(workflow.steps.length).fill("");

      const renderStep = () => {
        modalBody.innerHTML = `
        <div class="execute-workflow-step">
          <label>Step ${currentStep + 1}: ${
          workflow.steps[currentStep].title || "Untitled Step"
        }</label>
          <label>Prompt Content</label>
          <textarea readonly></textarea>
          ${
            workflow.steps[currentStep].isDynamic
              ? `<label>Parameters (JSON)</label>
                 <textarea class="step-params" placeholder='{"key": "value"}'>${JSON.stringify(
                   workflow.steps[currentStep].parameters || {},
                   null,
                   2
                 )}</textarea>`
              : ""
          }
          <label>Previous Step Output (if any)</label>
          <textarea class="previous-output" placeholder="Paste the output from the previous step">${
            previousOutput || ""
          }</textarea>
          <button class="action-btn execute-step">Execute Step</button>
          ${
            currentStep < workflow.steps.length - 1
              ? `<button class="action-btn next-step">Next Step</button>`
              : `<button class="action-btn finish-workflow">Finish Workflow</button>`
          }
        </div>
      `;

        // Lade den Prompt-Inhalt
        const promptId = workflow.steps[currentStep].promptId;
        console.log(
          `Verarbeite promptId: ${promptId} für Schritt ${currentStep + 1}`
        );
        if (promptId) {
          // Split nur beim letzten Unterstrich

          // In executeWorkflow, mit parsePromptId
          const parsedId = parsePromptId(promptId);
          if (!parsedId) {
            console.error(`Ungültige promptId: ${promptId}`);
            modalBody.querySelector("textarea[readonly]").value =
              "Ungültige Prompt-ID.";
            return;
          }
          const { folderId, promptIndex } = parsedId;

          console.log(`folderId: ${folderId}, promptIndex: ${promptIndex}`);

          chrome.storage.local.get(folderId, (data) => {
            const topic = data[folderId];
            console.log(`Geladenes Topic für folderId ${folderId}:`, topic);
            if (
              topic &&
              topic.prompts &&
              topic.prompts[parseInt(promptIndex)] // Sicherstellen, dass promptIndex eine Zahl ist
            ) {
              const promptContent =
                topic.prompts[parseInt(promptIndex)].content;
              console.log(`Prompt-Inhalt gefunden: ${promptContent}`);
              modalBody.querySelector("textarea[readonly]").value =
                promptContent;
            } else {
              console.error(
                `Prompt nicht gefunden. Topic existiert: ${!!topic}, Prompts existieren: ${!!topic?.prompts}, Prompt an Index ${promptIndex}: ${
                  topic?.prompts?.[parseInt(promptIndex)]
                }`
              );
              modalBody.querySelector("textarea[readonly]").value =
                "Prompt nicht gefunden.";
            }
          });
        } else {
          console.warn(
            `Keine promptId für Schritt ${currentStep + 1} definiert.`
          );
          modalBody.querySelector("textarea[readonly]").value =
            "Kein Prompt ausgewählt.";
        }

        // Execute Step
        modalBody
          .querySelector(".execute-step")
          .addEventListener("click", () => {
            const promptId = workflow.steps[currentStep].promptId;
            if (!promptId) {
              alert("Kein Prompt für diesen Schritt ausgewählt.");
              return;
            }

            const parsedId = parsePromptId(promptId);
            if (!parsedId) {
              alert("Ungültige Prompt-ID.");
              return;
            }
            const { folderId, promptIndex } = parsedId;

            chrome.storage.local.get(folderId, (data) => {
              const topic = data[folderId];
              if (
                !topic ||
                !topic.prompts ||
                !topic.prompts[parseInt(promptIndex)]
              ) {
                alert("Fehler: Prompt nicht gefunden.");
                return;
              }
              const prompt = topic.prompts[parseInt(promptIndex)];
              let finalPrompt = prompt.content;

              if (workflow.steps[currentStep].isDynamic) {
                try {
                  const params = JSON.parse(
                    modalBody.querySelector(".step-params").value || "{}"
                  );
                  finalPrompt = finalPrompt.replace(
                    /\{([^}]+)\}/g,
                    (match, key) => {
                      return params[key] || match;
                    }
                  );
                } catch (e) {
                  alert("Ungültiges JSON in den Parametern: " + e.message);
                  return;
                }
              }

              // Ersetze Platzhalter für previousOutput
              if (previousOutput) {
                finalPrompt = finalPrompt.replace(
                  "{previousOutput}",
                  previousOutput
                );
              }

              // Kopiere den Prompt in die Zwischenablage
              navigator.clipboard
                .writeText(finalPrompt)
                .then(() => {
                  // Öffne die KI-Seite in einem neuen Tab
                  const aiModel = workflow.aiModel;
                  const aiUrls = {
                    grok: "https://grok.x.ai",
                    gemini: "https://gemini.google.com",
                    chatgpt: "https://chat.openai.com",
                    claude: "https://www.anthropic.com",
                    blackbox: "https://www.blackbox.ai",
                    githubCopilot: "https://github.com/features/copilot",
                    microsoftCopilot: "https://copilot.microsoft.com",
                    mistral: "https://mistral.ai",
                    duckduckgo: "https://duckduckgo.com",
                    perplexity: "https://www.perplexity.ai",
                    deepseek: "https://www.deepseek.com",
                    deepai: "https://deepai.org",
                    qwenAi: "https://www.qwen.ai",
                  };
                  const url = aiUrls[aiModel] || "https://www.google.com";
                  window.open(url, "_blank");
                  alert(
                    "Prompt wurde in die Zwischenablage kopiert. Bitte füge ihn in die KI ein und kopiere die Ausgabe zurück."
                  );
                })
                .catch((err) => {
                  console.error("Fehler beim Kopieren des Prompts:", err);
                  alert("Fehler beim Kopieren des Prompts.");
                });
            });
          });

        // Next Step
        if (currentStep < workflow.steps.length - 1) {
          modalBody
            .querySelector(".next-step")
            .addEventListener("click", () => {
              stepOutputs[currentStep] = modalBody
                .querySelector(".previous-output")
                .value.trim();
              previousOutput = stepOutputs[currentStep];
              currentStep++;
              renderStep();
            });
        }

        // Finish Workflow
        if (currentStep === workflow.steps.length - 1) {
          modalBody
            .querySelector(".finish-workflow")
            .addEventListener("click", () => {
              stepOutputs[currentStep] = modalBody
                .querySelector(".previous-output")
                .value.trim();
              // Aktualisiere lastUsed
              chrome.storage.local.get(workflowId, (data) => {
                const updatedWorkflow = {
                  ...data[workflowId],
                  lastUsed: Date.now(),
                };
                chrome.storage.local.set(
                  { [workflowId]: updatedWorkflow },
                  () => {
                    modal.remove();
                    handleCategoryClick("Workflows");
                  }
                );
              });
            });
        }
      };

      renderStep();

      modalHeader.appendChild(closeSpan);
      modalHeader.appendChild(headerTitle);
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      closeSpan.onclick = () => modal.remove();
      window.onclick = (event) => {
        if (event.target === modal) modal.remove();
      };
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
          const category =
            document.querySelector(".main-header h1").textContent;
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

          // Split beim letzten Unterstrich

          // In showDetailsSidebar, mit parsePromptId
          const parsedId = parsePromptId(step.promptId);
          if (!parsedId) {
            return `
    <li class="step-item">
      <strong>Step ${index + 1}: ${step.title || "Untitled Step"}</strong><br>
      Prompt: Ungültige Prompt-ID (${step.promptId})<br>
      Parameters: <pre>${JSON.stringify(step.parameters || {}, null, 2)}</pre>
    </li>
  `;
          }
          const { folderId: promptFolderId, promptIndex } = parsedId;

          const topic = data[promptFolderId];

          if (
            !topic ||
            !topic.prompts ||
            isNaN(promptIndex) ||
            !topic.prompts[promptIndex]
          ) {
            return `
            <li class="step-item">
              <strong>Step ${index + 1}: ${
              step.title || "Untitled Step"
            }</strong><br>
              Prompt: Nicht gefunden (ID: ${step.promptId})<br>
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

        const metaChangeLogEntries = (prompt.metaChangeLog || [])
          .map(
            (entry) => `
            <div style="margin-bottom: 10px;">
              <strong>${new Date(entry.timestamp).toLocaleString(
                "de-DE"
              )}</strong>
              <ul>
                ${Object.entries(entry.changes)
                  .map(([key, change]) => {
                    const formatValue = (value) =>
                      Array.isArray(value)
                        ? value.join(", ") || "None"
                        : value === true
                        ? "Yes"
                        : value === false
                        ? "No"
                        : value || "None";
                    return `<li><strong>${key}:</strong> From "${formatValue(
                      change.from
                    )}" to "${formatValue(change.to)}"</li>`;
                  })
                  .join("")}
              </ul>
            </div>
          `
          )
          .join("");

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
        <input type="text" value="${
          Array.isArray(prompt.compatibleModels)
            ? prompt.compatibleModels.join(", ")
            : prompt.compatibleModels || "N/A"
        }" readonly>
        <label>Incompatible Models</label>
        <input type="text" value="${
          Array.isArray(prompt.incompatibleModels)
            ? prompt.incompatibleModels.join(", ")
            : prompt.incompatibleModels || "N/A"
        }" readonly>
        <label>Tags</label>
        <input type="text" value="${
          Array.isArray(prompt.tags)
            ? prompt.tags.join(", ")
            : prompt.tags || "N/A"
        }" readonly>
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
        <label>Updated At</label>
        <input type="text" value="${
          prompt.updatedAt
            ? new Date(prompt.updatedAt).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <label>Last Used</label>
        <input type="text" value="${
          prompt.lastUsed
            ? new Date(prompt.lastUsed).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <label>Metadata Change Log</label>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
          ${metaChangeLogEntries || "<p>No metadata changes recorded.</p>"}
        </div>
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
          updatedAt: Date.now(), // Immer aktualisieren
          metaChangeLog: prompt.metaChangeLog || [], // Bestehendes Log beibehalten
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
          // Optional: Begrenze die Länge des metaChangeLog
          if (updatedPrompt.metaChangeLog.length > 50) {
            updatedPrompt.metaChangeLog.shift();
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
        li.classList.add("folder-item");
        li.innerHTML = `
        📁 ${topic.name}
        <span class="folder-actions">
          <button class="folder-action blue-dots-button" title="Aktionen">⋯</button>
          <div class="folder-dropdown hidden">
            <div class="dropdown-option edit-folder">✏️ Bearbeiten</div>
            <div class="dropdown-option delete-folder">🗑️ Löschen</div>
          </div>
        </span>
      `;

        // Hauptklick auf Ordner (nicht auf Button)
        li.addEventListener("click", (event) => {
          if (
            event.target.classList.contains("folder-action") ||
            event.target.classList.contains("dropdown-option")
          )
            return;
          handleFolderClick(topic.name);
        });

        // Button mit drei Punkten → Dropdown anzeigen/ausblenden
        li.querySelector(".folder-action").addEventListener(
          "click",
          (event) => {
            event.stopPropagation();
            const dropdown = li.querySelector(".folder-dropdown");
            dropdown.classList.toggle("hidden");
            closeAllOtherDropdowns(dropdown);
          }
        );

        // Aktionen im Dropdown
        li.querySelector(".edit-folder").addEventListener("click", (e) => {
          e.stopPropagation();
          editFolder(id, topic);
        });

        li.querySelector(".delete-folder").addEventListener("click", (e) => {
          e.stopPropagation();
          deleteFolder(id);
        });

        folderList.appendChild(li);
      });

      // Klick außerhalb schließt alle Dropdowns
      document.addEventListener("click", () => {
        document
          .querySelectorAll(".folder-dropdown")
          .forEach((d) => d.classList.add("hidden"));
      });

      // Sichtbarkeit des Suchfelds
      folderSearchInput = document.querySelector(".folder-search");
      folderSearchInput.style.display = folders.length > 5 ? "block" : "none";
    });

    function closeAllOtherDropdowns(current) {
      document.querySelectorAll(".folder-dropdown").forEach((d) => {
        if (d !== current) d.classList.add("hidden");
      });
    }

    function editFolder(id, topic) {
      // Modal erstellen
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
      headerTitle.textContent = "Ordner bearbeiten";

      const modalBody = document.createElement("div");
      modalBody.className = "modal-body";

      const form = document.createElement("form");
      form.innerHTML = `
        <label>Ordnername:</label>
        <input type="text" id="folder-name" value="${topic.name}" placeholder="Neuer Ordnername" required>
        <button type="submit" class="action-btn">Speichern</button>
    `;

      // Event-Listener für das Formular
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const newName = form.querySelector("#folder-name").value.trim();

        if (newName && newName !== topic.name) {
          chrome.storage.local.get(id, (data) => {
            const updatedTopic = {
              ...data[id],
              name: newName,
              updatedAt: Date.now(),
            };

            // Aktualisiere die folderName in allen Prompts des Ordners
            updatedTopic.prompts = (updatedTopic.prompts || []).map(
              (prompt) => ({
                ...prompt,
                folderName: newName,
              })
            );

            chrome.storage.local.set({ [id]: updatedTopic }, () => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Fehler beim Aktualisieren des Ordners:",
                  chrome.runtime.lastError
                );
                alert("Fehler beim Aktualisieren des Ordners.");
              } else {
                // Aktualisiere die Ordnerliste
                loadFolders();
                // Aktualisiere die Anzeige, falls der aktuelle Ordner angezeigt wird
                const currentCategory =
                  document.querySelector(".main-header h1").textContent;
                if (currentCategory === topic.name) {
                  handleFolderClick(newName);
                }
                modal.remove();
              }
            });
          });
        } else if (newName === "") {
          alert("Der Ordnername darf nicht leer sein!");
        } else {
          modal.remove(); // Schließe das Modal, wenn kein neuer Name eingegeben wurde
        }
      });

      // Modal zusammenbauen
      modalHeader.appendChild(closeSpan);
      modalHeader.appendChild(headerTitle);
      modalBody.appendChild(form);
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Schließen-Button
      closeSpan.onclick = () => modal.remove();
      window.onclick = (event) => {
        if (event.target === modal) modal.remove();
      };
    }

    function deleteFolder(id) {
      const confirmed = confirm("Diesen Ordner wirklich löschen?");
      if (confirmed) {
        chrome.storage.local.remove(id, () => {
          loadFolders(); // neu laden
        });
      }
    }
  }

  function initializePrompts() {
    chrome.storage.local.get(null, function (data) {
      const allPrompts = Object.entries(data)
        .filter(([, topic]) => topic.prompts && !topic.isTrash)
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

      const isVisibleOrHiddenTopic = (topic) => topic.prompts && !topic.isTrash; // Definition hinzugefügt
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
            .filter(([, topic]) => isVisibleOrHiddenTopic(topic))
            .flatMap(([id, topic]) => getPromptObjects(topic, id));
          break;

        case "Favorites":
          filteredPrompts = Object.entries(data)
            .filter(
              ([, topic]) => isVisibleTopic(topic) || isHiddenTopic(topic)
            )
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
            .filter(
              ([, topic]) => isVisibleTopic(topic) || isHiddenTopic(topic)
            )
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
    if (category === "Workflows") {
      showCreateWorkflowModal();
    } else {
      showCreatePromptModal(category);
    }
  });
});
