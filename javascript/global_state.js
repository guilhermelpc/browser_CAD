export const GlobalState = {
    // SVG:
    AspectRatio: 1, // modified by svg_utils.js
    ViewBox: { x: 0, y: 0, width: 400, height: 400 }, // modified by svg_utils.js
    ZoomCoords: { x: 200, y: 200 }, // In SVG coordinates, modified by svg_utils.js
    SelectionCoords: null, // Stores the initial click coordinates for shape-selection
    CursorPrecisionFactor: 0.002, // Gets multiplied by screen height for dynamic scale
    CursorPrecision: (0.001 * 400), // Gets updated by svg_utils (update aspecratio and zoom functions)
    // CLI:
    CLITimeline: [], 
    CLIInputField: [],
    LastSuccessfulCmd: null,
    // Singleton class instances:
    ExecutionHistory: null, // Defined as a `CommandHistory` class instance by main.js
    PendingCommand: null, // Defined by `ShapeCommand` class instance, or similar, by command_exec.js
    // Working state:
    ShapeMap: new Map(),
    SelectedShapes: [],
    Layers: null,
    // Styles
    LineWidthDisplay: 2, // Updated by svg_utils.js (by updateViewBoxAspectRatio() and zoom functionality)
    // Misc.
    TimeoutHandle: 0,
}

export const GlobalElems = {
    // SVG Canvas:
    SvgElement: document.getElementById("svgCanvas"),
    // CLI HTML Elements:
    CLIHistory: document.getElementById('cliHistory'),
    CommandLine: document.getElementById('cliInput'),
    CliPrefix: document.getElementById('commandPrefix'),

    // TEST:
    CoordsTextElem: {}, // Text SVG elem. created in main.js
}
