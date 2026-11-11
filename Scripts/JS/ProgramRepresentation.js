import * as Utils from "./Utils.js";
import { Expression } from "./Expression.js";
import * as Identifier from "./Identifier.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import * as BaseNode from "./ProgramNode.js";
export function GetEmptyContent() { return new ShapeRenderer.ShapeContent(); }
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
    arraySize = new Expression();
    variableName = "";
    error = Identifier.IdentifierError.None;
    constructor(variableName = "", declarationType = VariableType.Void, isArray = false, arraySize = new Expression()) {
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
export class Program extends BaseNode.ProgramNode {
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
            if (renderedFunctionCount > 0) {
                let functionLeftWidth = currentFunction.GetSize(BaseNode.SizeCountType.OnlyLeft, BaseNode.SubnodeCountType.Entirety).x;
                currentPosition.x += functionLeftWidth;
            }
            let previousPosition = currentPosition.Copy();
            currentFunction.Render(currentPosition);
            currentPosition = previousPosition;
            let isLastFunction = i === this.subNodes.length - 1;
            if (!isLastFunction) {
                let functionRightWidth = currentFunction.GetSize(BaseNode.SizeCountType.OnlyRight, BaseNode.SubnodeCountType.Entirety).x;
                currentPosition.x += functionRightWidth;
                let functionGap = Utils.GetFromRootPX("--default-shape-width");
                currentPosition.x += functionGap;
            }
            renderedFunctionCount++;
        }
        console.log(this);
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
export class FunctionSignature extends BaseNode.ProgramNode {
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
        sizeCache.subLeftPortion.x += Math.max(sizeCache.subLeftPortion.x, endShapeSize.x / 2);
        sizeCache.subRightPortion.x += Math.max(sizeCache.subRightPortion.x, endShapeSize.x / 2);
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
    GetSideTotalWidth(checkedSide) {
        if (checkedSide === BaseNode.SizeCountType.CountAll)
            return this.GetSize(BaseNode.SizeCountType.OnlyLeft, BaseNode.SubnodeCountType.Entirety).x +
                this.GetSize(BaseNode.SizeCountType.OnlyRight, BaseNode.SubnodeCountType.Entirety).x;
        let totalWidth = super.GetSideTotalWidth(checkedSide);
        let endShapeWidth = this.functionEndShape.GetSize(this.GetEndShapeContent(), ShapeRenderer.ShapeType.FunctionEnd).x;
        totalWidth = Math.max(totalWidth, endShapeWidth / 2);
        return totalWidth;
    }
}
export class DeclarationInstruction extends BaseNode.ProgramNode {
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
                declarationName += `[${variableDeclaration.arraySize.expressionAsStr}]`;
            declarationContent.Append(declarationName, ShapeRenderer.TextType.Bolded);
            if (!isLastDeclaration)
                declarationContent.Append(", ");
        }
        return declarationContent;
    }
    Render(position) { this.AddShape(position); }
    GetType() { return ShapeRenderer.ShapeType.VariableDeclaration; }
}
export class AssignmentInstruction extends BaseNode.ProgramNode {
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
export class IOInstruction extends BaseNode.ProgramNode {
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
export class CallInstruction extends BaseNode.ProgramNode {
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
