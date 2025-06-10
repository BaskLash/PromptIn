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
      li.querySelector(".folder-action").addEventListener("click", (event) => {
        event.stopPropagation();
        const dropdown = li.querySelector(".folder-dropdown");
        dropdown.classList.toggle("hidden");
        closeAllOtherDropdowns(dropdown);
      });

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
          updatedTopic.prompts = (updatedTopic.prompts || []).map((prompt) => ({
            ...prompt,
            folderName: newName,
          }));

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
