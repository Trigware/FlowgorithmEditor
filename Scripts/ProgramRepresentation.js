import * as Utils from "./Utils.js";
import { Expression } from "./Expression.js";
import * as Identifier from "./Identifier.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
export class ProgramNode {
    subNodes = [];
    Clear() {
        this.subNodes = [];
    }
    GetContent() { return ""; }
    Render(position) { return Utils.Vec2.Zero(); }
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
    Render(position = Utils.Vec2.Zero()) {
        ShapeRenderer.ClearPlane();
        for (let i = 0; i < this.subNodes.length; i++) {
            if (i > 0)
                break;
            let currentFunction = this.subNodes[i];
            currentFunction.Render(position);
        }
        return Utils.Vec2.Zero();
    }
}
const defaultArrowLength = 50;
const defaultArrowAngle = 90;
export class FunctionSignature extends ProgramNode {
    name = "";
    parameters = [];
    returnType = VariableType.Void;
    returnVariableName = "";
    nameError = Identifier.IdentifierError.None;
    returnError = Identifier.IdentifierError.None;
    GetContent() {
        let signatureAsStr = this.name;
        let parameterCount = this.parameters.length;
        if (parameterCount > 0)
            signatureAsStr += " (";
        for (let i = 0; i < parameterCount; i++) {
            let currentParameter = this.parameters[i];
            let isLastParameter = i === parameterCount - 1;
            signatureAsStr += currentParameter.ToString();
            if (!isLastParameter)
                signatureAsStr += ", ";
        }
        if (parameterCount > 0)
            signatureAsStr += ")";
        return signatureAsStr;
    }
    Render(position) {
        let latestShapePosition = position;
        let functionSignatureShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.FunctionSignature, position, this.GetContent(), false);
        latestShapePosition.y += functionSignatureShape.GetSize().y / 2;
        let ownedShapeCount = this.subNodes.length + 1;
        for (let i = 0; i < ownedShapeCount; i++) {
            let isLastShape = i === ownedShapeCount - 1;
            let connectingArrow = new ShapeRenderer.ArrowPath(latestShapePosition, [defaultArrowLength], [defaultArrowAngle]);
            let arrowTotalSize = connectingArrow.ConstructArrow();
            latestShapePosition = latestShapePosition.Plus(arrowTotalSize.x, arrowTotalSize.y);
            if (isLastShape) {
                this.RenderEndShape(latestShapePosition);
                break;
            }
            let currentNode = this.subNodes[i];
            let nodeSize = currentNode.Render(latestShapePosition);
            latestShapePosition.y += nodeSize.y;
        }
        return Utils.Vec2.Zero();
    }
    RenderEndShape(position) {
        let returnShapeMessage = "End";
        let doesFunctionReturn = this.returnType !== VariableType.Void;
        let returnTypeAsStr = VariableType[this.returnType];
        if (doesFunctionReturn)
            returnShapeMessage = `Return ${returnTypeAsStr} ${this.returnVariableName}`;
        ShapeRenderer.AddShape(ShapeRenderer.ShapeType.FunctionEnd, position, returnShapeMessage);
    }
}
export class DeclarationInstruction extends ProgramNode {
    declaredVariables = [];
    GetContent() {
        let isWithoutDeclarations = this.declaredVariables.length === 0;
        if (isWithoutDeclarations)
            return "Declare";
        let declareTypeAsStr = this.declaredVariables[0].ToString(false) + " ";
        let declareContents = declareTypeAsStr;
        let declarationsCount = this.declaredVariables.length;
        for (let i = 0; i < this.declaredVariables.length; i++) {
            let variableDeclaration = this.declaredVariables[i];
            let isLastDeclaration = i === declarationsCount - 1;
            declareContents += variableDeclaration.variableName;
            if (variableDeclaration.isArray)
                declareContents += `[${variableDeclaration.arraySize}]`;
            if (!isLastDeclaration)
                declareContents += ", ";
        }
        return declareContents;
    }
    Render(position) { return ShapeRenderer.AddShape(ShapeRenderer.ShapeType.VariableDeclaration, position, this.GetContent()).GetSize(); }
}
export class AssignmentInstruction extends ProgramNode {
    lvalue = new Expression();
    rvalue = new Expression();
    isValidLValue = true;
    GetContent() { return `${this.lvalue.expressionAsStr} = ${this.rvalue.expressionAsStr}`; }
    Render(position) { return ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Assignment, position, this.GetContent()).GetSize(); }
}
export class IOInstruction extends ProgramNode {
    expression = new Expression();
    isInput = false;
    isValidLValue = true;
    GetContent() {
        let shapeContent = this.isInput ? "Input" : "Output";
        let isExpressionEmpty = this.expression.expressionAsStr.length === 0;
        if (!isExpressionEmpty)
            shapeContent += ` ${this.expression.expressionAsStr}`;
        return shapeContent;
    }
    Render(position) {
        let shapeType = this.isInput ? ShapeRenderer.ShapeType.Input : ShapeRenderer.ShapeType.Output;
        let renderedShape = ShapeRenderer.AddShape(shapeType, position, this.GetContent());
        return renderedShape.GetSize();
    }
}
export class CallInstruction extends ProgramNode {
    callExpression = new Expression();
    isValidCall = false;
    GetContent() { return this.callExpression.expressionAsStr; }
    Render(position) { return ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Call, position, this.callExpression.expressionAsStr).GetSize(); }
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
