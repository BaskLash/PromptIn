const inputField = document.getElementById("inputField"); // Stelle sicher, dass dein Input-Feld eine ID hat
const dropdownContent = document.querySelector(".dropdown-content");
const clearStorageButton = document.getElementById("clear-storage"); // Falls du einen Button hast

// Funktion zum Generieren einer eindeutigen ID
async function generateUniqueID(name) {
  const encoder = new TextEncoder();
  const data = encoder.encode(name + Date.now() + Math.random());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${Date.now()}-${hash.substring(0, 8)}`;
}

// Funktion zum Hinzufügen eines neuen Dropdown-Elements
function addDropdownItem(id, topicName) {
  if (!dropdownContent) {
    console.error("Dropdown-Content-Element nicht gefunden!");
    return;
  }
  const link = document.createElement("a");
  link.href = `#${id}`;
  link.title = topicName;
  link.textContent = topicName;
  dropdownContent.appendChild(link);
}

const accordionContainer = document.querySelector(".accordion-container");

// Function to create an accordion for a folder
function createAccordion(id, topicName, prompts) {
  if (!accordionContainer) {
    console.error("Accordion-Container nicht gefunden!");
    return;
  }

  const accordion = document.createElement("div");
  accordion.classList.add("accordion");
  accordion.dataset.target = id;

  const button = document.createElement("button");
  button.classList.add("topic-name");
  button.textContent = `${topicName} (${prompts.length})`;
  button.title = topicName;

  const actionLinks = document.createElement("span");
  actionLinks.classList.add("action-links");

  const renameButton = document.createElement("button");
  renameButton.classList.add("rename-button");
  const renameImg = document.createElement("img");
  renameImg.src = "icon/edit-solid.svg";
  renameImg.alt = "Rename";
  renameButton.appendChild(renameImg);
  renameButton.title = "Rename folder";

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-button");
  const deleteImg = document.createElement("img");
  deleteImg.src = "icon/trash-solid.svg";
  deleteImg.alt = "Delete";
  deleteButton.appendChild(deleteImg);
  deleteButton.title = "Delete folder";

  renameButton.addEventListener("click", function (event) {
    event.stopPropagation();
    const input = document.createElement("input");
    input.type = "text";
    input.value = topicName;
    input.style.padding = "12px 20px";
    input.classList.add("rename-input");
    accordion.replaceChild(input, button);
    input.focus();
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") saveNewName(id, input, button, accordion);
    });
    input.addEventListener("blur", function () {
      saveNewName(id, input, button, accordion);
    });
  });

  deleteButton.addEventListener("click", function (event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${topicName}"?`)) {
      chrome.storage.sync.remove(id, function () {
        if (chrome.runtime.lastError) {
          console.error("Error removing folder:", chrome.runtime.lastError);
          return;
        }
        console.log(`Deleted folder: ${topicName} (ID: ${id})`);
        accordion.remove();
        panel.remove();
      });
    }
  });

  actionLinks.appendChild(renameButton);
  actionLinks.appendChild(deleteButton);
  accordion.appendChild(button);
  accordion.appendChild(actionLinks);

  const panel = document.createElement("div");
  panel.classList.add("panel");
  panel.id = id;

  const table = document.createElement("table");
  const tbody = document.createElement("tbody");

  if (prompts.length === 0) {
    // Falls keine Prompts vorhanden sind
    const row = document.createElement("tr");
    const messageCell = document.createElement("td");
    messageCell.colSpan = 5; // Spannt über alle Spalten (Prompt + Edit/Delete/Use/Relocate)
    messageCell.style.textAlign = "center";
    messageCell.style.padding = "10px";

    const noPromptsMessage = document.createElement("p");
    noPromptsMessage.textContent = "No prompts available";
    noPromptsMessage.style.color = "#888";
    messageCell.appendChild(noPromptsMessage);

    const createPromptButton = document.createElement("button");
    createPromptButton.textContent = "Create Prompt";
    createPromptButton.classList.add("action-button");
    createPromptButton.style.marginTop = "10px";
    createPromptButton.addEventListener("click", () => {
      // Öffne das neue Modal für diesen spezifischen Ordner
      const newPromptOnlyModal = document.getElementById(
        "new-promptonly-modal"
      );
      if (newPromptOnlyModal) {
        newPromptOnlyModal.style.display = "block";
        newPromptOnlyModal.dataset.folderId = id; // Speichere die folderId im Modal
      } else {
        console.error("New Prompt Only Modal nicht gefunden!");
      }
    });
    messageCell.appendChild(createPromptButton);

    row.appendChild(messageCell);
    tbody.appendChild(row);
  } else {
    // Falls Prompts vorhanden sind, normale Darstellung
    prompts.forEach((prompt, index) => {
      const row = document.createElement("tr");
      const promptCell = document.createElement("td");
      const promptText = document.createElement("p");
      promptText.textContent =
        prompt.length > 18 ? prompt.slice(0, 18) + "..." : prompt;
      promptText.title = prompt;
      promptCell.appendChild(promptText);
      row.appendChild(promptCell);

      ["Edit", "Delete", "Use", "Relocate"].forEach((action) => {
        const actionCell = document.createElement("td");

        if (action === "Relocate") {
          const dropdown = document.createElement("div");
          dropdown.classList.add("dropdown2");

          const relocateButton = document.createElement("button");
          relocateButton.classList.add("action-button", "dropbtn2");
          relocateButton.textContent = "Relocate";
          relocateButton.title = "Relocate prompt";

          const dropdownContent = document.createElement("div");
          dropdownContent.classList.add("dropdown-content2");
          dropdownContent.id = `relocate-dropdown-${index}-${id}`;

          chrome.storage.sync.get(null, function (data) {
            if (chrome.runtime.lastError) {
              console.error(
                "Error fetching storage data:",
                chrome.runtime.lastError
              );
              return;
            }
            dropdownContent.innerHTML = "";
            Object.entries(data).forEach(([folderId, topic]) => {
              const folderName = topic.name;
              const folderLink = document.createElement("a");
              folderLink.href = "#";
              folderLink.textContent = folderName;
              folderLink.addEventListener("click", (e) => {
                e.preventDefault();
                console.log(
                  `Prompt "${prompt}" wird nach ${folderName} verschoben.`
                );
                relocatePrompt(promptText, id, folderName);
                dropdownContent.classList.remove("show2");
              });
              dropdownContent.appendChild(folderLink);
            });
            if (Object.keys(data).length === 0) {
              const noFolders = document.createElement("a");
              noFolders.href = "#";
              noFolders.textContent = "Keine Ordner vorhanden";
              noFolders.style.color = "#888";
              noFolders.style.pointerEvents = "none";
              dropdownContent.appendChild(noFolders);
            }
          });

          relocateButton.addEventListener("click", () => {
            dropdownContent.classList.toggle("show2");
          });

          dropdown.appendChild(relocateButton);
          dropdown.appendChild(dropdownContent);
          actionCell.appendChild(dropdown);
        } else {
          const actionButton = document.createElement("button");
          actionButton.classList.add("action-button");
          actionButton.textContent = action;
          actionButton.title = `${action} prompt`;
          actionCell.appendChild(actionButton);

          actionButton.addEventListener("click", function () {
            switch (action) {
              case "Edit":
                editPrompt(prompt, id, index);
                break;
              case "Delete":
                deletePrompt(promptText, id, row);
                break;
              case "Use":
                usePrompt(prompt);
                break;
            }
          });
        }

        row.appendChild(actionCell);
      });

      tbody.appendChild(row);
    });
  }

  table.appendChild(tbody);
  panel.appendChild(table);

  accordionContainer.appendChild(accordion);
  accordionContainer.appendChild(panel);

  button.addEventListener("click", function () {
    panel.classList.toggle("show2");
  });
}

// Funktion zum Laden aller gespeicherten Ordner
function loadDropdownItems() {
  chrome.storage.sync.get(null, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Fehler beim Abrufen der Daten:", chrome.runtime.lastError);
      return;
    }

    let topics = Object.entries(data);
    let noFoldersMessage = document.querySelector(".no-folders-message");

    // Überprüfen, ob es keine Topics gibt
    if (topics.length === 0) {
      // Wenn der Text noch nicht existiert, erstelle ihn
      if (!noFoldersMessage) {
        noFoldersMessage = document.createElement("p");
        noFoldersMessage.classList.add("no-folders-message");
        noFoldersMessage.style.marginLeft = "1rem";
        noFoldersMessage.style.color = "red";
        noFoldersMessage.style.fontWeight = "bold";
        noFoldersMessage.textContent = "No folders available yet";
        noFoldersMessage.title =
          "Enter a prompt or chat with copilot to create some folders";
        dropdownContent.appendChild(noFoldersMessage);
      }
      return;
    } else {
      // Wenn Topics vorhanden sind, entferne die Nachricht
      if (noFoldersMessage) {
        noFoldersMessage.remove();
      }
    }

    // Vorhandene Links entfernen, um Dopplungen zu vermeiden
    document.querySelectorAll(".dropdown-content a").forEach((a) => a.remove());

    // Ordner als Links hinzufügen
    topics.forEach(([id, topic]) => {
      addDropdownItem(id, topic.name);
    });
  });
}

// Speicher leeren, falls Button vorhanden
if (clearStorageButton) {
  clearStorageButton.addEventListener("click", function () {
    chrome.storage.sync.clear(function () {
      if (chrome.runtime.lastError) {
        console.error("Error clearing storage:", chrome.runtime.lastError);
        return;
      }

      // UI zurücksetzen
      dropdownContent.innerHTML = ""; // Dropdown zurücksetzen
      accordionContainer.innerHTML = ""; // Accordion zurücksetzen
      console.log("Storage cleared");
    });
  });
}

// Schließe Dropdown bei Klick außerhalb
window.addEventListener("click", (event) => {
  if (!event.target.matches(".dropbtn2")) {
    const dropdowns = document.getElementsByClassName("dropdown-content2");
    for (let i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show2")) {
        openDropdown.classList.remove("show2");
      }
    }
  }
});

function editPrompt(prompt, folderId, promptIndex) {
  const url =
    chrome.runtime.getURL("/pages/editPrompt.html") +
    `?folderId=${encodeURIComponent(folderId)}` +
    `&promptIndex=${encodeURIComponent(promptIndex)}` +
    `&prompt=${encodeURIComponent(prompt)}`; // Prompt hinzufügen

  chrome.tabs.create({ url: url }, (tab) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Fehler beim Erstellen des Tabs:",
        chrome.runtime.lastError
      );
    } else {
      console.log(
        "Neuer Tab geöffnet mit Folder ID:",
        folderId,
        "Prompt Index:",
        promptIndex,
        "Prompt:",
        prompt
      );
    }
  });
}

function deletePrompt(promptElement, folderId, rowElement) {
  const promptText = promptElement.title || promptElement.textContent.trim(); // Voller Text verwenden
  if (confirm("Are you sure you want to delete this prompt?")) {
    chrome.storage.sync.get(folderId, function (data) {
      if (data[folderId]) {
        data[folderId].prompts = data[folderId].prompts.filter(
          (p) => p !== promptText
        );

        chrome.storage.sync.set(data, function () {
          if (chrome.runtime.lastError) {
            console.error("Error saving data:", chrome.runtime.lastError);
            return;
          }
          console.log("Prompt deleted:", promptText);
          rowElement.remove();
          loadFolders(); // UI aktualisieren
        });
      }
    });
  }
}

function usePrompt(prompt) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error("🚨 No active tab found.");
      return;
    }

    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "usePrompt", text: prompt },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Message failed:", chrome.runtime.lastError);
        } else {
          console.log("📨 Response from content.js:", response);
        }
      }
    );
  });
}

// Die relocatePrompt-Funktion bleibt unverändert
function relocatePrompt(promptElement, currentFolderId, targetFolderName) {
  const promptText = promptElement.title || promptElement.textContent.trim(); // Voller Text verwenden

  chrome.storage.sync.get(null, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }

    let currentFolder = null;
    let targetFolderId = null;

    Object.entries(data).forEach(([id, topic]) => {
      if (id === currentFolderId) {
        currentFolder = topic;
      }
      if (topic.name === targetFolderName) {
        targetFolderId = id;
      }
    });

    if (!currentFolder) {
      console.error(
        `Aktueller Ordner mit ID ${currentFolderId} nicht gefunden.`
      );
      return;
    }

    const updatedCurrentPrompts = currentFolder.prompts.filter(
      (prompt) => prompt !== promptText
    );
    const updatedCurrentFolder = {
      name: currentFolder.name,
      prompts: updatedCurrentPrompts,
    };

    if (!targetFolderId) {
      targetFolderId = `folder_${Date.now()}`;
      const newFolder = {
        name: targetFolderName,
        prompts: [promptText],
      };
      data[targetFolderId] = newFolder;
    } else {
      data[targetFolderId].prompts.push(promptText);
    }

    data[currentFolderId] = updatedCurrentFolder;

    chrome.storage.sync.set(data, function () {
      if (chrome.runtime.lastError) {
        console.error("Error saving data:", chrome.runtime.lastError);
      } else {
        console.log(
          `Prompt "${promptText}" erfolgreich von "${currentFolder.name}" nach "${targetFolderName}" verschoben.`
        );
        promptElement.closest("tr")?.remove();
        loadFolders();
        loadDropdownItems();
      }
    });
  });
}

function saveNewName(id, input, button, accordion) {
  const newName = input.value.trim();
  if (newName) {
    chrome.storage.sync.get(null, function (data) {
      if (data[id]) {
        data[id].name = newName; // Update the name in storage
        chrome.storage.sync.set(data, function () {
          console.log(`Updated name for ${id}: ${newName}`);

          // Update UI
          button.textContent = newName;
          button.title = newName;
          accordion.replaceChild(button, input);
        });
      }
    });
  } else {
    accordion.replaceChild(button, input); // Restore button if name is empty
  }
}

// Function to load stored folders and prompts
function loadFolders() {
  chrome.storage.sync.get(null, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }

    // Clear the existing content before reloading
    accordionContainer.innerHTML = "";

    Object.entries(data).forEach(([id, topic]) => {
      createAccordion(id, topic.name, topic.prompts);
    });
  });
}
// Dropdown-Elemente beim Laden der Seite abrufen
document.addEventListener("DOMContentLoaded", loadDropdownItems);
// Load folders on page load
document.addEventListener("DOMContentLoaded", loadFolders);

// Close the dropdown if the user clicks outside of the enterage class
window.onclick = function (event) {
  // Überprüfen, ob das geklickte Element nicht innerhalb der Klasse "enterage" ist
  if (!event.target.closest(".enterage")) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (var i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};

document.addEventListener("DOMContentLoaded", function () {
  // inputField = document.getElementById("inputField");
  dropdownContent = document.querySelector(".dropdown-content");
  clearStorageButton = document.getElementById("clear-storage");
  accordionContainer = document.querySelector(".accordion-container");

  loadDropdownItems();
  loadFolders();
});
// Initialisierung des neuen Modals
document.addEventListener("DOMContentLoaded", function () {
  const newPromptOnlyModal = document.getElementById("new-promptonly-modal");
  const closeNewPromptOnlyModal = document.getElementById(
    "close-new-promptonly-modal"
  );
  const createPromptOnlyBtn = document.getElementById("create-promptonly-btn");
  const promptOnlyTextInput = document.getElementById("promptonly-text");

  // Modal schließen
  if (closeNewPromptOnlyModal) {
    closeNewPromptOnlyModal.addEventListener("click", () => {
      newPromptOnlyModal.style.display = "none";
      promptOnlyTextInput.value = ""; // Eingabe zurücksetzen
    });
  }

  // Schließen bei Klick außerhalb des Modals
  window.addEventListener("click", (event) => {
    if (event.target === newPromptOnlyModal) {
      newPromptOnlyModal.style.display = "none";
      promptOnlyTextInput.value = "";
    }
  });

  // Prompt erstellen und direkt in den Ordner einfügen
  if (createPromptOnlyBtn) {
    createPromptOnlyBtn.addEventListener("click", () => {
      const promptText = promptOnlyTextInput.value.trim();
      const folderId = newPromptOnlyModal.dataset.folderId; // folderId aus dem Modal holen

      if (promptText && folderId) {
        console.log(
          `Neue Prompt "${promptText}" wird zum Ordner ${folderId} hinzugefügt.`
        );

        // Bestehende Daten aus chrome.storage.sync abrufen
        chrome.storage.sync.get(null, function (data) {
          if (chrome.runtime.lastError) {
            console.error("Error fetching data:", chrome.runtime.lastError);
            return;
          }

          // Sicherstellen, dass der Ordner existiert
          if (data[folderId]) {
            data[folderId].prompts.push(promptText); // Prompt hinzufügen
          } else {
            console.warn(
              `Ordner ${folderId} nicht gefunden, erstelle neuen Eintrag.`
            );
            data[folderId] = {
              name: "Unnamed Folder", // Fallback-Name
              prompts: [promptText],
            };
          }

          // Daten speichern
          chrome.storage.sync.set(data, function () {
            if (chrome.runtime.lastError) {
              console.error("Error saving data:", chrome.runtime.lastError);
            } else {
              console.log(
                `Prompt "${promptText}" erfolgreich zu ${folderId} hinzugefügt.`
              );
              newPromptOnlyModal.style.display = "none";
              promptOnlyTextInput.value = "";
              loadFolders(); // UI aktualisieren
            }
          });
        });
      } else {
        alert("Bitte geben Sie eine Prompt ein!");
      }
    });
  }
});
const showOverview = document.getElementById("overview-btn");
if (showOverview) {
  showOverview.addEventListener("click", function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("/pages/app.html") });
  });
}
// Settings Modal
const settingsBtn = document.getElementById("settings-btn");
const modal = document.getElementById("settings-modal");
const closeModal = document.getElementById("close-modal");

settingsBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

// Schließe Modal, wenn außerhalb geklickt wird
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});
// FAQ Modal
const faqBtn = document.getElementById("faq-btn");
const faqModal = document.getElementById("faq-modal");
const closeFaqModal = document.getElementById("close-faq-modal");

faqBtn.addEventListener("click", () => {
  faqModal.style.display = "block";
});

closeFaqModal.addEventListener("click", () => {
  faqModal.style.display = "none";
});

// Schließe FAQ Modal, wenn außerhalb geklickt wird
window.addEventListener("click", (event) => {
  if (event.target === faqModal) {
    faqModal.style.display = "none";
  }
});
// New Folder Modal
const newFolderBtn = document.querySelector(".new-folder");
const newFolderModal = document.getElementById("new-folder-modal");
const closeNewFolderModal = document.getElementById("close-new-folder-modal");
const createFolderBtn = document.getElementById("create-folder-btn");
const folderNameInput = document.getElementById("folder-name");

newFolderBtn.addEventListener("click", () => {
  newFolderModal.style.display = "block";
});

closeNewFolderModal.addEventListener("click", () => {
  newFolderModal.style.display = "none";
  folderNameInput.value = ""; // Eingabe zurücksetzen
});

// Schließe Modal, wenn außerhalb geklickt wird
window.addEventListener("click", (event) => {
  if (event.target === newFolderModal) {
    newFolderModal.style.display = "none";
    folderNameInput.value = ""; // Eingabe zurücksetzen
  }
});

// Beim Klick auf "Erstellen"
createFolderBtn.addEventListener("click", () => {
  const folderName = folderNameInput.value.trim();
  if (folderName) {
    console.log(`Neuer Ordner wird erstellt: ${folderName}`);

    // Eindeutige ID für den neuen Ordner generieren
    const folderId = `folder_${Date.now()}`;

    // Bestehende Daten aus chrome.storage.sync abrufen
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      // Sicherstellen, dass data ein Objekt ist
      const updatedData = data || {};

      // Neuen Ordner hinzufügen
      updatedData[folderId] = {
        name: folderName,
        prompts: [], // Leeres Array für Prompts
      };

      // Aktualisierte Daten speichern
      chrome.storage.sync.set(updatedData, function () {
        if (chrome.runtime.lastError) {
          console.error("Error saving data:", chrome.runtime.lastError);
        } else {
          console.log(
            `Neuer Ordner "${folderName}" (ID: ${folderId}) erfolgreich erstellt.`
          );
          // Modal schließen und Eingabe zurücksetzen
          newFolderModal.style.display = "none";
          folderNameInput.value = "";
          // Popup-Fenster aktualisieren
          loadFolders();
          // Optional: Dropdown für neue Prompts aktualisieren
          loadDropdownItems();
        }
      });
    });
  } else {
    alert("Bitte geben Sie einen Ordnernamen ein!");
  }
});
// New Prompt Modal
const newPromptBtn = document.querySelector(".new-prompt");
const newPromptModal = document.getElementById("new-prompt-modal");
const closeNewPromptModal = document.getElementById("close-new-prompt-modal");
const createPromptBtn = document.getElementById("create-prompt-btn");
const promptTextInput = document.getElementById("prompt-text");
const folderSelect = document.getElementById("folder-select");

// Funktion zum Aktualisieren der Ordnerliste
function updateFolderSelect() {
  chrome.storage.sync.get(null, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }
    folderSelect.innerHTML = '<option value="">-- Ordner auswählen --</option>';
    Object.entries(data).forEach(([id, topic]) => {
      const option = document.createElement("option");
      option.value = id; // Verwende die ID als Wert
      option.textContent = topic.name;
      folderSelect.appendChild(option);
    });
  });
}

newPromptBtn.addEventListener("click", () => {
  updateFolderSelect(); // Ordnerliste aktualisieren, bevor das Modal geöffnet wird
  newPromptModal.style.display = "block";
});

closeNewPromptModal.addEventListener("click", () => {
  newPromptModal.style.display = "none";
  promptTextInput.value = ""; // Eingabe zurücksetzen
  folderSelect.value = ""; // Auswahl zurücksetzen
});

// Schließe Modal, wenn außerhalb geklickt wird
window.addEventListener("click", (event) => {
  if (event.target === newPromptModal) {
    newPromptModal.style.display = "none";
    promptTextInput.value = ""; // Eingabe zurücksetzen
    folderSelect.value = ""; // Auswahl zurücksetzen
  }
});

// Beim Klick auf "Erstellen"
createPromptBtn.addEventListener("click", () => {
  const promptText = promptTextInput.value.trim();
  const selectedFolder = folderSelect.value; // Dies ist die folderId aus updateFolderSelect

  if (promptText && selectedFolder) {
    console.log(
      `Neue Prompt wird erstellt: "${promptText}" im Ordner mit ID: "${selectedFolder}"`
    );

    // Bestehende Daten aus chrome.storage.sync abrufen
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      // Prüfen, ob der ausgewählte Ordner existiert
      if (data[selectedFolder]) {
        // Prompt zum bestehenden Ordner hinzufügen
        data[selectedFolder].prompts.push(promptText);
      } else {
        // Falls der Ordner nicht existiert (sicherheitshalber), neuen Ordner erstellen
        console.warn(
          `Ordner mit ID ${selectedFolder} nicht gefunden, erstelle neuen Ordner.`
        );
        data[selectedFolder] = {
          name: selectedFolder, // Name könnte hier angepasst werden, falls nötig
          prompts: [promptText],
        };
      }

      // Aktualisierte Daten speichern
      chrome.storage.sync.set(data, function () {
        if (chrome.runtime.lastError) {
          console.error("Error saving data:", chrome.runtime.lastError);
        } else {
          console.log(
            `Prompt "${promptText}" erfolgreich zum Ordner "${selectedFolder}" hinzugefügt.`
          );
          // Modal schließen und Eingaben zurücksetzen
          newPromptModal.style.display = "none";
          promptTextInput.value = "";
          folderSelect.value = "";
          // Popup-Fenster aktualisieren
          loadFolders();
        }
      });
    });
  } else {
    alert("Bitte geben Sie eine Prompt ein und wählen Sie einen Ordner aus!");
  }
});

function initializePromptSearch() {
  const inputField = document.getElementById("inputField");
  const accordionContainer = document.querySelector(".accordion-container");

  if (!inputField || !accordionContainer) {
    console.error("Suchfeld oder Accordion-Container nicht gefunden!");
    return;
  }

  // Hilfsfunktion zur Berechnung der String-Ähnlichkeit
  function calculateSimilarity(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();

    let matches = 0;
    const minLength = Math.min(str1.length, str2.length);

    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) matches++;
    }

    return matches / Math.max(str1.length, str2.length);
  }

  // Such-Event-Listener
  inputField.addEventListener("input", function (e) {
    const searchTerm = e.target.value.trim();

    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching storage data:", chrome.runtime.lastError);
        return;
      }

      accordionContainer.innerHTML = "";

      if (!searchTerm) {
        Object.entries(data).forEach(([id, topic]) => {
          createAccordion(id, topic.name, topic.prompts || []);
        });
        return;
      }

      const results = [];

      Object.entries(data).forEach(([id, topic]) => {
        const folderSimilarity = calculateSimilarity(searchTerm, topic.name);
        const prompts = topic.prompts || [];

        if (folderSimilarity > 0.3) {
          results.push({
            id,
            name: topic.name,
            prompts,
            similarity: folderSimilarity,
            type: "folder",
          });
        }

        prompts.forEach((prompt, index) => {
          const promptSimilarity = calculateSimilarity(searchTerm, prompt);
          if (promptSimilarity > 0.3) {
            results.push({
              id,
              name: topic.name,
              prompts: [prompt],
              similarity: promptSimilarity,
              type: "prompt",
              originalPrompts: prompts,
            });
          }
        });
      });

      results.sort((a, b) => b.similarity - a.similarity);

      results.forEach((result) => {
        createAccordion(
          result.id,
          result.name + (result.type === "prompt" ? " (Prompt-Treffer)" : ""),
          result.type === "prompt"
            ? result.prompts
            : result.originalPrompts || result.prompts
        );
      });

      if (results.length === 0) {
        const noResults = document.createElement("p");
        noResults.textContent = "Keine Ergebnisse gefunden";
        noResults.style.color = "#888";
        noResults.style.textAlign = "center";
        noResults.style.padding = "20px";
        accordionContainer.appendChild(noResults);
      }
    });
  });

  // Initialisiere mit allen Ordnern
  chrome.storage.sync.get(null, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching initial data:", chrome.runtime.lastError);
      return;
    }
    Object.entries(data).forEach(([id, topic]) => {
      createAccordion(id, topic.name, topic.prompts || []);
    });
  });
}

// Aufruf nach DOM-Laden
document.addEventListener("DOMContentLoaded", function () {
  initializePromptSearch();
});
document
  .getElementById("theme-select")
  .addEventListener("change", function (e) {
    document.documentElement.setAttribute("data-theme", e.target.value);

    // Save the user's preference
    localStorage.setItem("theme", e.target.value);
  });

// Load saved theme preference on page load
document.addEventListener("DOMContentLoaded", function () {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("theme-select").value = savedTheme;
});
