export const GlobalState = {
    ViewBox: { x: 0, y: 0, width: 400, height: 400 },
    TgtZoom: { x: 200, y: 200 },
    ZoomPosition: { x: 200, y: 200 },

    TimeoutHandle: 0,

    CLIHistoryList: [],
}

export const GlobalElems = {
    SvgElement: document.getElementById("svgCanvas"),
    CoordsTextElem: {}, // SVG elem. created in main
    CommandHistory: document.getElementById('commandHistory'),
    CommandLine: document.getElementById('commandLine'),
}