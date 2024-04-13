import { createSvgElement, initCoordsText, cursorPoint, updateViewBoxAspectRatio } from './svg_utils.js';

const svgElement = document.getElementById("svgCanvas");

let clickCoordinatesGlobal = [200, 200]; // Store last clicked coordinates globally
let coordsTextElementGlobal = initCoordsText(svgElement);  // Text element displaying the coordinates
let testTextElem = createSvgElement("text", {x:"50%",y:"50%", "text-anchor":"middle"}, svgElement);
testTextElem.textContent = "Teste";
let timeoutHandleGlobal = 0;  // Stores the timeout handle
let viewBoxGlobal = { x: 0, y: 0, width: 400, height: 400 }; // Initial coords -- will update during runtime
updateViewBoxAspectRatio(viewBoxGlobal, svgElement);

// Click functionality to store (and print) the last click coords
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

    const cursorPointBeforeZoom = cursorPoint(event, svgElement);

    // Base scale factor - determines how quickly the view zooms in and out:
    const baseScaleFactor = 1.3;

    // Calculate the dynamic scale factor based on scroll intensity
    let scrollIntensity = Math.min(Math.abs(event.deltaY), 50); // Math.min limits the max zoom speed
    let dynamicScaleFactor = Math.pow(baseScaleFactor, scrollIntensity / 50);

    let newWidth, newHeight, newX, newY;
    if (event.deltaY > 0) {// Zoom in - reduce the viewBox dimensions
        newWidth = viewBoxGlobal.width / dynamicScaleFactor;
        newHeight = viewBoxGlobal.height / dynamicScaleFactor;
        newX = cursorPointBeforeZoom.x - (cursorPointBeforeZoom.x - viewBoxGlobal.x) / dynamicScaleFactor;
        newY = cursorPointBeforeZoom.y - (cursorPointBeforeZoom.y - viewBoxGlobal.y) / dynamicScaleFactor;
    } else {// Zoom out - increase the viewBox dimensions
        newWidth = viewBoxGlobal.width * dynamicScaleFactor;
        newHeight = viewBoxGlobal.height * dynamicScaleFactor;
        newX = cursorPointBeforeZoom.x - (cursorPointBeforeZoom.x - viewBoxGlobal.x) * dynamicScaleFactor;
        newY = cursorPointBeforeZoom.y - (cursorPointBeforeZoom.y - viewBoxGlobal.y) * dynamicScaleFactor;
    }

    // Update the global viewBox dimensions
    viewBoxGlobal.x = newX;
    viewBoxGlobal.y = newY;
    viewBoxGlobal.width = newWidth;
    viewBoxGlobal.height = newHeight;

    // Update the SVG's viewBox attribute to apply the zoom
    svgElement.setAttribute('viewBox', `${viewBoxGlobal.x} ${viewBoxGlobal.y} 
        ${viewBoxGlobal.width} ${viewBoxGlobal.height}`);
});
