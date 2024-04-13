import { createSvgElement, setViewBox, initCoordsText } from './svg_utils.js';

const svgElement = document.getElementById("svgCanvas");

let clickCoordinatesGlobal = []; // Array to store coordinates globally
let coordsTextElementGlobal = initCoordsText(svgElement);  // This will reference the text element displaying the coordinates
let timeoutHandleGlobal = null;  // This will store the timeout handle
let viewBoxGlobal = { x: 0, y: 0, width: 400, height: 400 };

setViewBox(viewBoxGlobal.x, viewBoxGlobal.y, viewBoxGlobal.width, viewBoxGlobal.height, svgElement);

svgElement.addEventListener("click", function(event) {
    const svgPoint = cursorPoint(event, svgElement);
    const x = svgPoint.x;
    const y = svgPoint.y;

    // Update the coordinates in the text element at the bottom
    if (!coordsTextElementGlobal) {
        initCoordsText();
    }
    coordsTextElementGlobal.textContent = `${parseFloat(x).toFixed(1)}, ${parseFloat(y).toFixed(1)}`;

    // Store the coordinates in the global array
    clickCoordinatesGlobal.push({x: x, y: y});

    // Clear previous timeout and set a new one to clear the text
    if (timeoutHandleGlobal) {
        clearTimeout(timeoutHandleGlobal);
    }
    timeoutHandleGlobal = setTimeout(() => {
        coordsTextElementGlobal.textContent = "";
    }, 2000);
});

svgElement.addEventListener('wheel', function(event) {
    event.preventDefault();  // Prevent the page from scrolling
    const scaleFactor = 1.1;
    let newWidth, newHeight;
    if (event.deltaY < 0) {
        // Zoom in
        newWidth = viewBoxGlobal.width / scaleFactor;
        newHeight = viewBoxGlobal.height / scaleFactor;
    } else {
        // Zoom out
        newWidth = viewBoxGlobal.width * scaleFactor;
        newHeight = viewBoxGlobal.height * scaleFactor;
    }
    viewBoxGlobal.width = newWidth;
    viewBoxGlobal.height = newHeight;
    setViewBox(viewBoxGlobal.x, viewBoxGlobal.y, viewBoxGlobal.width, viewBoxGlobal.height, svgElement);
});



function cursorPoint(evt, svg) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}
