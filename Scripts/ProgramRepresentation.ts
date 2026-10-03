import * as Utils from "./Utils.js"

export class ProgramNode {
    public subNodes: ProgramNode[] = [];
}

enum VariableType { Void, Integer, Real, String, Boolean }

export class VariableDeclaration {
    public type: VariableType = VariableType.Void;
    public isArray: boolean = false;
    public arraySize: number = 0;
    public variableName: string = "";

    public static FromInfo(varName: string, declarationInfo: VariableDeclaration): VariableDeclaration {
        let createdDeclaration: VariableDeclaration = new VariableDeclaration();
        createdDeclaration.variableName = varName;
        createdDeclaration.type = declarationInfo.type;
        createdDeclaration.isArray = declarationInfo.isArray;
        createdDeclaration.arraySize = declarationInfo.arraySize;
        return createdDeclaration;
    }
}

export class Program extends ProgramNode {
    public static Create(): Program {
        let createdProgram: Program = new Program();
        let mainFunction: FunctionSignature = new FunctionSignature();
        mainFunction.name = "Main";

        createdProgram.subNodes.push(mainFunction);
        return createdProgram;
    }
}

export class FunctionSignature extends ProgramNode {
    public name: string = "";
    public parameters: VariableDeclaration[] = [];
    public returnType: VariableType = VariableType.Void;
    public returnVariableName: string = "";
}

export class DeclarationInstruction extends ProgramNode {
    public declaredVariables: VariableDeclaration[] = [];
    public error: DeclarationError = DeclarationError.None;
}

export class AssignmentInstruction extends ProgramNode {
    public variableName: string = "";
    public assignedExpression: Expression = new Expression();
    public arrayIndex: number = 0;
}

export class InputInstruction extends ProgramNode {
    public variableName: string = "";
    public arrayIndex: number = 0;
}

export class OutputInstruction extends ProgramNode {
    public expression: Expression = new Expression();
}

export class ConditionalStatement extends ProgramNode {
    public conditional: Expression = new Expression();
    public thenNode: ProgramNode = new ProgramNode();
    public elseNode: ProgramNode = new ProgramNode();
}

export class CallInstruction extends ProgramNode {
    public functionName: string = "";
    public arguments: Expression[] = [];
}

export class ForLoop extends ProgramNode {
    public iteratorName: string = "";
    public loopStart: number = 0; public loopEnd: number = 0;
    public isIncreasing: boolean = true;
    public iterationStep: number = 1;
}

export class WhileLoop extends ProgramNode {
    public expression: Expression = new Expression();
    public isDoWhile: boolean = false;
}

export class Expression {
    // tbd
}

export function StrToVarType(typeAsStr: string): VariableType {
    let varType: VariableType | null = Utils.GetEnumValueFromName(VariableType, typeAsStr);
    if (varType === null) return VariableType.Void;
    return varType;
}

export function StrToBoolean(booleanAsStr: string): boolean { return booleanAsStr === "True"; }

export enum DeclarationError {
    None,
    NonAlphanumeric, NumberAtStart, ReservedWord, IntrinsicFunction, MissingIdentifier
}

export function ParseDeclarationList(declaredVariablesStr: string): string[] | DeclarationError {
    let resultNames: string[] = [];
    let accumilatedStr: string = "";

    let declarationError: DeclarationError = DeclarationError.None;
    for (let ch of declaredVariablesStr) {
        if (ch !== ',') { accumilatedStr += ch; continue; }
        declarationError = AddIdentifierToList(resultNames, accumilatedStr);
        if (declarationError !== DeclarationError.None) return declarationError;
        accumilatedStr = "";
    }

    declarationError = AddIdentifierToList(resultNames, accumilatedStr);
    if (declarationError !== DeclarationError.None) return declarationError;
    return resultNames;
}

function AddIdentifierToList(identifierList: string[], identifierName: string): DeclarationError {
    identifierName = Utils.RemoveTrailingSpaces(identifierName);
    let identifierValidity: DeclarationError = GetIdentifierValidity(identifierName);
    if (identifierValidity !== DeclarationError.None) return identifierValidity;
    identifierList.push(identifierName);
    return DeclarationError.None;
}

const reservedWords: string[] = ["and", "false", "mod", "not", "or", "pi", "true", "boolean", "integer", "real", "string"];
const intrinsicFunctions: string[] = [
    "abs", "arccos", "arcsin", "arctan", "char", "cos", "int", "len", "log", "log10", "random",
    "sgn", "sin", "size", "sqrt", "tan", "tochar", "tocode", "tofixed", "tointeger", "tostring", "toreal",
    "arccosh", "arcsinh", "arctanh", "cosh", "sinh", "tanh"
];

function GetIdentifierValidity(identifierName: string): DeclarationError {
    if (identifierName.length === 0) return DeclarationError.MissingIdentifier;

    for (let i = 0; i < identifierName.length; i++) {
        let ch: string = identifierName[i];
        let isLetter: boolean = Utils.IsLetter(ch);
        let isNumber: boolean = Utils.IsNumber(ch);
        let invalidChar: boolean = !isLetter && !isNumber;
        if (invalidChar) return DeclarationError.NonAlphanumeric;

        let hasNumberAtStart: boolean = i === 0 && isNumber;
        if (hasNumberAtStart) return DeclarationError.NumberAtStart;
    }

    let isReservedWord: boolean = reservedWords.includes(identifierName);
    if (isReservedWord) return DeclarationError.ReservedWord;
    let isIntrinsicFunction: boolean = intrinsicFunctions.includes(identifierName);
    if (isIntrinsicFunction) return DeclarationError.IntrinsicFunction;

    return DeclarationError.None;
}