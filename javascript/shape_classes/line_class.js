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
        this.pendingCmdType = null;
        this.points = []; // List of coordinates-objects, e.g. [{ x1, y1 }, { x2, y2 }]
        this.center = null; // Coordinates { x, y } of the center of the Line. Used to place the circle marker at the middle.
        this.isComplete = false; // Set exclusively by this.consolidateShape()
        this.svgLine = null; // SVG line element, set by this.createShapeElement(), modified by other methods
        this.svgLineHighlight = null; // Thicker line that gets shown to highlight element

        this.selectionMarks = {
            start: null,
            mid: null,
            end: null
        };

        this.createShapeElement();

        // CLI hints:
        GlobalElems.CliPrefix.innerHTML = 'Line: Specify first point:&nbsp;';
        GlobalElems.CommandLine.placeholder = 'x,y';
    }

    getExpectedInputType() {
        return this.pendingCmdType;
    }

    createShapeElement() { // Creates also one thicker line for dynamic highlighting
        this.pendingCmdType = 'coord';
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

    handleInput(input) { // Called by command_exec.js processInput(...) -> ShapeCommand.handleInput(input) if there's pending command
        let point = input; // point: { x, y } object or 'x,y' string
        if (typeof input === 'string') {
            point = parseCoords(input); // parseCoords(input) returns null for invalid input
            if (!point) {
                updateTimelineCLI(`Invalid line coordinate input: '${input}'`);
                console.error('Invalid coordinate input:', input);
                return 0;
            }
        }
        this.points.push(point);

        if (this.points.length === 1) {
            this.updateElement(point);
            GlobalElems.CliPrefix.innerHTML = 'Line: Specify second point:&nbsp;';
            return 0;
        } else if (this.points.length === 2 && !this.isComplete) {
            this.consolidateShape();
            return 1;
        }
        return 0;
    }

    updateElement(cursorPos = null) { // Called by this.handleInput, this.updateCoord, and this.consolidateShape
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
        this.updateElement({x, y});
    }

    returnObjectCenter() { // Called by this.consolidateShape()
        const midX = (this.points[0].x + this.points[1].x) / 2;
        const midY = (this.points[0].y + this.points[1].y) / 2;
        return { x: midX, y: midY };
    }

    // Consolidate coords for highlight Line, creates selection grab marks:
    instantiateVisualCues(option) {
        if (option === true) {
            // Consolidate highlight line (instantiated by this.createShapeElement()):
            this.svgLineHighlight.setAttribute('x1', this.points[0].x);
            this.svgLineHighlight.setAttribute('y1', this.points[0].y);
            this.svgLineHighlight.setAttribute('x2', this.points[1].x);
            this.svgLineHighlight.setAttribute('y2', this.points[1].y);
            this.svgLineHighlight.setAttribute('stroke', 'transparent');

            // Create marks for grabbing:

            let width = GlobalElems.SquareReusableElement.width.baseVal.value;
            Object.keys(this.selectionMarks).forEach(key => {
                if (this.selectionMarks[key] === null) {
                    this.selectionMarks[key] = document.createElementNS("http://www.w3.org/2000/svg", "use");
                    this.selectionMarks[key].setAttributeNS("http://www.w3.org/1999/xlink", "href", "#squareReusableElement");
                }
                if (key == 'start') {
                    this.selectionMarks[key].setAttribute("x", this.points[0].x);
                    this.selectionMarks[key].setAttribute("y", this.points[0].y);
                }
                if (key == 'mid') {
                    this.selectionMarks[key].setAttribute("x", this.center.x);
                    this.selectionMarks[key].setAttribute("y", this.center.y);
                }
                if (key == 'end') {
                    this.selectionMarks[key].setAttribute("x", this.points[1].x);
                    this.selectionMarks[key].setAttribute("y", this.points[1].y);
                }
                this.selectionMarks[key].setAttribute("fill", "transparent");
                this.svg.appendChild(this.selectionMarks[key]);
            });
        }
        if (option === false) {
            Object.keys(this.selectionMarks).forEach(key => {
                if (this.selectionMarks[key] !== null) {
                    this.selectionMarks[key].remove();
                    this.selectionMarks[key] = null;
                }
            });
        }
    }

    consolidateShape() { // Called by this.handleInput(input) and this.restoreState(state)
        this.isComplete = true;
        this.pendingCmdType = null;
        this.center = this.returnObjectCenter(); // Bases on this.points
        this.updateElement(); // Set line coords based on this.points
        this.instantiateVisualCues(true); // Sets highlight line coords and selection grab-marks based on this.points

        GlobalState.ShapeMap.set(this.id, this);
    
        resetCliInput();

        this.updateDisplayZoom();

        console.log(`line consolidated`);
    }

    saveState() { // Called only when 'undo' is executed
        return { 
            points: this.points.slice(),
            isComplete: this.isComplete
        };
    }

    restoreState(state) { // Called by ShapeCommand's redo() (command_exec.js)
        this.createShapeElement(); // If there's already a line element, createShapeElement will only append it to the canvas
        this.points = state.points;
        this.consolidateShape();
    }

    cancel(){ // Cancel and/or deletes
        if (this.svgLine !== null) {
            this.svgLine.remove();
            this.svgLine = null;
        }
        if (this.svgLineHighlight !== null) {
            this.svgLineHighlight.remove();
            this.svgLineHighlight = null;
        }
        this.instantiateVisualCues(false); 
        resetCliInput();
        GlobalState.ShapeMap.delete(this.id);
    }

    // Updates only line width. Grab-marks are scaled in svg_utils.js with updateStyleZoom()
    updateDisplayZoom() { // Called by zoom functionality (svg_utils.js) to update stroke-width
        this.svgLine.setAttribute('stroke-width', GlobalState.LineWidthDisplay);
        this.svgLineHighlight.setAttribute('stroke-width', GlobalState.LineWidthDisplay * GlobalState.HighlightThicknessFactor);
    }

    highlightObject(option) { // Called in svg_utils.js by removeHoverHighlights() and the 'mousemove' eventListener
        if (option === true) {
            this.svgLineHighlight.setAttribute('stroke', `${GlobalState.HighlightColor}`);
        } else {
            this.svgLineHighlight.setAttribute('stroke', 'transparent');
        }
    }

    // Show/hide grab-marks
    isSelected(option) { // Called by updateObjectSelection (svg_utils.js)
        if (option === true) {
            Object.keys(this.selectionMarks).forEach(key => { 
                this.selectionMarks[key].setAttribute("fill", `${GlobalState.GrabMarkCokor}`);
                this.svg.appendChild(this.selectionMarks[key]); // Brings them to front of SVG
            });
        } else {
            Object.keys(this.selectionMarks).forEach(key => { this.selectionMarks[key].setAttribute("fill", "transparent"); });
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
