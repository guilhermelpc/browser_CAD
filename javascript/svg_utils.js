import { GlobalElems, GlobalState } from './global_state.js';
import { processInput } from './command_exec.js';

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
        GlobalState.LineWidthDisplay = GlobalState.ViewBox.width / 500;
    } else {
        // Portrait orientation
        width = viewBoxGlobal.width;  // Same arbitrary unit as above
        height = width / GlobalState.AspectRatio;
        GlobalState.LineWidthDisplay = GlobalState.ViewBox.height / 500;
    }
    viewBoxGlobal.width = width;
    viewBoxGlobal.height = height;
    parentElement.setAttribute('viewBox', `${viewBoxGlobal.x} ${viewBoxGlobal.y} 
        ${viewBoxGlobal.width} ${viewBoxGlobal.height}`);
}

function returnDistancesToShapes(coords) {
    let dists = [];
    // GlobalState.ShapeMap.forEach(shape => console.log(shape.getClickDistance(coords)));
    GlobalState.ShapeMap.forEach(shape => dists.push({id: shape.id, dist: shape.getClickDistance(coords)}));
    console.log(dists);

}

// Zoom functionality:
GlobalElems.SvgElement.addEventListener('wheel', function(event) {
    event.preventDefault();  // Prevent the page from scrolling
    const cursorPointPreZoom = getCursorCoords(event, GlobalElems.SvgElement);
    GlobalState.TgtZoom = { x: cursorPointPreZoom.x, y: cursorPointPreZoom.y };

    // // Checks for new zoom target:
    // if (event.clientX != GlobalState.ZoomPosition.x || event.clientY != GlobalState.ZoomPosition.y){
    //     // Window cursor position:
    //     GlobalState.ZoomPosition.x = event.clientX;
    //     GlobalState.ZoomPosition.y = event.clientY;
    //     // SVG cursor position:
    //     GlobalState.TgtZoom = { x: cursorPointPreZoom.x, y: cursorPointPreZoom.y };
    // }

    // Scroll intensity:
    const baseScaleFactor = 1.1;
    let scrollIntensity = Math.min(Math.abs(event.deltaY), 50);
    let dynamScaleFactor = Math.pow(baseScaleFactor, scrollIntensity / 50);

    let newWidth, newHeight, newX, newY;

    if (event.deltaY > 0) {
        // Zoom in (scroll up trackpad)
        newWidth = GlobalState.ViewBox.width / dynamScaleFactor;
        newHeight = GlobalState.ViewBox.height / dynamScaleFactor;
        newX = GlobalState.TgtZoom.x - (GlobalState.TgtZoom.x - GlobalState.ViewBox.x) / (dynamScaleFactor);
        newY = GlobalState.TgtZoom.y - (GlobalState.TgtZoom.y - GlobalState.ViewBox.y) / (dynamScaleFactor);
    } else {
        // Zoom out (scroll down trackpad)
        newWidth = GlobalState.ViewBox.width * dynamScaleFactor;
        newHeight = GlobalState.ViewBox.height * dynamScaleFactor;
        newX = GlobalState.TgtZoom.x - (GlobalState.TgtZoom.x - GlobalState.ViewBox.x) * (dynamScaleFactor);
        newY = GlobalState.TgtZoom.y - (GlobalState.TgtZoom.y - GlobalState.ViewBox.y) * (dynamScaleFactor);
    }

    GlobalState.ViewBox.x = newX;
    GlobalState.ViewBox.y = newY;
    GlobalState.ViewBox.width = newWidth;
    GlobalState.ViewBox.height = newHeight;

    // Update the SVG's viewBox attribute to apply the zoom
    GlobalElems.SvgElement.setAttribute('viewBox', `${GlobalState.ViewBox.x} ${GlobalState.ViewBox.y} 
        ${GlobalState.ViewBox.width} ${GlobalState.ViewBox.height}`);

    // Update stroke width:
    if (GlobalState.AspectRatio > 1) {
        GlobalState.LineWidthDisplay = GlobalState.ViewBox.width / 500;
    } else {
        GlobalState.LineWidthDisplay = GlobalState.ViewBox.height / 500;
    }
    GlobalState.ShapeMap.forEach(shape => { shape.updateDisplay(); });

});

// Mousedown functionality: 
// - if there are pending commands, processInput({x,y});
// - else, start object selection (by clicking or by drawing rectangle)
GlobalElems.SvgElement.addEventListener("mousedown", function(event) {
    event.preventDefault();
    const svgPoint = getCursorCoords(event, GlobalElems.SvgElement);
    const x = svgPoint.x;
    const y = svgPoint.y;
    // Use coords as input for any pending command:
    if (GlobalState.PendingCommand) {
        processInput({x,y});
    } else {
        returnDistancesToShapes({x,y});
    }

    // Test section: print click coordinates on screen:
    GlobalElems.CoordsTextElem.textContent = `${parseFloat(x).toFixed(1)}, ${parseFloat(y).toFixed(1)}`;
    clearTimeout(GlobalState.TimeoutHandle);
    GlobalState.TimeoutHandle = setTimeout(() => {GlobalElems.CoordsTextElem.textContent = "";}, 2000);
});

// Mouse