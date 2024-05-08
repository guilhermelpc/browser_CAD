export const GlobalState = {
    ViewBox: { x: 0, y: 0, width: 400, height: 400 },
    TgtZoom: { x: 200, y: 200 },
    ZoomPosition: { x: 200, y: 200 },

    TimeoutHandle: 0,

    CLIHistoryList: [],

    ExecutionHistory: null, // Defined as a `CommandHistory` class instance by main.js

    PendingCommand: null,

    SelectedShapes: [],
}

export const GlobalElems = {
    SvgElement: document.getElementById("svgCanvas"),
    CoordsTextElem: {}, // SVG elem. created in main.js
    CommandHistory: document.getElementById('commandHistory'),
    CommandLine: document.getElementById('commandLine'),
}