import { GlobalElems, GlobalState } from '../global_state.js';
import { generateCircleMarker } from '../04_svg_markers/circle_marker.js';
import { generateSquareMarker } from '../04_svg_markers/square_marker.js';

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

export function changeBgColor(color) {
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    // Get all SVG elements in the document
    const svgElements = document.querySelectorAll('svg');
    
    // Iterate over each SVG element and change its background color
    svgElements.forEach(function(svg) {
        svg.style.backgroundColor = color;
    });
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

    // Update objects display
    GlobalState.ShapeMap.forEach(shape => { shape.updateDisplayZoom(); });
    // Update pending shape command if exists:
    if (GlobalState.PendingCommand?.shape !== undefined) {
        GlobalState.PendingCommand.shape.updateDisplayZoom();
    }
}
// Removes highlights, except on selected shapes:
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

export function applyZoom(newX, newY, newWidth, newHeight) {
    GlobalState.ViewBox.x = newX;
    GlobalState.ViewBox.y = newY;
    GlobalState.ViewBox.width = newWidth;
    GlobalState.ViewBox.height = newHeight;

    // Update the SVG's viewBox attribute to apply the zoom
    GlobalElems.SvgElement.setAttribute('viewBox', `${GlobalState.ViewBox.x} ${GlobalState.ViewBox.y} 
        ${GlobalState.ViewBox.width} ${GlobalState.ViewBox.height}`);

    // Scale dependent values updated:
    updateStyleZoom();
}

export function zoomAll() { // Returns coords (after zoom)
    
    // Early return if no object exists:
    if (GlobalState.ShapeMap.size === 0) { 
        return { 
            x: GlobalState.ViewBox.x, 
            y: GlobalState.ViewBox.y, 
            width: GlobalState.ViewBox.width, 
            height: GlobalState.ViewBox.height }; 
        }

    let globalXMin = Infinity;
    let globalYMin = Infinity;
    let globalXMax = -Infinity;
    let globalYMax = -Infinity;

    let zommExtents = [{x:-1, y:-1}, {x:1, y:1}]; // [{xMin, yMin}, {xMax, yMax}]
    GlobalState.ShapeMap.forEach(shape => {
        const shapeExtents = shape.getCoordExtents();
        const { xMin, yMin } = shapeExtents[0];
        const { xMax, yMax } = shapeExtents[1];

        if (xMin < globalXMin) globalXMin = xMin;
        if (yMin < globalYMin) globalYMin = yMin;
        if (xMax > globalXMax) globalXMax = xMax;
        if (yMax > globalYMax) globalYMax = yMax;
    });

    updateViewBoxAspectRatio(GlobalState.ViewBox, GlobalElems.SvgElement);

    let newWidth = globalXMax - globalXMin;
    let newHeight = globalYMax - globalYMin;

    const extraZFactor = 1.03; // Extra zooming so objects dont lie exactly on the edge of screen\

    // If new height is too small for aspect ratio, correct it:
    if (newWidth / newHeight >= GlobalState.AspectRatio) { 
        // Applying first the extra zoom factor
        globalXMin -= newWidth * (extraZFactor - 1) / 2;
        newWidth = newWidth * extraZFactor;
        // Correcting height with aspect ratio:
        newHeight = newWidth / GlobalState.AspectRatio;
        const diff = newHeight - (globalYMax - globalYMin);
        const newY = globalYMin - diff / 2;
        applyZoom(globalXMin, newY, newWidth, newHeight);
        // Return params so they can be stored in Zoom tool class for undo/redo:
        return { x: globalXMin, y: newY, width: newWidth, height: newHeight };

        // Else, correct width:
    } else { 
        // Applying first the extra zoom factor
        globalYMin -= newHeight * (extraZFactor - 1) / 2;
        newHeight = newHeight * extraZFactor;
        // Correcting width with aspect ratio:
        newWidth = newHeight * GlobalState.AspectRatio;
        const diff = newWidth - (globalXMax - globalXMin);
        const newX = globalXMin - diff / 2;
        applyZoom(newX, globalYMin, newWidth, newHeight);
        // Return params so they can be stored in Zoom tool class for undo/redo:
        return { x: newX, y: globalYMin, width: newWidth, height: newHeight };
    }
}