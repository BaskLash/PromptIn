// Store the message in Chrome storage
chrome.storage.sync.set({ message: "Hello, World!" }, function() {
    console.log(message);
});