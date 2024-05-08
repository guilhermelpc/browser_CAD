import { GlobalElems, GlobalState } from '../global_state.js';
import { getCursorCoords } from '../svg_utils.js';
import { parseCoords } from '../command_exec.js';

export class Line {
    constructor() {
        this.type = 'line';
        this.points = [];
        this.isComplete = false;
        this.svgLine = null; // SVG line element
        this.svg = GlobalElems.SvgElement;
        console.log('Line class obj. initiated');
        this.createLineElement();
    }

    handleInput(input) {
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
            this.updateLineElement(point);
            this.attachMouseMoveHandler();
        } else if (this.points.length === 1 && !this.isComplete) {
            this.points.push(point);
            this.isComplete = true;
            this.updateLineElement();
            this.detachMouseMoveHandler();
        }
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

    attachSelectHandler() {
        this.svgLine.addEventListener('click', () => {
            selectedShape = this;

        });
    }

    cancel(){
        if (this.svgLine) {
            this.detachMouseMoveHandler();
            this.svgLine.remove();
            this.svgLine = null;
        }
        console.log('Line canceled');
    }
}