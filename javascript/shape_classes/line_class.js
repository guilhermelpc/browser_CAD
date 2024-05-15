import { GlobalElems, GlobalState } from '../global_state.js';
import { getCursorCoords } from '../svg_utils.js';
import { parseCoords } from '../command_exec.js';
import { updateTimelineCLI } from '../cli_utils.js';

export class Line {
    static lastId = 0;

    constructor() {
        this.type = 'line';
        this.id = `${this.type}${++Line.lastId}`
        this.points = [];
        this.isComplete = false;
        this.svgLine = null; // SVG line element
        this.svg = GlobalElems.SvgElement;
        console.log('new Line class obj., id:', this.id);
        this.createLineElement();
        GlobalState.ShapeMap.set(this.id, this);
    }

    createLineElement() {
        if (!this.svgLine) {
            this.svgLine = document.createElementNS("http://www.w3.org/2000/svg", 'line');
            this.svgLine.setAttribute('stroke', 'black');
            this.svgLine.setAttribute('stroke-width', '1');
            this.svg.appendChild(this.svgLine);
        } else {
            this.svg.appendChild(this.svgLine);
        }
    }

    handleInput(input) {
        let point = input;
        if (typeof input === 'string') {
            point = parseCoords(input); // parseCoords(input) returns null for invalid input
            if (!point) {
                console.error('Invalid coordinate input:', input);
                updateTimelineCLI(`Invalid line coordinate input: '${input}'`);
                return;
            }
        }
        this.points.push(point); // point: object

        if (this.points.length === 1) { // points: list of objects
            this.updateLineElement(point);
            this.attachMouseMoveHandler();
        } else if (this.points.length === 2 && !this.isComplete) {
            this.consolidateShape();
        } 
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

    consolidateShape() {
        this.updateLineElement();
        this.isComplete = true;
        this.detachMouseMoveHandler();
        this.attachSelectHandler();
    }

    saveState() { // Called only when 'undo' is executed
        return { 
            points: this.points.slice(),
            isComplete: this.isComplete
        };
    }

    restoreState(state) { // Called by 'redo'
        this.createLineElement();
        console.log(`restoring ${this.points}`)
        this.points = state.points;
        this.updateLineElement();
        this.isComplete = state.isComplete;
    }

    cancel(){ // Cancel and/or deletes
        if (this.svgLine) {
            this.detachMouseMoveHandler();
            this.svgLine.remove();
        }
        GlobalState.ShapeMap.delete(this.id);
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

    attachSelectHandler() {
        this.svgLine.addEventListener('click', () => {
            GlobalState.SelectedShapes.push(this);
            console.log('Selected shapes: ', GlobalState.SelectedShapes);
        });
    }
}