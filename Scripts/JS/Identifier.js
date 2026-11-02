import * as Utils from "./Utils.js";
export var IdentifierError;
(function (IdentifierError) {
    IdentifierError[IdentifierError["None"] = 0] = "None";
    IdentifierError[IdentifierError["NonAlphanumeric"] = 1] = "NonAlphanumeric";
    IdentifierError[IdentifierError["NumberAtStart"] = 2] = "NumberAtStart";
    IdentifierError[IdentifierError["ReservedWord"] = 3] = "ReservedWord";
    IdentifierError[IdentifierError["IntrinsicFunction"] = 4] = "IntrinsicFunction";
    IdentifierError[IdentifierError["MissingIdentifier"] = 5] = "MissingIdentifier";
})(IdentifierError || (IdentifierError = {}));
export function ParseDeclarationList(declaredVariablesStr) {
    let resultNames = [];
    let accumilatedStr = "";
    let identifierError = IdentifierError.None;
    for (let ch of declaredVariablesStr) {
        if (ch !== ',') {
            accumilatedStr += ch;
            continue;
        }
        identifierError = AddIdentifierToList(resultNames, accumilatedStr);
        if (identifierError !== IdentifierError.None)
            return identifierError;
        accumilatedStr = "";
    }
    identifierError = AddIdentifierToList(resultNames, accumilatedStr);
    if (identifierError !== IdentifierError.None)
        return identifierError;
    return resultNames;
}
function AddIdentifierToList(identifierList, identifierName) {
    identifierName = Utils.RemoveTrailingSpaces(identifierName);
    let identifierValidity = GetIdentifierValidity(identifierName);
    if (identifierValidity !== IdentifierError.None)
        return identifierValidity;
    identifierList.push(identifierName);
    return IdentifierError.None;
}
const reservedWords = ["and", "false", "mod", "not", "or", "pi", "true", "boolean", "integer", "real", "string"];
const intrinsicFunctions = [
    "abs", "arccos", "arcsin", "arctan", "char", "cos", "eof", "int", "len", "log", "log10", "random",
    "sgn", "sin", "size", "sqrt", "tan", "tochar", "tocode", "tofixed", "tointeger", "tostring", "toreal",
    "arccosh", "arcsinh", "arctanh", "cosh", "sinh", "tanh"
];
export function GetIdentifierValidity(identifierName) {
    if (identifierName.length === 0)
        return IdentifierError.MissingIdentifier;
    for (let i = 0; i < identifierName.length; i++) {
        let ch = identifierName[i];
        let isLetter = Utils.IsLetter(ch);
        let isNumber = Utils.IsNumber(ch);
        let invalidChar = !isLetter && !isNumber;
        if (invalidChar)
            return IdentifierError.NonAlphanumeric;
        let hasNumberAtStart = i === 0 && isNumber;
        if (hasNumberAtStart)
            return IdentifierError.NumberAtStart;
    }
    identifierName = identifierName.toLowerCase();
    let isReservedWord = reservedWords.includes(identifierName);
    if (isReservedWord)
        return IdentifierError.ReservedWord;
    let isIntrinsicFunction = intrinsicFunctions.includes(identifierName);
    if (isIntrinsicFunction)
        return IdentifierError.IntrinsicFunction;
    return IdentifierError.None;
}
