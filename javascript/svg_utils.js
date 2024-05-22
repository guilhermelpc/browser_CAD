import { GlobalElems, GlobalState } from './global_state.js';
import { processInput } from './command_exec.js';
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

// Get cursor SVG coords:
export function getCursorCoords(evt, svg) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;

    return pt.matrixTransform(svg.getScreenCTM().inverse()); // Transforms window coords to svg coords
}
// Execute isSelected shape methods to indicate whether they're selected:
export function updateObjectSelection() { // Called by mouseUp eventListener. Also called by unselectShapes() in cli_utils.js;
    GlobalState.ShapeMap.forEach(shape => { shape.isSelected(false) });
    GlobalState.SelectedShapes.forEach(shape => { shape.isSelected(true) });
    removeHoverHighlights();
}

// Change GlobalState and GlobalElems styles when zooming:
function updateStyleZoom() { // Called by updateViewBoxAspectRatio and scroll eventListener
    GlobalState.LineWidthDisplay = GlobalState.ViewBox.height / 500;
    GlobalState.CursorPrecision = GlobalState.CursorPrecisionFactor * GlobalState.ViewBox.height;

    let markWidth = 6; // Standard width before correction by GlobalState.LineWidthDisplay
    GlobalElems.CircleReusableElement.setAttribute("r", `${markWidth / 2 * GlobalState.LineWidthDisplay}`);
    GlobalElems.SquareReusableElement.setAttribute("width", `${markWidth * GlobalState.LineWidthDisplay}`);
    GlobalElems.SquareReusableElement.setAttribute("height", `${markWidth * GlobalState.LineWidthDisplay}`);
    GlobalElems.SquareReusableElement.setAttribute("x", `${-markWidth * GlobalState.LineWidthDisplay / 2}`);
    GlobalElems.SquareReusableElement.setAttribute("y", `${-markWidth * GlobalState.LineWidthDisplay / 2}`);
}

function returnDistancesToShapes(coords) {
    let dists = [];

    GlobalState.ShapeMap.forEach(shape => dists.push({ shape: shape, dist: shape.getClickDistance(coords) }));

    return dists;
}

function removeHoverHighlights() {
    try {
        GlobalState.ShapeMap.forEach(shape => { shape.highlightObject(false) });
        // Keep highlight in selected objects:
        GlobalState.SelectedShapes.forEach(shape => { shape.highlightObject(true) });
    } catch(error) {
        console.log(`err ${error}`);
        console.log(error.message);
    }
} 

// Zoom functionality:
GlobalElems.SvgElement.addEventListener('wheel', function(event) {
    event.preventDefault();  // Prevent the page from scrolling
    const cursorPointPreZoom = getCursorCoords(event, GlobalElems.SvgElement);
    GlobalState.ZoomCoords = { x: cursorPointPreZoom.x, y: cursorPointPreZoom.y };
    
    // Scroll intensity:
    const baseScaleFactor = 1.1;
    let scrollIntensity = Math.min(Math.abs(event.deltaY), 50);
    let dynamScaleFactor = Math.pow(baseScaleFactor, scrollIntensity / 50);

    let newWidth, newHeight, newX, newY;

    if (event.deltaY > 0) {
        // Zoom in (scroll up trackpad)
        newWidth = GlobalState.ViewBox.width / dynamScaleFactor;
        newHeight = GlobalState.ViewBox.height / dynamScaleFactor;
        newX = GlobalState.ZoomCoords.x - (GlobalState.ZoomCoords.x - GlobalState.ViewBox.x) / (dynamScaleFactor);
        newY = GlobalState.ZoomCoords.y - (GlobalState.ZoomCoords.y - GlobalState.ViewBox.y) / (dynamScaleFactor);
    } else {
        // Zoom out (scroll down trackpad)
        newWidth = GlobalState.ViewBox.width * dynamScaleFactor;
        newHeight = GlobalState.ViewBox.height * dynamScaleFactor;
        newX = GlobalState.ZoomCoords.x - (GlobalState.ZoomCoords.x - GlobalState.ViewBox.x) * (dynamScaleFactor);
        newY = GlobalState.ZoomCoords.y - (GlobalState.ZoomCoords.y - GlobalState.ViewBox.y) * (dynamScaleFactor);
    }

    GlobalState.ViewBox.x = newX;
    GlobalState.ViewBox.y = newY;
    GlobalState.ViewBox.width = newWidth;
    GlobalState.ViewBox.height = newHeight;

    // Update the SVG's viewBox attribute to apply the zoom
    GlobalElems.SvgElement.setAttribute('viewBox', `${GlobalState.ViewBox.x} ${GlobalState.ViewBox.y} 
        ${GlobalState.ViewBox.width} ${GlobalState.ViewBox.height}`);

    // Scale dependent values updated:
    updateStyleZoom();

    // Update objects display
    GlobalState.ShapeMap.forEach(shape => { shape.updateDisplayZoom(); });
    if (GlobalState.PendingCommand?.shape !== undefined) {
        GlobalState.PendingCommand.shape.updateDisplayZoom();
    }
});

// Mousedown functionality: - if there are pending commands, processInput({x,y}); Else, start object selection (by clicking or by drawing rectangle)
GlobalElems.SvgElement.addEventListener("mousedown", function(event) {
    event.preventDefault();

    // Ignore right-click
    if (event.button !== 0) { return; }

    const svgPoint = getCursorCoords(event, GlobalElems.SvgElement);
    const x = svgPoint.x;
    const y = svgPoint.y;

    // Use coords as input for any pending command, and early return:
    if (GlobalState.PendingCommand) {
        processInput({x,y});
        GlobalState.SelectionCoords = null; // Resets variable so no selection is triggered by mouseup or move eventlistener
        return;
    }

    // Store click coords if there aren't pending commands:
    GlobalState.SelectionCoords = { x: svgPoint.x, y: svgPoint.y };

    if (GlobalState.SelectedShapes.length > 0) {
        // Check if click is on any grab-mark for shape-editing

    }

    // Test section: print click coordinates on screen:
    // GlobalElems.CoordsTextElem.textContent = `${parseFloat(x).toFixed(1)}, ${parseFloat(y).toFixed(1)}`;
    // clearTimeout(GlobalState.TimeoutHandle);
    // GlobalState.TimeoutHandle = setTimeout(() => {GlobalElems.CoordsTextElem.textContent = "";}, 2000);
});

// - Mouse movement:
GlobalElems.SvgElement.addEventListener("mousemove", function(event) {
    removeHoverHighlights();

    const svgPoint = getCursorCoords(event, GlobalElems.SvgElement);
    const x = svgPoint.x;
    const y = svgPoint.y;

    // If there's pending command, update it in real time, and early return for no selection to occur:
    if (GlobalState.PendingCommand) {
        try {
            GlobalState.PendingCommand.shape.updateCoord({x,y});
        } catch (error) {
            console.log(`err ${error}`);
        }
        return;
    }

    // If mouse button is not being held
    if (!GlobalState.SelectionCoords) {
        let dists = returnDistancesToShapes(svgPoint); // List like [{ shape: shape, dist: dist }, { shape: shape, dist: dist }]
        let closeShapes = []; // List like [{ shape: shape, dist: dist }, { shape: shape, dist: dist }]
        
        dists.forEach(dist => {dist.dist < 3 * GlobalState.CursorPrecision ? closeShapes.push(dist) : null});

        if (closeShapes.length > 0) {
            closeShapes.forEach(shape => { shape.shape.highlightObject(true) });
        } 

    // If mouse button is being held, draw rectangle:
    } else {
        const distX = GlobalState.SelectionCoords.x - svgPoint.x;
        const distY = GlobalState.SelectionCoords.y - svgPoint.y;

        if (Math.abs(distX) > GlobalState.CursorPrecision || Math.abs(distY) > GlobalState.CursorPrecision) {
            console.log('selection rectangle update');
            // -- Draw rectangle here --

        }
    }
});

// Release click button for object selection:
GlobalElems.SvgElement.addEventListener("mouseup", function(event) {
    event.preventDefault();

    // Early return in the cases that no selection should occur:
    if (GlobalState.PendingCommand) { return; }
    if (!GlobalState.SelectionCoords) { return; }

    const svgPointEnd = getCursorCoords(event, GlobalElems.SvgElement);

    // Draw rectangle (if movement is greater than GlobalState.CursorPrecision):
    const distX = GlobalState.SelectionCoords.x - svgPointEnd.x;
    const distY = GlobalState.SelectionCoords.y - svgPointEnd.y;
    if (Math.abs(distX) > GlobalState.CursorPrecision || Math.abs(distY) > GlobalState.CursorPrecision) {
        // -- Consolidate rectangle-select here (add shapes to GlobalState.SelectedShapes here and delete rectangle) --

    // Click-select:
    } else {
        let dists = returnDistancesToShapes(GlobalState.SelectionCoords); // List like [{ shape: shape, dist: dist }, { shape: shape, dist: dist }]
        let closeShapes = [];
        dists.forEach(dist => {dist.dist < 3 * GlobalState.CursorPrecision ? closeShapes.push(dist) : null});
        if (closeShapes.length === 0) {
            // closeShapes = [];
            // GlobalState.SelectedShapes = [];
        } else if (closeShapes.length === 1) {
            // Add selected shape to GlobalState.SelectedShapes, if not already included:
            if (!GlobalState.SelectedShapes.includes(closeShapes[0].shape)) {
                GlobalState.SelectedShapes.push(closeShapes[0].shape);
            }
            console.log(`shape selected: ${closeShapes[0].shape.id}`);
        } else {
            console.log(`Warning: more than one object clicked simultaneously`);
        }

        updateObjectSelection();
    }

    GlobalState.SelectionCoords = null
});

// Prevent default context menu:
GlobalElems.SvgElement.addEventListener('contextmenu', function(event) {
    event.preventDefault(); // Prevents the context menu from appearing
    cliInput.focus(); // Ensure the CLI input remains focused
});
