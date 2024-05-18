import { GlobalElems } from '../global_state.js';

export function generateCircleMarker() {
    const svgNS = "http://www.w3.org/2000/svg";

    GlobalElems.CircleMarker = document.createElementNS(svgNS, "marker");
    GlobalElems.CircleMarker.setAttribute("id", "circleMarker");
    GlobalElems.CircleMarker.setAttribute("viewBox", "0 0 10 10");
    GlobalElems.CircleMarker.setAttribute("refX", "5");
    GlobalElems.CircleMarker.setAttribute("refY", "5");
    GlobalElems.CircleMarker.setAttribute("markerWidth", "10");
    GlobalElems.CircleMarker.setAttribute("markerHeight", "10");
    GlobalElems.CircleMarker.setAttribute("orient", "auto");

    // Create the circle element for the marker
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("class", "cue-circle");
    circle.setAttribute("cx", "5");
    circle.setAttribute("cy", "5");
    circle.setAttribute("r", "3");
    circle.setAttribute("fill", "blue");

    GlobalElems.CircleMarker.appendChild(circle);

    GlobalElems.SvgElementDefs.appendChild(GlobalElems.CircleMarker);
}

