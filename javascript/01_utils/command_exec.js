import { GlobalState } from '../global_state.js';
import { removeHoverHighlights } from './svg_utils.js';
import { Line } from '../shape_classes/line_class.js';
import { Erase } from '../tool_classes/erase_class.js';
import { Zoom } from '../tool_classes/zoom_class.js';
import { updateTimelineCLI, capitalizeFirstLetter } from './cli_utils.js';

class ToolCommand {
    constructor(tool) {
        this.tool = tool;
        this.pendingCmdType = [null]; // Can include 'select', 'coord', 'string', 'multiple', 'viewbox' or null. Used by submitInputCli(), and by mouseDown functionality;
        this.memento = null;
    }

    execute() {
        this.pendingCmdType = this.tool.pendingCmdType;
        if (this.tool.isComplete) {
            GlobalState.ExecutionHistory.finishCommand(); 
        }
    }

    handleInput(input) {
        this.tool.handleInput(input);
        if (this.tool.isComplete) {
            GlobalState.ExecutionHistory.finishCommand(); 
        }
    }

    cancel() {
        this.tool.cancel();
    }

    undo() {
        this.pendingCmdType = [null];
        this.memento = this.tool.saveState();
        this.tool.undo(this.memento);
    }

    redo() {
        this.pendingCmdType = [null];
        if (this.memento.isComplete) {
            this.tool.restoreState(this.memento);
        }
    }
}

class ShapeCommand {
    constructor(shape) { 
        this.shape = shape; // `shape` is object of a shape class, e.g. `new Line()`

        this.pendingCmdType = [null]; // Can include 'select', 'coord', 'string', 'multiple', 'viewbox' or null. Used by submitInputCli(), and by mouseDown functionality;

        this.memento = null; // Properties of shape, so it can be reconstructed with `redo`
    }

    execute() {
        unselectShapes();
        this.pendingCmdType = this.shape.pendingCmdType;
    }

    handleInput(input) { // Called by processInput if there's pending command
        this.shape.handleInput(input);
        if (this.shape.isComplete) {
            this.pendingCmdType = [null];
            GlobalState.ExecutionHistory.finishCommand(); 
        } else {
            console.log(`pending command: ${GlobalState.PendingCommand.shape.type}`);
        }
    }

    edit() { 
        // ...
    }

    cancel() {
        this.pendingCmdType = [null];
        this.shape.cancel();
    }

    undo() {
        this.pendingCmdType = [null];
        this.memento = this.shape.saveState();
        this.shape.cancel();
    }

    redo() {
        this.pendingCmdType = [null];
        if (this.memento.isComplete) {
            this.shape.restoreState(this.memento);
        }
    }
}

export class CommandHistory {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }

    executeCommand(command) {
        GlobalState.PendingCommand = command;
        this.undoStack.push(GlobalState.PendingCommand);
        GlobalState.PendingCommand.execute();
    }

    finishCommand() { // Called by the command class when it's ready
        GlobalState.PendingCommand = null;  // Resetting the command after completion
        this.redoStack = [];
    }

    // Undo also works as cancel pending command:
    undo() { // Also called by 'Escape' key (cancel if pending command)
        const lastCommand = this.undoStack.pop();
        if (lastCommand) {
            // if there's pending command, just cancel it:
            if (GlobalState.PendingCommand) { 
                lastCommand.cancel();
                GlobalState.PendingCommand = null;
            } else { 
                // If there's no pending command, undo history:
                this.redoStack.push(lastCommand);
                lastCommand.undo();
            }
        }
    }

    redo() {
        const command = this.redoStack.pop();
        if (command) {
            command.redo();
            this.undoStack.push(command);
        }
    }
}

const commandMap = {
    'e': () => GlobalState.ExecutionHistory.executeCommand(new ToolCommand(new Erase())),
    'erase': () => GlobalState.ExecutionHistory.executeCommand(new ToolCommand(new Erase())),
    'l': () => GlobalState.ExecutionHistory.executeCommand(new ShapeCommand(new Line())),
    'line': () => GlobalState.ExecutionHistory.executeCommand(new ShapeCommand(new Line())),
    // 'm': () => GlobalState.ExecutionHistory.executeCommand(new ToolCommand(new Move())),
    // 'move': () => GlobalState.ExecutionHistory.executeCommand(new ToolCommand(new Move())),
    'printstate': () => {
        console.log('Shape Map:', GlobalState.ShapeMap); 
        console.log('Shape Map Length:', GlobalState.ShapeMap.size);
        console.log(`Undo stack: ${GlobalState.ExecutionHistory.undoStack}`);
        console.log(`Redo stack: ${GlobalState.ExecutionHistory.redoStack}`);
        console.log(`Pending: ${GlobalState.PendingCommand}`)
    },
    'listshapes': () => { GlobalState.ShapeMap.forEach(shape => console.log(shape)) },
    'redo': () => GlobalState.ExecutionHistory.redo(),
    'undo': () => GlobalState.ExecutionHistory.undo(),
    'z': () => GlobalState.ExecutionHistory.executeCommand(new ToolCommand(new Zoom())),
    'zoom': () => GlobalState.ExecutionHistory.executeCommand(new ToolCommand(new Zoom())),
}

// Called by submitInputCLI and submitInputMouse, and by keyboard eventlistener shortcuts.
// The 'repeat' arg is just for a different text on the CLI.
export function processInput(input, repeat=false) {
    if (typeof input === 'string') {
        input = input.toLowerCase();
    }

    if (GlobalState.PendingCommand) {
        GlobalState.PendingCommand.handleInput(input); // Doesn't go through ExecutionHistory. History updated by PendingCommand when finished.
    } else {
        if (input in commandMap) {
            GlobalState.LastSuccessfulCmd = input; // Memory for repeating commands in CLI
            repeat ? updateTimelineCLI(`> Repeating last command: '${capitalizeFirstLetter(input)}'`) : updateTimelineCLI(`> '${capitalizeFirstLetter(input)}'`);
            commandMap[input]();
        } else {
            console.error('Invalid command:', input);
            updateTimelineCLI(`Invalid command: '${input}'`);
        }
    }
}

export function parseCoords(input) { // if error, returns null
    const parts = input.trim().split(',');

    if (parts.length != 2) { 
        console.error('Invalid input format: Please enter coordinates in the format "x,y"');
        return null;
    }

    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);

    if (!isNaN(x) && !isNaN(y)) {
        return { x: x, y: - y }; // invert y coord
    } else {
        console.error('Invalid input: Coordinates must be valid numbers.');
        return null;
    }
}

// Execute isSelected shape methods to indicate whether they're selected:
export function updateObjectSelection() { // Called by mouseUp eventListener. Also called by unselectShapes();
    // First reset all highlights:
    GlobalState.ShapeMap.forEach(shape => { shape.isSelected(false) }); 
    // Then activate only on the ones that are in GlobalState.SelectedShapes:
    GlobalState.SelectedShapes.forEach(shape => { shape.isSelected(true) }); 

    removeHoverHighlights();
}

export function unselectShapes() {
    GlobalState.SelectedShapes = [];
    updateObjectSelection();
}

