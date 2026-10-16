import * as Utils from "./Utils.js"

export enum IdentifierError {
    None,
    NonAlphanumeric, NumberAtStart, ReservedWord, IntrinsicFunction, MissingIdentifier
}

export function ParseDeclarationList(declaredVariablesStr: string): string[] | IdentifierError {
    let resultNames: string[] = [];
    let accumilatedStr: string = "";

    let identifierError: IdentifierError = IdentifierError.None;
    for (let ch of declaredVariablesStr) {
        if (ch !== ',') { accumilatedStr += ch; continue; }
        identifierError = AddIdentifierToList(resultNames, accumilatedStr);
        if (identifierError !== IdentifierError.None) return identifierError;
        accumilatedStr = "";
    }

    identifierError = AddIdentifierToList(resultNames, accumilatedStr);
    if (identifierError !== IdentifierError.None) return identifierError;
    return resultNames;
}

function AddIdentifierToList(identifierList: string[], identifierName: string): IdentifierError {
    identifierName = Utils.RemoveTrailingSpaces(identifierName);
    let identifierValidity: IdentifierError = GetIdentifierValidity(identifierName);
    if (identifierValidity !== IdentifierError.None) return identifierValidity;
    identifierList.push(identifierName);
    return IdentifierError.None;
}

const reservedWords: string[] = ["and", "false", "mod", "not", "or", "pi", "true", "boolean", "integer", "real", "string"];
const intrinsicFunctions: string[] = [
    "abs", "arccos", "arcsin", "arctan", "char", "cos", "eof", "int", "len", "log", "log10", "random",
    "sgn", "sin", "size", "sqrt", "tan", "tochar", "tocode", "tofixed", "tointeger", "tostring", "toreal",
    "arccosh", "arcsinh", "arctanh", "cosh", "sinh", "tanh"
];

export function GetIdentifierValidity(identifierName: string): IdentifierError {
    if (identifierName.length === 0) return IdentifierError.MissingIdentifier;

    for (let i = 0; i < identifierName.length; i++) {
        let ch: string = identifierName[i];
        let isLetter: boolean = Utils.IsLetter(ch);
        let isNumber: boolean = Utils.IsNumber(ch);
        let invalidChar: boolean = !isLetter && !isNumber;
        if (invalidChar) return IdentifierError.NonAlphanumeric;

        let hasNumberAtStart: boolean = i === 0 && isNumber;
        if (hasNumberAtStart) return IdentifierError.NumberAtStart;
    }

    identifierName = identifierName.toLowerCase();
    let isReservedWord: boolean = reservedWords.includes(identifierName);
    if (isReservedWord) return IdentifierError.ReservedWord;
    let isIntrinsicFunction: boolean = intrinsicFunctions.includes(identifierName);
    if (isIntrinsicFunction) return IdentifierError.IntrinsicFunction;

    return IdentifierError.None;
}