updateViewBoxAspectRatio(ViewBoxG, svgElement);

// Test Fixed Text:
const TestTextElemG = createSvgElement("text", {x:ViewBoxG.width/2,y:ViewBoxG.height/2, "text-anchor":"middle"}, svgElement);
TestTextElemG.textContent = "Teste";
// Test coords text:
let CoordsTextElemG = createSvgElement("text", {x:ViewBoxG.width/2,y:ViewBoxG.height/1.1, "text-anchor":"middle"}, svgElement);
CoordsTextElemG.textContent = "";
