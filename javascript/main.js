import { GlobalElems, GlobalState } from './global_state.js';
import { createSvgElement, getCursorCoords, updateViewBoxAspectRatio } from './svg_utils.js';

updateViewBoxAspectRatio(GlobalState.ViewBox, GlobalElems.SvgElement);

// Test Fixed Text:
const TestTextElemG = createSvgElement("text", {x:GlobalState.ViewBox.width/2,y:GlobalState.ViewBox.height/2, "text-anchor":"middle"}, GlobalElems.SvgElement);
TestTextElemG.textContent = "Teste";
// Test coords text:
GlobalElems.CoordsTextElem = createSvgElement("text", {x:GlobalState.ViewBox.width/2,y:GlobalState.ViewBox.height/1.1, "text-anchor":"middle"}, GlobalElems.SvgElement);
GlobalElems.CoordsTextElem.textContent = "";