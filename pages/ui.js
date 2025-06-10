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
function initializePrompts() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get("category");
  if (categoryFromUrl) {
    handleCategoryClick(decodeURIComponent(categoryFromUrl));
  } else {
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
}
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
          .filter(([, topic]) => isVisibleTopic(topic) || isHiddenTopic(topic))
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
          .filter(([, topic]) => isVisibleTopic(topic) || isHiddenTopic(topic))
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
