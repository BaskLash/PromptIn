function addCopilotButton() {
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
          let match = clickedButton.className.match(/save-prompt-button-(\d+)/);
          if (match) {
            let buttonNumber = parseInt(match[1], 10);
            console.log(`Button ${buttonNumber} wurde geklickt.`);

            clickedButton.textContent = "✔ Prompt Saved";
            copilotButtonClick(buttonNumber);

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

function addChatGPTButton() {
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

function addBlackBoxButton() {
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

function addGrokButton() {
  console.log("Your Inside of grok");

  const containers = document.querySelectorAll(".items-start");
  let existingElements = new Set();
  let buttonCounter = 1;

  containers.forEach((container, index) => {
    const divs = container.querySelectorAll(":scope > div");

    const secondDiv = divs[2];

    if (existingElements.has(secondDiv)) {
      console.log("Dieses Element wurde bereits verarbeitet, überspringe...");
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
        let match = clickedButton.className.match(/save-prompt-button-(\d+)/);
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
  });

  if (containers.length === 0) {
    console.log("Keine Elemente mit der Klasse .items-start gefunden");
  }
}

function addGeminiButton() {
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

function addClaudeButton() {
  // Alle Elemente mit der Klasse font-claude-message auswählen
  let startElements = document.querySelectorAll(".font-claude-message");
  if (startElements.length === 0) {
    throw new Error(
      "Keine Elemente mit der Klasse font-claude-message gefunden"
    );
  }

  // Durch jedes .font-claude-message Element iterieren mit Index
  startElements.forEach((startElement, index) => {
    // console.log(`Start-Element (Index ${index}):`, startElement);

    // Ein div nach oben (parent)
    let parentDiv = startElement.parentElement;
    if (!parentDiv) {
      throw new Error("Parent-Element nicht gefunden");
    }
    // console.log(`Parent-Div (Index ${index}):`, parentDiv);

    // Alle divs innerhalb des Parent-Elements finden
    let divs = parentDiv.querySelectorAll("div");

    // Sicherstellen, dass es mindestens 4 div-Elemente gibt
    if (divs.length < 4) {
      throw new Error(
        `Nicht genug div-Elemente gefunden. Gefunden: ${divs.length}`
      );
    }

    // Das vierte div (Index 3) auswählen
    let targetDiv = divs[3];
    // console.log(
    //   `Das richtige DIV konnte gefunden werden (Index ${index}):`,
    //   targetDiv
    // );

    // Alle enthaltenen Elemente innerhalb des vierten DIVs finden und ausgeben
    // let childElements = targetDiv.children;
    // console.log(`Inhalte des vierten DIVs (Index ${index}):`);
    // Array.from(childElements).forEach((element, childIndex) => {
    //   console.log(`Element ${childIndex}:`, element);
    // });

    // Sicherstellen, dass targetDiv mindestens ein weiteres <div> enthält
    let innerDiv = targetDiv.querySelector("div");
    if (!innerDiv) {
      throw new Error("Kein weiteres inneres <div> gefunden.");
    }
    // console.log(`Inneres DIV gefunden (Index ${index}):`, innerDiv);

    let lastDiv = innerDiv.querySelector("div");

    // Dynamische Button-Klasse und ID
    let buttonClass = `save-prompt-button-${index}`;
    let buttonId = `save-prompt-button-id-${index}`;

    // Überprüfen, ob der Button bereits existiert
    let buttonExists = Array.from(lastDiv.querySelectorAll("button")).some(
      (btn) => btn.classList.contains(buttonClass) || btn.id === buttonId
    );

    if (!buttonExists) {
      // Neuen Button erstellen und in lastDiv einfügen
      let button = document.createElement("button");
      button.textContent = "Save Prompt";
      button.classList.add(buttonClass);
      button.id = buttonId;

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
          claudeButtonClick(buttonNumber);

          setTimeout(() => {
            clickedButton.textContent = "Save Prompt";
          }, 5000);
        }
      });

      lastDiv.appendChild(button);
      // console.log(`Button wurde hinzugefügt (Index ${index}):`, button);
    } else {
      // console.log("Button existiert bereits, überspringe...");
    }

    // Index am Ende der Iteration ausgeben
    // console.log(`Verarbeitung abgeschlossen für Element mit Index: ${index}`);
  });
}
function addMicrosoftCopilotButton() {
  try {
    // Alle DIVs mit data-tabster, die "groupper" enthalten, auswählen
    const targetDivs = document.querySelectorAll(
      'div[data-tabster*="groupper"]'
    );
    if (targetDivs.length < 2) {
      throw new Error(
        "Weniger als 2 DIVs mit data-tabster='groupper' gefunden"
      );
    }

    // Schleife über alle groupper-DIVs, nur jedes zweite verarbeiten (Index 1, 3, 5...)
    targetDivs.forEach((targetDiv, index) => {
      if (index % 2 !== 1) return; // Nur ungerade Indizes (2., 4., 6. Element) verarbeiten

      // console.log(`Verarbeite das ${index + 1}. "groupper"-DIV:`, targetDiv);

      // Alle direkten DIV-Kinder von targetDiv auswählen
      const targetDivChildren = targetDiv.querySelectorAll(":scope > div");
      let nestedDiv;

      if (targetDivChildren.length === 1) {
        nestedDiv = targetDivChildren[0];
        // console.log("Nur ein DIV in groupper vorhanden, verwende dieses:", nestedDiv);
      } else if (targetDivChildren.length === 2) {
        nestedDiv = targetDivChildren[1];
        // console.log("Zwei DIVs in groupper, zweites ausgewählt:", nestedDiv);
      } else if (targetDivChildren.length === 4) {
        nestedDiv = targetDivChildren[0];
        // console.log("Vier DIVs in groupper, erstes ausgewählt:", nestedDiv);
      } else {
        // console.error(`Unerwartete Anzahl an DIVs (${targetDivChildren.length}) im groupper-DIV gefunden`);
        return;
      }

      // Alle direkten DIV-Kinder von nestedDiv auswählen
      const nestedDivChildren = nestedDiv.querySelectorAll(":scope > div");
      let nestedDiv2;

      if (nestedDivChildren.length === 2) {
        nestedDiv2 = nestedDivChildren[1];
        // console.log("Zwei DIVs in nestedDiv, zweites ausgewählt:", nestedDiv2);
      } else if (nestedDivChildren.length >= 1) {
        nestedDiv2 = nestedDivChildren[0];
        // console.log("Erstes DIV in nestedDiv ausgewählt:", nestedDiv2);
      } else {
        // console.error("Kein verschachteltes DIV in nestedDiv gefunden");
        return;
      }

      // Prüfen, ob bereits ein Button mit der Klasse "save-prompt-button" existiert
      const buttonExists = nestedDiv2.querySelector(".save-prompt-button");
      if (buttonExists) {
        // console.log("Button mit 'save-prompt-button' existiert bereits, überspringe...");
        return;
      }

      // Dynamische Button-Klasse und ID basierend auf Index
      const buttonClass = `save-prompt-button-${index}`;
      const buttonId = `save-prompt-button-id-${index}`;

      // Neuen Button erstellen
      const button = document.createElement("button");
      button.textContent = "Save Prompt";
      button.classList.add("save-prompt-button", buttonClass); // Allgemeine Klasse + spezifische Klasse
      button.id = buttonId;

      // Button-Styling
      Object.assign(button.style, {
        padding: "5px 10px",
        marginLeft: "5px",
        cursor: "pointer",
        border: "1px solid #ccc",
        borderRadius: "5px",
        color: "black",
        background: "#f0f0f0",
      });
      button.title =
        "Speichere den Prompt, der diese Antwort erzeugt hat, direkt in deinem Gedächtnis.";

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
        const clickedButton = event.target;
        const match = clickedButton.className.match(/save-prompt-button-(\d+)/);
        if (match) {
          const buttonNumber = parseInt(match[1], 10);
          console.log(`Button ${buttonNumber} wurde geklickt.`);

          clickedButton.textContent = "✔ Prompt Saved";
          addMicrosoftCopilotButtonClick(buttonNumber); // Übergibt den korrekten Index

          setTimeout(() => {
            clickedButton.textContent = "Save Prompt";
          }, 5000);
        }
      });

      // Button ans Ende von nestedDiv2 anhängen
      nestedDiv2.appendChild(button);
      // console.log("Button ans Ende von nestedDiv2 hinzugefügt");
    });
  } catch (error) {
    // console.error("Fehler:", error.message);
  }
}
function addMistralButton() {
  try {
    // Alle `.group.flex.w-full.gap-3` Elemente auswählen
    const groupElements = document.querySelectorAll(".group.flex.w-full.gap-3");

    let buttonCounter = 1; // Startwert für die Button-Nummerierung
    let existingElements = new Set();

    // Alle `.group.flex.w-full.gap-3` durchgehen
    for (let i = 1; i < groupElements.length; i += 2) {
      let targetElement = groupElements[i];

      let firstLevelDown = targetElement.querySelector("div");
      if (!firstLevelDown) continue;

      let secondDiv = firstLevelDown.children[1];
      if (!secondDiv) continue;

      let finalElement = secondDiv.children[1];
      if (!finalElement) continue;

      // Prüfe, ob bereits ein Button mit der Klasse "save-prompt-button" existiert
      const existingButton = finalElement.querySelector(".save-prompt-button");
      if (existingButton) {
        console.log("Button existiert bereits für:", finalElement.className);
        existingElements.add(finalElement);
        continue;
      }

      // Falls wir hier sind, gibt es noch keinen Button
      existingElements.add(finalElement);

      // Erstelle das neue Button-Element
      let newButton = document.createElement("button");
      newButton.textContent = "Save Prompt";
      newButton.className = `save-prompt-button save-prompt-button-${i} btn-primary`;

      // Button-Styling
      Object.assign(newButton.style, {
        padding: "5px 10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        color: "black",
        background: "#f0f0f0",
      });
      newButton.title = "Speichert den aktuellen Prompt in der Erinnerung.";

      // Hover-Effekte
      newButton.addEventListener("mouseover", () => {
        newButton.style.backgroundColor = "#e0e0e0";
        newButton.style.borderColor = "#bbb";
      });
      newButton.addEventListener("mouseout", () => {
        newButton.style.backgroundColor = "#f0f0f0";
        newButton.style.borderColor = "#ccc";
      });

      // Klick-Event
      newButton.addEventListener("click", (event) => {
        if (newButton.classList.contains("save-prompt-button")) {
          let buttonNumber = i + 1; // Button-Nummer aus der Klasse berechnen
          console.log(`Button ${buttonNumber} wurde geklickt.`);

          // Text auf "✔ Prompt gespeichert" setzen
          newButton.textContent = "✔ Prompt Saved";

          addMistralButtonClick(buttonNumber); // Übergibt den korrekten Index

          setTimeout(() => {
            newButton.textContent = "Save Prompt";
          }, 5000);
        }
      });

      // Button einfügen
      finalElement.prepend(newButton);
      console.log(
        `Button ${buttonCounter} zu ${finalElement.className} hinzugefügt.`
      );
      buttonCounter++; // Zähler erhöhen
    }
  } catch (error) {
    console.error("Fehler in addMistralButtons:", error.message);
  }
}

function addDuckduckGoButton() {
  try {
    // Alle div-Elemente mit heading-Attribut auswählen
    const allDivsWithHeading = document.querySelectorAll("div[heading]");
    let buttonCounter = 1; // Zähler für Button-Nummerierung
    let existingElements = new Set(); // Set für bereits bearbeitete Elemente

    // Über jedes div[heading]-Element iterieren
    allDivsWithHeading.forEach((divWithHeading, index) => {
      const firstLevelDown = divWithHeading.children[0];
      if (!firstLevelDown) return;

      const secondLevelDown = firstLevelDown.children[1];
      if (!secondLevelDown) return;

      // Prüfe, ob bereits ein Button mit der Klasse "save-prompt-button" existiert
      const existingButton = secondLevelDown.querySelector(
        ".save-prompt-button"
      );
      if (existingButton) {
        console.log("Button existiert bereits für:", secondLevelDown.className);
        existingElements.add(secondLevelDown);
        return;
      }

      // Falls wir hier sind, gibt es noch keinen Button
      existingElements.add(secondLevelDown);

      // Button-Element erstellen
      const button = document.createElement("button");
      button.textContent = "Save Prompt";
      button.className = `save-prompt-button save-prompt-button-${index} btn-primary`;

      // Button-Styling
      Object.assign(button.style, {
        padding: "5px 10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        color: "black",
        background: "#f0f0f0",
      });
      button.title = "Speichert den aktuellen Prompt in der Erinnerung.";

      // Hover-Effekte
      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "#e0e0e0";
        button.style.borderColor = "#bbb";
      });
      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "#f0f0f0";
        button.style.borderColor = "#ccc";
      });

      // Klick-Event (optional, analog zum zweiten Beispiel)
      button.addEventListener("click", (event) => {
        if (button.classList.contains("save-prompt-button")) {
          let buttonNumber = index + 1;
          console.log(`Button ${buttonNumber} wurde geklickt.`);

          button.textContent = "✔ Prompt Saved";
          addDuckduckGoButtonClick(buttonNumber); // Übergibt den korrekten Index
          setTimeout(() => {
            button.textContent = "Save Prompt";
          }, 5000);
        }
      });

      // Button als erstes Kind zu secondLevelDown hinzufügen
      secondLevelDown.prepend(button);
      console.log(
        `Button ${buttonCounter} zu ${secondLevelDown.className} hinzugefügt.`
      );
      buttonCounter++;
    });
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Buttons:", error.message);
  }
}
function addPerplexityButton() {
  try {
    let main = document.querySelector(".gap-xl");
    if (!main) throw new Error("Main-Element (.gap-xl) nicht gefunden");
    main = main.parentElement;
    main = main.parentElement;

    let buttonCounter = 1; // Startwert für die Button-Nummerierung
    let existingElements = new Set(); // Set für bereits bearbeitete Elemente

    // Schleife durch alle Kinder des Main-Elements
    for (let i = 1; i < main.children.length; i += 2) {
      let firstElement = main.children[i];
      if (!firstElement) continue;

      let firstLevelDown = firstElement.children[0];
      if (!firstLevelDown) continue;
      firstLevelDown = firstLevelDown.children[0];
      if (!firstLevelDown) continue;
      firstLevelDown = firstLevelDown.children[1];
      if (!firstLevelDown) continue;
      firstLevelDown = firstLevelDown.children[0];
      if (!firstLevelDown) continue;

      // Prüfe die Anzahl der Kinder an der kritischen Stelle
      if (firstLevelDown.children.length > 1) {
        // Mit Webresearch
        firstLevelDown = firstLevelDown.children[2]; // Mehrere Elemente vorhanden, wähle Index 2
      } else {
        // Ohne Websearch
        firstLevelDown = firstLevelDown.children[0]; // Nur ein Element, wähle Index 0
      }
      if (!firstLevelDown) continue;

      // Fortfahren mit dem restlichen Pfad
      firstLevelDown = firstLevelDown.children[0];
      if (!firstLevelDown) continue;
      firstLevelDown = firstLevelDown.children[1];
      if (!firstLevelDown) continue;
      firstLevelDown = firstLevelDown.children[1];
      if (!firstLevelDown) continue;
      firstLevelDown = firstLevelDown.children[1];
      if (!firstLevelDown) continue;

      // Prüfe, ob bereits ein Button mit der Klasse "save-prompt-button" existiert
      const existingButton = firstLevelDown.querySelector(
        ".save-prompt-button"
      );
      if (existingButton) {
        console.log("Button existiert bereits für:", firstLevelDown.className);
        existingElements.add(firstLevelDown);
        continue;
      }

      // Falls wir hier sind, gibt es noch keinen Button
      existingElements.add(firstLevelDown);

      // Button-Element erstellen
      let button = document.createElement("button");
      button.textContent = "Save Prompt";
      button.className = `save-prompt-button save-prompt-button-${i} btn-primary`;

      // Button-Styling
      Object.assign(button.style, {
        padding: "5px 10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        color: "black",
        background: "#f0f0f0",
        fontFamily: "Arial",
      });
      button.title = "Speichert den aktuellen Prompt in der Erinnerung.";

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
        if (button.classList.contains("save-prompt-button")) {
          let buttonNumber = i + 1; // Button-Nummer aus der Schleife berechnen
          console.log(`Button ${buttonNumber} wurde geklickt.`);

          button.textContent = "✔ Prompt Saved";
          // Falls eine Funktion wie addDuckduckGoButtonClick existiert:
          addPerplexityButtonClick(buttonNumber);
          setTimeout(() => {
            button.textContent = "Save Prompt";
          }, 5000);
        }
      });

      // Button einfügen
      firstLevelDown.prepend(button);
      console.log(
        `Button ${buttonCounter} zu ${firstLevelDown.className} hinzugefügt.`
      );
      buttonCounter++; // Zähler erhöhen
    }
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Buttons:", error.message);
  }
}
