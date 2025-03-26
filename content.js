document.addEventListener("DOMContentLoaded", removeElement);
function removeElement() {
  if (window.location.hostname === "github.com") {
    // Remove News Elements
    // Hide the right sidebar
    const sidebar = document.querySelector(".feed-right-sidebar");
    if (sidebar) {
      sidebar.style.display = "none";
    }

    // Hide the feed container for 'for-you' topic
    const feedContainer = document.querySelector(
      "feed-container[data-active-topic='for-you']"
    );
    if (feedContainer) {
      feedContainer.style.display = "none";
    }

    // Hide Footer container
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "none";
    }
  }
}

// Hilfsfunktion zur Generierung einer eindeutigen ID
async function generateUniqueID(baseName) {
  return `${baseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

let buttonCounter = 1; // Startwert für auto_increment
let existingToolbars = new Set(); // Set zur Verfolgung bereits verarbeiteter Toolbars
setInterval(() => {
  // Always in use; That's why on top
  const path = window.location.pathname;

  // Only hide if the user is on the Home Feed
  if (
    window.location.hostname === "github.com" &&
    path.startsWith("/copilot/c/")
  ) {
    addCopilotButton();
  }
  if (window.location.hostname === "chatgpt.com") {
    addChatGPTButton();
  }
  if (
    window.location.hostname === "gemini.google.com" &&
    path.startsWith("/app/")
  ) {
    addGeminiButton();
  }
  if (window.location.hostname === "grok.com" && path.startsWith("/chat/")) {
    addGrokButton();
  }
  if (
    (window.location.hostname === "blackbox.ai" ||
      window.location.hostname === "www.blackbox.ai") &&
    path.startsWith("/chat/")
  ) {
    addBlackBoxButton();
  }
  if (
    (window.location.hostname === "claude.ai" ||
      window.location.hostname === "www.claude.ai") &&
    path.startsWith("/chat/")
  ) {
    addClaudeButton();
  }
  if (
    (window.location.hostname === "copilot.microsoft.com" ||
      window.location.hostname === "www.copilot.microsoft.com") &&
    path.startsWith("/chats/")
  ) {
    addMicrosoftCopilotButton();
  }
  if (
    (window.location.hostname === "chat.mistral.ai" ||
      window.location.hostname === "www.chat.mistral.ai") &&
    path.startsWith("/chat/")
  ) {
    addMistralButton();
  }
  if (
    window.location.hostname === "duckduckgo.com" ||
    window.location.hostname === "www.duckduckgo.com"
  ) {
    addDuckduckGoButton();
  }
  if (
    window.location.hostname === "perplexity.ai" ||
    (window.location.hostname === "www.perplexity.ai" &&
      path.startsWith("/search/"))
  ) {
    addPerplexityButton();
  }
  if (
    window.location.hostname === "chat.deepseek.com" ||
    (window.location.hostname === "www.chat.deepseek.com" &&
      path.startsWith("/a/chat/s/"))
  ) {
    addDeepSeekButton();
  }
}, 3000); // Alle 3 Sekunden prüfen

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📩 Message received in content.js:", request);

  if (request.action !== "usePrompt") {
    sendResponse({
      status: "unknown_action",
      message: "Action not recognized",
    });
    return true;
  }

  console.log("✅ usePrompt action received!");
  const inputHandlers = {
    copilot: {
      selector: "textarea#copilot-chat-textarea",
      setText: (element, text) => (element.value = text),
    },
    gemini: {
      selector:
        ".text-input-field_textarea-inner > rich-textarea > [role='textbox'] > p",
      setText: (element, text) => (element.innerHTML = text),
    },
    blackbox: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
    chatGPT: {
      selector: "#composer-background",
      setText: setChatGPTText,
    },
    grok: {
      selector: ".relative.z-10 > textarea",
      setText: (element, text) => (element.value = text),
    },
    claude: {
      selector: ".ProseMirror > p",
      setText: (element, text) => (element.innerHTML = text),
    },
    microCopilot: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
    mistral: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
    duckduckgo: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
    perplexity: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
    deepseek: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
  };

  handlePromptInsertion(inputHandlers, request.text, sendResponse);
  return true; // Required for asynchronous sendResponse
});

// Helper Functions
function handlePromptInsertion(handlers, text, sendResponse) {
  let success = false;

  for (const [name, { selector, setText }] of Object.entries(handlers)) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        setText(element, text);
        triggerInputEvent(element);
        console.log(`✍️ Text inserted into ${name}:`, text);
        success = true;
      }
    } catch (error) {
      console.warn(`⚠️ Error processing ${name} input:`, error);
    }
  }

  sendResponse({
    status: success ? "success" : "error",
    message: success
      ? "Prompt inserted successfully"
      : "No suitable input found",
  });
}

function triggerInputEvent(element) {
  if (element.tagName === "TEXTAREA" || element.isContentEditable) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function setChatGPTText(startElement, text) {
  let currentElement = startElement;
  for (let level = 1; level <= 6; level++) {
    currentElement = Array.from(currentElement.children).find(
      (child) => child.tagName === "DIV"
    );
    if (!currentElement) {
      console.log(`Ebene ${level}: Kein DIV-Kind gefunden`);
      return;
    }
    console.log(`Ebene ${level}: DIV gefunden:`, currentElement);
  }

  const paragraph = currentElement.querySelector("p");
  if (paragraph) {
    paragraph.textContent = text;
    console.log("Paragraph erfolgreich gefunden und Wert gesetzt:", text);
  } else {
    console.log("Ebene 7: Kein Paragraph-Element gefunden");
  }
}

function blackboxButtonClick() {
  // Berechnung des Index muss bei jedem Aufruf neu erfolgen
  const proseElements = document.querySelectorAll(".prose");
  const totalElements = proseElements.length;
  const newIndex = totalElements - 2;

  console.log("Total Elements:", totalElements);
  console.log("New Index (zweitletztes Element):", newIndex);

  if (newIndex >= 0 && newIndex < totalElements) {
    const selectedProse = proseElements[newIndex];
    const firstParagraph = selectedProse.querySelector("p");

    if (firstParagraph) {
      console.log(firstParagraph.innerHTML);
      promptSaver(firstParagraph.innerHTML);
    } else {
      console.log("Kein Paragraph in diesem Prose-Element gefunden.");
    }
  } else {
    console.log("Nicht genügend Prose-Elemente vorhanden.");
  }
}

function grokButtonClick(index) {
  console.log("INDEX: " + index);

  index = index - 1;

  // Alle Elemente mit der Klasse "items-end" auswählen
  const containers = document.querySelectorAll(".items-end > div > span");

  // Überprüfen, ob es mindestens ein Element gibt
  if (containers.length > 0) {
    console.log("INDEX: " + index);
    // Hier kannst du das gewünschte Element auswählen, z.B. das erste Element
    const specificContainer = containers[index]; // Ändere den Index, um ein anderes Element auszuwählen

    // Den Text des spezifischen Elements anzeigen
    console.log(specificContainer.innerHTML);

    promptSaver(specificContainer.innerHTML);
  } else {
    console.log("Keine Elemente mit der Klasse 'items-end' gefunden.");
  }
}

function geminiButtonClick(index) {
  console.log("INDEX: " + index);

  index = index - 1;

  // Verwende den Index im ID-Selector
  let element = document.getElementById(`user-query-content-${index}`);

  // Prüfe, ob das Element existiert
  if (!element) {
    console.log(`Element mit ID 'user-query-content-${index}' nicht gefunden`);
    return;
  }

  // Finde das erste span-Element in der spezifischen Verschachtelung
  let span = element.querySelector(":scope > span > span > div > p");

  // Prüfe, ob span gefunden wurde und gib Inhalt aus
  if (span) {
    console.log("Gefundener Inhalt: " + span.innerHTML);

    promptSaver(span.innerHTML);
  } else {
    console.log("Kein passendes span-Element gefunden");
  }
}

function chatGPTButtonClick(index) {
  // Überprüfen, ob der Index eine positive Zahl ist
  index = index - 1;
  const articleElement = document.querySelector(
    `article[data-testid='conversation-turn-${index}']`
  );

  if (articleElement) {
    let stage = articleElement.children[1];
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    // stage = stage.children[0];
    // console.log(stage.textContent);
    promptSaver(stage.textContent);
  } else {
    console.log(
      `Article with data-testid 'conversation-turn-${index}' not found.`
    );
  }
}

function addMistralButtonClick(index) {
  index = index - 1;
  // 1. Zuerst das spezifische Element auswählen (das 6. Kind mit der angegebenen Klasse).
  let targetElement = document.querySelector(
    `.group.flex.w-full.gap-3:nth-child(${index})`
  );

  if (targetElement) {
    // 2. Innerhalb dieses Elements, gehen wir durch alle Kinder-Elemente (divs)
    let divs = targetElement.querySelectorAll("div");

    if (divs.length >= 4) {
      // 3. Wir holen uns den vierten div und lesen den darin enthaltenen Text aus
      let fourthDiv = divs[3];
      // console.log(fourthDiv.textContent); // Gibt den Text des vierten div aus
      promptSaver(fourthDiv.textContent);
    } else {
      console.log("Es gibt weniger als 4 div-Elemente in diesem Container.");
    }
  } else {
    console.log(
      "Das Ziel-Element mit der angegebenen Klasse wurde nicht gefunden."
    );
  }
}

function promptSaver(message) {
  message = message.trim(); // Trim entfernt überflüssige Leerzeichen

  let baseTopicName = "ExampleName"; // Dynamischer Name möglich
  let topicName = baseTopicName;

  // Prüfe, ob ein Doppelpunkt im Text vorhanden ist
  let processedMessage = message;
  const colonIndex = message.indexOf(":");
  if (colonIndex !== -1) {
    // Wenn ein ":" gefunden wird, nimm nur den Teil links davon inklusive ":"
    processedMessage = message.substring(0, colonIndex + 1).trim();
  }

  // Hole bestehende Daten
  chrome.storage.sync.get(null, async function (data) {
    let topics = data || {}; // Sicherstellen, dass ein Objekt existiert

    // Eindeutige ID generieren
    const uniqueID = await generateUniqueID(topicName);

    // Falls der Name bereits existiert, generiere einen neuen
    while (topics.hasOwnProperty(topicName)) {
      topicName = `${baseTopicName}_${Math.floor(Math.random() * 10000)}`;
    }

    // Neues Topic-Objekt erstellen mit der verarbeiteten Nachricht
    topics[uniqueID] = {
      name: topicName,
      prompts: [processedMessage],
    };

    // Speichern und UI sofort aktualisieren
    chrome.storage.sync.set(topics, function () {
      console.log(
        `Gespeichert in ${topicName} (ID: ${uniqueID}):`,
        processedMessage
      );
    });
  });
}

// Funktion zum Abrufen des passenden Chat-Elements
function copilotButtonClick(index) {
  // Überprüfen, ob der Index eine positive Zahl ist
  if (index <= 0) {
    console.error("Index muss eine positive Zahl sein.");
    return;
  }

  // Berechnung des nth-child-Wertes
  const nthChild = index;

  console.log("Nth-child: " + nthChild);

  const elements = document.querySelectorAll(
    ".UserMessage-module__container--cAvvK.ChatMessage-module__userMessage--xvIFp"
  );
  let message;
  // Stelle sicher, dass nthChild innerhalb des gültigen Bereichs liegt
  if (nthChild > 0 && nthChild <= elements.length) {
    message = elements[nthChild - 1]; // nth-child ist 1-basiert, NodeList ist 0-basiert
    console.log(message.textContent.trim());
  } else {
    console.log("Ungültiger nthChild-Wert: " + nthChild);
  }

  if (message) {
    promptSaver(message);
  } else {
    console.log(`Kein Element für Prompt ${index} gefunden.`);
  }
}
function claudeButtonClick(index) {
  // Alle Elemente mit data-testid='user-message' auswählen
  let userMessages = document.querySelectorAll("[data-testid='user-message']");

  // Das zweite Element auswählen (Index 1, da 0-based)
  let secondUserMessage = userMessages[index];

  // Das p-Element innerhalb des zweiten Elements finden und dessen innerHTML abrufen
  let paragraph = secondUserMessage.querySelector("p");
  if (!paragraph) {
    throw new Error("Kein p-Element im zweiten user-message gefunden");
  }
  let content = paragraph.innerHTML;
  if (content) {
    promptSaver(content);
    console.log(content);
  }
}
function addDuckduckGoButtonClick(index) {
  // Alle div-Elemente mit heading-Attribut auswählen
  const allDivsWithHeading = document.querySelectorAll("div[heading]");
  // Das zweite Element (Index 1) auswählen
  const divWithHeading = allDivsWithHeading[index - 1];

  if (divWithHeading && divWithHeading.parentElement) {
    const parentDiv = divWithHeading.parentElement;

    const pElement = parentDiv.querySelector("p");
    if (pElement) {
      console.log(pElement.textContent);
      promptSaver(pElement.textContent);
    } else {
      console.log("Kein p-Element gefunden");
    }
  } else {
    console.log(
      "Kein zweites div[heading]-Element oder kein parentElement gefunden"
    );
  }
}
function addMicrosoftCopilotButtonClick(index) {
  try {
    // Alle DIVs mit data-tabster, die "groupper" enthalten, auswählen
    const targetDivs = document.querySelectorAll(
      'div[data-tabster*="groupper"]'
    );
    if (targetDivs.length < 1) {
      throw new Error("Kein DIV mit data-tabster='groupper' gefunden");
    }

    // Sicherstellen, dass der übergebene Index gültig ist
    if (index < 0 || index >= targetDivs.length) {
      throw new Error(
        `Ungültiger Index ${index} für ${targetDivs.length} groupper-Elemente`
      );
    }

    // Das Ziel-Element basierend auf dem übergebenen Index auswählen
    const selectedDiv = targetDivs[index];
    console.log(`Ausgewähltes ${index + 1}. "groupper"-DIV:`, selectedDiv);

    // Index des vorherigen Elements (index - 1), um die Benutzernachricht zu erhalten
    const userIndex = index - 1;
    if (userIndex < 0) {
      console.warn(`Kein vorheriges Element für Index ${index} vorhanden`);
      return;
    }

    // Vorheriges groupper-Element auswählen
    const userTargetDiv = targetDivs[userIndex];
    console.log(`Vorheriges (${userIndex + 1}.) groupper-DIV:`, userTargetDiv);

    // Einziges direktes DIV im vorherigen groupper auswählen
    const nestedDiv = userTargetDiv.querySelector(":scope > div");
    if (!nestedDiv) {
      console.error("Kein direktes DIV im vorherigen groupper-DIV gefunden");
      return;
    }
    console.log("Direktes DIV im vorherigen groupper:", nestedDiv);

    // Nächstes verschachteltes DIV auswählen (innerhalb von nestedDiv)
    const nestedDiv2 = nestedDiv.querySelector("div");
    if (!nestedDiv2) {
      console.error(
        "Kein verschachteltes DIV im nestedDiv des vorherigen groupper gefunden"
      );
      return;
    }
    console.log("Verschachteltes DIV im vorherigen groupper:", nestedDiv2);

    // Textinhalt des innersten DIV ausgeben (Benutzernachricht)
    const textContent = nestedDiv2.textContent.trim();
    if (textContent) {
      console.log(
        `Benutzernachricht im ${userIndex + 1}. groupper-DIV:`,
        textContent
      );
      promptSaver(textContent);
    } else {
      console.warn(`Kein Text im ${userIndex + 1}. groupper-DIV gefunden`);
    }
  } catch (error) {
    console.error("Fehler:", error.message);
  }
}
function addPerplexityButtonClick(index) {
  try {
    const scrollableContainer = document.querySelector(".scrollable-container");
    const currentIndex =
      scrollableContainer?.children[0]?.children[0]?.children[0]?.children[1]
        ?.children[0]?.[index - 1];

    if (currentIndex) {
      const chat =
        currentIndex?.children[0]?.children[1]?.children[0]?.children[0]
          ?.children[0]?.children[0]?.children[1]?.children[0]?.children[0]
          ?.children[0];

      if (chat) {
        // Log and process the content
        // console.log(chat.innerHTML);
        promptSaver(chat.innerHTML);
      } else {
        console.error("Chat element not found.");
      }
    } else {
      console.error("Current index element not found.");
    }
  } catch (error) {
    console.error("Error in addPerplexityButtonClick:", error.message);
  }
}

function addDeepSeekButtonClick(index) {
  const root = document.getElementById("root");

  // Check if root exists
  if (!root) {
    console.log("Root-Element nicht gefunden.");
    return;
  }

  let currentElement = root;
  const path = [0, 1, 1, 0, 1, 0, 0, 0]; // Path to the desired element

  // Navigate through the path to find the final element
  for (let i = 0; i < path.length; i++) {
    const nextIndex = path[i];
    if (
      currentElement?.children &&
      nextIndex < currentElement.children.length
    ) {
      currentElement = currentElement.children[nextIndex];
      console.log(
        `Element ${i + 1}: ${currentElement.tagName}, Klasse: ${
          currentElement.className
        }`
      );
    } else {
      console.log(`Element ${i + 1} nicht gefunden.`);
      return;
    }
  }

  // Check if the final element was found
  if (!currentElement) {
    console.log("Finales Element nicht gefunden.");
    return;
  }

  console.log(
    `Finales Element: ${currentElement.tagName}, Klasse: ${currentElement.className}`
  );

  // Adjust the index (subtract 2 as per original logic)
  const adjustedIndex = index - 2;
  const children = currentElement.children;

  // Select and log the specific child element
  if (children && adjustedIndex >= 0 && adjustedIndex < children.length) {
    const selectedChild = children[adjustedIndex];
    console.log(
      `Ausgewähltes Element ${
        adjustedIndex + 1
      }: ${selectedChild.textContent.trim()}`
    );
    promptSaver(selectedChild.textContent.trim());
  } else {
    console.log(`Element mit Index ${adjustedIndex} nicht gefunden.`);
  }
}
