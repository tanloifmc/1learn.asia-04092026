export function convertHollandCodeToVector(hollandCode: string): Record<string, number> {
  const defaultVector: Record<string, number> = {
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  };

  if (!hollandCode || typeof hollandCode !== 'string') {
    return defaultVector;
  }

  // Clean the input: uppercase and remove spaces/non-letters
  const code = hollandCode.toUpperCase().replace(/[^A-Z]/g, '');

  if (code.length === 0) {
    return defaultVector;
  }

  // Assign weights based on position
  // Vị trí 1 = 1.0, Vị trí 2 = 0.7, Vị trí 3 = 0.4
  const weights = [1.0, 0.7, 0.4];

  // We only care about the first 3 valid RIASEC characters
  let weightIndex = 0;
  for (let i = 0; i < code.length && weightIndex < 3; i++) {
    const char = code[i];
    if (defaultVector.hasOwnProperty(char)) {
      // Only assign if it hasn't been assigned yet (handle duplicates like 'AAA' -> R=0, I=0, A=1.0)
      if (defaultVector[char] === 0) {
        defaultVector[char] = weights[weightIndex];
        weightIndex++;
      }
    }
  }

  return defaultVector;
}
