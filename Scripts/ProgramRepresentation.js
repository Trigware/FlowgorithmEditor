import * as Utils from "./Utils.js";
export class ProgramNode {
    subNodes = [];
}
var VariableType;
(function (VariableType) {
    VariableType[VariableType["Void"] = 0] = "Void";
    VariableType[VariableType["Integer"] = 1] = "Integer";
    VariableType[VariableType["Real"] = 2] = "Real";
    VariableType[VariableType["String"] = 3] = "String";
    VariableType[VariableType["Boolean"] = 4] = "Boolean";
})(VariableType || (VariableType = {}));
export class VariableDeclaration {
    type = VariableType.Void;
    isArray = false;
    arraySize = 0;
    variableName = "";
    static FromInfo(varName, declarationInfo) {
        let createdDeclaration = new VariableDeclaration();
        createdDeclaration.variableName = varName;
        createdDeclaration.type = declarationInfo.type;
        createdDeclaration.isArray = declarationInfo.isArray;
        createdDeclaration.arraySize = declarationInfo.arraySize;
        return createdDeclaration;
    }
}
export class Program extends ProgramNode {
    static Create() {
        let createdProgram = new Program();
        let mainFunction = new FunctionSignature();
        mainFunction.name = "Main";
        createdProgram.subNodes.push(mainFunction);
        return createdProgram;
    }
}
export class FunctionSignature extends ProgramNode {
    name = "";
    parameters = [];
    returnType = VariableType.Void;
    returnVariableName = "";
}
export class DeclarationInstruction extends ProgramNode {
    declaredVariables = [];
    error = DeclarationError.None;
}
export class AssignmentInstruction extends ProgramNode {
    variableName = "";
    assignedExpression = new Expression();
    arrayIndex = 0;
}
export class InputInstruction extends ProgramNode {
    variableName = "";
    arrayIndex = 0;
}
export class OutputInstruction extends ProgramNode {
    expression = new Expression();
}
export class ConditionalStatement extends ProgramNode {
    conditional = new Expression();
    thenNode = new ProgramNode();
    elseNode = new ProgramNode();
}
export class CallInstruction extends ProgramNode {
    functionName = "";
    arguments = [];
}
export class ForLoop extends ProgramNode {
    iteratorName = "";
    loopStart = 0;
    loopEnd = 0;
    isIncreasing = true;
    iterationStep = 1;
}
export class WhileLoop extends ProgramNode {
    expression = new Expression();
    isDoWhile = false;
}
export class Expression {
}
export function StrToVarType(typeAsStr) {
    let varType = Utils.GetEnumValueFromName(VariableType, typeAsStr);
    if (varType === null)
        return VariableType.Void;
    return varType;
}
export function StrToBoolean(booleanAsStr) { return booleanAsStr === "True"; }
export var DeclarationError;
(function (DeclarationError) {
    DeclarationError[DeclarationError["None"] = 0] = "None";
    DeclarationError[DeclarationError["NonAlphanumeric"] = 1] = "NonAlphanumeric";
    DeclarationError[DeclarationError["NumberAtStart"] = 2] = "NumberAtStart";
    DeclarationError[DeclarationError["ReservedWord"] = 3] = "ReservedWord";
    DeclarationError[DeclarationError["IntrinsicFunction"] = 4] = "IntrinsicFunction";
    DeclarationError[DeclarationError["MissingIdentifier"] = 5] = "MissingIdentifier";
})(DeclarationError || (DeclarationError = {}));
export function ParseDeclarationList(declaredVariablesStr) {
    let resultNames = [];
    let accumilatedStr = "";
    let declarationError = DeclarationError.None;
    for (let ch of declaredVariablesStr) {
        if (ch !== ',') {
            accumilatedStr += ch;
            continue;
        }
        declarationError = AddIdentifierToList(resultNames, accumilatedStr);
        if (declarationError !== DeclarationError.None)
            return declarationError;
        accumilatedStr = "";
    }
    declarationError = AddIdentifierToList(resultNames, accumilatedStr);
    if (declarationError !== DeclarationError.None)
        return declarationError;
    return resultNames;
}
function AddIdentifierToList(identifierList, identifierName) {
    identifierName = Utils.RemoveTrailingSpaces(identifierName);
    let identifierValidity = GetIdentifierValidity(identifierName);
    if (identifierValidity !== DeclarationError.None)
        return identifierValidity;
    identifierList.push(identifierName);
    return DeclarationError.None;
}
const reservedWords = ["and", "false", "mod", "not", "or", "pi", "true", "boolean", "integer", "real", "string"];
const intrinsicFunctions = [
    "abs", "arccos", "arcsin", "arctan", "char", "cos", "int", "len", "log", "log10", "random",
    "sgn", "sin", "size", "sqrt", "tan", "tochar", "tocode", "tofixed", "tointeger", "tostring", "toreal",
    "arccosh", "arcsinh", "arctanh", "cosh", "sinh", "tanh"
];
function GetIdentifierValidity(identifierName) {
    if (identifierName.length === 0)
        return DeclarationError.MissingIdentifier;
    for (let i = 0; i < identifierName.length; i++) {
        let ch = identifierName[i];
        let isLetter = Utils.IsLetter(ch);
        let isNumber = Utils.IsNumber(ch);
        let invalidChar = !isLetter && !isNumber;
        if (invalidChar)
            return DeclarationError.NonAlphanumeric;
        let hasNumberAtStart = i === 0 && isNumber;
        if (hasNumberAtStart)
            return DeclarationError.NumberAtStart;
    }
    let isReservedWord = reservedWords.includes(identifierName);
    if (isReservedWord)
        return DeclarationError.ReservedWord;
    let isIntrinsicFunction = intrinsicFunctions.includes(identifierName);
    if (isIntrinsicFunction)
        return DeclarationError.IntrinsicFunction;
    return DeclarationError.None;
}
