const svgElement = document.getElementById("svgCanvas");
let ViewBoxG = { x: 0, y: 0, width: 400, height: 400 };
let ZoomPositionG = { x: 200, y: 200 };

function createSvgElement(elementName, attributes, parentElement, innerHTML = null) {
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
function getCursorCoords(evt, svg) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    // console.log(pt.matrixTransform(svg.getScreenCTM().inverse()));
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

// Executed when the main code starts:
function updateViewBoxAspectRatio(viewBoxGlobal, parentElement) {
    const aspectRatio = window.innerWidth / window.innerHeight;
    let width, height;
    // Decide whether to match the width or the height to the window
    if (aspectRatio > 1) {
        // Landscape orientation
        height = viewBoxGlobal.height;  // Arbitrary unit; you can set this based on your needs
        width = viewBoxGlobal.height * aspectRatio;
    } else {
        // Portrait orientation
        width = viewBoxGlobal.width;  // Same arbitrary unit as above
        height = width / aspectRatio;
    }
    viewBoxGlobal.width = width;
    viewBoxGlobal.height = height;
    parentElement.setAttribute('viewBox', `${viewBoxGlobal.x} ${viewBoxGlobal.y} 
        ${viewBoxGlobal.width} ${viewBoxGlobal.height}`);
}

// Zoom functionality:
svgElement.addEventListener('wheel', function(event) {
    event.preventDefault();  // Prevent the page from scrolling
    const cursorPointPreZoom = getCursorCoords(event, svgElement);

    let center = { x: ViewBoxG.x + ViewBoxG.width/2, y: ViewBoxG.y + ViewBoxG.height/2 };

    // Checks for new zoom target:
    if (event.clientX != ZoomPositionG.x || event.clientY != ZoomPositionG.y){
        // Window cursor position:
        ZoomPositionG.x = event.clientX;
        ZoomPositionG.y = event.clientY;
        // SVG cursor position:
        TargetZoomG = { x: cursorPointPreZoom.x, y: cursorPointPreZoom.y };
        // SVG Coords target position referenced by screen center:
    }

    // Scroll intensity:
    const baseScaleFactor = 1.1;
    let scrollIntensity = Math.min(Math.abs(event.deltaY), 50);
    let dynamScaleFactor = Math.pow(baseScaleFactor, scrollIntensity / 50);

    let newWidth, newHeight, newX, newY;

    if (event.deltaY > 0) {
        // Zoom in (scroll up trackpad)
        newWidth = ViewBoxG.width / dynamScaleFactor;
        newHeight = ViewBoxG.height / dynamScaleFactor;
        newX = TargetZoomG.x - (TargetZoomG.x - ViewBoxG.x) / (dynamScaleFactor);// + 0.00001 * vectorTgtCenterDist.x * newWidth/ dynamScaleFactor;
        newY = TargetZoomG.y - (TargetZoomG.y - ViewBoxG.y) / (dynamScaleFactor);// + 0.00001 * vectorTgtCenterDist.y * newHeight/ dynamScaleFactor;
    } else {
        // Zoom out (scroll down trackpad)
        newWidth = ViewBoxG.width * dynamScaleFactor;
        newHeight = ViewBoxG.height * dynamScaleFactor;
        newX = center.x - (center.x - ViewBoxG.x) * (dynamScaleFactor);//+ 0.00001 * vectorTgtCenterDist.x * newWidth/(dynamScaleFactor);
        newY = center.y - (center.y - ViewBoxG.y) * (dynamScaleFactor);//+ 0.00001 * vectorTgtCenterDist.y * newHeight/(dynamScaleFactor);
    }

    // console.log(zoomTrgtB)
    ViewBoxG.x = newX;
    ViewBoxG.y = newY;
    ViewBoxG.width = newWidth;
    ViewBoxG.height = newHeight;

    // Update the SVG's viewBox attribute to apply the zoom
    svgElement.setAttribute('viewBox', `${ViewBoxG.x} ${ViewBoxG.y} 
        ${ViewBoxG.width} ${ViewBoxG.height}`);
});

// Test click functionality to print the last click coords
let TimeoutHandleG = 0;
svgElement.addEventListener("click", function(event) {
    const svgPoint = getCursorCoords(event, svgElement);
    const x = svgPoint.x;
    const y = svgPoint.y;
    CoordsTextElemG.textContent = `${parseFloat(x).toFixed(1)}, ${parseFloat(y).toFixed(1)}`;
    
    clearTimeout(TimeoutHandleG);
    TimeoutHandleG = setTimeout(() => {
        CoordsTextElemG.textContent = "";
    }, 2000);
});
