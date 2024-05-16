export const GlobalState = {
    // SVG:
    AspectRatio: 1, // modified by svg_utils.js
    ViewBox: { x: 0, y: 0, width: 400, height: 400 }, // modified by svg_utils.js
    TgtZoom: { x: 200, y: 200 }, // In SVG coordinates, modified by svg_utils.js
    ZoomPosition: { x: 200, y: 200 }, // In window coordinates, modified by svg_utils.js
    // CLI:
    CLITimeline: [], 
    CLIInputField: [],
    LastSuccessfulCmd: null,
    // Singleton class instances:
    ExecutionHistory: null, // Defined as a `CommandHistory` class instance in main.js
    PendingCommand: null, // Defined by `ShapeCommand` class instance, or similar, in command_exec.js
    // Working state:
    ShapeMap: new Map(),
    SelectedShapes: [],
    // Misc.
    TimeoutHandle: 0,

    Layers: null,

    LineWidthDisplay: 2,
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
