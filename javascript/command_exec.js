import { GlobalElems, GlobalState } from './global_state.js';
import { getCursorCoords } from './svg_utils.js'


class Line {
    constructor() {
        this.type = 'line';
        this.points = [];
        this.isComplete = false;
        this.svgLine = null; // SVG line element
        this.svg = GlobalElems.SvgElement;
        console.log('Line class obj. initiated');
        this.attachMouseMoveHandler();
    }

    handleInput(input) {
        if (!this.checkInput(input)) { return; } // under construction
        let point = input;
        if (typeof input === 'string') {
            point = parseCoords(input);
            if (!point) {
                console.error('Invalid coordinate input:', input);
                return;
            }
        }
        if (this.points.length === 0) {
            this.points.push(point);
            this.createLineElement();
            this.updateLineElement(point);
        } else if (this.points.length === 1 && !this.isComplete) {
            this.points.push(point);
            this.isComplete = true;
            this.updateLineElement();
            this.detachMouseMoveHandler();
        }
    }

    checkInput(input) {
        // under construction
        return true;
    }


    createLineElement() {
        this.svgLine = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        this.svgLine.setAttribute('stroke', 'black');
        this.svgLine.setAttribute('stroke-width', '1');
        this.svg.appendChild(this.svgLine);
    }

    updateLineElement(cursorPos = null) {
        if (!this.svgLine) { return; }
        this.svgLine.setAttribute('x1', this.points[0].x);
        this.svgLine.setAttribute('y1', this.points[0].y);
        if (cursorPos) {
            this.svgLine.setAttribute('x2', cursorPos.x);
            this.svgLine.setAttribute('y2', cursorPos.y);
        } else {
            this.svgLine.setAttribute('x2', this.points[1].x);
            this.svgLine.setAttribute('y2', this.points[1].y);
        }
    }

    attachMouseMoveHandler() {
        this.mouseMoveHandler = event => {
            const svgPoint = getCursorCoords(event, GlobalElems.SvgElement);
            const x = svgPoint.x;
            const y = svgPoint.y;
            this.updateLineElement({x, y});
        };
        this.svg.addEventListener('mousemove', this.mouseMoveHandler);
    }

    detachMouseMoveHandler() {
        this.svg.removeEventListener('mousemove', this.mouseMoveHandler);
    }

    cancel(){
        if (this.svgLine) {
            this.svgLine.remove();
            this.svgLine = null;
        }
        console.log('Line canceled');
    }
}

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
            GlobalState.PendingCommand = null;  // Resetting the command after completion
            console.log('Shape complete');
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

class ShapeFactory {
    static createShape(type) {
        switch (type) {
            case 'line':
                return new Line();
            default:
                throw new Error('Unsupported shape type');
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
    'l': () => new ShapeCommand(ShapeFactory.createShape('line')),
    'line': () => new ShapeCommand(ShapeFactory.createShape('line'))
};

export function processInput(input) {
    if (GlobalState.PendingCommand) {
        console.log(`pending command: ${GlobalState.PendingCommand.shape.type}`);
        GlobalState.PendingCommand.handleInput(input);
    } else {
        if (input in commandMap) {
            const command = commandMap[input]();
            GlobalState.ExecutionHistory.executeCommand(command); // main.js: GlobalState.ExecutionHistory = new CommandHistory();
        } else {
            console.error('Invalid command');
        }
    }
}

function parseCoords(input) { // if error, returns null
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
