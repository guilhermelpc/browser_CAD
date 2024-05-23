import { GlobalElems, GlobalState } from './global_state.js';
import { processInput, unselectShapes } from './command_exec.js';

// CLI Timeline update - adds its argument to the CLI's timeline:
export function updateTimelineCLI(cmdString) {
    GlobalState.CLITimeline.push(capitalizeFirstLetter(cmdString)); // Adds the new command to the end of the history array
    GlobalElems.CLIHistory.innerHTML = GlobalState.CLITimeline.slice(-6).join('<br>'); // Updates CLI history, newest command at the bottom
}

// Handles CLI input after Enter or Spacebar:
export function submitInputCli(inputCmd, repeat=false) {
    GlobalElems.CommandLine.value = '';
    // If not empty input, process it and early-returns:
    if (inputCmd != '') { 
        try {
            processInput(inputCmd, repeat);
        } catch (error) {
            console.log(`err ${error}`);
            console.log(error.message);
        }
        return;
    }
    // If empty input, but awaiting confirmation of selected objects, process and early-returns:
    if (inputCmd === '' && GlobalState.PendingCommand && GlobalState.PendingCommand.pendingCmdType === 'select') {
        try {
            processInput(null);
        } catch (error) {
            console.log(`err ${error}`);
            console.log(error.message);
        }
        return;
    }
    // If empty input and there's command history (and not early-returned above)
    if (inputCmd == '' && GlobalState.LastSuccessfulCmd && !GlobalState.PendingCommand) { 
        console.log('repeat last command');
        submitInputCli(GlobalState.LastSuccessfulCmd, true);
        return;
    }
    // If empty input and there isn't history (and not early-returned above)
    if (inputCmd == '' && !GlobalState.LastSuccessfulCmd) { 
        return;
    }
    return;
}

// Esc functionality:
function handleEsc() {
    resetCliInput();
    if (GlobalState.PendingCommand) {
        GlobalState.ExecutionHistory.undo();
    }
    unselectShapes();

    // Remove selection rectangle here (for canceling it easily in case the cursor gets outside during rectangle creation)
    // ...

}

export function resetCliInput() {
    GlobalElems.CommandLine.value = '';
    GlobalElems.CliPrefix.innerHTML = '';
    GlobalElems.CommandLine.placeholder = 'Enter commands...';
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Automatic CLI focus, spacebar handler, esc handler, ctrl+z and related:
document.addEventListener('keydown', function(event) {
    // Early return:
    if(event.key === 'Escape') {
        handleEsc();
        return;
    }
    // Prevent ' ' to be inserted into CLI, and early-return:
    if (event.key === ' ') {
        event.preventDefault();
        submitInputCli(GlobalElems.CommandLine.value);
        return;
    }
    // 'Undo' and 'Redo' commands shortcuts, with early return:
    if (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        unselectShapes();
        // Executes undo without passing through processInput, so it's not repeatable by pressing space or enter:
        GlobalState.ExecutionHistory.undo();
        updateTimelineCLI(`'Undo'`);
        event.preventDefault(); // Prevent the default browser action
        return;
    } else if ((event.key === 'y' && (event.ctrlKey || event.metaKey)) || (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey)) {
        unselectShapes();
        // Executes redo without passing through processInput, so it's not repeatable by pressing space or enter:
        GlobalState.ExecutionHistory.redo();
        updateTimelineCLI(`'Redo'`);
        event.preventDefault(); // Prevent the default browser action
        return;
    }

    if (document.activeElement !== GlobalElems.CommandLine) {
        GlobalElems.CommandLine.focus();
    }

    // Delete with backspace funcionality:
    if (event.key === 'Backspace' || event.key === 'Delete') {
        
    }
});

// Handles Enter Key:
GlobalElems.CommandLine.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        submitInputCli(this.value);  // Clear the input after the command is entered or fetch last command
    }
});
