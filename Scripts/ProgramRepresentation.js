import * as Utils from "./Utils.js";
import { Expression } from "./Expression.js";
import * as Identifier from "./Identifier.js";
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
    error = Identifier.IdentifierError.None;
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
    nameError = Identifier.IdentifierError.None;
    returnError = Identifier.IdentifierError.None;
}
export class DeclarationInstruction extends ProgramNode {
    declaredVariables = [];
}
export class AssignmentInstruction extends ProgramNode {
    lvalue = new Expression();
    rvalue = new Expression();
}
export class InputInstruction extends ProgramNode {
    lvalue = new Expression();
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
export function StrToVarType(typeAsStr) {
    let varType = Utils.GetEnumValueFromName(VariableType, typeAsStr);
    if (varType === null)
        return VariableType.Void;
    return varType;
}
export function StrToBoolean(booleanAsStr) { return booleanAsStr === "True"; }
