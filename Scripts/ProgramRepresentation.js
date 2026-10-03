import * as Utils from "./Utils.js";
export class Program {
    availableFunctions = [];
    constructor() {
        let mainFunction = new FunctionSignature();
        mainFunction.name = "Main";
    }
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
}
export class FunctionSignature {
    name = "";
    parameters = [];
    returnType = VariableType.Void;
    returnVariableName = "";
    instructions = [];
}
export class Instruction {
}
export class DeclarationInstruction extends Instruction {
    declaredVariables = [];
}
export class AssignmentInstruction extends Instruction {
    variableName = "";
    assignedExpression = new Expression();
    arrayIndex = 0;
}
export class InputInstruction extends Instruction {
    variableName = "";
    arrayIndex = 0;
}
export class OutputInstruction extends Instruction {
    expression = new Expression();
}
export class ConditionalStatement extends Instruction {
    conditional = new Expression();
    thenInstructions = [];
    elseInstructions = [];
}
export class CallInstruction extends Instruction {
    functionName = "";
    arguments = [];
}
export class ForLoop extends Instruction {
    iteratorName = "";
    loopStart = 0;
    loopEnd = 0;
    isIncreasing = true;
    iterationStep = 1;
}
export class WhileLoop extends Instruction {
    expression = new Expression();
    instructions = [];
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
