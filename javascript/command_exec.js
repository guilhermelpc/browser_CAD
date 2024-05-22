import { GlobalState } from './global_state.js';
import { removeHoverHighlights } from './svg_utils.js';
import { Line } from './shape_classes/line_class.js';
import { Erase } from './tool_classes/erase_class.js';
import { updateTimelineCLI, capitalizeFirstLetter, unselectShapes } from './cli_utils.js';

class ToolCommand {
    constructor(tool) {
        this.tool = tool;

        this.pendingCmdType = null; // Can be 'select', 'coord', or null.

        this.memento = null;
    }

    execute() {
        this.pendingCmdType = this.tool.getExpectedInputType();
    }

    handleInput(input) {
        this.tool.handleInput(input)
    }

    cancel() {
        this.tool.cancel();
    }

    undo() {}

    redo() {}
}

class ShapeCommand {
    constructor(shape) { // `shape` is object of a shape class, e.g. `new Line()`
        this.shape = shape;

        this.pendingCmdType = null; // Can be 'select', 'coord', or null.

        this.memento = null; // Properties of shape, so it can be reconstructed with `redo`
    }

    execute() {
        unselectShapes();
        this.pendingCmdType = this.shape.getExpectedInputType()
        // The shape gets started automatically when it's instantiated, and execution begins at
    }

    handleInput(input) { // Called by processInput if there's pending command
        this.shape.handleInput(input);
        if (this.shape.isComplete) {
            this.pendingCmdType = null;
            GlobalState.ExecutionHistory.finishCommand(); 
        } else {
            console.log(`pending command: ${GlobalState.PendingCommand.shape.type}`);
        }
    }

    edit() { 
        // ...
    }

    cancel() {
        this.pendingCmdType = null;
        this.shape.cancel();
    }

    undo() {
        this.pendingCmdType = null;
        this.memento = this.shape.saveState();
        this.pendingCmdType = null;
        this.shape.cancel();
        console.log(`${this.shape.constructor.name} cancelled/erased.`);
    }

    redo() {
        this.pendingCmdType = null;
        if (this.memento.isComplete) {
            this.shape.restoreState(this.memento);
            console.log(`${this.shape.constructor.name} recreated.`);
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
        GlobalState.PendingCommand.execute();
        this.undoStack.push(GlobalState.PendingCommand);
    }

    finishCommand() { // Called by the command class when it's ready
        GlobalState.PendingCommand = null;  // Resetting the command after completion
        this.redoStack = [];
    }

    undo() { // Also called by 'Escape' key (cancel if pending command)
        const command = this.undoStack.pop();

        if (command) {
            // If there's no pending command, undo history:
            if (!GlobalState.PendingCommand) { 
                this.redoStack.push(command);
                command.undo();
            // if there's pending command, just cancel it:
            } else { 
                command.cancel();
                GlobalState.PendingCommand = null;
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
    // 'z': () => GlobalState.ExecutionHistory.executeCommand(new ToolCommand(new Zoom())),
    // 'zoom': () => GlobalState.ExecutionHistory.executeCommand(new ToolCommand(new Zoom())),
}

export function processInput(input, repeat=false) { // Called by submitInputCLI(inputString, repeat=false) from cli_utils.js
    if (typeof input === 'string') {
        input = input.toLowerCase();
    }
    if (GlobalState.PendingCommand) {
        GlobalState.PendingCommand.handleInput(input); // Doesn't go through ExecutionHistory. History updated by PendingCommand when finished.
    } else {
        if (input in commandMap) {
            GlobalState.LastSuccessfulCmd = input; // Memory for repeating commands in CLI
            repeat ? updateTimelineCLI(`Repeating last command: '${capitalizeFirstLetter(input)}'`) : updateTimelineCLI(`'${capitalizeFirstLetter(input)}'`);
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
export function updateObjectSelection() { // Called by mouseUp eventListener. Also called by unselectShapes() in cli_utils.js;
    GlobalState.ShapeMap.forEach(shape => { shape.isSelected(false) });
    GlobalState.SelectedShapes.forEach(shape => { shape.isSelected(true) });
    removeHoverHighlights();
}
