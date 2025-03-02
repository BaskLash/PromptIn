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
    console.log("Your Inside of copilot");
    let toolbars = document.querySelectorAll(
      '[role="toolbar"][aria-label="Message tools"]'
    );

    let existingToolbars = new Set(); // Set für bereits verarbeitete Toolbars
    let buttonCounter = 1; // Startwert für die Button-Nummerierung

    toolbars.forEach((toolbar, index) => {
      // Überprüfen, ob die Toolbar bereits verarbeitet wurde
      if (!existingToolbars.has(toolbar)) {
        // Bestehende Buttons mit der Klasse "save-prompt-button" suchen
        let existingButtons = toolbar.querySelectorAll(
          "button[class*='save-prompt-button']"
        );

        // Wenn mehr als ein Button existiert, alle außer dem ersten entfernen
        if (existingButtons.length > 1) {
          for (let j = 1; j < existingButtons.length; j++) {
            existingButtons[j].remove();
            console.log("Überflüssiger Button entfernt.");
          }
        }

        // Prüfen, ob ein Button existiert
        let buttonExists = existingButtons.length > 0;

        // Falls es sich um die erste Toolbar handelt und kein Button existiert → Reset!
        if (index === 0 && !buttonExists) {
          console.log(
            "Erste Toolbar hat keinen Button – Counter wird zurückgesetzt."
          );
          buttonCounter = 1;
        }

        // Nur bei jedem zweiten Element (index 1, 3, 5, ...) und wenn kein Button existiert
        if (index % 2 === 1 && !buttonExists) {
          const button = document.createElement("button");
          button.textContent = "Save Prompt"; // Korrigierter String
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
            let match = clickedButton.className.match(
              /save-prompt-button-(\d+)/
            );
            if (match) {
              let buttonNumber = parseInt(match[1], 10);
              console.log(`Button ${buttonNumber} wurde geklickt.`);

              clickedButton.textContent = "✔ Prompt Saved";
              promptGrabber(buttonNumber);

              setTimeout(() => {
                clickedButton.textContent = "Save Prompt";
              }, 5000);
            }
          });

          toolbar.appendChild(button);
          console.log(`Button ${buttonCounter} hinzugefügt.`);
          buttonCounter++; // Zähler erhöhen
        } else if (buttonExists) {
          console.log("Button existiert bereits, überspringe...");
        }

        // Toolbar als verarbeitet markieren
        existingToolbars.add(toolbar);
      }
    });

    console.log("Der Zähler läuft");
  }
  if (window.location.hostname === "chatgpt.com" && path.startsWith("/c/")) {
    console.log("Your Inside of chatgpt");

    const articleElements = document.querySelectorAll(
      "article[data-testid^='conversation-turn-']"
    );

    let existingElements = new Set(); // Set für bereits verarbeitete Elemente
    let buttonCounter = 1; // Startwert für die Button-Nummerierung

    articleElements.forEach((articleElement, index) => {
      let currentElement = articleElement;

      for (let i = 0; i < 9; i++) {
        let nextDiv = null;
        let nextSibling = currentElement.firstElementChild;
        let divElements = [];

        while (nextSibling) {
          if (nextSibling.tagName === "DIV") {
            divElements.push(nextSibling);
          }
          nextSibling = nextSibling.nextElementSibling;
        }

        if (i === 4) {
          nextDiv = divElements[1];
        } else if (divElements.length > 0) {
          nextDiv = divElements[0];
        }

        if (nextDiv) {
          currentElement = nextDiv;

          if (
            currentElement.classList.contains("flex") &&
            currentElement.classList.contains("items-center")
          ) {
            if (existingElements.has(currentElement)) {
              console.log(
                "Dieses Element wurde bereits verarbeitet, überspringe..."
              );
              break;
            }

            // Bestehende Buttons mit der Klasse "save-prompt-button" suchen
            let existingButtons = currentElement.querySelectorAll(
              "button[class*='save-prompt-button']"
            );

            // Wenn mehr als ein Button existiert, alle außer dem ersten entfernen
            if (existingButtons.length > 1) {
              for (let j = 1; j < existingButtons.length; j++) {
                existingButtons[j].remove();
                console.log("Überflüssiger Button entfernt.");
              }
            }

            // Prüfen, ob ein Button existiert
            let buttonExists = existingButtons.length > 0;

            if (!buttonExists) {
              const button = document.createElement("button");
              button.textContent = "Save Prompt"; // String in Anführungszeichen
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
                let match = clickedButton.className.match(
                  /save-prompt-button-(\d+)/
                );
                if (match) {
                  let buttonNumber = parseInt(match[1], 10);
                  console.log(`Button ${buttonNumber} wurde geklickt.`);

                  clickedButton.textContent = "✔ Prompt Saved";
                  chatGPTButtonClick(buttonNumber);

                  setTimeout(() => {
                    clickedButton.textContent = "Save Prompt";
                  }, 5000);
                }
              });

              currentElement.appendChild(button);
              console.log(
                `Button ${buttonCounter} auf Ebene ${i + 1} hinzugefügt.`
              );
              buttonCounter++;
            } else {
              console.log("Button existiert bereits, überspringe...");
            }

            existingElements.add(currentElement);
            break;
          }
        } else {
          console.log(`Ebene ${i + 1}: Kein DIV-Element gefunden.`);
          break;
        }
      }
    });

    if (articleElements.length === 0) {
      console.log(
        "Keine Artikel mit data-testid 'conversation-turn-*' gefunden."
      );
    }
  }

  if (
    window.location.hostname === "gemini.google.com" &&
    path.startsWith("/app/")
  ) {
    console.log("Your Inside of gemini");

    // Alle Elemente mit der Klasse '.response-container-footer' auswählen
    const elements = document.querySelectorAll(".response-container-footer");
    let existingElements = new Set(); // Set für bereits verarbeitete Elemente
    let buttonCounter = 1; // Startwert für die Button-Nummerierung

    elements.forEach((element, index) => {
      let currentElement = element;
      let messageActions = currentElement.querySelector("message-actions");

      if (messageActions) {
        let firstDiv = messageActions.querySelector("div");
        if (firstDiv) {
          let secondDiv = firstDiv.querySelector("div");
          if (secondDiv) {
            // Falls dieses Element schon verarbeitet wurde, überspringen
            if (existingElements.has(secondDiv)) {
              console.log(
                "Dieses Element wurde bereits verarbeitet, überspringe..."
              );
              return;
            }

            // Bestehende Buttons mit der Klasse "save-prompt-button" suchen
            let existingButtons = secondDiv.querySelectorAll(
              "button[class*='save-prompt-button']"
            );

            // Wenn mehr als ein Button existiert, alle außer dem ersten entfernen
            if (existingButtons.length > 1) {
              for (let j = 1; j < existingButtons.length; j++) {
                existingButtons[j].remove();
                console.log("Überflüssiger Button entfernt.");
              }
            }

            // Prüfen, ob ein Button existiert
            let buttonExists = existingButtons.length > 0;

            // Falls es sich um das erste Element handelt und kein Button existiert → Zähler zurücksetzen
            if (index === 0 && !buttonExists) {
              console.log(
                "Erstes Element hat keinen Button – Counter wird zurückgesetzt."
              );
              buttonCounter = 1;
            }

            // Nur wenn kein Button existiert, einen neuen hinzufügen
            if (!buttonExists) {
              const button = document.createElement("button");
              button.textContent = "Save Prompt"; // Korrigierter String
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
                let match = clickedButton.className.match(
                  /save-prompt-button-(\d+)/
                );
                if (match) {
                  let buttonNumber = parseInt(match[1], 10);
                  console.log(`Button ${buttonNumber} wurde geklickt.`);

                  clickedButton.textContent = "✔ Prompt Saved";
                  geminiButtonClick(buttonNumber);

                  setTimeout(() => {
                    clickedButton.textContent = "Save Prompt";
                  }, 5000);
                }
              });

              secondDiv.appendChild(button);
              console.log(`Button ${buttonCounter} hinzugefügt.`);
              buttonCounter++; // Zähler erhöhen
            } else {
              console.log("Button existiert bereits, überspringe...");
            }

            // Element als verarbeitet markieren
            existingElements.add(secondDiv);
          }
        }
      }
    });

    if (elements.length === 0) {
      console.log(
        "Keine Elemente mit der Klasse 'response-container-footer' gefunden."
      );
    }
  }
  if (window.location.hostname === "grok.com" && path.startsWith("/chat/")) {
    console.log("Your Inside of grok");

    const containers = document.querySelectorAll(".items-start");
    let existingElements = new Set();
    let buttonCounter = 1;

    containers.forEach((container, index) => {
      const divs = container.querySelectorAll(":scope > div");

      if (divs.length === 2) {
        const secondDiv = divs[1];

        if (existingElements.has(secondDiv)) {
          console.log(
            "Dieses Element wurde bereits verarbeitet, überspringe..."
          );
          return;
        }

        // Bestehende Buttons mit der Klasse "save-prompt-button" suchen
        let existingButtons = secondDiv.querySelectorAll(
          "button[class*='save-prompt-button']"
        );

        // Wenn mehr als ein Button existiert, alle außer dem ersten entfernen
        if (existingButtons.length > 1) {
          for (let j = 1; j < existingButtons.length; j++) {
            existingButtons[j].remove();
            console.log("Überflüssiger Button entfernt.");
          }
        }

        // Prüfen, ob ein Button existiert
        let buttonExists = existingButtons.length > 0;

        if (index === 0 && !buttonExists) {
          console.log(
            "Erstes Element hat keinen Button – Counter wird zurückgesetzt."
          );
          buttonCounter = 1;
        }

        if (!buttonExists) {
          const button = document.createElement("button");
          button.textContent = "Save Prompt";
          button.classList.add(
            "save-prompt-button",
            `save-prompt-button-${buttonCounter}`
          );

          button.style.padding = "5px 10px";
          button.style.marginLeft = "5px";
          button.style.cursor = "pointer";
          button.style.border = "1px solid #ccc";
          button.style.borderRadius = "5px";
          button.style.color = "black";
          button.style.background = "#f0f0f0";
          button.title =
            "If you liked the answer, save the prompt that generated it directly to your memory.";

          button.addEventListener("mouseover", () => {
            button.style.backgroundColor = "#e0e0e0";
            button.style.borderColor = "#bbb";
          });

          button.addEventListener("mouseout", () => {
            button.style.backgroundColor = "#f0f0f0";
            button.style.borderColor = "#ccc";
          });

          button.addEventListener("click", (event) => {
            let clickedButton = event.target;
            let match = clickedButton.className.match(
              /save-prompt-button-(\d+)/
            );
            if (match) {
              let buttonNumber = parseInt(match[1], 10);
              console.log(`Button ${buttonNumber} wurde geklickt.`);

              clickedButton.textContent = "✔ Prompt Saved";
              grokButtonClick(buttonNumber);

              setTimeout(() => {
                clickedButton.textContent = "Save Prompt";
              }, 5000);
            }
          });

          secondDiv.appendChild(button);
          console.log(`Button ${buttonCounter} hinzugefügt.`);
          buttonCounter++;
        } else {
          console.log("Button existiert bereits, überspringe...");
        }

        existingElements.add(secondDiv);
      } else {
        console.log(
          `Element mit .items-start hat ${divs.length} div(s), erwartet: genau 2`
        );
      }
    });

    if (containers.length === 0) {
      console.log("Keine Elemente mit der Klasse .items-start gefunden");
    }
  }
  if (
    (window.location.hostname === "blackbox.ai" ||
      window.location.hostname === "www.blackbox.ai") &&
    path.startsWith("/chat/")
  ) {
    console.log("You're inside blackbox");

    // Das gewünschte div-Element auswählen
    const targetDiv = document.querySelector("div.flex.justify-center");

    // Überprüfen, ob das Ziel-Div existiert
    if (targetDiv) {
      // Bestehende Buttons mit der Klasse "save-prompt-button" suchen
      let existingButtons = targetDiv.querySelectorAll(
        "button[class*='save-prompt-button']"
      );

      // Wenn mehr als ein Button existiert, alle außer dem ersten entfernen
      if (existingButtons.length > 1) {
        for (let j = 1; j < existingButtons.length; j++) {
          existingButtons[j].remove();
          console.log("Überflüssiger Button entfernt.");
        }
      }

      // Prüfen, ob ein Button existiert
      let buttonExists = existingButtons.length > 0;

      if (!buttonExists) {
        // Button-Zähler initialisieren
        let buttonCounter =
          document.querySelectorAll(".save-prompt-button").length + 1;

        // Neuen Button erstellen
        const button = document.createElement("button");
        button.textContent = "Save Prompt";
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

            clickedButton.textContent = "✔ Prompt Saved";
            blackboxButtonClick();

            setTimeout(() => {
              clickedButton.textContent = "Save Prompt";
            }, 5000);
          } else {
            console.log("Button wurde geklickt, aber keine Nummer gefunden.");
          }
        });

        // Den Button dem div-Element hinzufügen
        targetDiv.appendChild(button);
        console.log(`Button ${buttonCounter} wurde hinzugefügt.`);
      } else {
        console.log("Button existiert bereits, überspringe...");
      }
    } else {
      console.error("Das angegebene div-Element wurde nicht gefunden.");
    }
  }
}, 3000); // Alle 3 Sekunden prüfen

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📩 Message received in content.js:", request);

  if (request.action === "usePrompt") {
    console.log("✅ usePrompt action received!");

    // For Copilot Input
    const textarea = document.querySelector("textarea#copilot-chat-textarea");
    if (textarea) {
      textarea.value = request.text; // Insert the stored text

      // Trigger an input event (important for some web apps)
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      console.log("✍️ Text inserted:", request.text);
      sendResponse({
        status: "success",
        message: "Prompt inserted successfully",
      });
    } else {
      console.warn("⚠️ No textarea found.");
      sendResponse({ status: "error", message: "Textarea not found" });
    }

    // For Gemini Input
    const geminiInput = document.querySelector(
      ".text-input-field_textarea-inner > rich-textarea > [role='textbox'] > p"
    );
    if (geminiInput) {
      geminiInput.innerHTML = request.text;
    }

    // For BlackBox Input
    const blackboxInput = document.querySelector("textarea");
    if (blackboxInput) {
      blackboxInput.value = request.text;
      // Trigger an input event (important for some web apps)
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      sendResponse({
        status: "success",
        message: "Prompt inserted successfully",
      });
    } else {
      console.warn("⚠️ No textarea found.");
      sendResponse({ status: "error", message: "Textarea not found" });
    }

    // For ChatGPT Input
    const firstDiv = document.getElementById("composer-background");

    // Ebene 1: Überprüfe den Startpunkt
    if (!firstDiv) {
      console.log(
        "Ebene 1: Start-Element 'composer-background' nicht gefunden."
      );
    } else if (firstDiv.tagName !== "DIV") {
      console.log("Ebene 1: Start-Element ist kein DIV:", firstDiv);
    } else {
      console.log(
        "Ebene 1: Start-DIV 'composer-background' gefunden:",
        firstDiv
      );

      // Ebene 2
      const secondDiv = Array.from(firstDiv.children).find(
        (child) => child.tagName === "DIV"
      );
      if (!secondDiv) {
        console.log("Ebene 2: Kein DIV-Kind gefunden in:", firstDiv);
      } else {
        console.log("Ebene 2: DIV gefunden:", secondDiv);

        // Ebene 3
        const thirdDiv = Array.from(secondDiv.children).find(
          (child) => child.tagName === "DIV"
        );
        if (!thirdDiv) {
          console.log("Ebene 3: Kein DIV-Kind gefunden in:", secondDiv);
        } else {
          console.log("Ebene 3: DIV gefunden:", thirdDiv);

          // Ebene 4
          const fourthDiv = Array.from(thirdDiv.children).find(
            (child) => child.tagName === "DIV"
          );
          if (!fourthDiv) {
            console.log("Ebene 4: Kein DIV-Kind gefunden in:", thirdDiv);
          } else {
            console.log("Ebene 4: DIV gefunden:", fourthDiv);

            // Ebene 5
            const fifthDiv = Array.from(fourthDiv.children).find(
              (child) => child.tagName === "DIV"
            );
            if (!fifthDiv) {
              console.log("Ebene 5: Kein DIV-Kind gefunden in:", fourthDiv);
            } else {
              console.log("Ebene 5: DIV gefunden:", fifthDiv);

              // Ebene 6
              const sixthDiv = Array.from(fifthDiv.children).find(
                (child) => child.tagName === "DIV"
              );
              if (!sixthDiv) {
                console.log("Ebene 6: Kein DIV-Kind gefunden in:", fifthDiv);
              } else {
                console.log("Ebene 6: DIV gefunden:", sixthDiv);

                // Ebene 7: Suche nach einem Paragraph-Element (p)
                const paragraph = sixthDiv.querySelector("p");
                if (!paragraph) {
                  console.log(
                    "Ebene 7: Kein Paragraph-Element in Ebene 6 gefunden:",
                    sixthDiv
                  );
                  console.log(
                    "Fehler: Paragraph konnte nicht gefunden werden."
                  );
                } else {
                  console.log("Ebene 7: Paragraph gefunden:", paragraph);
                  paragraph.textContent = request.text; // Setze den Textinhalt des p-Elements
                  console.log(
                    "Paragraph erfolgreich gefunden und Wert gesetzt:",
                    paragraph.textContent
                  );
                }
              }
            }
          }
        }
      }
    }
    // For Grok Input
    const grokInput = document.querySelector(".relative.z-10 > textarea");
    if (grokInput) {
      grokInput.value = request.text; // Insert the stored text

      // Trigger an input event (important for some web apps)
      grokInput.dispatchEvent(new Event("input", { bubbles: true }));

      console.log("✍️ Text inserted:", request.text);
      sendResponse({
        status: "success",
        message: "Prompt inserted successfully",
      });
    } else {
      console.warn("⚠️ No textarea found.");
      sendResponse({ status: "error", message: "Textarea not found" });
    }
  } else {
    sendResponse({
      status: "unknown_action",
      message: "Action not recognized",
    });
  }

  return true; // Required for asynchronous sendResponse
});

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
      let message = firstParagraph.innerHTML.trim();
      let baseTopicName = "ExampleName";
      let topicName = baseTopicName;

      let processedMessage = message;
      const colonIndex = message.indexOf(":");
      if (colonIndex !== -1) {
        processedMessage = message.substring(0, colonIndex + 1).trim();
      }

      chrome.storage.sync.get(null, async function (data) {
        let topics = data || {};
        const uniqueID = await generateUniqueID(topicName);

        while (topics.hasOwnProperty(topicName)) {
          topicName = `${baseTopicName}_${Math.floor(Math.random() * 10000)}`;
        }

        topics[uniqueID] = {
          name: topicName,
          prompts: [processedMessage],
        };

        chrome.storage.sync.set(topics, function () {
          console.log(
            `Gespeichert in ${topicName} (ID: ${uniqueID}):`,
            processedMessage
          );
          inputField.value = "";
          document.querySelector(".dropdown-content p").style.display = "none";
          addDropdownItem(uniqueID, topicName);
        });
      });
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

    message = specificContainer.innerHTML.trim(); // Trim entfernt überflüssige Leerzeichen
    console.log(`Prompt ${index}:`, message);

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
        inputField.value = ""; // Eingabefeld leeren

        document.querySelector(".dropdown-content p").style.display = "none";

        // Direkt das neue Element in die UI einfügen
        addDropdownItem(uniqueID, topicName);
      });
    });
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

    message = span.innerHTML.trim(); // Trim entfernt überflüssige Leerzeichen
    console.log(`Prompt ${index}:`, message);

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
        inputField.value = ""; // Eingabefeld leeren

        document.querySelector(".dropdown-content p").style.display = "none";

        // Direkt das neue Element in die UI einfügen
        addDropdownItem(uniqueID, topicName);
      });
    });
  } else {
    console.log("Kein passendes span-Element gefunden");
  }
}

function chatGPTButtonClick(index) {
  // Überprüfen, ob der Index eine positive Zahl ist
  if (index <= 0) {
    console.error("Index muss eine positive Zahl sein.");
    return;
  }
  index = index * 2;
  const articleElement = document.querySelector(
    `article[data-testid='conversation-turn-${index}']`
  );

  if (articleElement) {
    const whitespaceDiv = articleElement.querySelector(
      "div.whitespace-pre-wrap"
    );

    if (whitespaceDiv) {
      console.log(whitespaceDiv.textContent);

      message = whitespaceDiv.textContent.trim(); // Trim entfernt überflüssige Leerzeichen
      console.log(`Prompt ${index}:`, message);

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
          inputField.value = ""; // Eingabefeld leeren

          document.querySelector(".dropdown-content p").style.display = "none";

          // Direkt das neue Element in die UI einfügen
          addDropdownItem(uniqueID, topicName);
        });
      });
    } else {
      console.log(
        "No div with class 'whitespace-pre-wrap' found within the specified article."
      );
    }
  } else {
    console.log(
      `Article with data-testid 'conversation-turn-${index}' not found.`
    );
  }
}

// Funktion zum Abrufen des passenden Chat-Elements
function promptGrabber(index) {
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
    message = message.textContent.trim(); // Trim entfernt überflüssige Leerzeichen
    console.log(`Prompt ${index}:`, message);

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
