const commandHistory = document.getElementById('commandHistory');
const commandLine = document.getElementById('commandLine');

let commandHistoryList = [];

// CLI Timeline update:
function updateTimelineCLI(command) {
    commandHistoryList.push(command); // Adds the new command to the end of the history array
    const lastFourCommands = commandHistoryList.slice(-4);  // Gets the last 4 elements
    commandHistory.innerHTML = lastFourCommands.join('<br>'); // Updates the display, newest command is at the bottom
}

// Handles CLI input after Enter and Spacebar:
function submitInputCLI(input) { // => command_exec.js
    
    if (input != '') { // If not empty input
        updateTimelineCLI(input);
        input = '';  // Clear the input after the command is entered
        
        // Call command processor here

        return input;
    }
    if (input == '' && commandHistoryList.slice(-1) != '') { // If empty input and there's history
        console.log('repeat last command');
        return commandHistoryList.slice(-1);
    }
    if (input == '' && commandHistoryList.slice(-1) == '') { // If empty input and there's no history
        return '';
    }
}

// Esc functionality:
function handleEsc() {
    commandLine.value = '';
}

// Automatic CLI focus, spacebar handler, esc handler:
document.addEventListener('keydown', function(event) {
    if(event.key === 'Escape') {
        handleEsc();
    }
    if (event.key === ' ') {
        event.preventDefault(); // Prevents ' ' to be inserted into CLI
        commandLine.value = submitInputCLI(commandLine.value);
        return;
    }
    if (document.activeElement !== commandLine) {
        commandLine.focus();
    }
});

// Handles Enter Key:
commandLine.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        this.value = submitInputCLI(this.value);  // Clear the input after the command is entered or fetch last command
        return;
    }
});
