import * as Utils from "./Utils.js"
import { Expression } from "./Expression.js"
import * as Identifier from "./Identifier.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import { ArrowPath } from "./ArrowRendering.js"
import * as BaseNode from "./ProgramNode.js"

export function GetEmptyContent(): ShapeRenderer.ShapeContent { return new ShapeRenderer.ShapeContent(); }

type ProgramNodeOpt = BaseNode.ProgramNode | null;
enum VariableType { Void, Integer, Real, String, Boolean }
export const leftPointingRotation: number = 180, rightPointingRotation: number = 0, upwardPointingRotation: number = 270;

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

export class Program extends BaseNode.ProgramNode {
    public static Create(): Program {
        let createdProgram: Program = new Program();
        createdProgram.AddMain();
        return createdProgram;
    }

    public override Render(renderPosition: Utils.Vec2) {
        ShapeRenderer.ClearPlane();
        let currentPosition: Utils.Vec2 = renderPosition.Copy();
        let renderedFunctionCount: number = 0;

        for (let i = 0; i < this.subNodes.length; i++) {
            let currentSubnode: BaseNode.ProgramNode = this.subNodes[i];
            let isFunction: boolean = currentSubnode instanceof FunctionSignature;
            if (!isFunction) continue;

            let currentFunction: FunctionSignature = currentSubnode as FunctionSignature;
            if (renderedFunctionCount > 0) {
                let functionLeftWidth: number = currentFunction.GetSize(BaseNode.SizeCountType.OnlyLeft, BaseNode.SubnodeCountType.Entirety).x;
                currentPosition.x += functionLeftWidth;
            }
            let previousPosition: Utils.Vec2 = currentPosition.Copy();

            currentFunction.Render(currentPosition);
            currentPosition = previousPosition;
            let isLastFunction: boolean = i === this.subNodes.length - 1;
            if (!isLastFunction) {
                let functionRightWidth: number = currentFunction.GetSize(BaseNode.SizeCountType.OnlyRight, BaseNode.SubnodeCountType.Entirety).x;
                currentPosition.x += functionRightWidth;
                let functionGap: number = Utils.GetFromRootPX("--default-shape-width");
                currentPosition.x += functionGap;
            }
            renderedFunctionCount++;
        }

        console.log(this);
    }

    public HasMain(): boolean {
        for (let currentSubnode of this.subNodes) {
            let isFunction: boolean = currentSubnode instanceof FunctionSignature;
            if (!isFunction) continue;

            let currentFunction: FunctionSignature = currentSubnode as FunctionSignature;
            let isCurrentMain: boolean = currentFunction.name.toLowerCase() === "main";
            if (isCurrentMain) return true;
        }
        return false;
    }

    public AddMain() {
        let mainFunction: FunctionSignature = new FunctionSignature();
        mainFunction.name = "Main";
        this.subNodes.push(mainFunction);
    }
}

export const defaultArrowLength: number = 60;
export const defaultArrowAngle: number = 90;

export class FunctionSignature extends BaseNode.ProgramNode {
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

    private GetEndShapeContent(): ShapeRenderer.ShapeContent {
        let returnShapeContent: ShapeRenderer.ShapeContent = GetEmptyContent();
        let doesFunctionReturn: boolean = this.returnType !== VariableType.Void;
        let returnTypeAsStr: string = VariableType[this.returnType];

        if (doesFunctionReturn) {
            returnShapeContent.Append("Return", ShapeRenderer.TextType.Bolded);
            returnShapeContent.Append(` ${returnTypeAsStr} ${this.returnVariableName}`);
        } else returnShapeContent.Append("End", ShapeRenderer.TextType.Bolded);

        return returnShapeContent;
    }

    public override CalculateSizeCache(): BaseNode.CachedSize {
        let sizeCache: BaseNode.CachedSize = super.CalculateSizeCache();
        let endShapeSize: Utils.Vec2 = this.functionEndShape.GetSize(this.GetEndShapeContent(), ShapeRenderer.ShapeType.FunctionEnd);
        sizeCache.ApplyToSub(0, defaultArrowLength + endShapeSize.y);
        sizeCache.subLeftPortion.x += Math.max(sizeCache.subLeftPortion.x, endShapeSize.x / 2);
        sizeCache.subRightPortion.x += Math.max(sizeCache.subRightPortion.x, endShapeSize.x / 2);

        return sizeCache;
    }

    public override GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.FunctionSignature; }

    public override Render(position: Utils.Vec2) {
        let latestShapePosition: Utils.Vec2 = position;
        let functionSignatureShape: ShapeRenderer.RenderedShape = ShapeRenderer.AddShape(
            ShapeRenderer.ShapeType.FunctionSignature, position, this.GetContent(), false
        );
        let functionSignatureSize: Utils.Vec2 = functionSignatureShape.GetSize();
        latestShapePosition.y += functionSignatureSize.y / 2;

        this.linkedShape = functionSignatureShape;
        this.RenderSubnodes(position);
        position = latestShapePosition;
        this.RenderEndShape(position);
    }

    private RenderEndShape(position: Utils.Vec2) {
        let lastNode: ProgramNodeOpt = this.subNodes.length === 0 ? null : this.subNodes[this.subNodes.length - 1];
        let skippedArrowOffset: boolean = lastNode === null ? false : lastNode.DrawsAfterArrow();
        if (skippedArrowOffset) position.y += defaultArrowLength;
        else this.RenderDefaultArrow(position);

        let returnShapeContent: ShapeRenderer.ShapeContent = this.GetEndShapeContent();
        this.functionEndShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.FunctionEnd, position, returnShapeContent);
        let functionEndSize: Utils.Vec2 = this.functionEndShape.GetSize();
        position.y += functionEndSize.y * 1.5;

        if (this.functionEndShape.shadowShape === null) return;
        let endShadowYOffset: number = Utils.GetNumericPixels(Utils.GetProperty(this.functionEndShape.shadowShape, "--additional-offset-y"));
        position.y += endShadowYOffset;
    }

    public override Delete() { super.Delete(); this.functionEndShape.Delete(); }

    public GetSideTotalWidth(checkedSide: BaseNode.SizeCountType): number {
        if (checkedSide === BaseNode.SizeCountType.CountAll)
            return this.GetSize(BaseNode.SizeCountType.OnlyLeft, BaseNode.SubnodeCountType.Entirety).x +
                   this.GetSize(BaseNode.SizeCountType.OnlyRight, BaseNode.SubnodeCountType.Entirety).x;

        let totalWidth: number = super.GetSideTotalWidth(checkedSide);
        let endShapeWidth: number = this.functionEndShape.GetSize(this.GetEndShapeContent(), ShapeRenderer.ShapeType.FunctionEnd).x;
        totalWidth = Math.max(totalWidth, endShapeWidth / 2);
        return totalWidth;
    }
}

export class DeclarationInstruction extends BaseNode.ProgramNode {
    public declaredVariables: VariableDeclaration[] = [];

    public override GetContent(): ShapeRenderer.ShapeContent {
        let isWithoutDeclarations: boolean = this.declaredVariables.length === 0;
        if (isWithoutDeclarations) {
            let incompleteShapeContent: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent("Declare");
            incompleteShapeContent.isIncomplete = true;
            return incompleteShapeContent;
        }

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

    public override Render(position: Utils.Vec2) { this.AddShape(position); }
    public override GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.VariableDeclaration; }
}

export class AssignmentInstruction extends BaseNode.ProgramNode {
    public lvalue: Expression = new Expression();
    public rvalue: Expression = new Expression();
    public isValidLValue: boolean = true;

    public override GetContent(): ShapeRenderer.ShapeContent {
        let isIncomplete: boolean = this.lvalue.IsEmpty() || this.rvalue.IsEmpty();
        if (!isIncomplete) { return new ShapeRenderer.ShapeContent(`${this.lvalue.expressionAsStr} = ${this.rvalue.expressionAsStr}`); }
        
        let incompleteShapeContent: ShapeRenderer.ShapeContent = GetEmptyContent();
        incompleteShapeContent.Append("Assign");
        incompleteShapeContent.isIncomplete = true;
        return incompleteShapeContent;
    }

    public override GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.Assignment; }
    public override Render(position: Utils.Vec2) {
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Assignment, position, this.GetContent());
    }
}

export class IOInstruction extends BaseNode.ProgramNode {
    public expression: Expression = new Expression();
    public isInput: boolean = false;
    public isValidLValue: boolean = true;

    public override GetContent(): ShapeRenderer.ShapeContent {
        let instructionContent: ShapeRenderer.ShapeContent = GetEmptyContent();
        let shapeTypeAsStr: string = this.isInput ? "Input" : "Output";
        instructionContent.Append(shapeTypeAsStr);

        let isExpressionEmpty: boolean = this.expression.IsEmpty();
        if (isExpressionEmpty) { instructionContent.isIncomplete = true; return instructionContent; }

        instructionContent.Append(` ${this.expression.expressionAsStr}`, ShapeRenderer.TextType.Bolded);
        return instructionContent;
    }

    public override GetType(): ShapeRenderer.ShapeType { return this.isInput ? ShapeRenderer.ShapeType.Input : ShapeRenderer.ShapeType.Output; }
    public override Render(position: Utils.Vec2) { this.AddShape(position); }
}

export class CallInstruction extends BaseNode.ProgramNode {
    public callExpression: Expression = new Expression();
    public isValidCall: boolean = false;

    public override GetContent(): ShapeRenderer.ShapeContent {
        let isIncomplete: boolean = this.callExpression.IsEmpty();
        if (!isIncomplete) return new ShapeRenderer.ShapeContent(this.callExpression.expressionAsStr);

        let incompleteShapeContent: ShapeRenderer.ShapeContent = GetEmptyContent();
        incompleteShapeContent.Append("Call");
        incompleteShapeContent.isIncomplete = true;
        return incompleteShapeContent;
    }

    public override Render(position: Utils.Vec2) { this.AddShape(position); }
    public override GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.Call; }
}

export function StrToVarType(typeAsStr: string): VariableType {
    let varType: VariableType | null = Utils.GetEnumValueFromName(VariableType, typeAsStr);
    if (varType === null) return VariableType.Void;
    return varType;
}

export function StrToBoolean(booleanAsStr: string): boolean { return booleanAsStr === "True"; }