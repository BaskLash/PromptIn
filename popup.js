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

    if (topics.length === 0) {
      let noFolders = document.createElement("p");
      noFolders.style.marginLeft = "1rem";
      noFolders.style.color = "red";
      noFolders.style.fontWeight = "bold";
      noFolders.textContent = "No folders available yet";
      noFolders.title =
        "Enter a prompt or chat with copilot to create some folders";
      dropdownContent.appendChild(noFolders);
      return;
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
      dropdownContent.innerHTML = ""; // UI zurücksetzen
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
            usePrompt(promptText);
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

function usePrompt(promptElement) {
  const promptText = promptElement.textContent;

  // Send the prompt to the content script
  chrome.runtime.sendMessage({ action: "use_prompt", prompt: promptText });

  console.log("Prompt sent to content script:", promptText);
}

function relocatePrompt(promptElement, currentFolderId) {
  const newFolderId = prompt("Enter the new folder ID:");
  if (!newFolderId) return;

  chrome.storage.sync.get([currentFolderId, newFolderId], function (data) {
    if (data[currentFolderId] && data[newFolderId]) {
      const promptText = promptElement.textContent;
      data[newFolderId].prompts.push(promptText);
      data[currentFolderId].prompts = data[currentFolderId].prompts.filter(
        (p) => p !== promptText
      );

      chrome.storage.sync.set(data, function () {
        console.log(`Prompt moved from ${currentFolderId} to ${newFolderId}`);
        promptElement.closest("tr").remove();
      });
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
