import * as Utils from "./Utils.js";
import { Expression } from "./Expression.js";
import * as Identifier from "./Identifier.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import { ArrowPath } from "./ArrowRendering.js";
export function GetEmptyContent() { return new ShapeRenderer.ShapeContent(); }
export var SizeCountType;
(function (SizeCountType) {
    SizeCountType[SizeCountType["CountAll"] = 0] = "CountAll";
    SizeCountType[SizeCountType["OnlyLeft"] = 1] = "OnlyLeft";
    SizeCountType[SizeCountType["OnlyRight"] = 2] = "OnlyRight";
})(SizeCountType || (SizeCountType = {}));
export var SubnodeCountType;
(function (SubnodeCountType) {
    SubnodeCountType[SubnodeCountType["HeadOnly"] = 0] = "HeadOnly";
    SubnodeCountType[SubnodeCountType["SubnodeOnly"] = 1] = "SubnodeOnly";
    SubnodeCountType[SubnodeCountType["CountAll"] = 2] = "CountAll";
})(SubnodeCountType || (SubnodeCountType = {}));
export const mergePointSizeMultiplier = 1.65;
export class CachedSize {
    leftPortion = Utils.Vec2.Zero();
    rightPortion = Utils.Vec2.Zero();
    subLeftPortion = Utils.Vec2.Zero();
    subRightPortion = Utils.Vec2.Zero();
    isCached = false;
    GetByCountType(countType = SizeCountType.CountAll, countSubnodesMode = SubnodeCountType.HeadOnly) {
        let usedLeftPortion = this.leftPortion;
        let usedRightPortion = this.rightPortion;
        switch (countSubnodesMode) {
            case SubnodeCountType.SubnodeOnly:
                usedLeftPortion = this.subLeftPortion;
                usedRightPortion = this.subRightPortion;
                break;
            case SubnodeCountType.CountAll:
                usedLeftPortion = new Utils.Vec2(Math.max(this.leftPortion.x, this.subLeftPortion.x), this.leftPortion.y + this.subLeftPortion.y);
                usedRightPortion = new Utils.Vec2(Math.max(this.rightPortion.x, this.subRightPortion.x), this.rightPortion.y + this.subRightPortion.y);
                break;
        }
        switch (countType) {
            case SizeCountType.CountAll: return new Utils.Vec2(usedLeftPortion.x + usedRightPortion.x, Math.max(usedLeftPortion.y, usedRightPortion.y));
            case SizeCountType.OnlyLeft: return usedLeftPortion;
            case SizeCountType.OnlyRight: return usedRightPortion;
        }
    }
    ApplyToSub(x, y) {
        this.subLeftPortion = this.subLeftPortion.Plus(x, y);
        this.subRightPortion = this.subRightPortion.Plus(x, y);
    }
}
export class ProgramNode {
    subNodes = [];
    subArrows = [];
    parentNode = null;
    linkedShape = new ShapeRenderer.RenderedShape();
    sizeCache = new CachedSize();
    Clear() { this.subNodes = []; if (this.linkedShape !== null)
        this.linkedShape.Delete(); }
    GetContent() { return GetEmptyContent(); }
    GetType() { return ShapeRenderer.ShapeType.Unknown; }
    DrawsAfterArrow() { return false; }
    BeforeArrowHasEnding() { return true; }
    Render(position) { }
    Delete() {
        this.linkedShape.Delete();
        for (let childNode of this.subNodes)
            childNode.Delete();
        for (let currentArrow of this.subArrows)
            currentArrow.Delete();
    }
    AddShape(position) {
        this.linkedShape = ShapeRenderer.AddShape(this.GetType(), position, this.GetContent());
    }
    GetSize(countType = SizeCountType.CountAll, countSubnodesMode = SubnodeCountType.HeadOnly) {
        if (!this.sizeCache.isCached) {
            this.sizeCache = this.CalculateSizeCache();
            this.sizeCache.isCached = true;
            this.SetSubnodeCache(this.sizeCache);
            //console.log(`TEXT: ${this.GetContent().ToString()}, WIDTH: ${this.sizeCache.rightPortion.x}`);
        }
        return this.sizeCache.GetByCountType(countType, countSubnodesMode);
    }
    RenderSubnodes(position, renderFirstArrow = true) {
        for (let i = 0; i < this.subNodes.length; i++) {
            let isFirstNode = i === 0;
            if (!isFirstNode || renderFirstArrow)
                this.HandleArrowRender(position, i);
            let currentNode = this.subNodes[i];
            currentNode.Render(position);
            let currentNodeSize = currentNode.GetSize(SizeCountType.CountAll, SubnodeCountType.CountAll);
            position.y += currentNodeSize.y;
        }
        return position.Copy();
    }
    HandleArrowRender(position, nodeIndex) {
        let previousNode = this.GetSubnode(nodeIndex - 1), currentNode = this.GetSubnode(nodeIndex);
        let drawsAfterArrow = previousNode === null ? false : previousNode.DrawsAfterArrow();
        if (drawsAfterArrow) {
            position.y += defaultArrowLength;
            return;
        }
        let renderArrowEnding = currentNode === null ? true : currentNode.BeforeArrowHasEnding();
        let arrowLength = defaultArrowLength;
        let renderedArrow = this.RenderDefaultArrow(position, arrowLength, renderArrowEnding);
        this.subArrows.push(renderedArrow);
    }
    RenderDefaultArrow(position, arrowLength = defaultArrowLength, drawEnding = true) {
        let renderedArrow = new ArrowPath(position, [arrowLength], [defaultArrowAngle], drawEnding);
        let arrowTotalSize = renderedArrow.GetArrowSize();
        position.y += arrowTotalSize.y;
        return renderedArrow;
    }
    GetSubnode(nodeIndex) {
        let isIndexInvalid = nodeIndex < 0 || nodeIndex >= this.subNodes.length;
        if (isIndexInvalid)
            return null;
        return this.subNodes[nodeIndex];
    }
    CalculateSizeCache() {
        let sizeCache = new CachedSize();
        let headSize = this.linkedShape.GetSize(this.GetContent(), this.GetType());
        let headPortionHalfSize = new Utils.Vec2(headSize.x / 2, headSize.y);
        sizeCache.leftPortion = headPortionHalfSize;
        sizeCache.rightPortion = headPortionHalfSize;
        sizeCache.subLeftPortion = Utils.Vec2.Zero();
        sizeCache.subRightPortion = Utils.Vec2.Zero();
        return sizeCache;
    }
    SetSubnodeCache(currentSizeCache) {
        for (let currentSubnode of this.subNodes) {
            let totalLeftSize = currentSubnode.GetSize(SizeCountType.OnlyLeft, SubnodeCountType.CountAll), totalRightSize = currentSubnode.GetSize(SizeCountType.OnlyRight, SubnodeCountType.CountAll);
            let subnodeHeight = Math.max(totalLeftSize.y, totalRightSize.y);
            currentSizeCache.subLeftPortion.x = Math.max(currentSizeCache.subLeftPortion.x, totalLeftSize.x);
            currentSizeCache.subRightPortion.x = Math.max(currentSizeCache.subRightPortion.x, totalRightSize.x);
            currentSizeCache.ApplyToSub(0, subnodeHeight + defaultArrowLength);
        }
    }
    WillSpecialArrowsHaveArrowEnd(checkedIndex = 0) {
        let renderBranchArrowEnd = true;
        if (this.subNodes.length > checkedIndex) {
            let firstSubnode = this.subNodes[checkedIndex];
            renderBranchArrowEnd = firstSubnode.BeforeArrowHasEnding();
        }
        return renderBranchArrowEnd;
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
export const leftPointingRotation = 180, rightPointingRotation = 0, upwardPointingRotation = 270;
export class VariableDeclaration {
    type = VariableType.Void;
    isArray = false;
    arraySize = -1;
    variableName = "";
    error = Identifier.IdentifierError.None;
    constructor(variableName = "", declarationType = VariableType.Void, isArray = false, arraySize = -1) {
        this.variableName = variableName;
        this.type = declarationType;
        this.isArray = isArray;
        this.arraySize = arraySize;
    }
    static FromInfo(varName, declarationInfo) {
        let createdDeclaration = new VariableDeclaration(varName, declarationInfo.type, declarationInfo.isArray, declarationInfo.arraySize);
        return createdDeclaration;
    }
    ToString(includeVariableName = true) {
        let declarationAsStr = VariableType[this.type];
        if (this.isArray)
            declarationAsStr += " Array";
        if (includeVariableName)
            declarationAsStr += ` ${this.variableName}`;
        return declarationAsStr;
    }
}
export class Program extends ProgramNode {
    static Create() {
        let createdProgram = new Program();
        createdProgram.AddMain();
        return createdProgram;
    }
    Render(renderPosition) {
        ShapeRenderer.ClearPlane();
        let currentPosition = renderPosition.Copy();
        let renderedFunctionCount = 0;
        for (let i = 0; i < this.subNodes.length; i++) {
            let currentSubnode = this.subNodes[i];
            let isFunction = currentSubnode instanceof FunctionSignature;
            if (!isFunction)
                continue;
            let currentFunction = currentSubnode;
            let functionLeftSize = currentFunction.GetSize(SizeCountType.OnlyLeft, SubnodeCountType.CountAll);
            if (renderedFunctionCount > 0)
                currentPosition.x += functionLeftSize.x;
            let previousPosition = currentPosition.Copy();
            currentFunction.Render(currentPosition);
            currentPosition = previousPosition;
            let functionRightSize = currentFunction.GetSize(SizeCountType.OnlyRight, SubnodeCountType.CountAll);
            currentPosition.x += functionRightSize.x;
            renderedFunctionCount++;
        }
    }
    HasMain() {
        for (let currentSubnode of this.subNodes) {
            let isFunction = currentSubnode instanceof FunctionSignature;
            if (!isFunction)
                continue;
            let currentFunction = currentSubnode;
            let isCurrentMain = currentFunction.name.toLowerCase() === "main";
            if (isCurrentMain)
                return true;
        }
        return false;
    }
    AddMain() {
        let mainFunction = new FunctionSignature();
        mainFunction.name = "Main";
        this.subNodes.push(mainFunction);
    }
}
export const defaultArrowLength = 60;
export const defaultArrowAngle = 90;
export class FunctionSignature extends ProgramNode {
    name = "";
    parameters = [];
    returnType = VariableType.Void;
    returnVariableName = "";
    nameError = Identifier.IdentifierError.None;
    returnError = Identifier.IdentifierError.None;
    functionEndShape = new ShapeRenderer.RenderedShape();
    GetContent() {
        let functionContent = GetEmptyContent();
        functionContent.Append(this.name, ShapeRenderer.TextType.Bolded);
        let parametersAsStr = "";
        let parameterCount = this.parameters.length;
        if (parameterCount > 0)
            parametersAsStr += " (";
        for (let i = 0; i < parameterCount; i++) {
            let currentParameter = this.parameters[i];
            let isLastParameter = i === parameterCount - 1;
            parametersAsStr += currentParameter.ToString();
            if (!isLastParameter)
                parametersAsStr += ", ";
        }
        if (parameterCount > 0)
            parametersAsStr += ")";
        functionContent.Append(parametersAsStr);
        return functionContent;
    }
    GetEndShapeContent() {
        let returnShapeContent = GetEmptyContent();
        let doesFunctionReturn = this.returnType !== VariableType.Void;
        let returnTypeAsStr = VariableType[this.returnType];
        if (doesFunctionReturn) {
            returnShapeContent.Append("Return", ShapeRenderer.TextType.Bolded);
            returnShapeContent.Append(` ${returnTypeAsStr} ${this.returnVariableName}`);
        }
        else
            returnShapeContent.Append("End", ShapeRenderer.TextType.Bolded);
        return returnShapeContent;
    }
    CalculateSizeCache() {
        let sizeCache = super.CalculateSizeCache();
        let endShapeSize = this.functionEndShape.GetSize(this.GetEndShapeContent(), ShapeRenderer.ShapeType.FunctionEnd);
        sizeCache.ApplyToSub(0, defaultArrowLength + endShapeSize.y);
        sizeCache.subLeftPortion.x = Math.max(sizeCache.subLeftPortion.x, endShapeSize.x / 2);
        sizeCache.subRightPortion.x = Math.max(sizeCache.subRightPortion.x, endShapeSize.x / 2);
        for (let currentSubnode of this.subNodes) {
            let leftAllSize = currentSubnode.GetSize(SizeCountType.OnlyLeft, SubnodeCountType.CountAll), rightAllSize = currentSubnode.GetSize(SizeCountType.OnlyRight, SubnodeCountType.CountAll);
            sizeCache.subLeftPortion.x = Math.max(sizeCache.subLeftPortion.x, leftAllSize.x);
            sizeCache.subRightPortion.x = Math.max(sizeCache.subRightPortion.x, rightAllSize.x);
            let currentNodeHeight = Math.max(leftAllSize.y, rightAllSize.y);
            sizeCache.ApplyToSub(0, defaultArrowLength + currentNodeHeight);
        }
        return sizeCache;
    }
    GetType() { return ShapeRenderer.ShapeType.FunctionSignature; }
    Render(position) {
        let latestShapePosition = position;
        let functionSignatureShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.FunctionSignature, position, this.GetContent(), false);
        let functionSignatureSize = functionSignatureShape.GetSize();
        latestShapePosition.y += functionSignatureSize.y / 2;
        this.linkedShape = functionSignatureShape;
        this.RenderSubnodes(position);
        position = latestShapePosition;
        this.RenderEndShape(position);
    }
    RenderEndShape(position) {
        let lastNode = this.subNodes.length === 0 ? null : this.subNodes[this.subNodes.length - 1];
        let skippedArrowOffset = lastNode === null ? false : lastNode.DrawsAfterArrow();
        if (skippedArrowOffset)
            position.y += defaultArrowLength;
        else
            this.RenderDefaultArrow(position);
        let returnShapeContent = this.GetEndShapeContent();
        this.functionEndShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.FunctionEnd, position, returnShapeContent);
        let functionEndSize = this.functionEndShape.GetSize();
        position.y += functionEndSize.y * 1.5;
        if (this.functionEndShape.shadowShape === null)
            return;
        let endShadowYOffset = Utils.GetNumericPixels(Utils.GetProperty(this.functionEndShape.shadowShape, "--additional-offset-y"));
        position.y += endShadowYOffset;
    }
    Delete() { super.Delete(); this.functionEndShape.Delete(); }
}
export class DeclarationInstruction extends ProgramNode {
    declaredVariables = [];
    GetContent() {
        let isWithoutDeclarations = this.declaredVariables.length === 0;
        if (isWithoutDeclarations) {
            let incompleteShapeContent = new ShapeRenderer.ShapeContent("Declare");
            incompleteShapeContent.isIncomplete = true;
            return incompleteShapeContent;
        }
        let declareTypeAsStr = this.declaredVariables[0].ToString(false) + " ";
        let declarationsCount = this.declaredVariables.length;
        let declarationContent = new ShapeRenderer.ShapeContent(declareTypeAsStr);
        for (let i = 0; i < this.declaredVariables.length; i++) {
            let variableDeclaration = this.declaredVariables[i];
            let isLastDeclaration = i === declarationsCount - 1;
            let declarationName = variableDeclaration.variableName;
            if (variableDeclaration.isArray)
                declarationName += `[${variableDeclaration.arraySize}]`;
            declarationContent.Append(declarationName, ShapeRenderer.TextType.Bolded);
            if (!isLastDeclaration)
                declarationContent.Append(", ");
        }
        return declarationContent;
    }
    Render(position) { this.AddShape(position); }
    GetType() { return ShapeRenderer.ShapeType.VariableDeclaration; }
}
export class AssignmentInstruction extends ProgramNode {
    lvalue = new Expression();
    rvalue = new Expression();
    isValidLValue = true;
    GetContent() {
        let isIncomplete = this.lvalue.IsEmpty() || this.rvalue.IsEmpty();
        if (!isIncomplete) {
            return new ShapeRenderer.ShapeContent(`${this.lvalue.expressionAsStr} = ${this.rvalue.expressionAsStr}`);
        }
        let incompleteShapeContent = GetEmptyContent();
        incompleteShapeContent.Append("Assign");
        incompleteShapeContent.isIncomplete = true;
        return incompleteShapeContent;
    }
    GetType() { return ShapeRenderer.ShapeType.Assignment; }
    Render(position) {
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Assignment, position, this.GetContent());
    }
}
export class IOInstruction extends ProgramNode {
    expression = new Expression();
    isInput = false;
    isValidLValue = true;
    GetContent() {
        let instructionContent = GetEmptyContent();
        let shapeTypeAsStr = this.isInput ? "Input" : "Output";
        instructionContent.Append(shapeTypeAsStr);
        let isExpressionEmpty = this.expression.IsEmpty();
        if (isExpressionEmpty) {
            instructionContent.isIncomplete = true;
            return instructionContent;
        }
        instructionContent.Append(` ${this.expression.expressionAsStr}`, ShapeRenderer.TextType.Bolded);
        return instructionContent;
    }
    GetType() { return this.isInput ? ShapeRenderer.ShapeType.Input : ShapeRenderer.ShapeType.Output; }
    Render(position) { this.AddShape(position); }
}
export class CallInstruction extends ProgramNode {
    callExpression = new Expression();
    isValidCall = false;
    GetContent() {
        let isIncomplete = this.callExpression.IsEmpty();
        if (!isIncomplete)
            return new ShapeRenderer.ShapeContent(this.callExpression.expressionAsStr);
        let incompleteShapeContent = GetEmptyContent();
        incompleteShapeContent.Append("Call");
        incompleteShapeContent.isIncomplete = true;
        return incompleteShapeContent;
    }
    Render(position) { this.AddShape(position); }
    GetType() { return ShapeRenderer.ShapeType.Call; }
}
export function StrToVarType(typeAsStr) {
    let varType = Utils.GetEnumValueFromName(VariableType, typeAsStr);
    if (varType === null)
        return VariableType.Void;
    return varType;
}
export function StrToBoolean(booleanAsStr) { return booleanAsStr === "True"; }
