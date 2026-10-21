import * as Utils from "./Utils.js";
import { Expression } from "./Expression.js";
import * as Identifier from "./Identifier.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import { ArrowPath } from "./ArrowRendering.js";
function GetEmptyContent() { return new ShapeRenderer.ShapeContent(); }
export class ProgramNode {
    subNodes = [];
    linkedShape = new ShapeRenderer.RenderedShape();
    Clear() { this.subNodes = []; if (this.linkedShape !== null)
        this.linkedShape.Delete(); }
    GetContent() { return GetEmptyContent(); }
    Render(position) { }
    Delete() { this.linkedShape.Delete(); }
    GetSize() {
        let isNotRendered = this.linkedShape.mainShape === null;
        if (isNotRendered)
            return this.GetSizeByRender();
        let nodeSize = this.linkedShape.GetSize();
        return nodeSize;
    }
    GetSizeByRender() {
        this.Render(Utils.Vec2.Zero());
        let nodeSize = this.GetSize();
        this.Delete();
        return nodeSize;
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
        let mainFunction = new FunctionSignature();
        mainFunction.name = "Main";
        createdProgram.subNodes.push(mainFunction);
        return createdProgram;
    }
    Render(position) {
        ShapeRenderer.ClearPlane();
        for (let i = 0; i < this.subNodes.length; i++) {
            if (i > 0)
                break;
            let currentFunction = this.subNodes[i];
            currentFunction.Render(position);
        }
    }
}
const defaultArrowLength = 60;
const defaultArrowAngle = 90;
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
    Render(position) {
        let latestShapePosition = position;
        let functionSignatureShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.FunctionSignature, position, this.GetContent(), false);
        latestShapePosition.y += functionSignatureShape.GetSize().y / 2;
        this.linkedShape = functionSignatureShape;
        let ownedShapeCount = this.subNodes.length + 1;
        for (let i = 0; i < ownedShapeCount; i++) {
            let isLastShape = i === ownedShapeCount - 1;
            let connectingArrow = new ArrowPath(latestShapePosition, [defaultArrowLength], [defaultArrowAngle]);
            let arrowTotalSize = connectingArrow.GetArrowSize();
            latestShapePosition.y += arrowTotalSize.y;
            if (isLastShape) {
                this.RenderEndShape(latestShapePosition);
                break;
            }
            let currentNode = this.subNodes[i];
            let currentHeight = currentNode.GetSize().y;
            currentNode.Render(latestShapePosition);
            latestShapePosition.y += currentHeight;
        }
    }
    RenderEndShape(position) {
        let returnShapeContent = GetEmptyContent();
        let doesFunctionReturn = this.returnType !== VariableType.Void;
        let returnTypeAsStr = VariableType[this.returnType];
        if (doesFunctionReturn) {
            returnShapeContent.Append("Return", ShapeRenderer.TextType.Bolded);
            returnShapeContent.Append(` ${returnTypeAsStr} ${this.returnVariableName}`);
        }
        else
            returnShapeContent.Append("End", ShapeRenderer.TextType.Bolded);
        this.functionEndShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.FunctionEnd, position, returnShapeContent);
    }
    Delete() { super.Delete(); this.functionEndShape.Delete(); }
}
export class DeclarationInstruction extends ProgramNode {
    declaredVariables = [];
    GetContent() {
        let isWithoutDeclarations = this.declaredVariables.length === 0;
        if (isWithoutDeclarations)
            return new ShapeRenderer.ShapeContent("Declare");
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
    Render(position) {
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.VariableDeclaration, position, this.GetContent());
    }
}
export class AssignmentInstruction extends ProgramNode {
    lvalue = new Expression();
    rvalue = new Expression();
    isValidLValue = true;
    GetContent() { return new ShapeRenderer.ShapeContent(`${this.lvalue.expressionAsStr} = ${this.rvalue.expressionAsStr}`); }
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
        let isExpressionEmpty = this.expression.expressionAsStr.length === 0;
        if (!isExpressionEmpty)
            instructionContent.Append(` ${this.expression.expressionAsStr}`, ShapeRenderer.TextType.Bolded);
        return instructionContent;
    }
    Render(position) {
        let shapeType = this.isInput ? ShapeRenderer.ShapeType.Input : ShapeRenderer.ShapeType.Output;
        this.linkedShape = ShapeRenderer.AddShape(shapeType, position, this.GetContent());
    }
}
export class CallInstruction extends ProgramNode {
    callExpression = new Expression();
    isValidCall = false;
    GetContent() {
        return new ShapeRenderer.ShapeContent(this.callExpression.expressionAsStr);
    }
    Render(position) {
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Call, position, this.GetContent());
    }
}
export class ConditionalStatement extends ProgramNode {
    conditional = new Expression();
    thenNode = new ProgramNode();
    elseNode = new ProgramNode();
    MoveSubnodes(moveToThen) {
        let selectedNode = moveToThen ? this.thenNode : this.elseNode;
        selectedNode.subNodes = this.subNodes.slice();
        this.subNodes = [];
    }
    GetContent() {
        let resultContent = new ShapeRenderer.ShapeContent("if ");
        resultContent.Append(this.conditional.expressionAsStr, ShapeRenderer.TextType.Bolded);
        return resultContent;
    }
    Render(position) {
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Conditional, position, this.GetContent());
    }
}
export class ForLoop extends ProgramNode {
    iteratorName = "";
    loopStart = new Expression();
    loopEnd = new Expression();
    iterationStep = new Expression();
    isIncreasing = true;
}
export class ConditionalCycle extends ProgramNode {
    expression = new Expression();
    isDoWhile = false;
}
export function StrToVarType(typeAsStr) {
    let varType = Utils.GetEnumValueFromName(VariableType, typeAsStr);
    if (varType === null)
        return VariableType.Void;
    return varType;
}
export function StrToBoolean(booleanAsStr) { return booleanAsStr === "True"; }
