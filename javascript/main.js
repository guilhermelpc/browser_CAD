

// Test Fixed Text:
const TestTextElemG = createSvgElement("text", {x:200,y:200, "text-anchor":"middle"}, svgElement);
TestTextElemG.textContent = "Teste";
// Test coords text:
let CoordsTextElemG = createSvgElement("text", {x:200,y:300, "text-anchor":"middle"}, svgElement);
CoordsTextElemG.textContent = "";

updateViewBoxAspectRatio(ViewBoxG, svgElement);
