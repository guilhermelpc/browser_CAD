import { GlobalState } from './global_state.js';
import { Line } from './shape_classes/line_class.js';
import { updateTimelineCLI } from './cli_utils.js';

class ShapeCommand {
    constructor(shape) { // ex. `shape` is object of Line class
        this.shape = shape;
        this.memento = null;
    }

    execute() {
        if (!this.memento) {
            GlobalState.PendingCommand = this;
            console.log(`Shape creation started for ${this.shape.constructor.name}.`);
        }
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
        this.memento = this.shape.saveState();
        this.shape.cancel();
        console.log(`${this.shape.constructor.name} erased.`);
        GlobalState.PendingCommand = null;
    }

    redo() {
        if (this.memento.isComplete) {
            this.shape.restoreState(this.memento);
            console.log(`${this.shape.constructor.name} recreated.`);
        }
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

    undo() { // Also called by 'Escape' key (cancel pending command)
        const command = this.undoStack.pop();
        if (command) {
            if (!GlobalState.PendingCommand) {
                this.redoStack.push(command);
            }
            command.undo();
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
        return { x: x, y: y };
    } else {
        console.error('Invalid input: Coordinates must be valid numbers.');
        return null;
    }
}
