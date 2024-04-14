let ViewBoxG = { x: 0, y: 0, width: 400, height: 400 };
let ZoomPositionG = { x: 200, y: 200 }
let TargetZoomG = { x: 200, y: 200 }

// Test Fixed Text:
const TestTextElemG = createSvgElement("text", {x:200,y:200, "text-anchor":"middle"}, svgElement);
TestTextElemG.textContent = "Teste";
// Test coords text:
let CoordsTextElemG = createSvgElement("text", {x:200,y:300, "text-anchor":"middle"}, svgElement);
CoordsTextElemG.textContent = "";

updateViewBoxAspectRatio(ViewBoxG, svgElement);
