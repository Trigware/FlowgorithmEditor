import { Expression, ParenthesisType } from "./Expression.js";
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Utils from "./Utils.js"
import * as Identifier from "./Identifier.js"

let currentProgram: Flowgorithm.Program = new Flowgorithm.Program();
let previouslyParsedElements: Element[] = [];

enum ProgramTag {
    Unknown, Function, Declare, Assign, Input, Output, If, Call, For, While, Do
}

export function Setup(program: Flowgorithm.Program, scriptContents: string) {
    program = new Flowgorithm.Program();
    currentProgram = program;
    const xmlParser: DOMParser = new DOMParser();
    const xmlDocument: XMLDocument = xmlParser.parseFromString(scriptContents, "application/xml") as XMLDocument;
    previouslyParsedElements = [];
    ParseElement(xmlDocument.documentElement, currentProgram);
    console.log(currentProgram);
}

function ParseElement(currentElement: Element, parentNode: Flowgorithm.ProgramNode) {
    let currentTagName: string = currentElement.tagName;
    let elementAlreadyParsed: boolean = previouslyParsedElements.includes(currentElement);
    let skipElement: boolean = currentTagName.length === 0 || elementAlreadyParsed;
    if (skipElement) return;

    let firstLetterUpper: string = currentTagName[0].toUpperCase();
    currentTagName = firstLetterUpper + currentTagName.substring(1);
    let actualTag: ProgramTag | null = Utils.GetEnumValueFromName(ProgramTag, currentTagName);
    
    previouslyParsedElements.push(currentElement);
    let isNodeTag: boolean = actualTag !== null;
    if (isNodeTag) ParseSpecificTag(currentElement, actualTag!, parentNode);

    for (let childElement of currentElement.children) {
       ParseElement(childElement, parentNode);
    }
}

function ParseSpecificTag(currentElement: Element, currentTag: ProgramTag, parentNode: Flowgorithm.ProgramNode) {
    let hasParsingFunction: boolean = tagParsingFunctionMap.has(currentTag);
    if (!hasParsingFunction) return;

    let parsingFunction: (currentElement: Element) => Flowgorithm.ProgramNode = tagParsingFunctionMap.get(currentTag)!;
    let tagAsInstruction: Flowgorithm.ProgramNode = parsingFunction.call(undefined, currentElement);
    parentNode.subNodes.push(tagAsInstruction);
}

const tagParsingFunctionMap: Map<ProgramTag, (currentElement: Element) => Flowgorithm.ProgramNode> = new Map([
    [ProgramTag.Function, ParseFunctionTag],
    [ProgramTag.Declare, ParseDeclarationTag],
    [ProgramTag.Assign, ParseAssignmentTag],
    [ProgramTag.Input, ParseInputTag],
    [ProgramTag.Output, ParseOutputTag],
    [ProgramTag.If, ParseConditionalTag],
    [ProgramTag.Call, ParseCallTag],
    [ProgramTag.For, ParseForTag],
    [ProgramTag.While, ParseWhileTag],
    [ProgramTag.Do, ParseDoWhileTag]
]);

function ParseFunctionTag(currentElement: Element): Flowgorithm.ProgramNode {
    let functionSignature: Flowgorithm.FunctionSignature = new Flowgorithm.FunctionSignature();

    for (let attribute of currentElement.attributes) {
        let identifierValidity: Identifier.IdentifierError = Identifier.GetIdentifierValidity(attribute.value);
        switch (attribute.name) {
            case "name":
                functionSignature.nameError = identifierValidity;
                functionSignature.name = attribute.value;
                break;
            case "type": functionSignature.returnType = Flowgorithm.StrToVarType(attribute.value); break;
            case "variable":
                functionSignature.returnError = identifierValidity;
                functionSignature.returnVariableName = attribute.value;
                break;
        }
    }
    
    let parametersTag: Element | null = currentElement.querySelector("parameters");
    if (parametersTag !== null) ParseParametersTag(parametersTag, functionSignature);
    let functionBodyTag: Element | null = currentElement.querySelector("body");
    if (functionBodyTag !== null) ParseElement(functionBodyTag, functionSignature);
    
    return functionSignature;
}

function ParseParametersTag(currentElement: Element, ownerFunction: Flowgorithm.FunctionSignature) {
    for (let parameterChild of currentElement.children) {
        let currentParameter: Flowgorithm.VariableDeclaration = new Flowgorithm.VariableDeclaration();
        for (let attribute of parameterChild.attributes) {
            switch (attribute.name) {
                case "name":
                    let parameterValidity: Identifier.IdentifierError = Identifier.GetIdentifierValidity(attribute.value);
                    currentParameter.error = parameterValidity;
                    currentParameter.variableName = attribute.value;
                case "type": currentParameter.type = Flowgorithm.StrToVarType(attribute.value);
                case "array": currentParameter.isArray = Flowgorithm.StrToBoolean(attribute.value);
            }
        }
        ownerFunction.parameters.push(currentParameter);
    }
}

function ParseDeclarationTag(currentElement: Element): Flowgorithm.ProgramNode {
    let declarationTag: Flowgorithm.DeclarationInstruction = new Flowgorithm.DeclarationInstruction();
    let declarationInfo: Flowgorithm.VariableDeclaration = new Flowgorithm.VariableDeclaration();
    let variableNames: string[] = [];

    for (let attribute of currentElement.attributes) {
        switch (attribute.name) {
            case "name":
                let declarationListOrErr: string[] | Identifier.IdentifierError = Identifier.ParseDeclarationList(attribute.value);
                if (typeof declarationListOrErr !== "number") { variableNames = declarationListOrErr; break; }
                let errorDeclaration: Flowgorithm.VariableDeclaration = new Flowgorithm.VariableDeclaration();
                errorDeclaration.error = declarationListOrErr;
                declarationTag.declaredVariables.push(errorDeclaration);
                break;
            case "type": declarationInfo.type = Flowgorithm.StrToVarType(attribute.value); break;
            case "array": declarationInfo.isArray = Flowgorithm.StrToBoolean(attribute.value); break;
            case "size":
                let resultingSize: number = Number(attribute.value);
                if (!Number.isNaN(resultingSize)) declarationInfo.arraySize = resultingSize;
                break;
        }
    }

    for (let varName of variableNames) {
        let varDeclaration: Flowgorithm.VariableDeclaration = Flowgorithm.VariableDeclaration.FromInfo(varName, declarationInfo);
        declarationTag.declaredVariables.push(varDeclaration);
    }

    return declarationTag;
}

function ParseAssignmentTag(currentElement: Element): Flowgorithm.ProgramNode {
    let assignmentTag: Flowgorithm.AssignmentInstruction = new Flowgorithm.AssignmentInstruction();
    for (let attribute of currentElement.attributes) {
        switch (attribute.name) {
            case "variable":
                assignmentTag.lvalue = Expression.FromString(attribute.value);
                assignmentTag.isValidLValue = assignmentTag.lvalue.MatchesTemplate(ParenthesisType.Bracketed);
                break;
            case "expression": assignmentTag.rvalue = Expression.FromString(attribute.value); break;
        }
    }
    return assignmentTag;
}

function ParseInputTag(currentElement: Element): Flowgorithm.ProgramNode { return ParseIOTag(currentElement, true); }
function ParseOutputTag(currentElement: Element): Flowgorithm.ProgramNode { return ParseIOTag(currentElement, false); }

function ParseIOTag(currentElement: Element, isInput: boolean): Flowgorithm.IOInstruction {
    let resultInstruction: Flowgorithm.IOInstruction = new Flowgorithm.IOInstruction();
    resultInstruction.isInput = isInput;

    for (let attribute of currentElement.attributes) {
        switch (attribute.name) {
            case "variable":
                if (!isInput) break;
                resultInstruction.expression = Expression.FromString(attribute.value);
                resultInstruction.isValidLValue = resultInstruction.expression.MatchesTemplate(ParenthesisType.Bracketed);
                break;
            case "expression":
                if (isInput) break;
                resultInstruction.expression = Expression.FromString(attribute.value);
                break;
        }
    }

    return resultInstruction;
}

function ParseConditionalTag(currentElement: Element): Flowgorithm.ProgramNode {
    let conditionalTag: Flowgorithm.ConditionalStatement = new Flowgorithm.ConditionalStatement();
    let expressionValue: string | null = currentElement.getAttribute("expression");
    if (expressionValue !== null) conditionalTag.conditional = Expression.FromString(expressionValue);

    let conditionThenTag: Element | null = currentElement.querySelector("then");
    if (conditionThenTag !== null) { ParseElement(conditionThenTag, conditionalTag); conditionalTag.MoveSubnodes(true); }
    let conditionElseTag: Element | null = currentElement.querySelector("else");
    if (conditionElseTag !== null) { ParseElement(conditionElseTag, conditionalTag); conditionalTag.MoveSubnodes(false); }

    return conditionalTag;
}

function ParseCallTag(currentElement: Element): Flowgorithm.ProgramNode {
    let callTag: Flowgorithm.CallInstruction = new Flowgorithm.CallInstruction();
    let expressionValue: string | null = currentElement.getAttribute("expression");
    if (expressionValue === null) expressionValue = "";
    
    let callExpression: Expression = Expression.FromString(expressionValue);
    callTag.callExpression = callExpression;

    let isValidCallExpression: boolean = callExpression.MatchesTemplate(ParenthesisType.Regular);
    callTag.isValidCall = isValidCallExpression;

    return callTag;
}

function ParseForTag(currentElement: Element): Flowgorithm.ProgramNode {
    let forLoop: Flowgorithm.ForLoop = new Flowgorithm.ForLoop();
    for (let attribute of currentElement.attributes) {
        switch (attribute.name) {
            case "variable": forLoop.iteratorName = attribute.value; break;
            case "start": forLoop.loopStart = Expression.FromString(attribute.value); break;
            case "end": forLoop.loopEnd = Expression.FromString(attribute.value); break;
            case "direction": forLoop.isIncreasing = attribute.value !== "dec"; break;
            case "step": forLoop.iterationStep = Expression.FromString(attribute.value); break;
        }
    }

    for (let elementChild of currentElement.children) {
        ParseElement(elementChild, forLoop);
    }
    return forLoop;
}

function ParseWhileTag(currentElement: Element): Flowgorithm.ProgramNode { return ParseConditionalCycleTag(currentElement, false); }
function ParseDoWhileTag(currentElement: Element): Flowgorithm.ProgramNode { return ParseConditionalCycleTag(currentElement, true); }

function ParseConditionalCycleTag(currentElement: Element, isDoWhile: boolean): Flowgorithm.ProgramNode {
    let conditionalCycle: Flowgorithm.ConditionalCycle = new Flowgorithm.ConditionalCycle();
    conditionalCycle.isDoWhile = isDoWhile;

    let expressionValue: string | null = currentElement.getAttribute("expression");
    if (expressionValue !== null) conditionalCycle.expression = Expression.FromString(expressionValue);

    for (let elementChild of currentElement.children) {
        ParseElement(elementChild, conditionalCycle);
    }

    return conditionalCycle;
}