export const GlobalState = {
    ViewBox: { x: 0, y: 0, width: 400, height: 400 },
    TgtZoom: { x: 200, y: 200 },
    ZoomPosition: { x: 200, y: 200 },

    TimeoutHandle: 0,
}

export const GlobalElems = {
    SvgElement: document.getElementById("svgCanvas"),
    CoordsTextElem: {},

    commandHistory: document.getElementById('commandHistory'),
    commandLine: document.getElementById('commandLine'),
}