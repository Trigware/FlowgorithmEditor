import * as Utils from "./Utils.js"
import { Expression } from "./Expression.js"
import * as Identifier from "./Identifier.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import { ArrowPath } from "./ArrowRendering.js"

function GetEmptyContent(): ShapeRenderer.ShapeContent { return new ShapeRenderer.ShapeContent(); }

export class ProgramNode {
    public subNodes: ProgramNode[] = [];
    public nodeConnections: ArrowPath[] = [];
    protected linkedShape: ShapeRenderer.RenderedShape = new ShapeRenderer.RenderedShape();

    public Clear() { this.subNodes = []; if (this.linkedShape !== null) this.linkedShape.Delete(); }
    public GetContent(): ShapeRenderer.ShapeContent { return GetEmptyContent(); }
    public Render(position: Utils.Vec2) {}
    public Delete() {
        this.linkedShape.Delete();
        for (let childNode of this.subNodes) childNode.Delete();
        for (let currentArrow of this.nodeConnections) currentArrow.Delete();
    }

    public GetSize(): Utils.Vec2 {
        let isRendered: boolean = this.linkedShape.mainShape !== null;
        if (isRendered) return this.CalculateSize();

        this.Render(Utils.Vec2.Zero());
        let nodeSize: Utils.Vec2 = this.CalculateSize();
        this.Delete();
        return nodeSize;
    }

    public RenderSubnodes(position: Utils.Vec2, renderFirstArrow: boolean = true) {
        for (let i = 0; i < this.subNodes.length; i++) {
            let isFirstNode: boolean = i === 0;
            if (!isFirstNode || renderFirstArrow) this.nodeConnections.push(this.RenderDefaultArrow(position));
            let currentNode: ProgramNode = this.subNodes[i];
            let currentHeight: number = currentNode.GetSize().y;
            currentNode.Render(position);
            position.y += currentHeight;
        }
    }

    public CalculateSize(): Utils.Vec2 { return this.linkedShape.GetSize(); }

    public RenderDefaultArrow(position: Utils.Vec2): ArrowPath {
        let renderedArrow: ArrowPath = new ArrowPath(position, [defaultArrowLength], [defaultArrowAngle]);
        let arrowTotalSize: Utils.Vec2 = renderedArrow.GetArrowSize();
        position.y += arrowTotalSize.y;

        return renderedArrow;
    }

    public GetEntireNodeSize(countFirstArrow: boolean = true): Utils.Vec2 {
        let entireNodeSize: Utils.Vec2 = this.GetSize();
        for (let i: number = 0; i < this.subNodes.length; i++) {
            let isFirstNode: boolean = i === 0;
            let nodeChild: ProgramNode = this.subNodes[i];
            if (!isFirstNode || countFirstArrow) entireNodeSize.y += defaultArrowLength;

            let currentNodeSize: Utils.Vec2 = nodeChild.GetEntireNodeSize(countFirstArrow);
            entireNodeSize.x = Math.max(entireNodeSize.x, currentNodeSize.x);
            entireNodeSize.y += currentNodeSize.y;
        }

        return entireNodeSize;
    }
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

    public override Render(position: Utils.Vec2) {
        ShapeRenderer.ClearPlane();
        for (let i = 0; i < this.subNodes.length; i++) {
            if (i > 0) break;
            let currentFunction: FunctionSignature = this.subNodes[i] as FunctionSignature;
            currentFunction.Render(position);
        }
    }
}

export const defaultArrowLength: number = 60;
export const defaultArrowAngle: number = 90;

export class FunctionSignature extends ProgramNode {
    public name: string = "";
    public parameters: VariableDeclaration[] = [];
    public returnType: VariableType = VariableType.Void;
    public returnVariableName: string = "";

    public nameError: Identifier.IdentifierError = Identifier.IdentifierError.None;
    public returnError: Identifier.IdentifierError = Identifier.IdentifierError.None;

    private functionEndShape: ShapeRenderer.RenderedShape = new ShapeRenderer.RenderedShape();

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
        let latestShapePosition: Utils.Vec2 = position;
        let functionSignatureShape: ShapeRenderer.RenderedShape = ShapeRenderer.AddShape(
            ShapeRenderer.ShapeType.FunctionSignature, position, this.GetContent(), false
        );
        
        latestShapePosition.y += functionSignatureShape.GetSize().y / 2;
        this.linkedShape = functionSignatureShape;
        this.RenderSubnodes(position);
        this.RenderEndShape(latestShapePosition);
    }

    private RenderEndShape(position: Utils.Vec2) {
        this.RenderDefaultArrow(position);
        let returnShapeContent: ShapeRenderer.ShapeContent = GetEmptyContent();
        let doesFunctionReturn: boolean = this.returnType !== VariableType.Void;
        let returnTypeAsStr: string = VariableType[this.returnType];

        if (doesFunctionReturn) {
            returnShapeContent.Append("Return", ShapeRenderer.TextType.Bolded);
            returnShapeContent.Append(` ${returnTypeAsStr} ${this.returnVariableName}`);
        } else returnShapeContent.Append("End", ShapeRenderer.TextType.Bolded);

        this.functionEndShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.FunctionEnd, position, returnShapeContent);
    }

    public override Delete() { super.Delete(); this.functionEndShape.Delete(); }
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
            if (variableDeclaration.isArray) declarationName += `[${variableDeclaration.arraySize}]`;
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