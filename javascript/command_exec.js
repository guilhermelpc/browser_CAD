import { GlobalState } from './global_state.js';
import { Line } from './shape_classes/line_class.js';
import { updateTimelineCLI } from './cli_utils.js';

class ToolCommand {
    constructor(tool) {
        this.tool = tool;
        this.memento = null;
    }
    execute() {}
    handleInput() {}
    cancel() {}
    undo() {}
    redo() {}
}

class ShapeCommand {
    constructor(shape) { // `shape` is object of a shape class, e.g. `new Line()`
        this.shape = shape;
        this.memento = null; // Properties of shape, so it can be reconstructed with `redo`
    }

    execute() {
        if (!this.memento) {
            GlobalState.PendingCommand = this;
        }
    }

    handleInput(input) { // Called by processInput if there's pending command
        this.shape.handleInput(input);

        if (this.shape.isComplete) {
            GlobalState.PendingCommand = null;  // Resetting the command after completion
        } else {
            console.log(`pending command: ${GlobalState.PendingCommand.shape.type}`);
        }
    }

    cancel() {
        this.shape.cancel();
        GlobalState.PendingCommand = null;
    }

    undo() {
        this.memento = this.shape.saveState();
        this.shape.cancel();
        console.log(`${this.shape.constructor.name} cancelled/erased.`);
    }

    redo() {
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
        command.execute();
        this.undoStack.push(command);
        this.redoStack = [];
    }

    undo() { // Also called by 'Escape' key (cancel if pending command)
        const command = this.undoStack.pop();
        if (command) {
            if (!GlobalState.PendingCommand) { // If there's no pending command
                this.redoStack.push(command);
                command.undo();
            } else { // if pending command, doesn't add it to redo stack
                command.cancel();
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
    'l': () => GlobalState.ExecutionHistory.executeCommand(new ShapeCommand(new Line())),
    'line': () => GlobalState.ExecutionHistory.executeCommand(new ShapeCommand(new Line())),
    'printstate': () => {
        console.log('Shape Map:', GlobalState.ShapeMap); 
        console.log(`Undo stack: ${GlobalState.ExecutionHistory.undoStack}`);
        console.log(`Redo stack: ${GlobalState.ExecutionHistory.redoStack}`);
    },
    'listshapes': () => { GlobalState.ShapeMap.forEach(shape => console.log(shape.points)) },
    'redo': () => GlobalState.ExecutionHistory.redo(),
    'undo': () => GlobalState.ExecutionHistory.undo(),
}

export function processInput(input) {
    if (typeof input === 'string') {
        input = input.toLowerCase();
    }
    if (GlobalState.PendingCommand) {
        GlobalState.PendingCommand.handleInput(input);
    } else {
        if (input in commandMap) {
            GlobalState.LastSuccessfulCmd = input; // Memory for repeating commands in CLI
            updateTimelineCLI(input);
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
