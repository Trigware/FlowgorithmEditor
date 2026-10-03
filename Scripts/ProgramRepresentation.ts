import * as Utils from "./Utils.js"

export class Program {
    public availableFunctions: FunctionSignature[] = []
    public constructor() {
        let mainFunction: FunctionSignature = new FunctionSignature();
        mainFunction.name = "Main";
    }
}

enum VariableType { Void, Integer, Real, String, Boolean }

export class VariableDeclaration {
    public type: VariableType = VariableType.Void;
    public isArray: boolean = false;
    public arraySize: number = 0;
    public variableName: string = "";
}

export class FunctionSignature {
    public name: string = "";
    public parameters: VariableDeclaration[] = [];
    public returnType: VariableType = VariableType.Void;
    public returnVariableName: string = "";
    public instructions: Instruction[] = [];
}

export abstract class Instruction {}

export class DeclarationInstruction extends Instruction {
    public declaredVariables: VariableDeclaration[] = [];
}

export class AssignmentInstruction extends Instruction {
    public variableName: string = "";
    public assignedExpression: Expression = new Expression();
    public arrayIndex: number = 0;
}

export class InputInstruction extends Instruction {
    public variableName: string = "";
    public arrayIndex: number = 0;
}

export class OutputInstruction extends Instruction {
    public expression: Expression = new Expression();
}

export class ConditionalStatement extends Instruction {
    public conditional: Expression = new Expression();
    public thenInstructions: Instruction[] = [];
    public elseInstructions: Instruction[] = [];
}

export class CallInstruction extends Instruction {
    public functionName: string = "";
    public arguments: Expression[] = [];
}

export class ForLoop extends Instruction {
    public iteratorName: string = "";
    public loopStart: number = 0; public loopEnd: number = 0;
    public isIncreasing: boolean = true;
    public iterationStep: number = 1;
}

export class WhileLoop extends Instruction {
    public expression: Expression = new Expression();
    public instructions: Instruction[] = [];
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