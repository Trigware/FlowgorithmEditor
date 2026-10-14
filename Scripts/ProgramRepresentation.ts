import * as Utils from "./Utils.js"
import { Expression } from "./Expression.js"
import * as Identifier from "./Identifier.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import { ArrowPath } from "./ArrowRenderer.js"

function GetEmptyContent(): ShapeRenderer.ShapeContent { return new ShapeRenderer.ShapeContent(); }

type OptionalShape = ShapeRenderer.RenderedShape | null;

export class ProgramNode {
    public subNodes: ProgramNode[] = [];
    public linkedShape: OptionalShape = null;

    public Clear() { this.subNodes = []; }
    public GetContent(): ShapeRenderer.ShapeContent { return GetEmptyContent(); }
    public Render(position: Utils.Vec2): void {}
    public Delete(): void { if (this.linkedShape !== null) { this.linkedShape.Delete(); this.linkedShape = null; } }

    public GetSize(): Utils.Vec2 {
        let renderedShape: OptionalShape = this.linkedShape;
        let previouslyNotRendered: boolean = renderedShape === null;
        if (previouslyNotRendered) this.Render(Utils.Vec2.Zero());
        if (this.linkedShape === null) return Utils.Vec2.Zero();

        let shapeSize: Utils.Vec2 = this.linkedShape.GetSize();
        if (previouslyNotRendered) this.Delete();
        return shapeSize;
    }

    public RenderSubnodes(position: Utils.Vec2, drawFirstArrow: boolean = true): Utils.Vec2 {
        let updatedPosition: Utils.Vec2 = position.Copy();

        for (let i: number = 0; i < this.subNodes.length; i++) {
            let currentNode: ProgramNode = this.subNodes[i];
            let isFirstNode: boolean = i === 0;
            let drawCurrentArrow: boolean = !isFirstNode || drawFirstArrow;
            if (drawCurrentArrow) updatedPosition = this.RenderArrow(updatedPosition);

            currentNode.Render(updatedPosition);
            let currentNodeSize: Utils.Vec2 = currentNode.GetSize();
            updatedPosition.y += currentNodeSize.y;
        }

        return updatedPosition;
    }

    public RenderArrow(position: Utils.Vec2): Utils.Vec2 {
        let updatedPosition: Utils.Vec2 = position.Copy();
        let connectingArrow: ArrowPath = new ArrowPath(position, [defaultArrowLength], [defaultArrowAngle]);

        let arrowTotalSize: Utils.Vec2 = connectingArrow.GetSize();
        updatedPosition = position.Plus(arrowTotalSize.x, arrowTotalSize.y);
        return updatedPosition;
    }

    public GetSubnodesSize(): Utils.Vec2 {
        let subNodesSize: Utils.Vec2 = Utils.Vec2.Zero();

        for (let currentNode of this.subNodes) {
            let currentNodeSize: Utils.Vec2 = currentNode.GetSize();
            subNodesSize.x = Math.max(subNodesSize.x, currentNodeSize.x);
            subNodesSize.y += defaultArrowLength;
        }

        return subNodesSize;
    }
}

enum VariableType { Void, Integer, Real, String, Boolean }

export class VariableDeclaration {
    public type: VariableType = VariableType.Void;
    public isArray: boolean = false;
    public arraySize: Expression = new Expression();
    public variableName: string = "";
    public error: Identifier.IdentifierError = Identifier.IdentifierError.None;

    public constructor(variableName: string = "", declarationType: VariableType = VariableType.Void,
        isArray: boolean = false, arraySize: Expression = new Expression()) {
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

    public override Render(position: Utils.Vec2) {
        ShapeRenderer.ClearPlane();

        for (let i = 0; i < this.subNodes.length; i++) {
            if (i > 0) break;
            let currentFunction: FunctionSignature = this.subNodes[i] as FunctionSignature;
            currentFunction.Render(position);
        }
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

    public functionEndShape: ShapeRenderer.RenderedShape | null = null;

    public override GetContent(): ShapeRenderer.ShapeContent {
        let functionContent: ShapeRenderer.ShapeContent = GetEmptyContent();
        functionContent.Append(this.name, ShapeRenderer.TextType.Bolded);
        let parametersAsStr: string = "";

        let parameterCount: number = this.parameters.length;
        if (parameterCount > 0) parametersAsStr += " (";

        for (let i: number = 0; i < parameterCount; i++) {
            let currentParameter: VariableDeclaration = this.parameters[i];
            let isLastParameter: boolean = i === parameterCount - 1;
            parametersAsStr += currentParameter.ToString();
            if (!isLastParameter) parametersAsStr += ", ";
        }

        if (parameterCount > 0) parametersAsStr += ")";
        functionContent.Append(parametersAsStr);
        return functionContent;
    }

    public override Render(position: Utils.Vec2) {
        let latestShapePosition: Utils.Vec2 = position.Copy();
        let functionSignatureShape: ShapeRenderer.RenderedShape = ShapeRenderer.AddShape(
            ShapeRenderer.ShapeType.FunctionSignature, latestShapePosition, this.GetContent(), false
        );
        this.linkedShape = functionSignatureShape;

        latestShapePosition.y += functionSignatureShape.GetSize().y / 2;
        latestShapePosition = this.RenderSubnodes(latestShapePosition);
        latestShapePosition = this.RenderArrow(latestShapePosition);
        this.RenderEndShape(latestShapePosition);
    }

    private RenderEndShape(position: Utils.Vec2) {
        let returnShapeContent: ShapeRenderer.ShapeContent = GetEmptyContent();
        let doesFunctionReturn: boolean = this.returnType !== VariableType.Void;
        let returnTypeAsStr: string = VariableType[this.returnType];

        if (doesFunctionReturn) {
            returnShapeContent.Append("Return", ShapeRenderer.TextType.Bolded);
            returnShapeContent.Append(` ${returnTypeAsStr} ${this.returnVariableName}`);
        } else returnShapeContent.Append("End", ShapeRenderer.TextType.Bolded);

        this.functionEndShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.FunctionEnd, position, returnShapeContent);
    }
}

export class DeclarationInstruction extends ProgramNode {
    public declaredVariables: VariableDeclaration[] = [];

    public override GetContent(): ShapeRenderer.ShapeContent {
        let isWithoutDeclarations: boolean = this.declaredVariables.length === 0;
        if (isWithoutDeclarations) return new ShapeRenderer.ShapeContent("Declare");

        let declareTypeAsStr: string = this.declaredVariables[0].ToString(false) + " ";
        let declarationsCount: number = this.declaredVariables.length;
        let declarationContent: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent(declareTypeAsStr);

        for (let i: number = 0; i < this.declaredVariables.length; i++) {
            let variableDeclaration: VariableDeclaration = this.declaredVariables[i];
            let isLastDeclaration: boolean = i === declarationsCount - 1;

            let declarationName: string = variableDeclaration.variableName;
            if (variableDeclaration.isArray) declarationName += `[${variableDeclaration.arraySize.expressionAsStr}]`;
            declarationContent.Append(declarationName, ShapeRenderer.TextType.Bolded);

            if (!isLastDeclaration) declarationContent.Append(", ");
        }

        return declarationContent;
    }

    public override Render(position: Utils.Vec2) {
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.VariableDeclaration, position, this.GetContent());
    }
}

export class AssignmentInstruction extends ProgramNode {
    public lvalue: Expression = new Expression();
    public rvalue: Expression = new Expression();
    public isValidLValue: boolean = true;

    public override GetContent(): ShapeRenderer.ShapeContent { return new ShapeRenderer.ShapeContent(`${this.lvalue.expressionAsStr} = ${this.rvalue.expressionAsStr}`); }

    public override Render(position: Utils.Vec2) {
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Assignment, position, this.GetContent());
    }
}

export class IOInstruction extends ProgramNode {
    public expression: Expression = new Expression();
    public isInput: boolean = false;
    public isValidLValue: boolean = true;

    public override GetContent(): ShapeRenderer.ShapeContent {
        let instructionContent: ShapeRenderer.ShapeContent = GetEmptyContent();
        let shapeTypeAsStr: string = this.isInput ? "Input" : "Output";
        instructionContent.Append(shapeTypeAsStr);

        let isExpressionEmpty: boolean = this.expression.expressionAsStr.length === 0;
        if (!isExpressionEmpty) instructionContent.Append(` ${this.expression.expressionAsStr}`, ShapeRenderer.TextType.Bolded);
        return instructionContent;
    }

    public override Render(position: Utils.Vec2) {
        let shapeType: ShapeRenderer.ShapeType = this.isInput ? ShapeRenderer.ShapeType.Input : ShapeRenderer.ShapeType.Output;
        this.linkedShape = ShapeRenderer.AddShape(shapeType, position, this.GetContent());
    }
}

export class CallInstruction extends ProgramNode {
    public callExpression: Expression = new Expression();
    public isValidCall: boolean = false;

    public override GetContent(): ShapeRenderer.ShapeContent {
        return new ShapeRenderer.ShapeContent(this.callExpression.expressionAsStr);
    }

    public override Render(position: Utils.Vec2) {
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Call, position, this.GetContent());
    }
}

const branchingArrowOffset: number = 10;

export class ConditionalStatement extends ProgramNode {
    public conditional: Expression = new Expression();
    public thenNode: ProgramNode = new ProgramNode();
    public elseNode: ProgramNode = new ProgramNode();

    private thenArrow: ArrowPath | null = null;
    private elseArrow: ArrowPath | null = null;
    private thenBlockSize: Utils.Vec2 = Utils.Vec2.Zero();
    private elseBlockSize: Utils.Vec2 = Utils.Vec2.Zero();
    private hasBeenRendered: boolean = false;

    public MoveSubnodes(moveToThen: boolean) {
        let selectedNode: ProgramNode = moveToThen ? this.thenNode : this.elseNode;
        selectedNode.subNodes = this.subNodes.slice();
        this.subNodes = [];
    }

    public override GetContent(): ShapeRenderer.ShapeContent {
        let shapeContent: ShapeRenderer.ShapeContent = GetEmptyContent();
        shapeContent.Append("if ");
        shapeContent.Append(this.conditional.expressionAsStr, ShapeRenderer.TextType.Bolded);
        return shapeContent;
    }

    public override Render(position: Utils.Vec2) {
        let conditionalShape: ShapeRenderer.RenderedShape = ShapeRenderer.AddShape(
            ShapeRenderer.ShapeType.Conditional, position, this.GetContent()
        );

        let shapeSize: Utils.Vec2 = conditionalShape.GetSize();
        let diamondCenter: Utils.Vec2 = position.Plus(0, shapeSize.y / 2);
        let arrowPositionOffset: number = shapeSize.x / 2 - branchingArrowOffset;

        let arrowOffsetY: number = 0;
        if (conditionalShape.shadowShape !== null) {
            arrowOffsetY = Utils.GetNumericPixels(Utils.GetProperty(conditionalShape.shadowShape, "--shadow-offset-y")) / 2;
        }

        let downwardSegmentLength: number = shapeSize.y / 2 + defaultArrowLength;
        this.thenBlockSize = this.thenNode.GetSubnodesSize(); this.elseBlockSize = this.elseNode.GetSubnodesSize();
        let thenArrowDownwardSize: number = this.thenBlockSize.x / 2 + branchingArrowOffset,
            elseArrowDownwardSize: number = this.elseBlockSize.x / 2 + branchingArrowOffset;
        
        this.thenArrow = new ArrowPath(
            diamondCenter.Plus(-arrowPositionOffset, arrowOffsetY),
            [thenArrowDownwardSize, downwardSegmentLength], [180, defaultArrowAngle]
        );
        this.elseArrow = new ArrowPath(
            diamondCenter.Plus(arrowPositionOffset, arrowOffsetY),
            [elseArrowDownwardSize, downwardSegmentLength], [360, defaultArrowAngle]
        );

        this.thenNode.RenderSubnodes(this.thenArrow.GetLatestSegmentPos(), false);
        this.elseNode.RenderSubnodes(this.elseArrow.GetLatestSegmentPos(), false);

        this.linkedShape = conditionalShape;
        this.hasBeenRendered = true;
    }

    public override Delete(): void {
        super.Delete();
        if (this.thenArrow !== null) this.thenArrow.Delete();
        if (this.elseArrow !== null) this.elseArrow.Delete();
        this.hasBeenRendered = false;
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