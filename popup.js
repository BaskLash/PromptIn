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

// Event Listener für Eingabe
inputField.addEventListener("keydown", async function (event) {
  if (event.key === "Enter") {
    const inputValue = inputField.value.trim();
    let baseTopicName = "ExampleName"; // Dynamischer Name möglich
    let topicName = baseTopicName;

    if (inputValue) {
      // Hole bestehende Daten
      chrome.storage.sync.get(null, async function (data) {
        let topics = data || {}; // Sicherstellen, dass ein Objekt existiert

        // Eindeutige ID generieren
        const uniqueID = await generateUniqueID(topicName);

        // Falls der Name bereits existiert, generiere einen neuen
        while (topics.hasOwnProperty(topicName)) {
          topicName = `${baseTopicName}_${Math.floor(Math.random() * 10000)}`;
        }

        // Neues Topic-Objekt erstellen
        topics[uniqueID] = {
          name: topicName,
          prompts: [inputValue],
        };

        // Speichern und UI sofort aktualisieren
        chrome.storage.sync.set(topics, function () {
          console.log(
            `Gespeichert in ${topicName} (ID: ${uniqueID}):`,
            inputValue
          );
          inputField.value = ""; // Eingabefeld leeren

          document.querySelector(".dropdown-content p").style.display = "none";

          // Direkt das neue Element in die UI einfügen
          addDropdownItem(uniqueID, topicName);
        });
      });
    }
  }
});

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

const accordionContainer = document.querySelector(".accordion-container");

// Function to create an accordion for a folder
function createAccordion(id, topicName, prompts) {
  const accordion = document.createElement("div");
  accordion.classList.add("accordion");
  accordion.dataset.target = id;

  const button = document.createElement("button");
  button.classList.add("topic-name");
  button.textContent = topicName;
  button.title = topicName;

  const actionLinks = document.createElement("span");
  actionLinks.classList.add("action-links");

  const renameButton = document.createElement("button");
  renameButton.classList.add("rename-button");
  renameButton.textContent = "Rename";
  renameButton.title = "Rename folder";

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-button");
  deleteButton.textContent = "Delete";
  deleteButton.title = "Delete folder";

  // ✅ Rename functionality
  renameButton.addEventListener("click", function (event) {
    event.stopPropagation(); // Prevent accordion toggle

    // Create input field
    const input = document.createElement("input");
    input.type = "text";
    input.value = topicName;
    input.style.padding = "12px 20px";
    input.classList.add("rename-input");

    // Replace button with input field
    accordion.replaceChild(input, button);
    input.focus();

    // Save the new name on Enter or blur
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        saveNewName(id, input, button, accordion);
      }
    });

    input.addEventListener("blur", function () {
      saveNewName(id, input, button, accordion);
    });
  });

  deleteButton.addEventListener("click", function (event) {
    event.stopPropagation(); // Prevent the accordion from toggling

    if (confirm(`Are you sure you want to delete "${topicName}"?`)) {
      chrome.storage.sync.remove(id, function () {
        if (chrome.runtime.lastError) {
          console.error("Error removing folder:", chrome.runtime.lastError);
          return;
        }

        console.log(`Deleted folder: ${topicName} (ID: ${id})`);

        // Remove folder from UI
        accordion.remove();
        panel.remove();
      });
    }
  });

  actionLinks.appendChild(renameButton);
  actionLinks.appendChild(deleteButton);
  accordion.appendChild(button);
  accordion.appendChild(actionLinks);

  // Create panel for prompts
  const panel = document.createElement("div");
  panel.classList.add("panel");
  panel.id = id;

  const table = document.createElement("table");
  const tbody = document.createElement("tbody");

  prompts.forEach((prompt) => {
    const row = document.createElement("tr");

    // Prompt text
    const promptCell = document.createElement("td");
    const promptText = document.createElement("p");
    promptText.textContent = prompt;
    promptCell.appendChild(promptText);
    row.appendChild(promptCell);

    // Action buttons
    ["Edit", "Delete", "Use", "Relocate"].forEach((action) => {
      const actionCell = document.createElement("td");
      const actionButton = document.createElement("button");
      actionButton.classList.add("action-button");
      actionButton.textContent = action;
      actionButton.title = `${action} prompt`;
      actionCell.appendChild(actionButton);
      row.appendChild(actionCell);

      // Add event listeners for each button
      actionButton.addEventListener("click", function () {
        switch (action) {
          case "Edit":
            editPrompt(promptText);
            break;
          case "Delete":
            deletePrompt(promptText, id, row);
            break;
          case "Use":
            usePrompt(prompt);
            break;
          case "Relocate":
            relocatePrompt(promptText, id);
            break;
        }
      });
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  panel.appendChild(table);

  // Append to container
  accordionContainer.appendChild(accordion);
  accordionContainer.appendChild(panel);

  // ✅ Attach event listener for opening and closing
  button.addEventListener("click", function () {
    panel.classList.toggle("show");
  });
}

function editPrompt(promptElement) {
  const currentText = promptElement.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentText;
  input.classList.add("prompt-edit-input");

  promptElement.replaceWith(input);
  input.focus();

  input.addEventListener("blur", function () {
    if (input.value.trim()) {
      promptElement.textContent = input.value.trim();
      input.replaceWith(promptElement);
      console.log("Prompt updated:", input.value);
    } else {
      input.replaceWith(promptElement); // Restore if empty
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

function relocatePrompt(promptElement, currentFolderId) {
  // Create dropdown if it doesn't exist
  let dropdown = document.querySelector(".folder-dropdown");
  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.classList.add("folder-dropdown");
    dropdown.style.position = "absolute"; // Position it absolutely
    dropdown.style.backgroundColor = "white"; // Background color
    dropdown.style.border = "1px solid #ccc"; // Border
    dropdown.style.zIndex = "1000"; // Ensure it appears above other elements
    document.body.appendChild(dropdown);
  }

  // Clear existing items in the dropdown
  dropdown.innerHTML = "";

  // Populate the dropdown with folder names
  chrome.storage.sync.get(null, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching folders:", chrome.runtime.lastError);
      return;
    }

    Object.entries(data).forEach(([id, topic]) => {
      const folderItem = document.createElement("div");
      folderItem.classList.add("folder-item");
      folderItem.textContent = topic.name;
      folderItem.dataset.folderId = id; // Store the folder ID in a data attribute
      dropdown.appendChild(folderItem);

      // Add click event to each folder item
      folderItem.addEventListener("click", function () {
        const newFolderId = this.dataset.folderId; // Get the folder ID from data attribute
        if (!newFolderId) return;

        chrome.storage.sync.get(
          [currentFolderId, newFolderId],
          function (data) {
            if (data[currentFolderId] && data[newFolderId]) {
              const promptText = promptElement.textContent;
              data[newFolderId].prompts.push(promptText);
              data[currentFolderId].prompts = data[
                currentFolderId
              ].prompts.filter((p) => p !== promptText);

              chrome.storage.sync.set(data, function () {
                console.log(
                  `Prompt moved from ${currentFolderId} to ${newFolderId}`
                );
                promptElement.closest("tr").remove();
              });
            }
          }
        );

        // Remove dropdown after selection
        dropdown.remove();
      });
    });
  });

  // Position the dropdown below the button
  const button = promptElement
    .closest("tr")
    .querySelector(".action-button:contains('Relocate')");
  const rect = button.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;

  // Show the dropdown
  dropdown.style.display = "block";

  // Hide dropdown when clicking outside
  document.addEventListener("click", function (event) {
    if (!dropdown.contains(event.target) && !button.contains(event.target)) {
      dropdown.style.display = "none"; // Hide dropdown
    }
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

document.querySelector(".folder-icon").addEventListener("click", function () {
  document.querySelector(".dropdown-content").classList.toggle("show");
});

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
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("input", function () {
    const searchTerm = searchInput.value.toLowerCase();
    const folders = document.querySelectorAll(".dropdown-content a");

    let results = [];
    let noResultsMessage = document.querySelector(".no-results-message");

    folders.forEach((folder) => {
      const folderName = folder.textContent.toLowerCase();
      const similarity = jaroWinkler(searchTerm, folderName);

      if (folderName.includes(searchTerm) || similarity > 0.8) {
        results.push({ element: folder, similarity });
      }
    });

    // Ergebnisse nach bester Übereinstimmung sortieren (höchste Ähnlichkeit zuerst)
    results.sort((a, b) => b.similarity - a.similarity);

    // Alle Elemente verstecken
    folders.forEach((folder) => (folder.style.display = "none"));

    // Beste Treffer anzeigen
    results.forEach((result) => (result.element.style.display = "block"));

    // Überprüfen, ob es Ergebnisse gibt
    if (results.length === 0) {
      // Wenn der Text noch nicht existiert, erstelle ihn
      if (!noResultsMessage) {
        noResultsMessage = document.createElement("p");
        noResultsMessage.classList.add("no-results-message");
        noResultsMessage.style.color = "red";
        noResultsMessage.style.marginLeft = "1rem";
        noResultsMessage.style.fontWeight = "bold";
        noResultsMessage.textContent = "No results found";
        dropdownContent.appendChild(noResultsMessage);
      }
    } else {
      // Wenn Ergebnisse vorhanden sind, entferne die Nachricht
      if (noResultsMessage) {
        noResultsMessage.remove();
      }
    }
  });

  // Jaro-Winkler Similarity Function
  function jaroWinkler(s1, s2) {
    let m = 0;

    // Kurzer Check, falls einer der Strings leer ist
    if (s1.length === 0 || s2.length === 0) {
      return 0;
    }

    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    for (let i = 0; i < s1.length; i++) {
      let start = Math.max(0, i - matchDistance);
      let end = Math.min(i + matchDistance + 1, s2.length);

      for (let j = start; j < end; j++) {
        if (s2Matches[j]) continue;
        if (s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }

    if (m === 0) return 0;

    let t = 0;
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }

    t /= 2;
    let jaro = (m / s1.length + m / s2.length + (m - t) / m) / 3;

    let p = 0.1; // Jaro-Winkler Skalierungsfaktor
    let l = 0;
    while (l < 4 && s1[l] === s2[l]) l++;
    return jaro + l * p * (1 - jaro);
  }
});
document.addEventListener("DOMContentLoaded", function () {
  const dropdownContent = document.querySelector(".dropdown-content");

  dropdownContent.addEventListener("click", function (event) {
    const clickedAnchor = event.target.closest("a"); // Find the closest <a> in case of nested elements

    if (clickedAnchor) {
      console.log("Clicked on:", clickedAnchor.textContent);
      // You can also do something with clickedAnchor.href or clickedAnchor.dataset
    }
  });
});
