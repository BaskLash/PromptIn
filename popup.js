document.addEventListener("DOMContentLoaded", function () {
  const inputField = document.getElementById("inputField");
  const storedMessagesElem = document.getElementById("stored-messages");
  const clearStorageButton = document.getElementById("clear-storage");

  // Display the stored messages
  function displayStoredMessages() {
    chrome.storage.sync.get("enteredValues", function (data) {
      const enteredValues = data.enteredValues || [];
      storedMessagesElem.innerHTML = ""; // Clear existing entries
      enteredValues.forEach(function (value, index) {
        const li = document.createElement("li");
        li.textContent = value;

        // Create edit button
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function () {
          inputField.value = value; // Set input field to the value
          inputField.dataset.index = index; // Store index for editing
        });

        // Create delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function () {
          deleteEntry(index);
        });

        // Create USE button
        const useButton = document.createElement("button");
        useButton.textContent = "Use";
        useButton.addEventListener("click", function () {
          usePrompt(index);
        });

        li.appendChild(editButton);
        li.appendChild(deleteButton);
        li.appendChild(useButton);
        storedMessagesElem.appendChild(li);
      });
    });
  }

  // Store input value when Enter key is pressed
  inputField.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      const inputValue = inputField.value.trim();
      if (inputValue) {
        const index = inputField.dataset.index; // Get index for editing
        if (index !== undefined) {
          // Edit existing entry
          chrome.storage.sync.get("enteredValues", function (data) {
            let enteredValues = data.enteredValues || [];
            enteredValues[index] = inputValue; // Update the value
            chrome.storage.sync.set(
              { enteredValues: enteredValues },
              function () {
                console.log("Value updated:", inputValue);
                displayStoredMessages();
                inputField.value = ""; // Clear the input field
                delete inputField.dataset.index; // Remove index after editing
              }
            );
          });
        } else {
          // Add new entry
          chrome.storage.sync.get("enteredValues", function (data) {
            let enteredValues = data.enteredValues || [];
            enteredValues.push(inputValue);
            chrome.storage.sync.set(
              { enteredValues: enteredValues },
              function () {
                console.log("Value stored:", inputValue);
                displayStoredMessages();
                inputField.value = ""; // Clear the input field
              }
            );
          });
        }
      }
    }
  });

  // Delete entry
  function deleteEntry(index) {
    chrome.storage.sync.get("enteredValues", function (data) {
      let enteredValues = data.enteredValues || [];
      enteredValues.splice(index, 1); // Remove the entry at the specified index
      chrome.storage.sync.set({ enteredValues: enteredValues }, function () {
        console.log("Value deleted at index:", index);
        displayStoredMessages();
      });
    });
  }

  // Use prompt
  function usePrompt(index) {
    chrome.storage.sync.get("enteredValues", function (data) {
      let enteredValues = data.enteredValues || [];

      // Check if the index is valid
      if (index >= 0 && index < enteredValues.length) {
        // Set the value of the input field to the specific entry
        document.querySelector(
          "textarea.ChatInputV2-module__input--B2oNx"
        ).value = enteredValues[index];
      } else {
        console.error("Invalid index:", index);
      }
    });
  }

  // Clear storage when the button is clicked
  clearStorageButton.addEventListener("click", function () {
    chrome.storage.sync.remove("enteredValues", function () {
      storedMessagesElem.innerHTML = "";
      console.log("Storage cleared");
    });
  });

  

  // Initial display of stored messages
  displayStoredMessages();
});
const accordions = document.querySelectorAll('.accordion');

    accordions.forEach(accordion => {
        accordion.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const panel = document.getElementById(targetId);
            if (panel.classList.contains('show')) {
                panel.classList.remove('show');
            } else {
                panel.classList.add('show');
            }
        });
    });