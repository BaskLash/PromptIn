function inputFieldTrigger() {
  console.log("inputFieldTrigger is running!");

  // Warte, bis das DOM geladen ist
  document.addEventListener("DOMContentLoaded", () => {
    // Warte zusätzlich 2 Sekunden nach DOM-Laden
    setTimeout(() => {
      const inputField = document.getElementById("prompt-textarea");

      // Prüfe, ob inputField existiert
      if (!inputField) {
        console.error("Input field with ID 'prompt-textarea' not found.");
        return;
      }

      // Prüfe, ob document.body existiert
      if (!document.body) {
        console.error("Document body is not available.");
        return;
      }

      const dropdown = document.createElement("div");
      dropdown.id = "dropdown";
      dropdown.style.position = "absolute";
      dropdown.style.backgroundColor = "white";
      dropdown.style.color = "black";
      dropdown.style.border = "1px solid #ccc";
      dropdown.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
      dropdown.style.width = "400px";
      dropdown.style.maxHeight = "300px";
      dropdown.style.overflowY = "auto";
      dropdown.style.display = "none";
      dropdown.style.zIndex = "10000"; // Höherer zIndex für Chrome-Erweiterung
      dropdown.style.display = "flex";
      dropdown.style.flexDirection = "row";
      document.body.appendChild(dropdown);

      // Create navigation panel (left side)
      const navPanel = document.createElement("div");
      navPanel.style.width = "150px";
      navPanel.style.borderRight = "1px solid #ccc";
      navPanel.style.padding = "10px";
      navPanel.style.backgroundColor = "#f9f9f9";
      navPanel.style.overflowY = "auto";
      dropdown.appendChild(navPanel);

      // Create content panel (right side)
      const contentPanel = document.createElement("div");
      contentPanel.style.flex = "1";
      contentPanel.style.padding = "10px";
      contentPanel.style.overflowY = "auto";
      dropdown.appendChild(contentPanel);

      // Define categories and their items
      const categories = {
        Favorites: ["Starred Item 1", "Starred Item 2"],
        All: ["Option 1", "Option 2", "Option 3", "Option 4"],
        Tools: ["Tool A", "Tool B"],
        Settings: ["Setting X", "Setting Y"],
      };

      // Create navigation items
      Object.keys(categories).forEach((category) => {
        const navItem = document.createElement("div");
        navItem.textContent = category;
        navItem.style.padding = "10px";
        navItem.style.cursor = "pointer";
        navItem.className = "nav-item";
        navItem.addEventListener("mouseover", () => {
          navItem.style.backgroundColor = "#e0e0e0";
        });
        navItem.addEventListener("mouseout", () => {
          navItem.style.backgroundColor = "transparent";
        });
        navItem.addEventListener("click", () => {
          // Highlight selected nav item
          document.querySelectorAll(".nav-item").forEach((item) => {
            item.style.fontWeight = "normal";
            item.style.backgroundColor = "transparent";
          });
          navItem.style.fontWeight = "bold";
          navItem.style.backgroundColor = "#d0d0d0";

          // Update content panel
          contentPanel.innerHTML = "";
          categories[category].forEach((itemText) => {
            const contentItem = document.createElement("div");
            contentItem.textContent = itemText;
            contentItem.style.padding = "10px";
            contentItem.style.cursor = "pointer";
            contentItem.className = "dropdown-item";
            contentItem.addEventListener("mouseover", () => {
              contentItem.style.backgroundColor = "#f0f0f0";
            });
            contentItem.addEventListener("mouseout", () => {
              contentItem.style.backgroundColor = "white";
            });
            contentPanel.appendChild(contentItem);
          });
        });
        navPanel.appendChild(navItem);
      });

      // Initialize with first category selected
      if (Object.keys(categories).length > 0) {
        const firstNavItem = navPanel.querySelector(".nav-item");
        if (firstNavItem) {
          firstNavItem.click(); // Simulate click to load first category
        }
      }

      inputField.addEventListener("keyup", function (e) {
        // Zeige das Dropdown bei Eingabe von "/"
        if (e.key === "/") {
          const rect = inputField.getBoundingClientRect();
          dropdown.style.display = "flex";
          dropdown.style.top = `${rect.bottom + window.scrollY + 2}px`; // Kleiner Abstand
          dropdown.style.left = `${rect.left + window.scrollX}px`;
          // Sicherstellen, dass das Dropdown im sichtbaren Bereich bleibt
          const dropdownRect = dropdown.getBoundingClientRect();
          if (dropdownRect.right > window.innerWidth) {
            dropdown.style.left = `${
              window.innerWidth - dropdownRect.width + window.scrollX - 10
            }px`;
          }
        }

        // Verstecke das Fenster, wenn Escape gedrückt wird
        if (e.key === "Escape") {
          dropdown.style.display = "none";
        }

        // Überprüfe, ob "/" im Eingabefeld vorhanden ist
        if (!inputField.innerText.includes("/")) {
          dropdown.style.display = "none";
        }
      });

      // Klick auf Dropdown-Item
      dropdown.addEventListener("click", (e) => {
        if (e.target.classList.contains("dropdown-item")) {
          inputField.innerText = e.target.textContent;
          dropdown.style.display = "none";
        }
      });

      // Bei Größenänderung des Fensters repositionieren
      window.addEventListener("resize", () => {
        if (dropdown.style.display === "flex") {
          const rect = inputField.getBoundingClientRect();
          dropdown.style.top = `${rect.bottom + window.scrollY + 2}px`;
          dropdown.style.left = `${rect.left + window.scrollX}px`;
          const dropdownRect = dropdown.getBoundingClientRect();
          if (dropdownRect.right > window.innerWidth) {
            dropdown.style.left = `${
              window.innerWidth - dropdownRect.width + window.scrollX - 10
            }px`;
          }
        }
      });

      // Bei Scroll repositionieren
      window.addEventListener("scroll", () => {
        if (dropdown.style.display === "flex") {
          const rect = inputField.getBoundingClientRect();
          dropdown.style.top = `${rect.bottom + window.scrollY + 2}px`;
          dropdown.style.left = `${rect.left + window.scrollX}px`;
        }
      });

      /* Plus Button */
      // Ziel-Element auswählen
      const container = document.querySelector(
        "[data-testid='composer-footer-actions']"
      );

      // Neuen Button erstellen
      const button = document.createElement("button");
      button.textContent = "+"; // "+" Zeichen
      button.style.width = "40px";
      button.style.height = "40px";
      button.style.borderRadius = "50%";
      button.style.backgroundColor = "white";
      button.style.color = "black";
      button.style.border = "none";
      button.style.cursor = "pointer";
      button.style.fontSize = "24px";
      button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      button.style.transition = "box-shadow 0.3s ease";
      button.style.display = "flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";

      // Hover-Effekt mit JavaScript (alternativ ginge auch per CSS-Klasse)
      button.addEventListener("mouseover", () => {
        button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
      });
      button.addEventListener("mouseout", () => {
        button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      });

      // Button dem Container hinzufügen
      container.appendChild(button);
    }, 2000); // 2 Sekunden Verzögerung
  });
}
