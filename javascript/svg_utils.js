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

    GlobalState.ShapeMap.forEach(shape => dists.push({shape, dist: shape.getClickDistance(coords)}));

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

    // Updates pending command in real time, and early return for no selection to occur:
    if (GlobalState.PendingCommand) {
        GlobalState.PendingCommand.shape.updateCoord({x,y});
        return;
    }

    // If mouse button is not being held
    if (!GlobalState.SelectionCoords) {
        // -- Highlight selection-preview for shapes here --
        let dists = returnDistancesToShapes(svgPoint);
        let closeShapes = [];
        dists.forEach(dist => {dist.dist < 3 * GlobalState.CursorPrecision ? closeShapes.push(dist) : null});
        if (closeShapes.length > 0) {
            dists.forEach(dist => {  });
            console.log(`shape hovered: ${closeShapes[0].shape.id}`)
        }

    // If mouse button is being held, draw rectangle:
    } else {
        // Ignore small movements (less than GlobalState.CursorPrecision):
        if (Math.abs(GlobalState.SelectionCoords.x) - Math.abs(svgPoint.x) > GlobalState.CursorPrecision ||
        Math.abs(GlobalState.SelectionCoords.y) - Math.abs(svgPoint.y) > GlobalState.CursorPrecision) {
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

    // Ignore small movements (less than GlobalState.CursorPrecision):
    if (Math.abs(GlobalState.SelectionCoords.x) - Math.abs(svgPointEnd.x) > GlobalState.CursorPrecision ||
        Math.abs(GlobalState.SelectionCoords.y) - Math.abs(svgPointEnd.y) > GlobalState.CursorPrecision) {
        // -- Consolidate rectangle-select here (add shapes to GlobalState.SelectedShapes here and delete rectangle) --

    
    // Click-select:
    } else {
        let dists = returnDistancesToShapes(GlobalState.SelectionCoords);
        let closeShapes = [];
        dists.forEach(dist => {dist.dist < 3 * GlobalState.CursorPrecision ? closeShapes.push(dist) : null});
        if (closeShapes.length === 0) {
            closeShapes = [];
        }
        if (closeShapes.length === 1) {
            console.log(`shape selected: ${closeShapes[0].shape.id}`)
            // -- add shapes to GlobalState.SelectedShapes here --

        }
    }

    GlobalState.SelectionCoords = null
});

// Prevent default context menu and text selection on right-click
GlobalElems.SvgElement.addEventListener('contextmenu', function(event) {
    event.preventDefault(); // Prevents the context menu from appearing
    cliInput.focus(); // Ensure the CLI input remains focused
});
