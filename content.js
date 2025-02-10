// Hilfsfunktion zur Generierung einer eindeutigen ID
async function generateUniqueID(baseName) {
  return `${baseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

let buttonCounter = 1; // Startwert für auto_increment
let existingToolbars = new Set(); // Set zur Verfolgung bereits verarbeiteter Toolbars

setInterval(() => {
  let toolbars = document.querySelectorAll(
    '[role="toolbar"][aria-label="Message tools"]'
  );

  toolbars.forEach((toolbar, index) => {
    // Überprüfen, ob die Toolbar bereits verarbeitet wurde
    if (!existingToolbars.has(toolbar)) {
      let buttonExists = Array.from(toolbar.querySelectorAll("button")).some(
        (btn) => btn.className.match(/\bsave-prompt-button-\d+\b/)
      );

      // Falls es sich um die erste Toolbar handelt und kein Button existiert → Reset!
      if (index === 0 && !buttonExists) {
        console.log(
          "Erste Toolbar hat keinen Button – Counter wird zurückgesetzt."
        );
        buttonCounter = 1;
      }

      // Falls kein Button existiert, neuen Button hinzufügen
      if (!buttonExists) {
        const button = document.createElement("button");
        button.textContent = `Save Prompt`;
        button.classList.add(
          "save-prompt-button",
          `save-prompt-button-${buttonCounter}`
        );

        // Button-Styling
        button.style.padding = "5px 10px";
        button.style.marginLeft = "5px";
        button.style.cursor = "pointer";
        button.style.border = "1px solid #ccc";
        button.style.borderRadius = "5px";
        button.style.color = "black";
        button.style.background = "#f0f0f0";
        button.title =
          "If you liked the answer, save the prompt that generated it directly to your memory.";

        // Hover-Effekte
        button.addEventListener("mouseover", () => {
          button.style.backgroundColor = "#e0e0e0";
          button.style.borderColor = "#bbb";
        });

        button.addEventListener("mouseout", () => {
          button.style.backgroundColor = "#f0f0f0";
          button.style.borderColor = "#ccc";
        });

        // Klick-Event
        button.addEventListener("click", (event) => {
          let clickedButton = event.target;
          let match = clickedButton.className.match(/save-prompt-button-(\d+)/);
          if (match) {
            let buttonNumber = parseInt(match[1], 10);
            console.log(`Button ${buttonNumber} wurde geklickt.`);
            promptGrabber(buttonNumber);
          }
        });

        toolbar.appendChild(button);
        console.log(`Button ${buttonCounter} hinzugefügt.`);
        buttonCounter++; // Zähler erhöhen
      }

      // Toolbar als verarbeitet markieren
      existingToolbars.add(toolbar);
    }
  });

  console.log("Der Zähler läuft");
}, 3000); // Alle 3 Sekunden prüfen

// Funktion zum Abrufen des passenden Chat-Elements
function promptGrabber(index) {
  // Überprüfen, ob der Index eine positive Zahl ist
  if (index <= 0) {
    console.error("Index muss eine positive Zahl sein.");
    return;
  }

  // Berechnung des nth-child-Wertes
  const nthChild = index * 2;

  let message = document.querySelector(
    `.ChatMessage-module__chatMessage--rtt38.ChatMessage-module__user--UoWHh:nth-child(${nthChild})`
  );

  if (message) {
    message = message.textContent;
    console.log(`Prompt ${index}:`, message);

    let baseTopicName = "ExampleName"; // Dynamischer Name möglich
    let topicName = baseTopicName;

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
        prompts: [message],
      };

      // Speichern und UI sofort aktualisieren
      chrome.storage.sync.set(topics, function () {
        console.log(`Gespeichert in ${topicName} (ID: ${uniqueID}):`, message);
        inputField.value = ""; // Eingabefeld leeren

        document.querySelector(".dropdown-content p").style.display = "none";

        // Direkt das neue Element in die UI einfügen
        addDropdownItem(uniqueID, topicName);
      });
    });
  } else {
    console.log(`Kein Element für Prompt ${index} gefunden.`);
  }
}
