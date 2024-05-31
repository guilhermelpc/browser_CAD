export function isValidNumber(input) {
    // Append 0 to strings ending with dot:
    if (input.endsWith('.')) {
    input += '0';
    }

    const numberPattern = /^-?\d+(\.\d+)?$/;

    return numberPattern.test(input);
}


export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }