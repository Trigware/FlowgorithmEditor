import * as Utils from "./Utils.js"
import { Expression } from "./Expression.js"
import * as Identifier from "./Identifier.js"
import * as ShapeRenderer from "./ShapeRenderer.js"

export class ProgramNode {
    public subNodes: ProgramNode[] = [];
    public Clear() {
        this.subNodes = [];
    }

    public GetContent(): string { return ""; }
    public Render(position: Utils.Vec2): Utils.Vec2 { return Utils.Vec2.Zero(); }
}

enum VariableType { Void, Integer, Real, String, Boolean }

export class VariableDeclaration {
    public type: VariableType = VariableType.Void;
    public isArray: boolean = false;
    public arraySize: number = -1;
    public variableName: string = "";
    public error: Identifier.IdentifierError = Identifier.IdentifierError.None;

    public constructor(variableName: string = "", declarationType: VariableType = VariableType.Void,
        isArray: boolean = false, arraySize: number = -1) {
        this.variableName = variableName; this.type = declarationType; this.isArray = isArray; this.arraySize = arraySize;
    }

    public static FromInfo(varName: string, declarationInfo: VariableDeclaration): VariableDeclaration {
        let createdDeclaration: VariableDeclaration = new VariableDeclaration(varName, declarationInfo.type, declarationInfo.isArray, declarationInfo.arraySize);
        return createdDeclaration;
    }

    public ToString(includeVariableName: boolean = true): string {
        let declarationAsStr: string = VariableType[this.type];
        if (this.isArray) declarationAsStr += " Array";
        if (includeVariableName) declarationAsStr += ` ${this.variableName}`;
        return declarationAsStr;
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

    public override Render(position: Utils.Vec2 = Utils.Vec2.Zero()): Utils.Vec2 {
        ShapeRenderer.ClearPlane();
        for (let i = 0; i < this.subNodes.length; i++) {
            if (i > 0) break;
            let currentFunction: FunctionSignature = this.subNodes[i] as FunctionSignature;
            currentFunction.Render(position);
        }
        return Utils.Vec2.Zero();
    }
}

const defaultArrowLength: number = 50;
const defaultArrowAngle: number = 90;

export class FunctionSignature extends ProgramNode {
    public name: string = "";
    public parameters: VariableDeclaration[] = [];
    public returnType: VariableType = VariableType.Void;
    public returnVariableName: string = "";

    public nameError: Identifier.IdentifierError = Identifier.IdentifierError.None;
    public returnError: Identifier.IdentifierError = Identifier.IdentifierError.None;

    public override GetContent(): string {
        let signatureAsStr: string = this.name;
        let parameterCount: number = this.parameters.length;
        if (parameterCount > 0) signatureAsStr += " (";

        for (let i: number = 0; i < parameterCount; i++) {
            let currentParameter: VariableDeclaration = this.parameters[i];
            let isLastParameter: boolean = i === parameterCount - 1;
            signatureAsStr += currentParameter.ToString();
            if (!isLastParameter) signatureAsStr += ", ";
        }

        if (parameterCount > 0) signatureAsStr += ")";
        return signatureAsStr;
    }

    public override Render(position: Utils.Vec2): Utils.Vec2 {
        let latestShapePosition: Utils.Vec2 = position;
        let functionSignatureShape: ShapeRenderer.RenderedShape = ShapeRenderer.AddShape(
            ShapeRenderer.ShapeType.FunctionSignature, position, this.GetContent(), false
        );
        latestShapePosition.y += functionSignatureShape.GetSize().y / 2;

        let ownedShapeCount: number = this.subNodes.length + 1;
        for (let i = 0; i < ownedShapeCount; i++) {
            let isLastShape: boolean = i === ownedShapeCount - 1;
            let connectingArrow: ShapeRenderer.ArrowPath = new ShapeRenderer.ArrowPath(latestShapePosition, [defaultArrowLength], [defaultArrowAngle]);
            let arrowTotalSize: Utils.Vec2 = connectingArrow.ConstructArrow();
            latestShapePosition = latestShapePosition.Plus(arrowTotalSize.x, arrowTotalSize.y);
            if (isLastShape) { this.RenderEndShape(latestShapePosition); break; }

            let currentNode: ProgramNode = this.subNodes[i];
            let nodeSize: Utils.Vec2 = currentNode.Render(latestShapePosition);
            latestShapePosition.y += nodeSize.y;
        }

        return Utils.Vec2.Zero();
    }

    private RenderEndShape(position: Utils.Vec2) {
        let returnShapeMessage: string = "End";
        let doesFunctionReturn: boolean = this.returnType !== VariableType.Void;
        let returnTypeAsStr: string = VariableType[this.returnType];
        if (doesFunctionReturn) returnShapeMessage = `Return ${returnTypeAsStr} ${this.returnVariableName}`;
        ShapeRenderer.AddShape(ShapeRenderer.ShapeType.FunctionEnd, position, returnShapeMessage);
    }
}

export class DeclarationInstruction extends ProgramNode {
    public declaredVariables: VariableDeclaration[] = [];

    public override GetContent(): string {
        let isWithoutDeclarations: boolean = this.declaredVariables.length === 0;
        if (isWithoutDeclarations) return "Declare";

        let declareTypeAsStr: string = this.declaredVariables[0].ToString(false) + " ";
        let declareContents: string = declareTypeAsStr;
        let declarationsCount: number = this.declaredVariables.length;

        for (let i: number = 0; i < this.declaredVariables.length; i++) {
            let variableDeclaration: VariableDeclaration = this.declaredVariables[i];
            let isLastDeclaration: boolean = i === declarationsCount - 1;
            declareContents += variableDeclaration.variableName;
            if (variableDeclaration.isArray) declareContents += `[${variableDeclaration.arraySize}]`;
            if (!isLastDeclaration) declareContents += ", ";
        }

        return declareContents;
    }

    public override Render(position: Utils.Vec2) { return ShapeRenderer.AddShape(ShapeRenderer.ShapeType.VariableDeclaration, position, this.GetContent()).GetSize(); }
}

export class AssignmentInstruction extends ProgramNode {
    public lvalue: Expression = new Expression();
    public rvalue: Expression = new Expression();
    public isValidLValue: boolean = true;

    public override GetContent(): string { return `${this.lvalue.expressionAsStr} = ${this.rvalue.expressionAsStr}`; }
    public override Render(position: Utils.Vec2): Utils.Vec2 { return ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Assignment, position, this.GetContent()).GetSize(); }
}

export class IOInstruction extends ProgramNode {
    public expression: Expression = new Expression();
    public isInput: boolean = false;
    public isValidLValue: boolean = true;

    public override GetContent(): string {
        let shapeContent: string = this.isInput ? "Input" : "Output";
        let isExpressionEmpty: boolean = this.expression.expressionAsStr.length === 0;
        if (!isExpressionEmpty) shapeContent += ` ${this.expression.expressionAsStr}`;
        return shapeContent;
    }

    public override Render(position: Utils.Vec2): Utils.Vec2 {
        let shapeType: ShapeRenderer.ShapeType = this.isInput ? ShapeRenderer.ShapeType.Input : ShapeRenderer.ShapeType.Output;
        let renderedShape: ShapeRenderer.RenderedShape = ShapeRenderer.AddShape(shapeType, position, this.GetContent());
        return renderedShape.GetSize();
    }
}

export class CallInstruction extends ProgramNode {
    public callExpression: Expression = new Expression();
    public isValidCall: boolean = false;

    public override GetContent(): string { return this.callExpression.expressionAsStr; }
    public override Render(position: Utils.Vec2) { return ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Call, position, this.callExpression.expressionAsStr).GetSize(); }
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