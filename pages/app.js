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
      @media (max-width: 600px) {
        .details-sidebar {
          width: 100%;
        }
        .dropdown-menu {
          right: auto;
          left: 0;
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
    <label>Title:</label>
    <input type="text" id="prompt-title" placeholder="Enter prompt title" required>
    <label>Description:</label>
    <textarea id="prompt-description" placeholder="Enter prompt description"></textarea>
    <label>Content:</label>
    <textarea id="prompt-content" placeholder="Enter prompt content" required></textarea>
    <label>Type:</label>
    <input type="text" id="prompt-type" placeholder="Enter prompt type">
    <label>Compatible Models:</label>
    <input type="text" id="prompt-compatible" placeholder="Enter compatible models (comma-separated)">
    <label>Incompatible Models:</label>
    <input type="text" id="prompt-incompatible" placeholder="Enter incompatible models (comma-separated)">
    <label>Tags:</label>
    <input type="text" id="prompt-tags" placeholder="Enter tags (comma-separated)">
  `;

    const createButton = document.createElement("button");
    createButton.textContent = "Create Prompt";
    createButton.className = "action-btn";
    createButton.type = "submit";

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const newPrompt = {
        title: document.getElementById("prompt-title").value.trim(),
        description: document.getElementById("prompt-description").value.trim(),
        content: document.getElementById("prompt-content").value.trim(),
        type: document.getElementById("prompt-type").value.trim(),
        compatibleModels: document
          .getElementById("prompt-compatible")
          .value.trim(),
        incompatibleModels: document
          .getElementById("prompt-incompatible")
          .value.trim(),
        tags: document.getElementById("prompt-tags").value.trim(),
        createdAt: Date.now(),
        lastUsed: null,
        versions: [
          {
            versionId: generateUUID(),
            title: document.getElementById("prompt-title").value.trim(),
            description: document
              .getElementById("prompt-description")
              .value.trim(),
            content: document.getElementById("prompt-content").value.trim(),
            timestamp: Date.now(),
          },
        ],
      };

      saveNewPrompt(newPrompt, category);
      modal.remove();
      handleCategoryClick(category);
    });

    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalBody.appendChild(form);
    modalBody.appendChild(createButton);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    closeSpan.onclick = () => modal.remove();
    window.onclick = (event) => {
      if (event.target === modal) modal.remove();
    };
  }

  function saveNewPrompt(prompt, category) {
    chrome.storage.local.get(null, (data) => {
      let folderId;
      if (category === "Single Prompts") {
        folderId = `single_prompt_${Date.now()}`;
        chrome.storage.local.set({
          [folderId]: {
            name: "Single Prompt",
            prompts: [prompt],
            isHidden: true,
            isTrash: false,
          },
        });
      } else if (category === "Categorised Prompts") {
        // Suche nach einem passenden Ordner oder erstelle einen neuen
        const existingFolder = Object.entries(data).find(
          ([, topic]) =>
            topic.name === "Default Category" &&
            !topic.isHidden &&
            !topic.isTrash
        );
        if (existingFolder) {
          folderId = existingFolder[0];
          const topic = existingFolder[1];
          topic.prompts.push(prompt);
          chrome.storage.local.set({ [folderId]: topic });
        } else {
          folderId = `category_${Date.now()}`;
          chrome.storage.local.set({
            [folderId]: {
              name: "Default Category",
              prompts: [prompt],
              isHidden: false,
              isTrash: false,
            },
          });
        }
      } else if (
        [
          "All Prompts",
          "Favorites",
          "Dynamic Prompts",
          "Static Prompts",
          "Unused Prompts",
        ].includes(category)
      ) {
        folderId = `category_${Date.now()}`;
        chrome.storage.local.set({
          [folderId]: {
            name: category,
            prompts: [prompt],
            isHidden: false,
            isTrash: false,
          },
        });
      } else if (category === "Trash") {
        folderId = "trash_folder";
        const trashFolder = data[folderId] || { prompts: [], isTrash: true };
        trashFolder.prompts.push(prompt);
        chrome.storage.local.set({ [folderId]: trashFolder });
      } else {
        // Annahme: category ist ein Ordnername
        const folder = Object.entries(data).find(
          ([, topic]) =>
            topic.name === category && !topic.isHidden && !topic.isTrash
        );
        if (folder) {
          folderId = folder[0];
          const topic = folder[1];
          topic.prompts.push(prompt);
          chrome.storage.local.set({ [folderId]: topic });
        } else {
          folderId = `folder_${Date.now()}`;
          chrome.storage.local.set({
            [folderId]: {
              name: category,
              prompts: [prompt],
              isHidden: false,
              isTrash: false,
            },
          });
        }
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
        <label>Content</label>
        <textarea readonly>${prompt.content || "N/A"}</textarea>
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
    <label>Content</label>
    <textarea id="edit-content">${prompt.content || ""}</textarea>
    <label>Compatible Models</label>
    <input type="text" value="${
      prompt.compatibleModels || ""
    }" id="edit-compatible">
    <label>Incompatible Models</label>
    <input type="text" value="${
      prompt.incompatibleModels || ""
    }" id="edit-incompatible">
    <label>Tags</label>
    <input type="text" value="${prompt.tags || ""}" id="edit-tags">
    <button class="save-btn">Save</button>
    <button class="cancel-btn">Cancel</button>
  `;

    const saveBtn = sidebarContent.querySelector(".save-btn");
    const cancelBtn = sidebarContent.querySelector(".cancel-btn");

    saveBtn.addEventListener("click", () => {
      chrome.storage.local.get(folderId, (data) => {
        const topic = data[folderId];
        if (!topic || !topic.prompts) return;

        const updatedPrompt = {
          ...prompt,
          title: sidebarContent.querySelector("#edit-title").value.trim(),
          content: sidebarContent.querySelector("#edit-content").value.trim(),
          compatibleModels: sidebarContent
            .querySelector("#edit-compatible")
            .value.trim(),
          incompatibleModels: sidebarContent
            .querySelector("#edit-incompatible")
            .value.trim(),
          tags: sidebarContent.querySelector("#edit-tags").value.trim(),
        };

        // Prüfe, ob Änderungen vorliegen
        const hasChanges =
          prompt.title !== updatedPrompt.title ||
          prompt.content !== updatedPrompt.content ||
          prompt.description !== (updatedPrompt.description || "") ||
          prompt.compatibleModels !== updatedPrompt.compatibleModels ||
          prompt.incompatibleModels !== updatedPrompt.incompatibleModels ||
          prompt.tags !== updatedPrompt.tags;

        if (hasChanges) {
          updatedPrompt.versions = updatedPrompt.versions || [];
          updatedPrompt.versions.push({
            versionId: generateUUID(),
            title: updatedPrompt.title,
            description: updatedPrompt.description || "",
            content: updatedPrompt.content,
            timestamp: Date.now(),
          });
          // Begrenze die Anzahl der Versionen (z. B. 50)
          if (updatedPrompt.versions.length > 50) {
            updatedPrompt.versions.shift();
          }
        }

        topic.prompts[promptIndex] = updatedPrompt;

        chrome.storage.local.set({ [folderId]: topic }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error saving prompt:", chrome.runtime.lastError);
            alert("Error saving prompt.");
          } else {
            showDetailsSidebar(topic.prompts[promptIndex], folderId);
            const category =
              document.querySelector(".main-header h1").textContent;
            handleCategoryClick(category);
          }
        });
      });
    });

    cancelBtn.addEventListener("click", () => {
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
