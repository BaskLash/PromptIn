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

function addV0ButtonClick(index) {
  index = index - 2;
  const messageListContainer = document.querySelector(".group\\/message-list")
    ?.children[0];

  if (messageListContainer) {
    const children = messageListContainer.children;

    for (let i = 0; i < children.length; i += 2) {
      const child = children[0];
      // console.log(child);
      kitty =
        child.children[0].children[0].children[0].children[1].children[0]
          .children[0];
      let paragraphs = kitty.querySelectorAll("p");

      paragraphs.forEach((p) => {
        console.log(p.textContent); // Or use .innerHTML if you want to keep icons, formatting, etc.
      });
    }
  } else {
    console.warn("messageListContainer wurde nicht gefunden.");
  }
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
  const container = document.querySelector(".scrollable-container");
  if (!container) {
    throw new Error("Scrollable container nicht gefunden");
  }

  // Finde das erste div-Element ohne Klasse innerhalb des Containers
  let divElement = container.querySelector("div[class='']");
  if (!divElement) {
    throw new Error("Div-Element ohne Klasse nicht gefunden");
  }
  divElement = divElement.children[index - 1];
  let title = divElement.querySelector(".overflow-hidden");
  title = title.children[0];

  // console.log(title.innerText);
  promptSaver(title);
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
