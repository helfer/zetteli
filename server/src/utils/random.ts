const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+_";
const allowedChars = new Map();
for (var i = 0, len = alphabet.length; i < len; i++) {
    allowedChars.set(alphabet.charAt(i), true);
}
export function isValidStackId(str: string) {
    if (str.length !== 16) {
        return false;
    }
    for (var i = 0, len = str.length; i < len; i++) {
        if (!allowedChars.has(str.charAt(i))) {
            return false;
        }
    }
    return true;
}

console.log('test', isValidStackId('afefd'));
console.log('test', isValidStackId('aaaaaaaaaaaaaaaa'));
console.log('test', isValidStackId('aaaaaaaaaaaaaaa&'));