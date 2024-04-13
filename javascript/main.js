import { createSvgElement, setViewBox, initCoordsText, cursorPoint } from './svg_utils.js';

const svgElement = document.getElementById("svgCanvas");
let clickCoordinatesGlobal = [200, 200]; // Array to store coordinates globally
let coordsTextElementGlobal = initCoordsText(svgElement);  // This will reference the text element displaying the coordinates
let timeoutHandleGlobal = 0;  // This will store the timeout handle
let viewBoxGlobal = { x: 0, y: 0, width: 400, height: 400 };

setViewBox(viewBoxGlobal.x, viewBoxGlobal.y, viewBoxGlobal.width, viewBoxGlobal.height, svgElement);

// Click functionality to get click coords
svgElement.addEventListener("click", function(event) {
    const svgPoint = cursorPoint(event, svgElement);
    const x = svgPoint.x;
    const y = svgPoint.y;
    clickCoordinatesGlobal = [x, y];
    coordsTextElementGlobal.textContent = `${parseFloat(x).toFixed(1)}, ${parseFloat(y).toFixed(1)}`;
    console.log(parseFloat(x).toFixed(2) + " " + parseFloat(x).toFixed(2))
    
    clearTimeout(timeoutHandleGlobal);
    timeoutHandleGlobal = setTimeout(() => {
        coordsTextElementGlobal.textContent = "";
    }, 2000);
});

// Zoom functionality:
svgElement.addEventListener('wheel', function(event) {
    event.preventDefault();  // Prevent the page from scrolling

    // Base scale factor - determines how quickly the view zooms in and out
    const baseScaleFactor = 1.3;

    // Calculate the dynamic scale factor based on scroll intensity
    // The `Math.min` function ensures that extremely fast scrolls don't zoom too much
    let scrollIntensity = Math.min(Math.abs(event.deltaY), 50);
    let dynamicScaleFactor = Math.pow(baseScaleFactor, scrollIntensity / 50);

    let newWidth, newHeight;
    if (event.deltaY < 0) {
        // Zoom in - reduce the viewBox dimensions
        newWidth = viewBoxGlobal.width / dynamicScaleFactor;
        newHeight = viewBoxGlobal.height / dynamicScaleFactor;
    } else {
        // Zoom out - increase the viewBox dimensions
        newWidth = viewBoxGlobal.width * dynamicScaleFactor;
        newHeight = viewBoxGlobal.height * dynamicScaleFactor;
    }

    // Update the global viewBox dimensions
    viewBoxGlobal.width = newWidth;
    viewBoxGlobal.height = newHeight;

    // Update the SVG's viewBox attribute to apply the zoom
    setViewBox(viewBoxGlobal.x, viewBoxGlobal.y, viewBoxGlobal.width, viewBoxGlobal.height, svgElement);
});



