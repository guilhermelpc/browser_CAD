import { GlobalElems, GlobalState } from './global_state.js';
import { processInput } from './command_exec.js';

// CLI Timeline update - adds its argument to the CLI's timeline:
export function updateTimelineCLI(cmdString) {
    GlobalState.CLITimeline.push(cmdString); // Adds the new command to the end of the history array

    const lastFourCommands = GlobalState.CLITimeline.slice(-4);  // Gets the last 4 elements
    GlobalElems.CLIHistory.innerHTML = lastFourCommands.join('<br>'); // Updates the display, newest command is at the bottom
}

// Handles CLI input after Enter or Spacebar:
function submitInputCLI(inputString) { // => command_exec.js
    if (inputString != '') { // If not empty input
        try {
            processInput(inputString);
        } catch (error) {
            console.log(`err ${error}`);
            console.log(error.message);
        }
        inputString = '';  // Clear the input after the command is entered
        return '';
    }
    if (inputString == '' && GlobalState.LastSuccessfulCmd) { // If empty input and there's history
        console.log('repeat last command');
        submitInputCLI(GlobalState.LastSuccessfulCmd);
        return '';
    }
    if (inputString == '' && !GlobalState.LastSuccessfulCmd) { // If empty input and there's no history
        return '';
    }
    return '';
}

// Esc functionality:
function handleEsc() {
    GlobalElems.CommandLine.value = '';
    if (GlobalState.PendingCommand) {
        GlobalState.ExecutionHistory.undo();
    }
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

    const isUndo = (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey);
    const isRedo = (event.key === 'y' && (event.ctrlKey || event.metaKey)) || (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey);

    if (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        GlobalState.ExecutionHistory.undo();
        event.preventDefault(); // Prevent the default browser action
    } else if ((event.key === 'y' && (event.ctrlKey || event.metaKey)) || (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey)) {
        GlobalState.ExecutionHistory.redo();
        event.preventDefault(); // Prevent the default browser action
    }

});

// Handles Enter Key:
GlobalElems.CommandLine.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        this.value = submitInputCLI(this.value);  // Clear the input after the command is entered or fetch last command
        return;
    }
});