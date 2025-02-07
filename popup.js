document.addEventListener('DOMContentLoaded', function() {
    const inputField = document.getElementById('inputField');
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

    // Store input value when Enter key is pressed
    inputField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const inputValue = inputField.value;
            chrome.storage.sync.get('enteredValues', function(data) {
                let enteredValues = data.enteredValues || [];
                enteredValues.push(inputValue);

                chrome.storage.sync.set({ enteredValues: enteredValues }, function() {
                    console.log('Value stored:', inputValue);
                    const li = document.createElement('li');
                    li.textContent = inputValue;
                    storedMessagesElem.appendChild(li);
                    inputField.value = ''; // Clear the input field
                });
            });
        }
    });

    // Clear storage when the button is clicked
    clearStorageButton.addEventListener('click', function() {
        chrome.storage.sync.remove('enteredValues', function() {
            storedMessagesElem.innerHTML = '';
            console.log('Storage cleared');
        });
    });
});