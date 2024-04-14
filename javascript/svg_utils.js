export function createSvgElement(elementName, attributes, parentElement, innerHTML = null) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", elementName);

    for (const [key, value] of Object.entries(attributes)) {
        element.setAttributeNS(null, key, value);
    }

    if (innerHTML) {
        element.innerHTML = innerHTML;
    }

    parentElement.appendChild(element);
    return element;
}

export function initCoordsText(parentElement) {
    let coordsTextElement = createSvgElement("text", {x:200,y:300, "text-anchor":"middle"}, parentElement);
    coordsTextElement.textContent = "";
    return coordsTextElement;
}

export function cursorPoint(evt, svg) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    // console.log(pt.matrixTransform(svg.getScreenCTM().inverse()));
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

export function updateViewBoxAspectRatio(viewBoxGlobal, parentElement) {
    const aspectRatio = window.innerWidth / window.innerHeight;
    let width, height;
    // Decide whether to match the width or the height to the window
    if (aspectRatio > 1) {
        // Landscape orientation
        height = viewBoxGlobal.height;  // Arbitrary unit; you can set this based on your needs
        width = viewBoxGlobal.height * aspectRatio;
    } else {
        // Portrait orientation
        width = viewBoxGlobal.width;  // Same arbitrary unit as above
        height = width / aspectRatio;
    }
    viewBoxGlobal.width = width;
    viewBoxGlobal.height = height;
    parentElement.setAttribute('viewBox', `${viewBoxGlobal.x} ${viewBoxGlobal.y} 
        ${viewBoxGlobal.width} ${viewBoxGlobal.height}`);
}
