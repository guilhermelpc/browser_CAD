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

export function setViewBox(x, y, width, height, parentElement) {
    parentElement.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
}

// Initialize the text element for displaying coordinates and append it to the SVG
export function initCoordsText(parentElement) {
    let coordsTextElement = createSvgElement("text", {x:"50%",y:"95%", "text-anchor":"middle"}, parentElement);
    coordsTextElement.textContent = "";
    return coordsTextElement;
}