// Get the textarea element
//const input = document.querySelector("textarea.ChatInputV2-module__input--B2oNx");
//const input = document.querySelector(".Layout-module__chatInputContainer--DXrKy")
const input = document.getElementById("copilot-chat-textarea-preview");

// Check if the Enter key has been pressed and show an alert
input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        chrome.storage.sync.set({ entered: input.value }, function() {
            console.log(message);
        });
    }
});