import { GlobalElems, GlobalState } from './global_state.js';
import { processInput } from './command_exec.js';

// CLI Timeline update - adds its argument to the CLI's timeline:
export function updateTimelineCLI(cmdString) {
    GlobalState.CLITimeline.push(cmdString); // Adds the new command to the end of the history array
    GlobalElems.CLIHistory.innerHTML = GlobalState.CLITimeline.slice(-4).join('<br>'); // Updates CLI history, newest command at the bottom
}

// Handles CLI input after Enter or Spacebar:
function submitInputCLI(inputString) { // => command_exec.js
    GlobalElems.CommandLine.value = '';
    if (inputString != '') { // If not empty input
        try {
            processInput(inputString);
        } catch (error) {
            console.log(`err ${error}`);
            console.log(error.message);
        }
        return;  // Clear the input after the command is entered
    }
    if (inputString == '' && GlobalState.LastSuccessfulCmd) { // If empty input and there's command history
        console.log('repeat last command');
        submitInputCLI(GlobalState.LastSuccessfulCmd);
        return;
    }
    if (inputString == '' && !GlobalState.LastSuccessfulCmd) { // If empty input and there's no history
        return;
    }
    return;
}

// Esc functionality:
function handleEsc() {
    GlobalElems.CommandLine.value = '';
    GlobalElems.CliPrefix.value = '';
    if (GlobalState.PendingCommand) {
        GlobalState.ExecutionHistory.undo();
    }
    unselectShapes();
}

// Automatic CLI focus, spacebar handler, esc handler:
document.addEventListener('keydown', function(event) {
    if(event.key === 'Escape') {
        handleEsc();
    }
    if (event.key === ' ') {
        event.preventDefault(); // Prevents ' ' to be inserted into CLI
        submitInputCLI(GlobalElems.CommandLine.value);
        return;
    }
    if (document.activeElement !== GlobalElems.CommandLine) {
        GlobalElems.CommandLine.focus();
    }

    const isUndo = (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey);
    const isRedo = (event.key === 'y' && (event.ctrlKey || event.metaKey)) || (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey);

    if (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        unselectShapes();
        GlobalState.ExecutionHistory.undo();
        event.preventDefault(); // Prevent the default browser action
    } else if ((event.key === 'y' && (event.ctrlKey || event.metaKey)) || (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey)) {
        unselectShapes();
        GlobalState.ExecutionHistory.redo();
        event.preventDefault(); // Prevent the default browser action
    }
});

// Handles Enter Key:
GlobalElems.CommandLine.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        submitInputCLI(this.value);  // Clear the input after the command is entered or fetch last command
    }
});

function unselectShapes() {
    GlobalState.SelectedShapes = [];
}