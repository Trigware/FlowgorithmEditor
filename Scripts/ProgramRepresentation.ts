import * as Utils from "./Utils.js"
import { Expression } from "./Expression.js"
import * as Identifier from "./Identifier.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import { ArrowPath } from "./ArrowRendering.js"

export function GetEmptyContent(): ShapeRenderer.ShapeContent { return new ShapeRenderer.ShapeContent(); }

export enum SizeCountType {
    CountAll, OnlyLeft, OnlyRight
}

export enum SubnodeCountType {
    HeadOnly, SubnodeOnly, CountAll
}

type ProgramNodeOpt = ProgramNode | null;

export const mergePointSizeMultiplier: number = 1.65;

export class CachedSize {
    public leftPortion: Utils.Vec2 = Utils.Vec2.Zero(); public rightPortion: Utils.Vec2 = Utils.Vec2.Zero();
    public subLeftPortion: Utils.Vec2 = Utils.Vec2.Zero(); public subRightPortion: Utils.Vec2 = Utils.Vec2.Zero();
    public isCached: boolean = false;

    public GetByCountType(countType: SizeCountType = SizeCountType.CountAll, countSubnodesMode: SubnodeCountType = SubnodeCountType.HeadOnly): Utils.Vec2 {
        let usedLeftPortion: Utils.Vec2 = this.leftPortion;
        let usedRightPortion: Utils.Vec2 = this.rightPortion;
        switch (countSubnodesMode) {
            case SubnodeCountType.SubnodeOnly: usedLeftPortion = this.subLeftPortion; usedRightPortion = this.subRightPortion; break;
            case SubnodeCountType.CountAll:
                usedLeftPortion = new Utils.Vec2(
                    Math.max(this.leftPortion.x, this.subLeftPortion.x), this.leftPortion.y + this.subLeftPortion.y
                );
                usedRightPortion = new Utils.Vec2(
                    Math.max(this.rightPortion.x, this.subRightPortion.x), this.rightPortion.y + this.subRightPortion.y
                )
                break;
        }

        switch (countType) {
            case SizeCountType.CountAll: return new Utils.Vec2(
                usedLeftPortion.x + usedRightPortion.x,
                Math.max(usedLeftPortion.y, usedRightPortion.y)
            );
            case SizeCountType.OnlyLeft: return usedLeftPortion;
            case SizeCountType.OnlyRight: return usedRightPortion;
        }
    }

    public ApplyToSub(x: number, y: number) {
        this.subLeftPortion = this.subLeftPortion.Plus(x, y); this.subRightPortion = this.subRightPortion.Plus(x, y);
    }
}

export class ProgramNode {
    public subNodes: ProgramNode[] = [];
    public subArrows: ArrowPath[] = [];
    public parentNode: ProgramNodeOpt = null;
    public linkedShape: ShapeRenderer.RenderedShape = new ShapeRenderer.RenderedShape();
    protected sizeCache: CachedSize = new CachedSize();

    public Clear() { this.subNodes = []; if (this.linkedShape !== null) this.linkedShape.Delete(); }
    public GetContent(): ShapeRenderer.ShapeContent { return GetEmptyContent(); }
    public GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.Unknown; }
    public DrawsAfterArrow(): boolean { return false; }
    public Render(position: Utils.Vec2) {}
    public Delete() {
        this.linkedShape.Delete();
        for (let childNode of this.subNodes) childNode.Delete();
        for (let currentArrow of this.subArrows) currentArrow.Delete();
    }

    protected AddShape(position: Utils.Vec2) {
        this.linkedShape = ShapeRenderer.AddShape(this.GetType(), position, this.GetContent());
    }

    public GetSize(countType: SizeCountType = SizeCountType.CountAll, countSubnodesMode: SubnodeCountType = SubnodeCountType.HeadOnly): Utils.Vec2 {
        if (!this.sizeCache.isCached) {
            this.sizeCache = this.CalculateSizeCache();
            this.SetSubnodesCache(this.sizeCache);
            /*console.log(`CONTENT: ${this.GetContent().ToString()}, 
                SIZE LEFT HEAD: ${this.sizeCache.GetByCountType(SizeCountType.OnlyLeft).ToString()}, 
                SIZE RIGHT HEAD: ${this.sizeCache.GetByCountType(SizeCountType.OnlyRight).ToString()},
                SIZE LEFT SUBNODES: ${this.sizeCache.GetByCountType(SizeCountType.OnlyLeft, SubnodeCountType.SubnodeOnly).ToString()}, 
                SIZE RIGHT SUBNODES: ${this.sizeCache.GetByCountType(SizeCountType.OnlyRight, SubnodeCountType.SubnodeOnly).ToString()},
            `);
            console.log(this.sizeCache);*/
        }

        return this.sizeCache.GetByCountType(countType, countSubnodesMode);
    }

    public RenderSubnodes(position: Utils.Vec2, renderFirstArrow: boolean = true): Utils.Vec2 {
        let previousNode: ProgramNodeOpt = null; 
        
        for (let i = 0; i < this.subNodes.length; i++) {
            let isFirstNode: boolean = i === 0;
            if (!isFirstNode || renderFirstArrow) this.HandleArrowRender(position, previousNode);
            let currentNode: ProgramNode = this.subNodes[i];

            currentNode.Render(position);
            let currentNodeSize: Utils.Vec2 = currentNode.GetSize(SizeCountType.CountAll, SubnodeCountType.CountAll);
            position.y += currentNodeSize.y;
            previousNode = currentNode;
        }

        return position.Copy();
    }

    private HandleArrowRender(position: Utils.Vec2, previousNode: ProgramNodeOpt) {
        let drawsAfterArrow: boolean = previousNode === null ? false : previousNode.DrawsAfterArrow();
        if (drawsAfterArrow) { position.y += defaultArrowLength; return; }

        let arrowLength: number = defaultArrowLength;        
        let renderedArrow: ArrowPath = this.RenderDefaultArrow(position, arrowLength);
        this.subArrows.push(renderedArrow);
    }

    public CalculateSizeCache(): CachedSize {
        let sizeCache: CachedSize = new CachedSize();
        sizeCache.isCached = true;
        
        let headSize: Utils.Vec2 = this.linkedShape.GetSize(this.GetContent(), this.GetType());
        let headPortionHalfSize: Utils.Vec2 = new Utils.Vec2(headSize.x / 2, headSize.y);
        sizeCache.leftPortion = headPortionHalfSize; sizeCache.rightPortion = headPortionHalfSize;
        return sizeCache;
    }

    public SetSubnodesCache(currentSizeCache: CachedSize) {
        for (let currentSubnode of this.subNodes) {
            let leftHeadSize: Utils.Vec2 = currentSubnode.GetSize(SizeCountType.OnlyLeft, SubnodeCountType.HeadOnly),
                rightHeadSize: Utils.Vec2 = currentSubnode.GetSize(SizeCountType.OnlyRight, SubnodeCountType.HeadOnly),
                leftAllSize: Utils.Vec2 = currentSubnode.GetSize(SizeCountType.OnlyLeft, SubnodeCountType.CountAll),
                rightAllSize: Utils.Vec2 = currentSubnode.GetSize(SizeCountType.OnlyRight, SubnodeCountType.CountAll);

            let currentLeftWidth: number = rightHeadSize.x, currentRightWidth: number = leftHeadSize.x;
            currentSizeCache.subLeftPortion.x = Math.max(currentSizeCache.subLeftPortion.x, currentLeftWidth);
            currentSizeCache.subRightPortion.x = Math.max(currentSizeCache.subRightPortion.x, currentRightWidth);
            currentSizeCache.subLeftPortion.y += defaultArrowLength + leftAllSize.y;
            currentSizeCache.subRightPortion.y += defaultArrowLength + rightAllSize.y;
        }
    }

    public RenderDefaultArrow(position: Utils.Vec2, arrowLength: number = defaultArrowLength): ArrowPath {
        let renderedArrow: ArrowPath = new ArrowPath(position, [arrowLength], [defaultArrowAngle]);
        let arrowTotalSize: Utils.Vec2 = renderedArrow.GetArrowSize();
        position.y += arrowTotalSize.y;
        return renderedArrow;
    }
}

enum VariableType { Void, Integer, Real, String, Boolean }
export const leftPointingRotation: number = 180, rightPointingRotation: number = 0, upwardPointingRotation: number = 270;

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

    public override Render(renderPosition: Utils.Vec2) {
        ShapeRenderer.ClearPlane();
        let currentPosition: Utils.Vec2 = renderPosition.Copy();
        let renderedFunctionCount: number = 0;

        for (let i = 0; i < this.subNodes.length; i++) {
            let currentSubnode: ProgramNode = this.subNodes[i];
            let isFunction: boolean = currentSubnode instanceof FunctionSignature;
            if (!isFunction) continue;

            let currentFunction: FunctionSignature = this.subNodes[i] as FunctionSignature;
            let leftFunctionSize: Utils.Vec2 = currentFunction.GetSize(SizeCountType.OnlyLeft, SubnodeCountType.CountAll);
            if (renderedFunctionCount > 0) currentPosition.x += leftFunctionSize.x;
            let previousPosition: Utils.Vec2 = currentPosition.Copy();

            currentFunction.Render(currentPosition);
            currentPosition = previousPosition;
            let functionSize: Utils.Vec2 = currentFunction.GetSize(SizeCountType.CountAll, SubnodeCountType.CountAll);
            console.log(`NAME: ${currentFunction.name}, SIZE: ${functionSize.ToString()}, LEFT SIZE: ${leftFunctionSize.ToString()}`);
            currentPosition.x += functionSize.x / 2;
            renderedFunctionCount++;
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

    public override CalculateSizeCache(): CachedSize {
        let sizeCache: CachedSize = super.CalculateSizeCache();
        let endShapeSize: Utils.Vec2 = this.functionEndShape.GetSize(this.GetEndShapeContent(), ShapeRenderer.ShapeType.FunctionEnd);
        sizeCache.ApplyToSub(0, defaultArrowLength + endShapeSize.y);
        sizeCache.subLeftPortion.x = Math.max(sizeCache.subLeftPortion.x, endShapeSize.x / 2);
        sizeCache.subRightPortion.x = Math.max(sizeCache.subRightPortion.x, endShapeSize.x / 2);
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
        let endShadowYOffset: number = Utils.GetNumericPixels(Utils.GetProperty(this.functionEndShape.shadowShape, "--shadow-offset-y"));
        position.y += endShadowYOffset;
    }

    public override Delete() { super.Delete(); this.functionEndShape.Delete(); }
}

export class DeclarationInstruction extends ProgramNode {
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
            if (variableDeclaration.isArray) declarationName += `[${variableDeclaration.arraySize}]`;
            declarationContent.Append(declarationName, ShapeRenderer.TextType.Bolded);

            if (!isLastDeclaration) declarationContent.Append(", ");
        }

        return declarationContent;
    }

    public override Render(position: Utils.Vec2) { this.AddShape(position); }
    public override GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.VariableDeclaration; }
}

export class AssignmentInstruction extends ProgramNode {
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

export class IOInstruction extends ProgramNode {
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

export class CallInstruction extends ProgramNode {
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