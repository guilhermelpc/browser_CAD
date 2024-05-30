import { GlobalElems, GlobalState } from '../global_state.js';
import { updateTimelineCLI, resetCliInput } from '../01_utils/cli_utils.js';
import { applyZoom, zoomAll } from '../01_utils/svg_utils.js';

export class Zoom {
    constructor() {
        // Constants:
        this.type = 'zoom';
        // To be modified:
        this.isComplete = false;
        this.pendingCmdType = ['string', 'viewbox'];
        this.beforeZoom = { x: null, y: null, width: null, height: null }; // Set only when command is executed, bc initial params might be changed by scroll-zoom
        this.afterZoom = { x: null, y: null, width: null, height: null };
        // CLI hints:
        GlobalElems.CliPrefix.innerHTML = 'Zoom [All] or Select area for zooming:';
        GlobalElems.CommandLine.placeholder = '';
    }

    handleInput(input) {
        if (typeof input === 'string') {
            if (input === 'a') {
                // Save previous zoom state for undoing
                this.beforeZoom = {
                    x: GlobalState.ViewBox.x,
                    y: GlobalState.ViewBox.y,
                    width: GlobalState.ViewBox.width,
                    height: GlobalState.ViewBox.height
                }
                this.afterZoom = zoomAll(); // from '../svg_utils.js'
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
        return {
            isComplete: this.isComplete,
            beforeZoom: this.beforeZoom,
            afterZoom: this.afterZoom
        };
    }

    undo(state) {
        applyZoom(state.beforeZoom.x, state.beforeZoom.y, state.beforeZoom.width, state.beforeZoom.height);
    }

    restoreState(state) {
        applyZoom(state.afterZoom.x, state.afterZoom.y, state.afterZoom.width, state.afterZoom.height);
        this.consolidateCommand();
    }

    cancel() {
        updateTimelineCLI(`'Zoom' cancelled`);
        resetCliInput();
    }


}