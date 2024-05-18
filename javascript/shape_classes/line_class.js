import { GlobalElems, GlobalState } from '../global_state.js';
import { createSvgElement } from '../svg_utils.js';
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
        this.points = []; // List of coordinates-objects, e.g. [{ x1, y1 }, { x2, y2 }]
        this.isComplete = false; // Set exclusively by this.consolidateShape()
        this.svgLine = null; // SVG line element, set by this.createLineElement(), modified by other methods
        this.svgLineHighlight = null;

        this.createLineElement();

        // CLI hints:
        GlobalElems.CliPrefix.innerHTML = 'Line: Specify first point:&nbsp;';
        GlobalElems.CommandLine.placeholder = 'x,y';

    }

    createLineElement() { // Creates also one thicker line for dynamic highlighting
        if (!this.svgLine) {

            this.svgLineHighlight = createSvgElement('line', {
                'stroke': 'transparent', 'stroke-width': `${GlobalState.LineWidthDisplay * GlobalState.HighlightThicknessFactor}`
            }, this.svg);

            this.svgLine = createSvgElement('line', {
                'stroke': 'black', 'stroke-width': `${GlobalState.LineWidthDisplay}`
            }, this.svg);

        } else {
            this.svg.appendChild(this.svgLineHighlight);
            this.svg.appendChild(this.svgLine);
        }
    }

    handleInput(input) { // Called by processInput->ShapeCommand.handleInput if there's pending command
        let point = input; // point: { x, y } object or 'x,y' string
        if (typeof input === 'string') {
            point = parseCoords(input); // parseCoords(input) returns null for invalid input
            if (!point) {
                updateTimelineCLI(`Invalid line coordinate input: '${input}'`);
                console.error('Invalid coordinate input:', input);
                return;
            }
        }
        this.points.push(point);

        if (this.points.length === 1) {
            this.updateLineElement(point);
            GlobalElems.CliPrefix.innerHTML = 'Line: Specify second point:&nbsp;';
        } else if (this.points.length === 2 && !this.isComplete) {
            this.consolidateShape();
        }
    }

    updateLineElement(cursorPos = null) { // Called by this.handleInput, this.updateCoord, and this.consolidateShape
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

    updateCoord(svgPoint) { // Called by mousemove eventListener (in svg_utils.js) attached to GlobalElems.SvgElement
        if (this.points.length != 1) { return; }
        const x = svgPoint.x;
        const y = svgPoint.y;
        this.updateLineElement({x, y});
    }

    consolidateShape() { // Called by this.handleInput(input) and this.restoreState(state)
        this.updateLineElement();
        this.isComplete = true;
        GlobalState.ShapeMap.set(this.id, this);
        resetCliInput();
        // Creates highlight line:
        this.svgLineHighlight.setAttribute('x1', this.points[0].x);
        this.svgLineHighlight.setAttribute('y1', this.points[0].y);
        this.svgLineHighlight.setAttribute('x2', this.points[1].x);
        this.svgLineHighlight.setAttribute('y2', this.points[1].y);
        this.svgLineHighlight.setAttribute('stroke', 'transparent');

        this.updateDisplay();
        console.log(`line consolidated`);
    }

    saveState() { // Called only when 'undo' is executed
        return { 
            points: this.points.slice(),
            isComplete: this.isComplete
        };
    }

    restoreState(state) { // Called by ShapeCommand's redo() (command_exec.js)
        this.createLineElement(); // If there's already a line element, createLineElement will only append it to the canvas
        this.points = state.points;
        this.consolidateShape();
    }

    cancel(){ // Cancel and/or deletes
        if (this.svgLine) {
            this.svgLine.remove();
        }
        if (this.svgLineHighlight) {
            this.svgLineHighlight.remove();
        }
        resetCliInput();
        GlobalState.ShapeMap.delete(this.id);
    }

    updateDisplay() { // Called by zoom functionality (svg_utils.js) to update stroke-width
        this.svgLine.setAttribute('stroke-width', GlobalState.LineWidthDisplay);
        this.svgLineHighlight.setAttribute('stroke-width', GlobalState.LineWidthDisplay * GlobalState.HighlightThicknessFactor);
    }

    highlightObject(option) {
        if (option === true) {
            this.svgLineHighlight.setAttribute('stroke', `${GlobalState.HighlightColor}`);
        } else {
            this.svgLineHighlight.setAttribute('stroke', 'transparent');
        }
    }

    isSelected(option) {
        if (option === true) {
            this.svgLineHighlight.setAttribute('stroke', `${GlobalState.HighlightColor}`);
            this.svgLine.setAttribute("marker-start", "url(#circleMarker)");
            this.svgLine.setAttribute("marker-mid", "url(#circleMarker)");
            this.svgLine.setAttribute("marker-end", "url(#circleMarker)");
        } else {
            this.svgLineHighlight.setAttribute('stroke', 'transparent');
            this.svgLine.removeAttribute("marker-start");
            this.svgLine.removeAttribute("marker-mid");
            this.svgLine.removeAttribute("marker-end");
        }
    }

    getClickDistance(input) { // Called by returnDistancesToShapes(coords) in svg_utils.js through GlobalState.ShapeMap
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
