import { GlobalElems, GlobalState } from './global_state.js';
import { generateCircleMarker } from './svg_markers/circle_marker.js';
import { generateSquareMarker } from './svg_markers/square_marker.js';

// Create svg 'defs' elements and append reusable elements/markers to it:
export function generateMarkers() {
    const svgNS = "http://www.w3.org/2000/svg";

    GlobalElems.SvgElementDefs = svgCanvas.querySelector("defs");
    if (!GlobalElems.SvgElementDefs) {
        GlobalElems.SvgElementDefs = document.createElementNS(svgNS, "defs");
        GlobalElems.SvgElement.appendChild(GlobalElems.SvgElementDefs);
    }

    generateCircleMarker();
    generateSquareMarker();
}

// For creating SVG elements:
export function createSvgElement(elementName, attributes, parentElement, innerHTML = null) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", elementName);

    for (const [key, value] of Object.entries(attributes)) {
        element.setAttributeNS(null, key, value);
    }

    if (innerHTML) {
        element.innerHTML = innerHTML;
    }

    parentElement.appendChild(element);
    return element;
}

// Executed once when main.js starts:
export function updateViewBoxAspectRatio(viewBoxGlobal, parentElement) {
    GlobalState.AspectRatio = window.innerWidth / window.innerHeight;
    let width, height;
    // Decide whether to match the width or the height to the window
    if (GlobalState.AspectRatio > 1) {
        // Landscape orientation
        height = viewBoxGlobal.height;  // Arbitrary unit
        width = viewBoxGlobal.height * GlobalState.AspectRatio;
    } else {
        // Portrait orientation
        width = viewBoxGlobal.width;  // Same arbitrary unit as above
        height = width / GlobalState.AspectRatio;
    }
    viewBoxGlobal.width = width;
    viewBoxGlobal.height = height;
    
    // Scale dependent values updated:
    updateStyleZoom();

    parentElement.setAttribute('viewBox', `${viewBoxGlobal.x} ${viewBoxGlobal.y} 
        ${viewBoxGlobal.width} ${viewBoxGlobal.height}`);
}

// Change GlobalState and GlobalElems styles when zooming:
export function updateStyleZoom() { // Called by updateViewBoxAspectRatio and scroll eventListener
    GlobalState.LineWidthDisplay = GlobalState.ViewBox.height / 500;
    GlobalState.CursorPrecision = GlobalState.CursorPrecisionFactor * GlobalState.ViewBox.height;

    let markWidth = 6; // Standard width before correction by GlobalState.LineWidthDisplay
    GlobalElems.CircleReusableElement.setAttribute("r", `${markWidth / 2 * GlobalState.LineWidthDisplay}`);
    GlobalElems.SquareReusableElement.setAttribute("width", `${markWidth * GlobalState.LineWidthDisplay}`);
    GlobalElems.SquareReusableElement.setAttribute("height", `${markWidth * GlobalState.LineWidthDisplay}`);
    GlobalElems.SquareReusableElement.setAttribute("x", `${-markWidth * GlobalState.LineWidthDisplay / 2}`);
    GlobalElems.SquareReusableElement.setAttribute("y", `${-markWidth * GlobalState.LineWidthDisplay / 2}`);
}

export function removeHoverHighlights() {
    try {
        GlobalState.ShapeMap.forEach(shape => { shape.highlightObject(false) });
        // Keep highlight in selected objects:
        GlobalState.SelectedShapes.forEach(shape => { shape.highlightObject(true) });
    } catch(error) {
        console.log(`err ${error}`);
        console.log(error.message);
    }
} 

