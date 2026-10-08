import * as Utils from "./Utils.js"
import { Expression } from "./Expression.js"
import * as Identifier from "./Identifier.js"

export class ProgramNode {
    public subNodes: ProgramNode[] = [];
    public Clear() {
        this.subNodes = [];
    }
}

enum VariableType { Void, Integer, Real, String, Boolean }

export class VariableDeclaration {
    public type: VariableType = VariableType.Void;
    public isArray: boolean = false;
    public arraySize: number = 0;
    public variableName: string = "";
    public error: Identifier.IdentifierError = Identifier.IdentifierError.None;

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

    public nameError: Identifier.IdentifierError = Identifier.IdentifierError.None;
    public returnError: Identifier.IdentifierError = Identifier.IdentifierError.None;
}

export class DeclarationInstruction extends ProgramNode {
    public declaredVariables: VariableDeclaration[] = [];
}

export class AssignmentInstruction extends ProgramNode {
    public lvalue: Expression = new Expression();
    public rvalue: Expression = new Expression();
    public isValidLValue: boolean = true;
}

export class IOInstruction extends ProgramNode {
    public expression: Expression = new Expression();
    public isInput: boolean = false;
    public isValidLValue: boolean = true;
}

export class ConditionalStatement extends ProgramNode {
    public conditional: Expression = new Expression();
    public thenNode: ProgramNode = new ProgramNode();
    public elseNode: ProgramNode = new ProgramNode();

    public MoveSubnodes(moveToThen: boolean) {
        let selectedNode: ProgramNode = moveToThen ? this.thenNode : this.elseNode;
        selectedNode.subNodes = this.subNodes.slice();
        this.subNodes = [];
    }
}

export class CallInstruction extends ProgramNode {
    public callExpression: Expression = new Expression();
    public isValidCall: boolean = false;
}

export class ForLoop extends ProgramNode {
    public iteratorName: string = "";
    public loopStart: Expression = new Expression();
    public loopEnd: Expression = new Expression();
    public iterationStep: Expression = new Expression();
    public isIncreasing: boolean = true;
}

export class ConditionalCycle extends ProgramNode {
    public expression: Expression = new Expression();
    public isDoWhile: boolean = false;
}

export function StrToVarType(typeAsStr: string): VariableType {
    let varType: VariableType | null = Utils.GetEnumValueFromName(VariableType, typeAsStr);
    if (varType === null) return VariableType.Void;
    return varType;
}

export function StrToBoolean(booleanAsStr: string): boolean { return booleanAsStr === "True"; }