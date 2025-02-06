
// Check if the Enter key has been pressed and store the input value
let input = document.querySelector("textarea.ChatInputV2-module__input--B2oNx");
let promptedValue;
// Ensure the input element exists
if (input) {
    input.addEventListener('keydown', function (event) {
        // Get the input element
        if (event.key === 'Enter') {
            promptedValue = input.value;
            console.log(input.value)
        }
    });
}