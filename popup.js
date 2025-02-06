document.addEventListener('DOMContentLoaded', function() {
    const storedMessagesElem = document.getElementById('stored-messages');
    const clearStorageButton = document.getElementById('clear-storage');

    // Display the stored messages
    chrome.storage.sync.get('enteredValues', function(data) {
        const enteredValues = data.enteredValues || [];
        enteredValues.forEach(function(value) {
            const li = document.createElement('li');
            li.textContent = value;
            storedMessagesElem.appendChild(li);
        });
    });

    // Clear storage when the button is clicked
    clearStorageButton.addEventListener('click', function() {
        chrome.storage.sync.remove('enteredValues', function() {
            storedMessagesElem.innerHTML = '';
            console.log('Storage cleared');
        });
    });
});