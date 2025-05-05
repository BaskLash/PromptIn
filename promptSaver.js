function promptSaver(message) {
  // Sicherstellen, dass der DOM verfügbar ist
  if (!document.body || !document.head) {
    console.error(
      "DOM nicht verfügbar: document.body oder document.head fehlt."
    );
    alert("Fehler: Seite nicht vollständig geladen. Bitte versuche es erneut.");
    return;
  }

  console.log("promptSaver aufgerufen mit message:", message);

  // Shadow Host erstellen
  const shadowHost = document.createElement("div");
  document.body.appendChild(shadowHost);

  // Shadow Root anfügen
  const shadowRoot = shadowHost.attachShadow({ mode: "open" });

  // Modal-Elemente erstellen
  const modal = document.createElement("div");
  modal.id = "myModal";
  modal.className = "modal";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";

  const closeSpan = document.createElement("span");
  closeSpan.className = "close";
  closeSpan.innerHTML = "×";

  const headerTitle = document.createElement("h2");
  headerTitle.textContent = "Save Prompt";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  // Step 1: Prompt Title and Description
  const titleSection = document.createElement("div");
  titleSection.className = "step-section active";

  const promptTitleLabel = document.createElement("label");
  promptTitleLabel.setAttribute("for", "promptTitle");
  promptTitleLabel.textContent = "Prompt Title:";

  const promptTitleInput = document.createElement("input");
  promptTitleInput.type = "text";
  promptTitleInput.id = "promptTitle";
  promptTitleInput.name = "promptTitle";
  promptTitleInput.placeholder = "Gib einen Titel für deinen Prompt ein";

  const promptDescLabel = document.createElement("label");
  promptDescLabel.setAttribute("for", "promptDescription");
  promptDescLabel.textContent = "Prompt Description:";

  const promptDescInput = document.createElement("textarea");
  promptDescInput.id = "promptDescription";
  promptDescInput.name = "promptDescription";
  promptDescInput.rows = 3;
  promptDescInput.placeholder = "Gib eine Beschreibung für deinen Prompt ein";

  const nextToPromptButton = document.createElement("button");
  nextToPromptButton.textContent = "Next";
  nextToPromptButton.className = "next-button";

  // Step 2: Prompt Textarea
  const promptSection = document.createElement("div");
  promptSection.className = "step-section";

  const promptTextareaLabel = document.createElement("label");
  promptTextareaLabel.setAttribute("for", "promptTextarea");
  promptTextareaLabel.textContent = "Your Prompt:";

  const promptTextarea = document.createElement("textarea");
  promptTextarea.id = "promptTextarea";
  promptTextarea.name = "promptTextarea";
  promptTextarea.rows = 10;
  promptTextarea.style.width = "100%";

  message =
    typeof message === "string" ? message.trim() : String(message).trim();
  const originalMessage = message;
  let processedMessage = message.includes(":")
    ? message.split(":")[0].trim()
    : message;

  promptTextarea.value = processedMessage;
  promptTextarea.placeholder = "Bearbeite deinen Prompt hier...";

  const checkboxContainer = document.createElement("div");
  checkboxContainer.style.marginTop = "10px";
  checkboxContainer.style.display = "flex";
  checkboxContainer.style.alignItems = "center";

  const showFullContentCheckbox = document.createElement("input");
  showFullContentCheckbox.type = "checkbox";
  showFullContentCheckbox.id = "showFullContent";
  showFullContentCheckbox.name = "showFullContent";
  showFullContentCheckbox.style.width = "16px";
  showFullContentCheckbox.style.height = "16px";
  showFullContentCheckbox.style.marginRight = "10px";

  const checkboxLabel = document.createElement("label");
  checkboxLabel.setAttribute("for", "showFullContent");
  checkboxLabel.textContent = "Gesamten Inhalt anzeigen (inkl. Text nach ':')";
  checkboxLabel.style.fontSize = "14px";
  checkboxLabel.style.marginTop = "5px";

  showFullContentCheckbox.addEventListener("change", (e) => {
    promptTextarea.value = e.target.checked
      ? originalMessage
      : originalMessage.includes(":")
      ? originalMessage.split(":")[0].trim()
      : originalMessage;
  });

  const promptButtons = document.createElement("div");
  promptButtons.className = "button-group";
  promptButtons.style.marginTop = "10px";

  const backToTitleButton = document.createElement("button");
  backToTitleButton.textContent = "Back";
  backToTitleButton.className = "back-button";

  const nextToOptionsButton = document.createElement("button");
  nextToOptionsButton.textContent = "Next";
  nextToOptionsButton.className = "next-button";

  promptSection.appendChild(promptTextareaLabel);
  promptSection.appendChild(promptTextarea);
  checkboxContainer.appendChild(showFullContentCheckbox);
  checkboxContainer.appendChild(checkboxLabel);
  promptSection.appendChild(checkboxContainer);
  promptButtons.appendChild(backToTitleButton);
  promptButtons.appendChild(nextToOptionsButton);
  promptSection.appendChild(promptButtons);

  // Step 3: Options
  const optionsSection = document.createElement("div");
  optionsSection.className = "step-section";

  const optionsHeader = document.createElement("p");
  optionsHeader.textContent = "Options:";

  const optionsSwitch = document.createElement("div");
  optionsSwitch.className = "options-switch";

  const subOptionButtons = [
    { text: "Create new prompt", id: "create" },
    { text: "Replace prompt", id: "replace" },
    { text: "Add prompt to folder", id: "add" },
  ];

  subOptionButtons.forEach((btn, index) => {
    const button = document.createElement("button");
    button.textContent = btn.text;
    button.setAttribute("data-tab", btn.id);
    if (index === 0) button.classList.add("active");
    optionsSwitch.appendChild(button);
  });

  const createContent = document.createElement("div");
  createContent.id = "create";
  createContent.className = "option-content active";
  const createText = document.createElement("p");
  createText.textContent =
    "Creates a new prompt without assigning it to a folder. Click 'Save' to confirm.";
  createContent.appendChild(createText);

  const replaceContent = document.createElement("div");
  replaceContent.id = "replace";
  replaceContent.className = "option-content";
  const replaceText = document.createElement("p");
  replaceText.textContent =
    "Select a folder and prompt to replace with the new prompt:";
  const replaceFolderLabel = document.createElement("label");
  replaceFolderLabel.setAttribute("for", "replaceFolderSelect");
  replaceFolderLabel.textContent = "Select folder:";
  const replaceFolderSelect = document.createElement("select");
  replaceFolderSelect.id = "replaceFolderSelect";
  replaceFolderSelect.innerHTML = '<option value="">Select a folder</option>';

  const replacePromptLabel = document.createElement("label");
  replacePromptLabel.setAttribute("for", "replacePromptSelect");
  replacePromptLabel.textContent = "Select prompt to replace:";
  const replacePromptSelect = document.createElement("select");
  replacePromptSelect.id = "replacePromptSelect";
  replacePromptSelect.innerHTML = '<option value="">Select a prompt</option>';
  replacePromptSelect.disabled = true;

  replaceContent.appendChild(replaceText);
  replaceContent.appendChild(replaceFolderLabel);
  replaceContent.appendChild(replaceFolderSelect);
  replaceContent.appendChild(replacePromptLabel);
  replaceContent.appendChild(replacePromptSelect);

  const addContent = document.createElement("div");
  addContent.id = "add";
  addContent.className = "option-content";
  const addFolderLabel = document.createElement("label");
  addFolderLabel.setAttribute("for", "addFolderSelect");
  addFolderLabel.textContent = "Select folder to add prompt to:";
  const addFolderSelect = document.createElement("select");
  addFolderSelect.id = "addFolderSelect";
  addFolderSelect.innerHTML = '<option value="">Select a folder</option>';

  addContent.appendChild(addFolderLabel);
  addContent.appendChild(addFolderSelect);

  const optionsButtons = document.createElement("div");
  optionsButtons.className = "button-group";
  const backToPromptButton = document.createElement("button");
  backToPromptButton.textContent = "Back";
  backToPromptButton.className = "back-button";

  optionsSection.appendChild(optionsHeader);
  optionsSection.appendChild(optionsSwitch);
  optionsSection.appendChild(createContent);
  optionsSection.appendChild(replaceContent);
  optionsSection.appendChild(addContent);
  optionsButtons.appendChild(backToPromptButton);
  optionsSection.appendChild(optionsButtons);

  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer";

  const saveButton = document.createElement("button");
  saveButton.className = "save-button";
  saveButton.textContent = "Speichern";

  // Stile definieren
  const style = document.createElement("style");
  style.textContent = `
      .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(3px);
      }
      .modal-content {
        background: #fff;
        margin: 5% auto;
        padding: 0;
        width: 90%;
        max-width: 600px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }
      .modal-header {
        padding: 16px 24px;
        background: linear-gradient(135deg, #1e90ff, #4169e1);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.6em;
        font-weight: 600;
      }
      .modal-body {
        padding: 24px;
        color: #2c3e50;
      }
      .step-section {
        display: none;
      }
      .step-section.active {
        display: block;
      }
      .options-switch {
        display: flex;
        gap: 4px;
        margin-bottom: 20px;
        background: #f1f3f5;
        padding: 4px;
        border-radius: 6px;
      }
      .options-switch button {
        flex: 1;
        padding: 10px;
        background: none;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 4px;
      }
      .options-switch button:hover {
        background: #e9ecef;
      }
      .options-switch button.active {
        background: #1e90ff;
        color: white;
      }
      .option-content {
        display: none;
      }
      .option-content.active {
        display: block;
      }
      .modal-body label {
        font-weight: 600;
        margin-top: 16px;
        margin-bottom: 6px;
        display: block;
        color: #34495e;
      }
      .modal-body input,
      .modal-body select,
      .modal-body textarea {
        width: 100%;
        padding: 10px;
        margin-bottom: 12px;
        border: 1px solid #dcdcdc;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
        transition: border-color 0.2s ease;
      }
      .modal-body input:focus,
      .modal-body select:focus,
      .modal-body textarea:focus {
        border-color: #1e90ff;
        outline: none;
      }
      .modal-body textarea {
        resize: vertical;
        min-height: 120px;
      }
      .button-group {
        display: flex;
        gap: 12px;
        margin-top: 12px;
      }
      .next-button, .back-button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .next-button {
        background: #1e90ff;
        color: white;
      }
      .next-button:hover {
        background: #4169e1;
      }
      .back-button {
        background: #6c757d;
        color: white;
      }
      .back-button:hover {
        background: #5a6268;
      }
      .modal-footer {
        padding: 16px 24px;
        background: #f8f9fa;
        text-align: right;
      }
      .save-button {
        padding: 10px 20px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
        display: none;
      }
      .modal-content.options-active .save-button {
        display: block;
      }
      .save-button:hover {
        background: #218838;
      }
      .close {
        color: white;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      .close:hover,
      .close:focus {
        transform: scale(1.1);
      }
    `;

  // Modal zusammenbauen
  modalHeader.appendChild(closeSpan);
  modalHeader.appendChild(headerTitle);

  titleSection.appendChild(promptTitleLabel);
  titleSection.appendChild(promptTitleInput);
  titleSection.appendChild(promptDescLabel);
  titleSection.appendChild(promptDescInput);
  titleSection.appendChild(nextToPromptButton);

  modalBody.appendChild(titleSection);
  modalBody.appendChild(promptSection);
  modalBody.appendChild(optionsSection);

  modalFooter.appendChild(saveButton);

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalFooter);

  modal.appendChild(modalContent);

  // Stile und Modal zum Shadow Root hinzufügen
  try {
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(modal);
    console.log("Modal created and appended to shadow root");
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Modals zum Shadow Root:", error);
    alert("Fehler beim Erstellen des Modals. Bitte versuche es erneut.");
    return;
  }

  // Modal anzeigen
  modal.style.display = "block";
  console.log("Modal display set to block");

  // Funktion zum Schließen des Modals
  function closeModal() {
    modal.style.display = "none";
    try {
      document.body.removeChild(shadowHost);
    } catch (error) {
      console.error("Fehler beim Entfernen des Modals:", error);
    }
  }

  // Modal bei Klick auf Schließen-Button schließen
  closeSpan.onclick = closeModal;

  // Modal schließen, wenn außerhalb des Modal-Inhalts geklickt wird
  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Load folders for replace and add options
  function loadFolders() {
    chrome.storage.sync.get(null, (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      const folders = Object.entries(data).filter(
        ([, topic]) =>
          topic.prompts && Array.isArray(topic.prompts) && !topic.isHidden
      );

      replaceFolderSelect.innerHTML =
        '<option value="">Select a folder</option>';
      folders.forEach(([id, topic]) => {
        if (topic.prompts.length > 0) {
          const option = document.createElement("option");
          option.value = id;
          option.textContent = topic.name;
          replaceFolderSelect.appendChild(option);
        }
      });

      addFolderSelect.innerHTML = '<option value="">Select a folder</option>';
      folders.forEach(([id, topic]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = topic.name;
        addFolderSelect.appendChild(option);
      });
    });
  }

  // Load prompts for selected folder in replace option
  replaceFolderSelect.addEventListener("change", () => {
    const folderId = replaceFolderSelect.value;
    replacePromptSelect.disabled = !folderId;
    replacePromptSelect.innerHTML = '<option value="">Select a prompt</option>';

    if (folderId) {
      chrome.storage.sync.get(folderId, (data) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error fetching folder data:",
            chrome.runtime.lastError
          );
          return;
        }

        const topic = data[folderId];
        if (topic && topic.prompts) {
          topic.prompts.forEach((prompt, index) => {
            const option = document.createElement("option");
            option.value = index;
            const promptTitle = prompt.title || "Untitled Prompt";
            option.textContent =
              promptTitle.length > 50
                ? promptTitle.slice(0, 50) + "..."
                : promptTitle;
            option.title = promptTitle;
            replacePromptSelect.appendChild(option);
          });
        }
      });
    }
  });

  // Step navigation
  nextToPromptButton.onclick = function () {
    if (promptTitleInput.value.trim() === "") {
      alert("Bitte gib einen Prompt-Titel ein!");
      return;
    }
    if (promptDescInput.value.trim() === "") {
      alert("Bitte gib eine Prompt-Beschreibung ein!");
      return;
    }
    titleSection.classList.remove("active");
    promptSection.classList.add("active");
  };

  backToTitleButton.onclick = function () {
    promptSection.classList.remove("active");
    titleSection.classList.add("active");
  };

  nextToOptionsButton.onclick = function () {
    if (promptTextarea.value.trim() === "") {
      alert("Bitte gib einen Prompt-Text ein!");
      return;
    }
    loadFolders();
    promptSection.classList.remove("active");
    optionsSection.classList.add("active");
    modalContent.classList.add("options-active");
  };

  backToPromptButton.onclick = function () {
    optionsSection.classList.remove("active");
    promptSection.classList.add("active");
    modalContent.classList.remove("options-active");
  };

  // Options Switcher logic
  const subOptionButtonsElements = optionsSwitch.querySelectorAll("button");
  const optionContents = optionsSection.querySelectorAll(".option-content");
  subOptionButtonsElements.forEach((button) => {
    button.addEventListener("click", () => {
      subOptionButtonsElements.forEach((btn) => btn.classList.remove("active"));
      optionContents.forEach((c) => c.classList.remove("active"));
      button.classList.add("active");
      document
        .getElementById(button.getAttribute("data-tab"))
        .classList.add("active");
    });
  });

  // Save logic
  saveButton.onclick = function () {
    const promptTitle = promptTitleInput.value.trim();
    const promptDescription = promptDescInput.value.trim();
    const promptContent = promptTextarea.value.trim();
    const activeOption = optionsSwitch
      .querySelector("button.active")
      .getAttribute("data-tab");

    if (!promptTitle || !promptDescription || !promptContent) {
      alert("Bitte fülle alle Felder (Titel, Beschreibung, Prompt) aus!");
      return;
    }

    const savePrompt = () => {
      const promptObject = {
        title: promptTitle,
        description: promptDescription,
        content: promptContent,
      };

      if (activeOption === "create") {
        const hiddenFolderId = `hidden_folder_${Date.now()}_${Math.floor(
          Math.random() * 10000
        )}`;
        const hiddenFolder = {
          name: promptTitle,
          prompts: [promptObject],
          isHidden: true,
        };

        chrome.storage.sync.set({ [hiddenFolderId]: hiddenFolder }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error saving prompt:", chrome.runtime.lastError);
            alert("Fehler beim Speichern des Prompts.");
          } else {
            console.log(
              "Standalone prompt created in hidden folder:",
              hiddenFolder
            );
            closeModal();
          }
        });
      } else if (activeOption === "replace") {
        const folderId = replaceFolderSelect.value;
        const promptIndex = replacePromptSelect.value;

        if (!folderId || promptIndex === "") {
          alert("Bitte wähle einen Ordner und eine Prompt aus!");
          return;
        }

        chrome.storage.sync.get(folderId, (data) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error fetching folder data:",
              chrome.runtime.lastError
            );
            return;
          }

          const topic = data[folderId];
          if (topic && topic.prompts) {
            topic.prompts[promptIndex] = promptObject;
            topic.name = topic.prompts.length === 1 ? promptTitle : topic.name;

            chrome.storage.sync.set({ [folderId]: topic }, () => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error replacing prompt:",
                  chrome.runtime.lastError
                );
                alert("Fehler beim Ersetzen der Prompt.");
              } else {
                console.log(
                  `Prompt in folder ${folderId} replaced at index ${promptIndex}`
                );
                closeModal();
              }
            });
          }
        });
      } else if (activeOption === "add") {
        const folderId = addFolderSelect.value;

        if (!folderId) {
          alert("Bitte wähle einen Ordner aus!");
          return;
        }

        chrome.storage.sync.get(folderId, (data) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error fetching folder data:",
              chrome.runtime.lastError
            );
            return;
          }

          const topic = data[folderId] || { name: promptTitle, prompts: [] };
          topic.prompts.push(promptObject);

          chrome.storage.sync.set({ [folderId]: topic }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error adding prompt to folder:",
                chrome.runtime.lastError
              );
              alert("Fehler beim Hinzufügen der Prompt zum Ordner.");
            } else {
              console.log(`Prompt added to folder ${folderId}`);
              closeModal();
            }
          });
        });
      }
    };

    savePrompt();
  };
}
