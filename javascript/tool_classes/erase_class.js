import { GlobalElems, GlobalState } from '../global_state.js';
import { updateTimelineCLI, resetCliInput } from '../cli_utils.js';
import { unselectShapes } from '../command_exec.js';

export class Erase {
    constructor() {
        // Constants:
        this.type = 'erase';
        // To be modified:
        this.isComplete = false; // Set exclusively by this.consolidateCommand()
        this.pendingCmdType = null; // Modif. by this.getShapesSelected() and this.consolidateCommand()
        this.selectedObj = null; // null if no selection when `new Erase` is instantiated
        this.mementos = [];
        this.getShapesSelection();
    }

    getShapesSelection() { // Called by this class' constructor
        // If there aren't any selected objects:
        if (Array.isArray(GlobalState.SelectedShapes) && GlobalState.SelectedShapes.length === 0) {
            this.pendingCmdType = 'select';
            
            // CLI hints:
            GlobalElems.CliPrefix.innerHTML = 'Erase: Select objects to erase.';
            GlobalElems.CommandLine.placeholder = '';

            this.selectedObj = null;
            return
        } else {
            this.selectedObj = GlobalState.SelectedShapes;
            this.consolidateCommand();
        }
    }

    getExpectedInputType() {
        return this.pendingCmdType;
    }

    handleInput(input) { // Called by command_exec.js processInput(...) -> ToolCommand.handleInput(input) if there's pending command
        this.selectedObj = this.getShapesSelection();
        if (this.selectedObj !== null) {
            this.consolidateCommand();
        }
    }

    consolidateCommand() {
        GlobalState.SelectedShapes.forEach(shape => { 
            this.mementos.push(shape.saveState());
            shape.cancel();
        });
        unselectShapes();
        this.pendingCmdType = null;
        this.isComplete = true;
        console.log('Objects erased: ', this.selectedObj);

        resetCliInput();
    }

    saveState() { // Called only when 'undo' is executed
        return {
            shapes: this.selectedObj.slice(),
            mementos: this.mementos.slice(),
            isComplete: this.isComplete
        }
    }

    undo(state){
        console.log('undoing erase');
        for (let i = 0; i < state.shapes.length; i++){
            state.shapes[i].restoreState(this.mementos[i]);
        }
    }

    restoreState(state) { // State is the same object returned by this.saveState()
        console.log('redoing');
    }

    cancel() {
        resetCliInput();
    }

}