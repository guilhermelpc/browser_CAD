// Checks if a string can be converted to number:
export function isValidNumber(input) {
    // Append 0 to strings that end with '.' to simplify the regex:
    if (input.endsWith('.')) {
    input += '0';
    }

    const numberPattern = /^-?\d+(\.\d+)?$/; // If bad regex, GPT is to blame

    return numberPattern.test(input);
}


export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}