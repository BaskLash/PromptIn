// Get the textarea element
// selector for entrypoint on github.com/copilot
const input = document.querySelector("textarea.ChatInputV2-module__input--B2oNx")
// selector for entrypoint on github.com
//const input = document.getElementById("copilot-dashboard-entrypoint-textarea");

// Ensure the input element exists
if (input) {
    input.addEventListener('keydown', function(event) {
        // Check if the Enter key has been pressed
        if (event.key === 'Enter') {
            const promptedValue = input.value;
            console.log(promptedValue);

            // Retrieve the existing array from Chrome storage
            chrome.storage.sync.get('enteredValues', function(data) {
                let enteredValues = data.enteredValues || [];
                // Push the new value to the array
                enteredValues.push(promptedValue);

                // Store the updated array back in Chrome storage
                chrome.storage.sync.set({ enteredValues: enteredValues }, function() {
                    console.log('Value stored:', promptedValue);
                });
            });
        }
    });
}