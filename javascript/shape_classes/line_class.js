import { GlobalElems, GlobalState } from '../global_state.js';
import { getCursorCoords, createSvgElement } from '../svg_utils.js';
import { parseCoords } from '../command_exec.js';
import { updateTimelineCLI, resetCliInput } from '../cli_utils.js';

export class Line {
    static lastId = 0;

    constructor() {
        // Constants:
        this.svg = GlobalElems.SvgElement; 
        this.type = 'line';
        this.id = `${this.type}${++Line.lastId}`
        // Variables to be modified:
        this.points = []; // List of coordinates-objects, e.g. [{x1,y1}, {x2,y2}]
        this.isComplete = false; // Set exclusively by consolidateShape()
        this.svgLine = null; // SVG line element, set by createLineElement(), modified by other methods
        
        this.createLineElement();

        GlobalElems.CliPrefix.innerHTML = 'Line: Specify first point:&nbsp;';
        GlobalElems.CommandLine.placeholder = 'x,y';

        console.log('new Line class obj., id:', this.id);
    }

    createLineElement() {
        if (!this.svgLine) {
            this.svgLine = createSvgElement('line', {'stroke': 'black', 'stroke-width': `${GlobalState.LineWidthDisplay}`}, this.svg);
        } else {
            this.svg.appendChild(this.svgLine);
        }
    }

    handleInput(input) { // Called by processInput->ShapeCommand.handleInput if there's pending command
        let point = input;
        if (typeof input === 'string') {
            point = parseCoords(input); // parseCoords(input) returns null for invalid input
            if (!point) {
                console.error('Invalid coordinate input:', input);
                updateTimelineCLI(`Invalid line coordinate input: '${input}'`);
                return;
            }
        }
        this.points.push(point); // point: object {x, y}

        if (this.points.length === 1) {
            this.updateLineElement(point);
            GlobalElems.CliPrefix.innerHTML = 'Line: Specify second point:&nbsp;';
        } else if (this.points.length === 2 && !this.isComplete) {
            this.consolidateShape();
        }
    }

    updateLineElement(cursorPos = null) { // Called by handleInput, updateCoord, and consolidateShape
        if (!this.svgLine) { 
            return; 
        }

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

    updateCoord(svgPoint) {
        if (this.points.length != 1) { return; }
        const x = svgPoint.x;
        const y = svgPoint.y;
        this.updateLineElement({x, y});
    }

    consolidateShape() {
        this.updateLineElement();
        this.isComplete = true;
        GlobalState.ShapeMap.set(this.id, this);
        this.updateDisplay();
        resetCliInput();
        console.log(`line consolidated`);
    }

    saveState() { // Called only when 'undo' is executed
        return { 
            points: this.points.slice(),
            isComplete: this.isComplete
        };
    }

    restoreState(state) { // Called by 'redo'
        this.createLineElement(); // If there's already a line element, this function will only append it to the canvas
        this.points = state.points;
        this.consolidateShape();
    }

    cancel(){ // Cancel and/or deletes
        if (this.svgLine) {
            this.svgLine.remove();
        }
        resetCliInput();
        GlobalState.ShapeMap.delete(this.id);
    }

    updateDisplay() {
        this.svgLine.setAttribute('stroke-width', GlobalState.LineWidthDisplay);
    }

    getClickDistance(input) {
        if (!this.isComplete || this.points.length != 2) { return null; }

        const A = input.x - this.points[0].x
        const B = input.y - this.points[0].y

        const C = this.points[1].x - this.points[0].x;
        const D = this.points[1].y - this.points[0].y

        // Dot product of vectors A,B and C,D:
        const dot = A * C + B * D;
        // Length squared of the line segment:
        const len_sq = C * C + D * D;
        // Projection factor of point onto the line segment:
        const param = len_sq !== 0 ? dot / len_sq : -1;

        let xx, yy;

        if (param < 0) {
            // Point projection falls before the start of the line segment
            xx = this.points[0].x;
            yy = this.points[0].y;
        } else if (param > 1) {
            // Point projection falls after the end of the line segment
            xx = this.points[1].x;
            yy = this.points[1].y;
        } else {
            // Point projection falls within the line segment
            xx = this.points[0].x + param * C;
            yy = this.points[0].y + param * D;
        }
    
        // Compute the distance from the point to the projection point on the line segment
        const dx = input.x - xx;
        const dy = input.y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        return distance;
    }
}
