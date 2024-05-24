import { GlobalElems, GlobalState } from '../global_state.js';
import { updateTimelineCLI, resetCliInput } from '../cli_utils.js';
import { unselectShapes } from '../command_exec.js';
import { zoomAll } from '../svg_utils.js';

export class Zoom {
    constructor() {
        // Constants:
        this.type = 'zoom';
        // To be modified:
        this.isComplete = false;
        this.pendingCmdType = ['string', 'viewbox'];
            
        // CLI hints:
        GlobalElems.CliPrefix.innerHTML = 'Zoom [All] or: Select area for zooming&nbsp;';
        GlobalElems.CommandLine.placeholder = '';
    }

    handleInput(input) {
        if (typeof input === 'string') {
            if (input === 'a') {
                zoomAll(); // from '../svg_utils.js'
                this.consolidateCommand();
                return;
            } else {
                updateTimelineCLI(`Invalid option for 'Zoom': '${input}'`);
                return;
            }
        } else {
            // Viewbox coords. processing:
            // ...
        }

        this.consolidateCommand();
    }

    consolidateCommand() {
        this.pendingCmdType = null;
        this.isComplete = true;
        resetCliInput();
    }

    saveState() {
    }

    undo(state) {
    }

    restoreState(state) {
    }

    cancel() {
        updateTimelineCLI(`'Zoom' cancelled`);
        resetCliInput();
    }


}