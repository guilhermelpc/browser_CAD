import { GlobalElems, GlobalState } from '../global_state.js';
import { parseCoords } from '../command_exec.js';
import { updateTimelineCLI, resetCliInput } from '../cli_utils.js';

export class Erase {
    constructor() {
        this.pendingCmdType = null;

        this.selectedObj = this.getShapesSelected(); // null if no selection when `new Erase` is instantiated
    }

    getShapesSelected() { // Called by this class' constructor
        // If there aren't any selected objects:
        if (Array.isArray(GlobalState.SelectedShapes) && GlobalState.SelectedShapes.length === 0) {
            this.pendingCmdType = 'select';
            
            // CLI hints:
            GlobalElems.CliPrefix.innerHTML = 'Erase: Select objects to erase.';
            GlobalElems.CommandLine.placeholder = '';

            return null;
        } else {
            this.pendingCmdType = null;

            console.log('Objects erased: ', GlobalState.SelectedShapes);
            return GlobalState.SelectedShapes;
        }
    }

    getExpectedInputType() {
        return this.pendingCmdType;
    }

    handleInput(input) {
    }

    consolidateCommand() {
    }

    saveState() {
    }

    restoreState(state) {
    }

    cancel() {
        resetCliInput();
    }

}