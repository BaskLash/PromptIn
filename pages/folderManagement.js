function loadFolders() {
  const folderList = document.querySelector(".folder-list");
  chrome.storage.local.get(["folders"], ({ folders }) => {
    folderList.innerHTML = ""; // Vorherige Liste löschen

    if (!folders || Object.keys(folders).length === 0) {
      folderList.innerHTML = "<li>No folder available</li>";
      return;
    }

    const visibleFolders = Object.entries(folders).filter(
      ([, folder]) => !folder.isTrash
    );

    if (visibleFolders.length === 0) {
      folderList.innerHTML = "<li>No folder available</li>";
      return;
    }

    visibleFolders.forEach(([folderId, folder]) => {
      const li = document.createElement("li");
      li.classList.add("folder-item");
      li.setAttribute("data-folder", folder.name);
      li.innerHTML = `
      📁 ${folder.name}
      <span class="folder-actions">
        <button class="folder-action blue-dots-button" title="Aktionen">⋯</button>
        <div class="folder-dropdown hidden">
          <div class="dropdown-option edit-folder">✏️ Bearbeiten</div>
          <div class="dropdown-option delete-folder">🗑️ Löschen</div>
        </div>
      </span>
    `;

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
        editFolder(folderId, folder);
      });

      li.querySelector(".delete-folder").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteFolder(folderId);
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
    folderSearchInput.style.display =
      visibleFolders.length > 5 ? "block" : "none";
  });

  function closeAllOtherDropdowns(current) {
    document.querySelectorAll(".folder-dropdown").forEach((d) => {
      if (d !== current) d.classList.add("hidden");
    });
  }

  function editFolder(folderId, folderData) {
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
    <input type="text" id="folder-name" value="${folderData.name}" placeholder="Neuer Ordnername" required>
    <button type="submit" class="action-btn">Speichern</button>
  `;

    // Event-Listener für das Formular
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const newName = form.querySelector("#folder-name").value.trim();

      if (newName === "") {
        alert("Der Ordnername darf nicht leer sein!");
        return;
      }

      if (newName !== folderData.name) {
        chrome.storage.local.get(["folders"], ({ folders }) => {
          if (!folders || !folders[folderId]) {
            alert("Ordner konnte nicht gefunden werden.");
            return;
          }

          const updatedFolder = {
            ...folders[folderId],
            name: newName,
            updatedAt: Date.now(),
          };

          folders[folderId] = updatedFolder;

          chrome.storage.local.set({ folders }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Fehler beim Aktualisieren des Ordners:",
                chrome.runtime.lastError
              );
              alert("Fehler beim Aktualisieren des Ordners.");
            } else {
              loadFolders();

              const currentCategory =
                document.querySelector(".main-header h1")?.textContent;
              if (currentCategory === folderData.name) {
                handleFolderClick(newName);
              }

              modal.remove();
            }
          });
        });
      } else {
        modal.remove(); // kein neuer Name → einfach schließen
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

    // Schließen-Events
    closeSpan.onclick = () => modal.remove();
    window.onclick = (event) => {
      if (event.target === modal) modal.remove();
    };
  }

  function deleteFolder(folderId) {
    const confirmed = confirm("Diesen Ordner wirklich löschen?");
    if (!confirmed) return;

    chrome.storage.local.get(["folders"], ({ folders }) => {
      if (!folders || !folders[folderId]) {
        alert("Ordner konnte nicht gefunden werden.");
        return;
      }

      delete folders[folderId];

      chrome.storage.local.set({ folders }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Fehler beim Löschen des Ordners:",
            chrome.runtime.lastError
          );
          alert("Fehler beim Löschen des Ordners.");
        } else {
          loadFolders(); // neu laden
        }
      });
    });
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
  headerTitle.textContent = "Create new folder";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  const form = document.createElement("form");
  form.innerHTML = `
    <label>Foldername:</label>
    <input type="text" id="new-folder-name" placeholder="New foldername" required>
    <button type="submit" class="action-btn">Create</button>
    <button type="button" class="cancel-btn">Cancel</button>
  `;

  // Event-Listener für das Formular
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const folderName = form.querySelector("#new-folder-name").value.trim();

    if (!folderName) {
      alert("The folder name must not be empty!");
      return;
    }

    const folderId = `folder_${Date.now()}_${generateUUID()}`;
    const newFolder = {
      folderId: folderId,
      name: folderName,
      promptIds: [],
      isTrash: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    chrome.storage.local.get(["folders"], ({ folders }) => {
      const updatedFolders = folders || {};
      updatedFolders[folderId] = newFolder;

      chrome.storage.local.set({ folders: updatedFolders }, () => {
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
    });
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
