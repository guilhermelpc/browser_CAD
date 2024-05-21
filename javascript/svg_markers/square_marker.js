import { GlobalElems } from '../global_state.js';

export function generateSquareMarker() {
    const svgNS = "http://www.w3.org/2000/svg";
    // To be used with SVG 'use' element.
    GlobalElems.SquareReusableElement = document.createElementNS(svgNS, "rect");
    GlobalElems.SquareReusableElement.setAttribute("id", "SquareReusableElement");
    GlobalElems.SvgElementDefs.appendChild(GlobalElems.SquareReusableElement);

    // Color, width and heigth have to be defined from the 'use' SVG element, and not from here.
}