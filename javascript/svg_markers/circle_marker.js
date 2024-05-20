import { GlobalElems } from '../global_state.js';

export function generateCircleMarker() {
    const svgNS = "http://www.w3.org/2000/svg";
    // To be used with SVG 'use' element.
    GlobalElems.CircleReusableElement = document.createElementNS(svgNS, "circle");
    GlobalElems.CircleReusableElement.setAttribute("id", "circleReusableElement");
    GlobalElems.CircleReusableElement.setAttribute("cx", "0");
    GlobalElems.CircleReusableElement.setAttribute("cy", "0");
    // GlobalElems.CircleReusableElement.setAttribute("r", "3");
    GlobalElems.SvgElementDefs.appendChild(GlobalElems.CircleReusableElement);

    // Color has to be defined from the 'use' SVG element, and not from here.
}