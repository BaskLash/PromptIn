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

            copilotButtonClick(buttonNumber);
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
  try {
    console.log("Inside addChatGPTButton");

    const articleElements = document.querySelectorAll(
      "article[data-testid^='conversation-turn-']"
    );
    if (articleElements.length === 0) {
      throw new Error(
        "Keine Artikel mit data-testid 'conversation-turn-*' gefunden."
      );
    }

    let buttonCounter = 1; // Nummerierung nur für eingefügte Buttons

    articleElements.forEach((articleElement, index) => {
      // Nur jeden zweiten Turn ab dem ersten (Index 1, 3, 5, …)
      if (index % 2 === 1) {
        const targetDiv = articleElement.querySelector(
          ".text-token-text-secondary[data-testid='copy-turn-action-button'], " +
            ".text-token-text-secondary[data-testid='good-response-turn-action-button'], " +
            ".text-token-text-secondary[data-testid='bad-response-turn-action-button']"
        );

        if (targetDiv) {
          const parent = targetDiv.parentElement;

          // Prüfen, ob der Button schon existiert
          if (!parent.querySelector(".save-prompt-button")) {
            const button = document.createElement("button");
            button.textContent = "Save Prompt";
            button.className = `save-prompt-button save-prompt-button-${buttonCounter} btn-primary`;

            // Styling
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
            button.addEventListener("click", () => {
              console.log(`Button ${buttonCounter} wurde geklickt.`);
              chatGPTButtonClick(index);
            });

            // Einfügen
            parent.appendChild(button);
            console.log(
              `Button ${buttonCounter} zu Turn ${index} hinzugefügt.`
            );
            buttonCounter++;
          }
        }
      }
    });
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Buttons:", error.message);
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

          blackboxButtonClick();
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

          grokButtonClick(buttonNumber);
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

                geminiButtonClick(buttonNumber);
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

function addV0DevButton() {
  try {
    let startElement = document.querySelector(".group\\/message-list");
    if (!startElement) throw new Error("Message-List-Element nicht gefunden");

    startElement = startElement.children[0];
    if (!startElement) throw new Error("Erstes Kind-Element nicht gefunden");

    let buttonCounter = 1; // Startwert für die Button-Nummerierung
    let existingElements = new Set(); // Set für bereits bearbeitete Elemente

    function addButtons() {
      for (let i = 0; i < startElement.children.length; i += 2) {
        let childElement = startElement.children[i];
        if (!childElement) continue;

        const allCandidates = childElement.querySelectorAll(
          "div.items-center.gap-1.flex"
        );

        for (const candidate of allCandidates) {
          const classList = Array.from(candidate.classList).sort();
          if (
            classList.length === 3 &&
            classList.includes("items-center") &&
            classList.includes("gap-1") &&
            classList.includes("flex")
          ) {
            // Prüfe auf doppelte Buttons und entferne sie
            const existingButtons = candidate.querySelectorAll(
              ".save-prompt-button"
            );
            if (existingButtons.length > 1) {
              for (let j = 1; j < existingButtons.length; j++) {
                existingButtons[j].remove();
                // console.log("Überflüssiger Button entfernt.");
              }
            }

            // Prüfe, ob ein Button existiert
            const existingButton = candidate.querySelector(
              ".save-prompt-button"
            );
            if (existingButton) {
              // console.log("Button existiert bereits für:", candidate.className);
              existingElements.add(candidate);
              continue;
            }

            existingElements.add(candidate);

            const newButton = document.createElement("button");
            newButton.textContent = "Save Prompt";
            newButton.className = `save-prompt-button save-prompt-button-${i} btn-primary`;

            Object.assign(newButton.style, {
              padding: "5px 10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              color: "black",
              background: "#f0f0f0",
            });
            newButton.title =
              "Speichert den aktuellen Prompt in der Erinnerung.";

            newButton.addEventListener("mouseover", () => {
              newButton.style.backgroundColor = "#e0e0e0";
              newButton.style.borderColor = "#bbb";
            });
            newButton.addEventListener("mouseout", () => {
              newButton.style.backgroundColor = "#f0f0f0";
              newButton.style.borderColor = "#ccc";
            });

            newButton.addEventListener("click", () => {
              if (newButton.classList.contains("save-prompt-button")) {
                let buttonNumber = i + 1;
                // console.log(`Button ${buttonNumber} wurde geklickt.`);

                addV0ButtonClick(buttonNumber);
              }
            });

            candidate.appendChild(newButton);
            // console.log(
            //   `Button ${buttonCounter} zu ${candidate.className} hinzugefügt`
            // );
            buttonCounter++;
          }
        }
      }
    }

    // Initiale Ausführung
    addButtons();

    // MutationObserver einrichten
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length || mutation.removedNodes.length) {
          // console.log("DOM-Änderung erkannt, füge Buttons erneut hinzu...");
          addButtons();
        }
      });
    });

    // Beobachte Änderungen im startElement und seinen Nachkommen
    observer.observe(startElement, {
      childList: true,
      subtree: true,
    });
  } catch (error) {
    // console.error("Fehler beim Hinzufügen der Buttons:", error.message);
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

          claudeButtonClick(buttonNumber);
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
        const clickedButton = event.target;
        const match = clickedButton.className.match(/save-prompt-button-(\d+)/);
        if (match) {
          const buttonNumber = parseInt(match[1], 10);
          console.log(`Button ${buttonNumber} wurde geklickt.`);

          addMicrosoftCopilotButtonClick(buttonNumber); // Übergibt den korrekten Index
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
        cursor: "pointer",
        background: "#f0f0f0",
      });
      newButton.title =
        "If you liked the answer, save the prompt that generated it directly to your memory.";

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

          addMistralButtonClick(buttonNumber); // Übergibt den korrekten Index
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
    let container = document.getElementById("react-layout");
    if (!container) throw new Error("React-Layout-Element nicht gefunden");

    // Finde den äußeren Container
    container = container.querySelector(
      "section.Z25pZbqDDnGMxZx706Ne.U6SIOwl59r4JrXnL_Bic"
    );
    if (!container) throw new Error("Äußerer Container nicht gefunden");

    // Finde den spezifischen inneren Container
    container = container.querySelector(".e8hNVcv2hNmgdRTcd0UO");
    if (!container) throw new Error("Innerer Container nicht gefunden");

    let buttonCounter = 1; // Startwert für die Button-Nummerierung
    let existingElements = new Set(); // Set für bereits bearbeitete Elemente

    // Iteriere durch jedes Kind-Element
    Array.from(container.children).forEach((child, index) => {
      // Suche nach einem Element mit einer ID, die "heading" enthält
      const headingElement = child.querySelector('[id*="heading"]');
      if (!headingElement) {
        console.log(`Kein Heading-Element in Kind ${index} gefunden`);
        return;
      }

      const parent = headingElement.parentElement;
      if (!parent) {
        console.log(
          `Kein Eltern-Element für Heading in Kind ${index} gefunden`
        );
        return;
      }

      // Prüfe, ob bereits ein Button mit der Klasse "save-prompt-button" existiert
      const existingButton = parent.querySelector(".save-prompt-button");
      if (existingButton) {
        console.log("Button existiert bereits für:", parent.className);
        existingElements.add(parent);
        return;
      }

      // Falls wir hier sind, gibt es noch keinen Button
      existingElements.add(parent);

      // Erstelle und konfiguriere den Button
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
        marginLeft: "10px", // Original-Styling beibehalten
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
          let buttonNumber = index + 1; // Button-Nummer aus dem Index berechnen
          console.log(`Button ${buttonNumber} wurde geklickt.`);

          // Original-Logik angepasst, falls eine Funktion wie addDuckDuckGoButtonClick existiert:
          // console.log(
          //   "Prompt saved (child " + index + "):",
          //   child.textContent.trim()
          // );
          addDuckDuckGoButtonClick(buttonNumber);
        }
      });

      // Button an das Eltern-Element anhängen
      parent.appendChild(button);
      console.log(`Button ${buttonCounter} zu ${parent.className} hinzugefügt`);
      buttonCounter++; // Zähler erhöhen
    });
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Buttons:", error.message);
  }
}

function addPerplexityButton() {
  try {
    const container = document.querySelector(".scrollable-container");
    if (!container) throw new Error("Scrollable container nicht gefunden");

    const divElement = container.querySelector("div[class='']");
    if (!divElement)
      throw new Error("Div-Element mit leerer Klasse nicht gefunden");

    // Hole nur die direkten Kind-Elemente von divElement und wandle sie in ein Array um
    const divChildren = Array.from(divElement.children);

    let buttonCounter = 1; // Startwert für die Button-Nummerierung
    let existingElements = new Set(); // Set für bereits bearbeitete Elemente

    divChildren.forEach((child, index) => {
      // Prüfe, ob dieses Kind-Element ein optionBar enthält
      const optionBar = child.querySelector(".-ml-sm");
      if (!optionBar) {
        console.log("Kein optionBar in diesem Kind-Element gefunden:", child);
        return;
      }

      // Prüfe, ob bereits ein Button mit der Klasse "save-prompt-button" existiert
      const existingButton = optionBar.querySelector(".save-prompt-button");
      if (existingButton) {
        console.log("Button existiert bereits für:", optionBar.className);
        existingElements.add(optionBar);
        return;
      }

      // Falls wir hier sind, gibt es noch keinen Button
      existingElements.add(optionBar);

      // Erstelle einen neuen Button für jedes optionBar
      const button = document.createElement("button");
      button.textContent = "Save Prompt";
      button.className = `save-prompt-button save-prompt-button-${index} btn-primary`;

      // Button-Styling
      Object.assign(button.style, {
        padding: "5px 10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        color: "black",
        fontFamily: "Arial",
        background: "#f0f0f0",
        margin: "5px",
      });
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
        if (button.classList.contains("save-prompt-button")) {
          let buttonNumber = index + 1; // Button-Nummer aus dem Index berechnen
          console.log(`Button ${buttonNumber} wurde geklickt.`);

          addPerplexityButtonClick(buttonNumber);
        }
      });

      // Füge den Button zu optionBar hinzu
      optionBar.appendChild(button);
      console.log(
        `Button ${buttonCounter} zu ${optionBar.className} hinzugefügt`
      );
      buttonCounter++; // Zähler erhöhen
    });
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Buttons:", error.message);
  }
}
function addDeepSeekButton() {
  try {
    // Für Content Zugriff des Anwenders selbst
    const root = document.getElementById("root");
    if (!root) throw new Error("Root-Element nicht gefunden");

    let stage = root;
    const pathToElement = [0, 1, 1, 0, 1, 0, 0, 0]; // Pfad zu dem gewünschten Element

    // Durch den Pfad navigieren
    for (let i = 0; i < pathToElement.length; i++) {
      if (stage && stage.children && stage.children[pathToElement[i]]) {
        stage = stage.children[pathToElement[i]];
        console.log(
          `Element ${i + 1}:`,
          stage.tagName,
          "Klasse:",
          stage.className
        );
      } else {
        throw new Error(`Element ${i + 1} nicht gefunden`);
      }
    }

    if (!stage) throw new Error("Finales Element nicht gefunden");

    console.log("Finales Element:", stage.tagName, "Klasse:", stage.className);

    let buttonCounter = 1; // Startwert für die Button-Nummerierung
    let existingElements = new Set(); // Set für bereits bearbeitete Elemente

    // Durch jedes children-Element des finalen Elements iterieren
    const children = stage.children;
    for (let i = 0; i < children.length; i++) {
      // Überprüfen, ob es sich um jedes zweite Element handelt
      if ((i + 1) % 2 === 0) {
        const child = children[i];
        if (!child) continue;

        let optionStage = child.children[2];
        if (!optionStage) continue;
        optionStage = optionStage.children[0];
        if (!optionStage) continue;

        // Prüfe, ob bereits ein Button mit der Klasse "save-prompt-button" existiert
        const existingButton = optionStage.querySelector(".save-prompt-button");
        if (existingButton) {
          console.log("Button existiert bereits für:", optionStage.className);
          existingElements.add(optionStage);
          continue;
        }

        // Falls wir hier sind, gibt es noch keinen Button
        existingElements.add(optionStage);

        // Button erstellen
        const button = document.createElement("button");
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
          cursor: "pointer",
        });
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
          if (button.classList.contains("save-prompt-button")) {
            let buttonNumber = i + 1; // Button-Nummer aus der Schleife berechnen
            console.log(`Button ${buttonNumber} wurde geklickt.`);

            addDeepSeekButtonClick(buttonNumber);
          }
        });

        // Button zum aktuellen optionStage-Element hinzufügen
        optionStage.appendChild(button);
        console.log(
          `Button ${buttonCounter} zu ${optionStage.className} hinzugefügt`
        );
        buttonCounter++; // Zähler erhöhen
      }
    }
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Buttons:", error.message);
  }
}
function addDeepaiButton() {
  try {
    const form = document.querySelector("form");
    if (!form) throw new Error("Kein Formular auf der Seite gefunden");

    let buttonCounter = 1;
    let existingElements = new Set();

    Array.from(form.children).forEach((child, index) => {
      if (child.classList.contains("outputBox")) {
        const chatOptionsBox = child.querySelector(".optionsBox");
        if (!chatOptionsBox) {
          console.warn("Keine .optionsBox in .outputBox gefunden", child);
          return;
        }

        const existingButton = chatOptionsBox.querySelector(
          ".save-prompt-button"
        );
        if (existingButton) {
          console.log(
            "Button existiert bereits für:",
            chatOptionsBox.className
          );
          existingElements.add(chatOptionsBox);
          return;
        }

        existingElements.add(chatOptionsBox);

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save Prompt";
        saveButton.className = `save-prompt-button save-prompt-button-${index} btn-primary`;

        Object.assign(saveButton.style, {
          padding: "5px 10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
          color: "black",
          background: "#f0f0f0",
          marginRight: "8px",
        });
        saveButton.title = "Speichert den aktuellen Prompt in der Erinnerung.";

        saveButton.addEventListener("mouseover", () => {
          saveButton.style.backgroundColor = "#e0e0e0";
          saveButton.style.borderColor = "#bbb";
        });
        saveButton.addEventListener("mouseout", () => {
          saveButton.style.backgroundColor = "#f0f0f0";
          saveButton.style.borderColor = "#ccc";
        });

        saveButton.addEventListener("click", (event) => {
          event.stopPropagation(); // Verhindert, dass das Ereignis an Eltern-Elemente weitergeleitet wird
          event.preventDefault(); // Verhindert Standard-Browser-Verhalten
          if (saveButton.classList.contains("save-prompt-button")) {
            let buttonNumber = index + 1;
            console.log(`Button ${buttonNumber} wurde geklickt.`);

            addDeepAIButtonClick(buttonNumber);
          }
        });

        chatOptionsBox.insertBefore(saveButton, chatOptionsBox.firstChild);
        console.log(
          `Button ${buttonCounter} zu ${chatOptionsBox.className} hinzugefügt`
        );
        buttonCounter++;
      }
    });
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Buttons:", error.message);
  }
}
function addQwenAiButton() {
  try {
    const container = document.getElementById("chat-message-container");

    if (!container) {
      console.warn("No container found with ID 'chat-message-container'.");
      return;
    }

    const children = Array.from(container.children);
    let buttonCounter = 1; // Startwert für die Button-Nummerierung
    let existingElements = new Set();

    children.forEach((child, index) => {
      // Only target every second child starting at index 1 (i.e., 1, 3, 5, ...)
      if (index % 2 !== 1) return;

      const messageWrapper = child.querySelector(".message-footer-buttons");
      if (!messageWrapper) {
        console.warn(
          `No '.message-footer-buttons' element found in child ${index}.`
        );
        return;
      }

      // Prüfe, ob bereits ein Button mit der Klasse "save-prompt-button" existiert
      const existingButton = messageWrapper.querySelector(
        ".save-prompt-button"
      );
      if (existingButton) {
        console.log("Button existiert bereits für:", messageWrapper.className);
        existingElements.add(messageWrapper);
        return;
      }

      // Falls wir hier sind, gibt es noch keinen Button
      existingElements.add(messageWrapper);

      // Erstelle das neue Button-Element
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
        marginLeft: "10px",
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
          let buttonNumber = index + 1; // Button-Nummer aus der Klasse berechnen
          // console.log(`Button ${buttonNumber} wurde geklickt.`);

          // Text auf "✔ Prompt gespeichert" setzen

          addQwenAiButtonClick(buttonNumber);
          // console.log(`Saving prompt for button ${buttonNumber}`);
        }
      });

      // Button einfügen
      messageWrapper.appendChild(button);
      // console.log(
      //   `Button ${buttonCounter} zu ${messageWrapper.className} hinzugefügt.`
      // );
      buttonCounter++; // Zähler erhöhen
    });
  } catch (error) {
    // console.error("Fehler in addQwenButtons:", error.message);
  }
}
