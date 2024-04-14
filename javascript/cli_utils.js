const commandHistory = document.getElementById('commandHistory');
const commandLine = document.getElementById('commandLine');

let commandHistoryList = [];

// Handles CLI input after Enter and Spacebar:
function handleCommandCLI(input) {
    // If not empty input:
    if (input != '') {
        updateTimelineCLI(input);
        input = '';  // Clear the input after the command is entered
        return input;
    }
    if (input == '' && commandHistoryList.slice(-1) != '') {
        console.log('repeat last command');
        return commandHistoryList.slice(-1);
    }
    if (input == '' && commandHistoryList.slice(-1) == '') {
        return '';
    }

}

// CLI Timeline update:
function updateTimelineCLI(command) {
    commandHistoryList.push(command); // Adds the new command to the end of the history array
    const lastFourCommands = commandHistoryList.slice(-4);  // Gets the last 4 elements
    commandHistory.innerHTML = lastFourCommands.join('<br>'); // Updates the display, newest command is at the bottom
}

// Automatic CLI focus, spacebar handler:
document.addEventListener('keydown', function(event) {
    if (event.key === ' ') {
        event.preventDefault(); // Prevents ' ' to be inserted into CLI
        commandLine.value = handleCommandCLI(commandLine.value);
        return;
    }
    if (document.activeElement !== commandLine) {
        commandLine.focus();
    }
});

// Handles Enter Key:
commandLine.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        this.value = handleCommandCLI(this.value);  // Clear the input after the command is entered
        return;
    }
});
