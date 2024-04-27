import { GlobalElems, GlobalState } from './global_state.js';

// CLI Timeline update:
function updateTimelineCLI(command) {
    GlobalState.CLIHistoryList.push(command); // Adds the new command to the end of the history array
    const lastFourCommands = GlobalState.CLIHistoryList.slice(-4);  // Gets the last 4 elements
    GlobalElems.CommandHistory.innerHTML = lastFourCommands.join('<br>'); // Updates the display, newest command is at the bottom
}

// Handles CLI input after Enter and Spacebar:
function submitInputCLI(input) { // => command_exec.js
    if (input != '') { // If not empty input
        updateTimelineCLI(input);
        input = '';  // Clear the input after the command is entered
        
        // Call command processor here

        return input;
    }
    if (input == '' && GlobalState.CLIHistoryList.slice(-1) != '') { // If empty input and there's history
        console.log('repeat last command');
        return GlobalState.CLIHistoryList.slice(-1);
    }
    if (input == '' && GlobalState.CLIHistoryList.slice(-1) == '') { // If empty input and there's no history
        return '';
    }
}

// Esc functionality:
function handleEsc() {
    GlobalElems.CommandLine.value = '';

    // Reset command processor from here
    
}

// Automatic CLI focus, spacebar handler, esc handler:
document.addEventListener('keydown', function(event) {
    if(event.key === 'Escape') {
        handleEsc();
    }
    if (event.key === ' ') {
        event.preventDefault(); // Prevents ' ' to be inserted into CLI
        GlobalElems.CommandLine.value = submitInputCLI(GlobalElems.CommandLine.value);
        return;
    }
    if (document.activeElement !== GlobalElems.CommandLine) {
        GlobalElems.CommandLine.focus();
    }
});

// Handles Enter Key:
GlobalElems.CommandLine.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        this.value = submitInputCLI(this.value);  // Clear the input after the command is entered or fetch last command
        return;
    }
});
