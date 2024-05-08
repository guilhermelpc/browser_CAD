export const GlobalState = {
    ViewBox: { x: 0, y: 0, width: 400, height: 400 },
    TgtZoom: { x: 200, y: 200 },
    ZoomPosition: { x: 200, y: 200 },

    CLITimeline: [], // [[a, b],[a, b], ...] where `a` is successful command flag, and b is command text

    LastSuccessfulCmd: null,

    CLIInputField: [],

    ExecutionHistory: null, // Defined as a `CommandHistory` class instance in main.js

    PendingCommand: null, // Defined by `ShapeCommand` class instance, or similar, in command_exec.js

    SelectedShapes: [],

    TimeoutHandle: 0,

    // StrokeWidth: 1,
}

export const GlobalElems = {
    SvgElement: document.getElementById("svgCanvas"),

    CLIHistory: document.getElementById('cliHistory'),
    CommandLine: document.getElementById('cliInput'),

    CoordsTextElem: {}, // Test SVG elem. created in main.js
}