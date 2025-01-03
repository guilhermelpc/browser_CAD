import { GlobalElems, GlobalState } from '../global_state.js';
import { processInput, unselectShapes, updateObjectSelection, toggleProperty } from './command_exec.js';

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
        // try {
            processInput(inputCmd, repeat);
        // } catch (error) {
        //     console.log(`err ${error}`);
        //     console.log(error.message);
        // }
        return;
    }
    // If empty input, but awaiting confirmation of selected objects, process and early-returns:
    if (inputCmd === '' && GlobalState.PendingCommand && GlobalState.PendingCommand.pendingCmdType.includes('select')) {
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

export function resetCliInput() {
    GlobalElems.CommandLine.value = '';
    GlobalElems.CliPrefix.innerHTML = '';
    GlobalElems.CommandLine.placeholder = 'Enter commands...';
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

// Keyboard event listener:
document.addEventListener('keydown', function(event) {
    // Esc functionality:
    if(event.key === 'Escape') {
        handleEsc();
        return;
    }
    // Spacebar and enter are equivalent:
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        submitInputCli(GlobalElems.CommandLine.value);
        return;
    }
    // 'Undo' command shortcuts -- Ctrl + Z, Cmd + Z:
    if (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        unselectShapes();
        // Executes undo without passing through processInput, so it's not repeatable by pressing space or enter:
        GlobalState.ExecutionHistory.undo();
        updateTimelineCLI(`> 'Undo'`);
        event.preventDefault(); // Prevent the default browser action
        return;
    }
    // 'Redo' command shortcuts -- Ctrl+Y, Ctrl+Shift+Z, and also works with metaKey (Command Key on Mac) instead of Ctrl:
    if ((event.key === 'y' && (event.ctrlKey || event.metaKey)) || (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey)) {
        unselectShapes();
        // Executes redo without passing through processInput, so it's not repeatable by pressing space or enter:
        GlobalState.ExecutionHistory.redo();
        updateTimelineCLI(`> 'Redo'`);
        event.preventDefault(); // Prevent the default browser action
        return;
    }
    // Select All funcionality -- Ctrl + A or Cmd + A:
    if (event.key === 'a' && (event.ctrlKey || event.metaKey && !event.shiftKey)) {
        GlobalState.ShapeMap.forEach(shape => {
            if (!GlobalState.SelectedShapes.includes(shape)) {
                GlobalState.SelectedShapes.push(shape);
            }
        });
        updateObjectSelection();
    }
    // Backspace acts as erase:
    if (event.key === 'Backspace' || event.key === 'Delete') {
        // Applies the 'erase' commmand, but only if there are shapes already selected:
        if (GlobalState.SelectedShapes.length === 0) { return; }
        submitInputCli('erase', false)
    }
    // F8 key
    if (event.key === 'F8') {
        event.preventDefault();
        toggleProperty('Ortho');
    }
    // Autofocus on CLI:
    if (document.activeElement !== GlobalElems.CommandLine) {
        GlobalElems.CommandLine.focus();
    }
});
