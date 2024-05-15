export const GlobalState = {
    // SVG:
    ViewBox: { x: 0, y: 0, width: 400, height: 400 },
    TgtZoom: { x: 200, y: 200 },
    ZoomPosition: { x: 200, y: 200 },
    // CLI:
    CLITimeline: [], 
    CLIInputField: [],
    LastSuccessfulCmd: null,
    // Singleton class instances:
    ExecutionHistory: null, // Defined as a `CommandHistory` class instance in main.js
    PendingCommand: null, // Defined by `ShapeCommand` class instance, or similar, in command_exec.js
    // Working state:
    SelectedShapes: [],
    // Misc.
    TimeoutHandle: 0,

    Layers: null,

    ShapeMap: new Map(),
}

export const GlobalElems = {
    // SVG Canvas:
    SvgElement: document.getElementById("svgCanvas"),
    // CLI HTML Elements:
    CLIHistory: document.getElementById('cliHistory'),
    CommandLine: document.getElementById('cliInput'),
    // TEST TEXT:
    CoordsTextElem: {}, // Test SVG elem. created in main.js
}
