import { GlobalElems, GlobalState } from './global_state.js';
import { createSvgElement, updateViewBoxAspectRatio } from './svg_utils.js';
import { } from './cli_utils.js';
import { CommandHistory } from './command_exec.js';

updateViewBoxAspectRatio(GlobalState.ViewBox, GlobalElems.SvgElement);

GlobalState.ExecutionHistory = new CommandHistory();
// GlobalState.Processor = new CommandProcessor(GlobalState.ExecutionHistory);
// console.log(GlobalState.ExecutionHistory);



// TESTES:
// Test Fixed Text:
const TestTextElemG = createSvgElement("text", {x:GlobalState.ViewBox.width/2,y:GlobalState.ViewBox.height/2, "text-anchor":"middle"}, GlobalElems.SvgElement);
TestTextElemG.textContent = "Teste";
// Test coords text:
GlobalElems.CoordsTextElem = createSvgElement("text", {x:GlobalState.ViewBox.width/2,y:GlobalState.ViewBox.height/1.1, "text-anchor":"middle"}, GlobalElems.SvgElement);
GlobalElems.CoordsTextElem.textContent = "";