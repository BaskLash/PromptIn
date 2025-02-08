// Function to handle input event and save data
async function handleInputEvent(event, inputElement) {
  if (event.key !== "Enter") return;

  const inputValue = inputElement.value.trim();
  if (!inputValue) return;

  let baseTopicName = "Default";
  let topicName = baseTopicName;

  // Retrieve existing topics from Chrome storage
  chrome.storage.sync.get(null, async function (data) {
    let topics = data || {};
    const uniqueID = await generateUniqueID(topicName);

    // Ensure unique topic name
    while (topics.hasOwnProperty(topicName)) {
      topicName = `${baseTopicName}_${Math.floor(Math.random() * 10000)}`;
    }

    // Create new topic object
    topics[uniqueID] = {
      name: topicName,
      prompts: [inputValue],
    };

    // Save and update UI
    chrome.storage.sync.set(topics, function () {
      console.log(`Gespeichert in ${topicName} (ID: ${uniqueID}):`, inputValue);
      inputElement.value = ""; // Clear input field
      addDropdownItem(uniqueID, topicName);
    });
  });
}

// Function to attach event listeners to input elements
function attachListeners() {
  const copilotInput = document.querySelector(
    "textarea.ChatInputV2-module__input--B2oNx"
  );
  const gitHubInput = document.querySelector(
    "textarea#copilot-dashboard-entrypoint-textarea"
  );

  if (copilotInput && !copilotInput.dataset.listenerAttached) {
    copilotInput.addEventListener("keydown", (event) =>
      handleInputEvent(event, copilotInput)
    );
    copilotInput.dataset.listenerAttached = "true";
  }

  if (gitHubInput && !gitHubInput.dataset.listenerAttached) {
    gitHubInput.addEventListener("keydown", (event) =>
      handleInputEvent(event, gitHubInput)
    );
    gitHubInput.dataset.listenerAttached = "true";
  }
}

// Run the function initially
attachListeners();

// MutationObserver to detect DOM changes and reattach event listeners
const observer = new MutationObserver(() => {
  attachListeners();
});

// Observe changes in the entire body
observer.observe(document.body, { childList: true, subtree: true });

// Hilfsfunktion zur Generierung einer eindeutigen ID
async function generateUniqueID(baseName) {
  return `${baseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
