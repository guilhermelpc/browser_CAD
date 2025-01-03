import { GlobalElems, GlobalState } from '../global_state.js';
import { processInput, updateObjectSelection } from './command_exec.js';
import { removeHoverHighlights, applyZoom } from './svg_utils.js'

// Handles command input called by click:
function submitInputMouse(inputCmd, repeat=false) {
    GlobalElems.CommandLine.value = '';
    processInput(inputCmd, repeat);
    return;
}

// Get cursor SVG coords:
function getCursorCoords(evt, svg) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;

    return pt.matrixTransform(svg.getScreenCTM().inverse()); // Transforms window coords to svg coords
}

function returnDistancesToShapes(coords) {
    let dists = [];

    GlobalState.ShapeMap.forEach(shape => dists.push({ shape: shape, dist: shape.getClickDistance(coords) }));

    return dists;
}

// Mousedown functionality: - if there are pending commands, processInput({x,y}); Else, start object selection (by clicking or by drawing rectangle)
GlobalElems.SvgElement.addEventListener("mousedown", function(event) {
    event.preventDefault();

    // Ignore right-click
    if (event.button !== 0) { return; }

    GlobalState.LastCursorCoords = getCursorCoords(event, GlobalElems.SvgElement);

    // Use coords as input for any pending shape 'coord' command, and early returns if it exists:
    if (GlobalState.PendingCommand && GlobalState.PendingCommand.pendingCmdType.includes('coord')) {
        submitInputMouse({ x: GlobalState.LastCursorCoords.x, y: GlobalState.LastCursorCoords.y});
        GlobalState.SelectionCoords = null; // Resets variable so no selection is triggered by mouseup or move eventlistener
        return;
    }

    // Store click coords for selection if not early-returned above:
    GlobalState.SelectionCoords = { x: GlobalState.LastCursorCoords.x, y: GlobalState.LastCursorCoords.y};

    if (GlobalState.SelectedShapes.length > 0) {
        // Check if click is on any grab-mz ark for shape-editing
        // ...

    }
});

// Mouse movement:
GlobalElems.SvgElement.addEventListener("mousemove", function(event) {
    removeHoverHighlights();

    GlobalState.LastCursorCoords = getCursorCoords(event, GlobalElems.SvgElement);

    // If there's pending command, update it in real time, and early return for no selection to occur:
    if (GlobalState.PendingCommand && GlobalState.PendingCommand.pendingCmdType.includes('coord')) {
        try {
            GlobalState.PendingCommand.updateCoord({ x: GlobalState.LastCursorCoords.x, y: GlobalState.LastCursorCoords.y});
        } catch (error) {
            console.log(`err ${error}`);
        }
        return;
    }
    // If mouse button is not being held (and there's no pending 'coord' command, as it would early-return above),
    // highlight close objects:
    if (!GlobalState.SelectionCoords) {
        let dists = returnDistancesToShapes(GlobalState.LastCursorCoords); // List like [{ shape: shape, dist: dist }, { shape: shape, dist: dist }]
        let closeShapes = []; // List like [{ shape: shape, dist: dist }, { shape: shape, dist: dist }]
        
        dists.forEach(dist => {dist.dist < 3 * GlobalState.CursorPrecision ? closeShapes.push(dist) : null});

        if (closeShapes.length > 0) {
            closeShapes.forEach(shape => { shape.shape.highlightObject(true) });
        } 

    // If mouse button is being held, draw rectangle:
    } else {
        const distX = GlobalState.SelectionCoords.x - GlobalState.LastCursorCoords.x;
        const distY = GlobalState.SelectionCoords.y - GlobalState.LastCursorCoords.y;

        if (Math.abs(distX) > GlobalState.CursorPrecision || Math.abs(distY) > GlobalState.CursorPrecision) {
            console.log('selection rectangle update');
            // Start and update rectangle drawing here
            // ...

        }
    }
});

// Release click button for object selection:
GlobalElems.SvgElement.addEventListener("mouseup", function(event) {
    event.preventDefault();

    // Early return in the cases that no selection should occur:
    if (!GlobalState.SelectionCoords) { return; }

    const svgPointEnd = getCursorCoords(event, GlobalElems.SvgElement);

    // Draw rectangle (if movement is greater than GlobalState.CursorPrecision):
    const distX = GlobalState.SelectionCoords.x - svgPointEnd.x;
    const distY = GlobalState.SelectionCoords.y - svgPointEnd.y;
    if (Math.abs(distX) > GlobalState.CursorPrecision || Math.abs(distY) > GlobalState.CursorPrecision) {
        // Consolidate rectangle-select here (add shapes to GlobalState.SelectedShapes here and delete rectangle)
        // ...

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

// Scroll (zoom) functionality:
GlobalElems.SvgElement.addEventListener('wheel', function(event) {
    event.preventDefault();  // Prevent the page from scrolling
    const cursorPointPreZoom = getCursorCoords(event, GlobalElems.SvgElement);
    GlobalState.LastCursorCoords = { x: cursorPointPreZoom.x, y: cursorPointPreZoom.y };
    
    // Scroll intensity:
    const baseScaleFactor = 1.1;
    let scrollIntensity = Math.min(Math.abs(event.deltaY), 50);
    let dynamScaleFactor = Math.pow(baseScaleFactor, scrollIntensity / 50);

    let newWidth, newHeight, newX, newY;

    if (event.deltaY > 0) {
        // Zoom in (scroll up trackpad)
        newWidth = GlobalState.ViewBox.width / dynamScaleFactor;
        newHeight = GlobalState.ViewBox.height / dynamScaleFactor;
        newX = GlobalState.LastCursorCoords.x - (GlobalState.LastCursorCoords.x - GlobalState.ViewBox.x) / (dynamScaleFactor);
        newY = GlobalState.LastCursorCoords.y - (GlobalState.LastCursorCoords.y - GlobalState.ViewBox.y) / (dynamScaleFactor);
    } else {
        // Zoom out (scroll down trackpad)
        newWidth = GlobalState.ViewBox.width * dynamScaleFactor;
        newHeight = GlobalState.ViewBox.height * dynamScaleFactor;
        newX = GlobalState.LastCursorCoords.x - (GlobalState.LastCursorCoords.x - GlobalState.ViewBox.x) * (dynamScaleFactor);
        newY = GlobalState.LastCursorCoords.y - (GlobalState.LastCursorCoords.y - GlobalState.ViewBox.y) * (dynamScaleFactor);
    }

    applyZoom(newX, newY, newWidth,newHeight);
});