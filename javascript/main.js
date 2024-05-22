import { GlobalElems, GlobalState } from './global_state.js';
import { generateMarkers, createSvgElement, updateViewBoxAspectRatio } from './svg_utils.js';
import { } from './cli_utils.js';
import { } from './mouse_utils.js';
import { CommandHistory } from './command_exec.js';

document.addEventListener("DOMContentLoaded", () => {
    generateMarkers();
    updateViewBoxAspectRatio(GlobalState.ViewBox, GlobalElems.SvgElement);
    
    GlobalState.ExecutionHistory = new CommandHistory();
    
    // Dev environment testing:
    if (window.location.port.includes('5500')) {
        // Test Fixed Text:
        const TestTextElemG = createSvgElement("text", {x:GlobalState.ViewBox.width/2,y:GlobalState.ViewBox.height/2, "text-anchor":"middle"}, GlobalElems.SvgElement);
        TestTextElemG.textContent = "Teste";
        // Test coords text:
        GlobalElems.CoordsTextElem = createSvgElement("text", {x:GlobalState.ViewBox.width/2,y:GlobalState.ViewBox.height/1.1, "text-anchor":"middle"}, GlobalElems.SvgElement);
        GlobalElems.CoordsTextElem.textContent = "";
    
        // console.log(GlobalState.ShapeMap);
    }
    
});
