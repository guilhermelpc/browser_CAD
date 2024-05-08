import { GlobalElems, GlobalState } from './global_state.js';
import { getCursorCoords } from './svg_utils.js'
import { Line } from './shape_classes/line_class.js'

class ShapeCommand {
    constructor(shape) { // ex. `shape` is object of Line class
        // super();
        this.shape = shape;
    }

    execute() {
        GlobalState.PendingCommand = this;
        console.log(`Shape creation started for ${this.shape.constructor.name}.`);
    }

    handleInput(input) {
        this.shape.handleInput(input);
        if (this.shape.isComplete) {
            console.log(`${GlobalState.PendingCommand.shape.type} complete`);
            GlobalState.PendingCommand = null;  // Resetting the command after completion
        } else {
            console.log(`pending command: ${GlobalState.PendingCommand.shape.type}`);
        }
    }

    undo() {
        this.shape.cancel();
        console.log(`${this.shape.constructor.name} erased.`);
        GlobalState.PendingCommand = null;
    }

    cancel() {
        this.shape.cancel();
        console.log(`${this.shape.constructor.name} cancelled.`);
        GlobalState.PendingCommand = null;

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

    undo() {
        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        }
    }

    redo() {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
        }
    }
}

const commandMap = {
    'l': () => GlobalState.ExecutionHistory.executeCommand(new ShapeCommand(new Line())),
    'line': () => GlobalState.ExecutionHistory.executeCommand(new ShapeCommand(new Line())),
    'undo': () => GlobalState.ExecutionHistory.undo()
};

export function processInput(input) {
    if (GlobalState.PendingCommand) {
        GlobalState.PendingCommand.handleInput(input);
    } else {
        if (input in commandMap) {
            commandMap[input]();
        } else {
            console.error('Invalid command');
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
        return { x: x, y: y };
    } else {
        console.error('Invalid input: Coordinates must be valid numbers.');
        return null;
    }
}
