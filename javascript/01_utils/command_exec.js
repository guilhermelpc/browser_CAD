import { GlobalState } from '../global_state.js';
import { removeHoverHighlights } from './svg_utils.js';
import { Line } from '../02_shape_classes/line_class.js';
import { Erase } from '../03_tool_classes/erase_class.js';
import { Zoom } from '../03_tool_classes/zoom_class.js';
import { updateTimelineCLI, capitalizeFirstLetter } from './cli_utils.js';
import { isValidNumber, degreesToRadians } from './math_utils.js';

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

    updateCoord(svgPoint) {
        // this.tool.updateCoord(svgPoint);
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

        this.pendingCmdType = [null]; // Can include 'select', 'coord', 'string', 'multiple', 'viewbox' and null. Used by submitInputCli(), and by mouseDown functionality;

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

    updateCoord(svgPoint) {
        this.shape.updateCoord(svgPoint);
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
    'ortho': () => toggleProperty('Ortho'),
    'printstate': () => {
        console.log('Shape Map:', GlobalState.ShapeMap); 
        console.log('Shape Map Length:', GlobalState.ShapeMap.size);
        console.log(`Undo stack: ${GlobalState.ExecutionHistory.undoStack}`);
        console.log(`Redo stack: ${GlobalState.ExecutionHistory.redoStack}`);
        console.log(`Pending: ${GlobalState.PendingCommand}`)
    },
    'listshapes': () => GlobalState.ShapeMap.forEach(shape => console.log(shape)),
    'redo': () => GlobalState.ExecutionHistory.redo(),
    'undo': () => GlobalState.ExecutionHistory.undo(),
    'z': () => GlobalState.ExecutionHistory.executeCommand(new ToolCommand(new Zoom())),
    'zoom': () => GlobalState.ExecutionHistory.executeCommand(new ToolCommand(new Zoom())),
}

// Called by submitInputCLI and submitInputMouse. The 'repeat' arg is just for printing a different text on the CLI.
// Commands like Ctrl+Z and Ctrl+Y bypass this function so they are not repeatable by enter or space.
export function processInput(input, repeat=false) {
    if (typeof input === 'string') {
        input = input.toLowerCase();
    }

    if (GlobalState.PendingCommand) {
        // Doesn't go through ExecutionHistory. History updated by PendingCommand when finished.
        GlobalState.PendingCommand.handleInput(input);
        // Early return:
        return;
    }

    if (input in commandMap) {
        // Update CLI Timeliine:
        repeat ? updateTimelineCLI(`> Repeating last command: '${capitalizeFirstLetter(input)}'`) : updateTimelineCLI(`> '${capitalizeFirstLetter(input)}'`);
        // Memory for repeating commands in CLI:
        GlobalState.LastSuccessfulCmd = input; 
        // Execute input command:
        commandMap[input]();
    } else {
        // Invalid command -- error warning:
        updateTimelineCLI(`Invalid command: '${input}'`);
        console.error('Invalid command:', input);
    }
}

// Used to turn text like '10.05,25.' or '14<11.5' into { x, y } objects:
// Doesn't work with '@' at the beginning -- this should be handled by the caller of this function.
// Also doesn't work with single number input -- this should also be handled by caller.
export function parseCoords(input) { // Returns null if error.
    // Trim whitespace just in case:
    const parts = input.trim();

    // Deal with cartesian coords 'x,y':
    if (input.includes(',')) {
        const parts = input.trim().split(',');
        if (parts.length != 2) {
            console.error('Invalid input format.');
            return null;
        }
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(y)) {
            // Reverse y coord so positive y means up:
            return { x: x, y: - y };
        } else {
            console.error('Invalid input: Coordinates must be valid numbers.');
            return null;
        }
    }

    // Deal with polar coords 'r<a':
    if (input.includes('<')) {

    }

    // If conditions above not met:
    console.error('Invalid input format.');
    return null;
}

// Execute isSelected shape methods to indicate whether they're selected:
export function updateObjectSelection() { // Called by mouseUp eventListener. Also called by unselectShapes();
    // First reset all highlights:
    GlobalState.ShapeMap.forEach(shape => { shape.isSelected(false) }); 
    // Then activate only on the ones that are in GlobalState.SelectedShapes:
    GlobalState.SelectedShapes.forEach(shape => { shape.isSelected(true) }); 
    // Remove highlights only for unselected objects:
    removeHoverHighlights();
}

export function unselectShapes() {
    GlobalState.SelectedShapes = [];
    updateObjectSelection();
}

// For toggling Ortho, Snap, etc.:
export function toggleProperty(prop) {
    GlobalState.Tools[prop] = !GlobalState.Tools[prop];
    updateTimelineCLI(`${prop} ${GlobalState.Tools[prop] ? 'ON' : 'OFF'}`);

    // If there's pending command, update its coords to reflect new prop:
    if (GlobalState.PendingCommand && GlobalState.PendingCommand.pendingCmdType.includes('coord')) {
        try {
            const x = GlobalState.LastCursorCoords.x;
            const y = GlobalState.LastCursorCoords.y;
            GlobalState.PendingCommand.updateCoord({x,y});
        } catch (error) {
            console.log(`err ${error}`);
        }
    }
}
