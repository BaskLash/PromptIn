function inputFieldTrigger() {
  console.log("inputFieldTrigger is running!");

  // Warte, bis das DOM geladen ist
  document.addEventListener("DOMContentLoaded", () => {
    // Warte zusätzlich 2 Sekunden nach DOM-Laden
    setTimeout(() => {
      const inputField = document.getElementById("prompt-textarea");

      if (!inputField) {
        console.error("Input field with ID 'prompt-textarea' not found.");
        return;
      }

      if (!document.body) {
        console.error("Document body is not available.");
        return;
      }

      const dropdown = document.createElement("div");
      dropdown.id = "dropdown";
      dropdown.style.position = "absolute";
      dropdown.style.backgroundColor = "white";
      dropdown.style.color = "#333";
      dropdown.style.border = "1px solid #ddd";
      dropdown.style.borderRadius = "8px";
      dropdown.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.15)";
      dropdown.style.width = "400px";
      dropdown.style.maxHeight = "300px";
      dropdown.style.overflow = "hidden";
      dropdown.style.display = "none";
      dropdown.style.zIndex = "10000";
      dropdown.style.display = "flex";
      dropdown.style.flexDirection = "row";
      dropdown.style.fontFamily = "Segoe UI, sans-serif";
      dropdown.style.backdropFilter = "blur(6px)";
      dropdown.style.opacity = "0";
      dropdown.style.transform = "translateY(10px)";
      dropdown.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      document.body.appendChild(dropdown);

      // Left nav panel
      const navPanel = document.createElement("div");
      navPanel.style.width = "150px";
      navPanel.style.borderRight = "1px solid #eee";
      navPanel.style.padding = "10px";
      navPanel.style.backgroundColor = "#fafafa";
      navPanel.style.overflowY = "auto";
      dropdown.appendChild(navPanel);

      // Right content panel
      const contentPanel = document.createElement("div");
      contentPanel.style.flex = "1";
      contentPanel.style.padding = "10px";
      contentPanel.style.overflowY = "auto";
      dropdown.appendChild(contentPanel);

      const categories = {
        Favorites: ["Starred Item 1", "Starred Item 2"],
        All: ["Option 1", "Option 2", "Option 3", "Option 4"],
        Tools: ["Tool A", "Tool B"],
        Settings: ["Setting X", "Setting Y"],
      };

      Object.keys(categories).forEach((category) => {
        const navItem = document.createElement("div");
        navItem.textContent = category;
        navItem.style.padding = "10px";
        navItem.style.cursor = "pointer";
        navItem.style.borderRadius = "4px";
        navItem.style.transition =
          "background-color 0.2s ease, font-weight 0.2s ease";
        navItem.className = "nav-item";

        navItem.addEventListener("mouseover", () => {
          navItem.style.backgroundColor = "#f0f0f0";
        });

        navItem.addEventListener("mouseout", () => {
          if (!navItem.classList.contains("active")) {
            navItem.style.backgroundColor = "transparent";
          }
        });

        navItem.addEventListener("click", () => {
          document.querySelectorAll(".nav-item").forEach((item) => {
            item.classList.remove("active");
            item.style.fontWeight = "normal";
            item.style.backgroundColor = "transparent";
          });

          navItem.classList.add("active");
          navItem.style.fontWeight = "bold";
          navItem.style.backgroundColor = "#e3e3e3";

          contentPanel.innerHTML = "";
          categories[category].forEach((itemText) => {
            const contentItem = document.createElement("div");
            contentItem.textContent = itemText;
            contentItem.style.padding = "10px";
            contentItem.style.cursor = "pointer";
            contentItem.style.borderRadius = "4px";
            contentItem.style.transition = "background-color 0.2s ease";
            contentItem.className = "dropdown-item";

            contentItem.addEventListener("mouseover", () => {
              contentItem.style.backgroundColor = "#f8f8f8";
            });

            contentItem.addEventListener("mouseout", () => {
              contentItem.style.backgroundColor = "white";
            });

            contentItem.addEventListener("click", () => {
              inputField.innerText = itemText;
              dropdown.style.display = "none";
            });

            contentPanel.appendChild(contentItem);
          });
        });

        navPanel.appendChild(navItem);
      });

      // Select first category by default
      const firstNavItem = navPanel.querySelector(".nav-item");
      if (firstNavItem) {
        firstNavItem.click();
      }

      inputField.addEventListener("keyup", function (e) {
        if (e.key === "/") {
          const rect = inputField.getBoundingClientRect();
          dropdown.style.display = "flex";
          dropdown.style.top = `${rect.bottom + window.scrollY + 2}px`;
          dropdown.style.left = `${rect.left + window.scrollX}px`;

          const dropdownRect = dropdown.getBoundingClientRect();
          if (dropdownRect.right > window.innerWidth) {
            dropdown.style.left = `${
              window.innerWidth - dropdownRect.width + window.scrollX - 10
            }px`;
          }

          // Animate in
          requestAnimationFrame(() => {
            dropdown.style.opacity = "1";
            dropdown.style.transform = "translateY(0)";
          });
        }

        if (e.key === "Escape") {
          dropdown.style.opacity = "0";
          dropdown.style.transform = "translateY(10px)";
          setTimeout(() => {
            dropdown.style.display = "none";
          }, 300);
        }

        if (!inputField.innerText.includes("/")) {
          dropdown.style.opacity = "0";
          dropdown.style.transform = "translateY(10px)";
          setTimeout(() => {
            dropdown.style.display = "none";
          }, 300);
        }
      });

      // Adjust on resize
      window.addEventListener("resize", () => {
        if (dropdown.style.display === "flex") {
          const rect = inputField.getBoundingClientRect();
          dropdown.style.top = `${rect.bottom + window.scrollY + 2}px`;
          dropdown.style.left = `${rect.left + window.scrollX}px`;
        }
      });

      // Adjust on scroll
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
