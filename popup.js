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

// Event Listener für Eingabe
// inputField.addEventListener("keydown", async function (event) {
//   if (event.key === "Enter") {
//     const inputValue = inputField.value.trim();
//     let baseTopicName = "ExampleName"; // Dynamischer Name möglich
//     let topicName = baseTopicName;

//     if (inputValue) {
//       // Hole bestehende Daten
//       chrome.storage.sync.get(null, async function (data) {
//         let topics = data || {}; // Sicherstellen, dass ein Objekt existiert

//         // Eindeutige ID generieren
//         const uniqueID = await generateUniqueID(topicName);

//         // Falls der Name bereits existiert, generiere einen neuen
//         while (topics.hasOwnProperty(topicName)) {
//           topicName = `${baseTopicName}_${Math.floor(Math.random() * 10000)}`;
//         }

//         // Neues Topic-Objekt erstellen
//         topics[uniqueID] = {
//           name: topicName,
//           prompts: [inputValue],
//         };

//         // Speichern und UI sofort aktualisieren
//         chrome.storage.sync.set(topics, function () {
//           console.log(
//             `Gespeichert in ${topicName} (ID: ${uniqueID}):`,
//             inputValue
//           );
//           inputField.value = ""; // Eingabefeld leeren

//           document.querySelector(".dropdown-content p").style.display = "none";

//           // Direkt das neue Element in die UI einfügen
//           addDropdownItem(uniqueID, topicName);
//         });
//       });
//     }
//   }
// });

// Funktion zum Hinzufügen eines neuen Dropdown-Elements
function addDropdownItem(id, topicName) {
  let link = document.createElement("a");
  link.href = `#${id}`;
  link.title = topicName;
  link.textContent = topicName;
  dropdownContent.appendChild(link);

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

const accordionContainer = document.querySelector(".accordion-container");

// Function to create an accordion for a folder
function createAccordion(id, topicName, prompts) {
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
  renameImg.alt = "";
  renameButton.appendChild(renameImg);
  renameButton.title = "Rename folder";

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-button");
  const deleteImg = document.createElement("img");
  deleteImg.src = "icon/trash-solid.svg";
  deleteImg.alt = "";
  deleteButton.appendChild(deleteImg);
  deleteButton.title = "Delete folder";

  // Rename functionality
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

              // Relocate-Logik direkt im Event-Listener
              const currentFolderId = id;
              const promptTextContent = promptText.textContent.trim();

              let currentFolder = data[currentFolderId];
              let targetFolderId = null;

              // Finde Zielordner-ID
              Object.entries(data).forEach(([id, topic]) => {
                if (topic.name === folderName) targetFolderId = id;
              });

              if (!currentFolder) {
                console.error(
                  `Aktueller Ordner mit ID ${currentFolderId} nicht gefunden.`
                );
                return;
              }

              // Entferne Prompt aus aktuellem Ordner
              const updatedCurrentPrompts = currentFolder.prompts.filter(
                (p) => p !== promptTextContent
              );
              const updatedCurrentFolder = {
                name: currentFolder.name,
                prompts: updatedCurrentPrompts,
              };

              // Füge Prompt zum Zielordner hinzu
              if (!targetFolderId) {
                targetFolderId = `folder_${Date.now()}`;
                data[targetFolderId] = {
                  name: folderName,
                  prompts: [promptTextContent],
                };
              } else {
                data[targetFolderId].prompts.push(promptTextContent);
              }

              data[currentFolderId] = updatedCurrentFolder;

              // Speichere die Änderungen in chrome.storage.sync
              chrome.storage.sync.set(data, function () {
                if (chrome.runtime.lastError) {
                  console.error("Error saving data:", chrome.runtime.lastError);
                } else {
                  console.log(
                    `Prompt "${promptTextContent}" erfolgreich von "${currentFolder.name}" nach "${folderName}" verschoben.`
                  );
                  // Aktualisiere das DOM direkt
                  const currentTbody = document.querySelector(
                    `#${currentFolderId} tbody`
                  );
                  if (currentTbody) {
                    currentTbody.innerHTML = ""; // Leere aktuelles Panel
                    updatedCurrentPrompts.forEach((p, idx) => {
                      const newRow = document.createElement("tr");
                      const newPromptCell = document.createElement("td");
                      const newPromptText = document.createElement("p");
                      newPromptText.textContent = p;
                      newPromptCell.appendChild(newPromptText);
                      newRow.appendChild(newPromptCell);

                      ["Edit", "Delete", "Use", "Relocate"].forEach((act) => {
                        const actCell = document.createElement("td");
                        if (act === "Relocate") {
                          const dd = document.createElement("div");
                          dd.classList.add("dropdown2");
                          const rb = document.createElement("button");
                          rb.classList.add("action-button", "dropbtn2");
                          rb.textContent = "Relocate";
                          rb.title = "Relocate prompt";
                          const dc = document.createElement("div");
                          dc.classList.add("dropdown-content2");
                          dc.id = `relocate-dropdown-${idx}-${currentFolderId}`;

                          chrome.storage.sync.get(null, (d) => {
                            dc.innerHTML = "";
                            Object.entries(d).forEach(([fid, t]) => {
                              const fl = document.createElement("a");
                              fl.href = "#";
                              fl.textContent = t.name;
                              fl.addEventListener("click", (e) => {
                                e.preventDefault();
                                relocatePrompt(
                                  newPromptText,
                                  currentFolderId,
                                  t.name
                                );
                                dc.classList.remove("show2");
                              });
                              dc.appendChild(fl);
                            });
                          });

                          rb.addEventListener("click", () =>
                            dc.classList.toggle("show2")
                          );
                          dd.appendChild(rb);
                          dd.appendChild(dc);
                          actCell.appendChild(dd);
                        } else {
                          const ab = document.createElement("button");
                          ab.classList.add("action-button");
                          ab.textContent = act;
                          ab.title = `${act} prompt`;
                          ab.addEventListener("click", () => {
                            if (act === "Edit")
                              editPrompt(promptText, id, index);
                            else if (act === "Delete")
                              deletePrompt(
                                newPromptText,
                                currentFolderId,
                                newRow
                              );
                            else if (act === "Use") usePrompt(p);
                          });
                          actCell.appendChild(ab);
                        }
                        newRow.appendChild(actCell);
                      });

                      currentTbody.appendChild(newRow);
                    });
                  }

                  // Aktualisiere Zielordner
                  const targetTbody = document.querySelector(
                    `#${targetFolderId} tbody`
                  );
                  if (targetTbody) {
                    targetTbody.innerHTML = ""; // Leere Zielpanel
                    data[targetFolderId].prompts.forEach((p, idx) => {
                      const newRow = document.createElement("tr");
                      const newPromptCell = document.createElement("td");
                      const newPromptText = document.createElement("p");
                      newPromptText.textContent = p;
                      newPromptCell.appendChild(newPromptText);
                      newRow.appendChild(newPromptCell);

                      ["Edit", "Delete", "Use", "Relocate"].forEach((act) => {
                        const actCell = document.createElement("td");
                        if (act === "Relocate") {
                          const dd = document.createElement("div");
                          dd.classList.add("dropdown2");
                          const rb = document.createElement("button");
                          rb.classList.add("action-button", "dropbtn2");
                          rb.textContent = "Relocate";
                          rb.title = "Relocate prompt";
                          const dc = document.createElement("div");
                          dc.classList.add("dropdown-content2");
                          dc.id = `relocate-dropdown-${idx}-${targetFolderId}`;

                          chrome.storage.sync.get(null, (d) => {
                            dc.innerHTML = "";
                            Object.entries(d).forEach(([fid, t]) => {
                              const fl = document.createElement("a");
                              fl.href = "#";
                              fl.textContent = t.name;
                              fl.addEventListener("click", (e) => {
                                e.preventDefault();
                                relocatePrompt(
                                  newPromptText,
                                  targetFolderId,
                                  t.name
                                );
                                dc.classList.remove("show2");
                              });
                              dc.appendChild(fl);
                            });
                          });

                          rb.addEventListener("click", () =>
                            dc.classList.toggle("show2")
                          );
                          dd.appendChild(rb);
                          dd.appendChild(dc);
                          actCell.appendChild(dd);
                        } else {
                          const ab = document.createElement("button");
                          ab.classList.add("action-button");
                          ab.textContent = act;
                          ab.title = `${act} prompt`;
                          ab.addEventListener("click", () => {
                            if (act === "Edit")
                              editPrompt(promptText, id, index);
                            else if (act === "Delete")
                              deletePrompt(
                                newPromptText,
                                targetFolderId,
                                newRow
                              );
                            else if (act === "Use") usePrompt(p);
                          });
                          actCell.appendChild(ab);
                        }
                        newRow.appendChild(actCell);
                      });

                      targetTbody.appendChild(newRow);
                    });
                  }
                }
              });

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
              editPrompt(promptText, id, index);
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

function editPrompt(promptElement, folderId, promptIndex) {
  // Erstelle die URL mit Query-Parametern nur für Ordner-ID und Prompt-Index
  const url =
    chrome.runtime.getURL("/pages/editPrompt.html") +
    `?folderId=${encodeURIComponent(folderId)}` +
    `&promptIndex=${encodeURIComponent(promptIndex)}`;

  // Öffne eine neue Registerkarte mit der URL
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
        promptIndex
      );
    }
  });
}

function deletePrompt(promptElement, folderId, rowElement) {
  if (confirm("Are you sure you want to delete this prompt?")) {
    chrome.storage.sync.get(folderId, function (data) {
      if (data[folderId]) {
        data[folderId].prompts = data[folderId].prompts.filter(
          (p) => p !== promptElement.textContent
        );

        chrome.storage.sync.set(data, function () {
          console.log("Prompt deleted:", promptElement.textContent);
          rowElement.remove();
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
  const promptText = promptElement.textContent.trim();

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
  const showOverview = document.querySelector(".nav-link");
  showOverview.addEventListener("click", function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("/pages/app.html") });
  });
});
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

// Beim Klick auf "Erstellen" (Platzhalter für Logik)
createFolderBtn.addEventListener("click", () => {
  const folderName = folderNameInput.value.trim();
  if (folderName) {
    console.log(`Neuer Ordner wird erstellt: ${folderName}`);
    // Hier kannst du die Logik hinzufügen, um den Ordner tatsächlich zu erstellen
    newFolderModal.style.display = "none";
    folderNameInput.value = ""; // Eingabe zurücksetzen
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
  // Beispiel: Hier solltest du deine tatsächlichen Ordner laden
  const folders = ["Folder 1", "Folder 2", "Folder 3"]; // Platzhalter
  folderSelect.innerHTML = '<option value="">-- Ordner auswählen --</option>';
  folders.forEach((folder) => {
    const option = document.createElement("option");
    option.value = folder;
    option.textContent = folder;
    folderSelect.appendChild(option);
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
  const selectedFolder = folderSelect.value;

  if (promptText && selectedFolder) {
    console.log(
      `Neue Prompt wird erstellt: "${promptText}" im Ordner: "${selectedFolder}"`
    );
    // Hier kannst du die Logik hinzufügen, um die Prompt tatsächlich zu erstellen
    newPromptModal.style.display = "none";
    promptTextInput.value = ""; // Eingabe zurücksetzen
    folderSelect.value = ""; // Auswahl zurücksetzen
  } else {
    alert("Bitte geben Sie eine Prompt ein und wählen Sie einen Ordner aus!");
  }
});
