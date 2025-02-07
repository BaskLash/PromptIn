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

// Funktion zum Hinzufügen des Event-Listeners
function addInputListener(input) {
  input.addEventListener("keydown", function (event) {
    // Überprüfen, ob die Enter-Taste gedrückt wurde
    if (event.key === "Enter") {
      const promptedValue = input.value.trim(); // Trim, um Leerzeichen zu entfernen
      if (promptedValue) {
        // Nur speichern, wenn der Wert nicht leer ist
        console.log(promptedValue);

        // Bestehendes Array aus dem Chrome Storage abrufen
        chrome.storage.sync.get("enteredValues", function (data) {
          let enteredValues = data.enteredValues || [];
          // Neuen Wert zum Array hinzufügen
          enteredValues.push(promptedValue);

          // Aktualisiertes Array zurück im Chrome Storage speichern
          chrome.storage.sync.set(
            { enteredValues: enteredValues },
            function () {
              console.log("Value stored:", promptedValue);
            }
          );
        });
      }
    }
  });
}

// Funktion zum Überprüfen und Hinzufügen des Input-Listeners
function checkAndAddInputListener() {
  const inputStartPage = document.querySelector(
    "textarea#copilot-dashboard-entrypoint-textarea"
  );
  const inputOnCopilot = document.querySelector(
    "textarea.ChatInputV2-module__input--B2oNx"
  );

  let input; // Variable für das aktive Input-Element

  // Überprüfen, welches Input-Element existiert und es zuweisen
  if (inputStartPage) {
    input = inputStartPage;
  } else if (inputOnCopilot) {
    input = inputOnCopilot;
  }

  // Sicherstellen, dass das Input-Element existiert
  if (input) {
    addInputListener(input);
  }
}

// MutationObserver einrichten, um DOM-Änderungen zu überwachen
const observer = new MutationObserver(checkAndAddInputListener);

// Observer auf den gesamten Body anwenden
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initiale Überprüfung
checkAndAddInputListener();
