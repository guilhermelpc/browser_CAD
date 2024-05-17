import { GlobalElems, GlobalState } from './global_state.js';
import { processInput } from './command_exec.js';

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

// Get cursor SVG coords:
export function getCursorCoords(evt, svg) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;

    return pt.matrixTransform(svg.getScreenCTM().inverse()); // Transforms window coords to svg coords
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
    GlobalState.LineWidthDisplay = viewBoxGlobal.height / 500;
    GlobalState.CursorPrecision = GlobalState.CursorPrecisionFactor * viewBoxGlobal.height;
    
    parentElement.setAttribute('viewBox', `${viewBoxGlobal.x} ${viewBoxGlobal.y} 
        ${viewBoxGlobal.width} ${viewBoxGlobal.height}`);
}

function returnDistancesToShapes(coords) {
    let dists = [];
    // GlobalState.ShapeMap.forEach(shape => console.log(shape.getClickDistance(coords)));
    GlobalState.ShapeMap.forEach(shape => dists.push({id: shape.id, dist: shape.getClickDistance(coords)}));
    console.log(dists);
    return dists;
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
    GlobalState.LineWidthDisplay = GlobalState.ViewBox.height / 500;
    GlobalState.CursorPrecision = GlobalState.CursorPrecisionFactor * GlobalState.ViewBox.height;

    
    GlobalState.ShapeMap.forEach(shape => { shape.updateDisplay(); });
    if (GlobalState.PendingCommand) {
        GlobalState.PendingCommand.shape.updateDisplay();
    }
});

// Mousedown functionality: 
// - if there are pending commands, processInput({x,y});
// - else, start object selection (by clicking or by drawing rectangle)
GlobalElems.SvgElement.addEventListener("mousedown", function(event) {
    event.preventDefault();

    const svgPoint = getCursorCoords(event, GlobalElems.SvgElement);
    const x = svgPoint.x;
    const y = svgPoint.y;
    
    if (GlobalState.PendingCommand) {
        // Use coords as input for any pending command:
        processInput({x,y});
        GlobalState.SelectionCoords = null; // this variable is reset so no selection is triggered by mouseup or move eventlistener
        return;
    }

    GlobalState.SelectionCoords = { x: svgPoint.x, y: svgPoint.y };

    // Test section: print click coordinates on screen:
    // GlobalElems.CoordsTextElem.textContent = `${parseFloat(x).toFixed(1)}, ${parseFloat(y).toFixed(1)}`;
    // clearTimeout(GlobalState.TimeoutHandle);
    // GlobalState.TimeoutHandle = setTimeout(() => {GlobalElems.CoordsTextElem.textContent = "";}, 2000);
});

// - Mouse movement:
GlobalElems.SvgElement.addEventListener("mousemove", function(event) {
    const svgPoint = getCursorCoords(event, GlobalElems.SvgElement);
    const x = svgPoint.x;
    const y = svgPoint.y;

    if (GlobalState.PendingCommand) {
        GlobalState.PendingCommand.shape.updateCoord({x,y});
        return; // Early return for no selection to occur:
    }

    if (!GlobalState.SelectionCoords) { // If mouse button is not being held
        // Highlight selection-preview for shapes:

    } else {
        // Draw rectangle
        if (Math.abs(GlobalState.SelectionCoords.x) - Math.abs(svgPoint.x) > GlobalState.CursorPrecision ||
        Math.abs(GlobalState.SelectionCoords.y) - Math.abs(svgPoint.y) > GlobalState.CursorPrecision) {
            // console.log('selection rectangle update');
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
    
    if (Math.abs(GlobalState.SelectionCoords.x) - Math.abs(svgPointEnd.x) > GlobalState.CursorPrecision ||
        Math.abs(GlobalState.SelectionCoords.y) - Math.abs(svgPointEnd.y) > GlobalState.CursorPrecision) {
        // Rectangle-select:

    } else {
        // Click-select;
        let dists = returnDistancesToShapes(GlobalState.SelectionCoords);
        let closeShapes = [];
        dists.forEach(dist => {dist.dist < 3 * GlobalState.CursorPrecision ? closeShapes.push(dist) : null});
        if (closeShapes.length === 0) {
            closeShapes = [];
        }
        if (closeShapes.length === 1) {
            console.log(`shape selected: ${closeShapes[0].id}`)
        }
    }

    GlobalState.SelectionCoords = null
});
