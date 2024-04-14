import { createSvgElement, initCoordsText, cursorPoint, updateViewBoxAspectRatio } from './svg_utils.js';

const svgElement = document.getElementById("svgCanvas");

let ClickCoordsG = [200, 200]; // Store last clicked coordinates globally
let ViewBoxG = { x: 0, y: 0, width: 400, height: 400 };
let ZoomPositionG = { x: 200, y: 200 }
let TargetZoomG = { x: 200, y: 200 }
let TimeoutHandleG = 0;
let CoordsTextElemG = initCoordsText(svgElement);  // Text element displaying the coordinates
let TestTextElemG = createSvgElement("text", {x:200,y:200, "text-anchor":"middle"}, svgElement);
TestTextElemG.textContent = "Teste";

updateViewBoxAspectRatio(ViewBoxG, svgElement);

// Click functionality to store (and print) the last click coords
svgElement.addEventListener("click", function(event) {
    const svgPoint = cursorPoint(event, svgElement);
    const x = svgPoint.x;
    const y = svgPoint.y;
    ClickCoordsG = [x, y];
    CoordsTextElemG.textContent = `${parseFloat(x).toFixed(1)}, ${parseFloat(y).toFixed(1)}`;
    // console.log(parseFloat(x).toFixed(2) + " " + parseFloat(x).toFixed(2))
    // console.log( "client X: " + event.clientX)
    
    clearTimeout(TimeoutHandleG);
    TimeoutHandleG = setTimeout(() => {
        CoordsTextElemG.textContent = "";
    }, 2000);
});

// Zoom functionality
svgElement.addEventListener('wheel', function(event) {
    event.preventDefault();  // Prevent the page from scrolling
    const cursorPointPreZoom = cursorPoint(event, svgElement);

    if (event.clientX != ZoomPositionG.x || event.clientY != ZoomPositionG.y){
        // Window cursor position:
        ZoomPositionG.x = event.clientX;
        ZoomPositionG.y = event.clientY;
        // SVG cursor position:
        TargetZoomG = { x: cursorPointPreZoom.x, y: cursorPointPreZoom.y };
    }  
    // SVG Coords:
    let center = {x: ViewBoxG.x + ViewBoxG.width/2, y: ViewBoxG.y + ViewBoxG.height/2 };
    let vectorTarget = { x: TargetZoomG.x - center.x, y: TargetZoomG.y - center.y };
    TargetZoomG.x -= 0.01*( TargetZoomG.x - center.x) / Math.sqrt(Math.abs(TargetZoomG.x**2 - center.x**2));
    TargetZoomG.y -= 0.01*( TargetZoomG.y - center.y ) / Math.sqrt(Math.abs(TargetZoomG.y**2 - center.y**2));

    // Scroll intensity:
    const baseScaleFactor = 1.1;
    let scrollIntensity = Math.min(Math.abs(event.deltaY), 50);
    let dynamScaleFactor = Math.pow(baseScaleFactor, scrollIntensity / 50);

    let newWidth, newHeight, newX, newY;

    if (event.deltaY > 0) {
        // Zoom in (scroll up trackpad)
        newWidth = ViewBoxG.width / dynamScaleFactor;
        newHeight = ViewBoxG.height / dynamScaleFactor;
        newX = (cursorPointPreZoom.x - (cursorPointPreZoom.x - ViewBoxG.x) / dynamScaleFactor) + 0.00001 * vectorTarget.x * newWidth/ dynamScaleFactor;
        newY = (cursorPointPreZoom.y - (cursorPointPreZoom.y - ViewBoxG.y) / dynamScaleFactor) + 0.00001 * vectorTarget.y * newHeight/ dynamScaleFactor;
        console.log(vectorTarget)
    } else {
        // Zoom out (scroll down trackpad)
        newWidth = ViewBoxG.width * dynamScaleFactor;
        newHeight = ViewBoxG.height * dynamScaleFactor;
        newX = (cursorPointPreZoom.x - (cursorPointPreZoom.x - ViewBoxG.x) * dynamScaleFactor)+ 0.00001 * vectorTarget.x * newWidth* dynamScaleFactor;
        newY = (cursorPointPreZoom.y - (cursorPointPreZoom.y - ViewBoxG.y) * dynamScaleFactor)+ 0.00001 * vectorTarget.y * newHeight* dynamScaleFactor;
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

const commandLine = document.getElementById('commandLine');
const commandHistory = document.getElementById('commandHistory');
let commandHistoryList = [];

document.addEventListener('keydown', function(event) {
    if (document.activeElement !== commandLine) {
        commandLine.focus();
    }
});

commandLine.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        let command = this.value;
        // Repeat last command if empty input:
        if (command == '') {
            if (commandHistoryList.slice(-1) != ''){
                console.log('repeat last command');
                command = commandHistoryList.slice(-1)
                this.value = command;
                return;
            } else {
                return;
            }
        }
        // Update command history
        updateCommandHistory(command);
        this.value = '';  // Clear the input after the command is entered
    }
});

function updateCommandHistory(command) {
    // Add the new command to the end of the history array
    commandHistoryList.push(command);
    // Display only the last 4 commands
    const lastFourCommands = commandHistoryList.slice(-4);  // Get the last 4 elements
    // Update the display, the newest command is at the bottom
    commandHistory.innerHTML = lastFourCommands.join('<br>');
}


