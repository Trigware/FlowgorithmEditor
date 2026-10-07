import { Expression } from "./Expression.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Utils from "./Utils.js";
import * as Identifier from "./Identifier.js";
let currentProgram = new Flowgorithm.Program();
var ProgramTag;
(function (ProgramTag) {
    ProgramTag[ProgramTag["Unknown"] = 0] = "Unknown";
    ProgramTag[ProgramTag["Function"] = 1] = "Function";
    ProgramTag[ProgramTag["Declare"] = 2] = "Declare";
    ProgramTag[ProgramTag["Assign"] = 3] = "Assign";
    ProgramTag[ProgramTag["Input"] = 4] = "Input";
    ProgramTag[ProgramTag["Output"] = 5] = "Output";
    ProgramTag[ProgramTag["If"] = 6] = "If";
    ProgramTag[ProgramTag["Call"] = 7] = "Call";
    ProgramTag[ProgramTag["For"] = 8] = "For";
    ProgramTag[ProgramTag["While"] = 9] = "While";
    ProgramTag[ProgramTag["Do"] = 10] = "Do";
})(ProgramTag || (ProgramTag = {}));
export function Setup(program, scriptContents) {
    program = new Flowgorithm.Program();
    currentProgram = program;
    const xmlParser = new DOMParser();
    const xmlDocument = xmlParser.parseFromString(scriptContents, "application/xml");
    ParseElement(xmlDocument.documentElement, currentProgram);
    console.log(currentProgram);
}
function ParseElement(currentElement, parentNode, notNodeTagExit = false) {
    let currentTagName = currentElement.tagName;
    if (currentTagName.length == 0)
        return;
    let firstLetterUpper = currentTagName[0].toUpperCase();
    currentTagName = firstLetterUpper + currentTagName.substring(1);
    let actualTag = Utils.GetEnumValueFromName(ProgramTag, currentTagName);
    let isNodeTag = actualTag !== null;
    if (!isNodeTag && notNodeTagExit)
        return;
    if (isNodeTag)
        ParseSpecificTag(currentElement, actualTag, parentNode);
    for (let childElement of currentElement.children)
        ParseElement(childElement, parentNode, true);
}
function ParseSpecificTag(currentElement, currentTag, parentNode) {
    let hasParsingFunction = tagParsingFunctionMap.has(currentTag);
    if (!hasParsingFunction)
        return;
    let parsingFunction = tagParsingFunctionMap.get(currentTag);
    let tagAsInstruction = parsingFunction.call(undefined, currentElement);
    parentNode.subNodes.push(tagAsInstruction);
}
const tagParsingFunctionMap = new Map([
    [ProgramTag.Function, ParseFunctionTag],
    [ProgramTag.Declare, ParseDeclarationTag],
    [ProgramTag.Assign, ParseAssignmentTag],
    [ProgramTag.Input, ParseInputTag],
    [ProgramTag.Output, ParseOutputTag],
    [ProgramTag.If, ParseConditionalTag]
]);
function ParseFunctionTag(currentElement) {
    let functionSignature = new Flowgorithm.FunctionSignature();
    for (let attribute of currentElement.attributes) {
        let identifierValidity = Identifier.GetIdentifierValidity(attribute.value);
        switch (attribute.name) {
            case "name":
                functionSignature.nameError = identifierValidity;
                functionSignature.name = attribute.value;
                break;
            case "type":
                functionSignature.returnType = Flowgorithm.StrToVarType(attribute.value);
                break;
            case "variable":
                functionSignature.returnError = identifierValidity;
                functionSignature.returnVariableName = attribute.value;
                break;
        }
    }
    let parametersTag = currentElement.querySelector("parameters");
    if (parametersTag !== null)
        ParseParametersTag(parametersTag, functionSignature);
    let functionBodyTag = currentElement.querySelector("body");
    if (functionBodyTag !== null)
        ParseElement(functionBodyTag, functionSignature);
    return functionSignature;
}
function ParseParametersTag(currentElement, ownerFunction) {
    for (let parameterChild of currentElement.children) {
        let currentParameter = new Flowgorithm.VariableDeclaration();
        for (let attribute of parameterChild.attributes) {
            switch (attribute.name) {
                case "name":
                    let parameterValidity = Identifier.GetIdentifierValidity(attribute.value);
                    currentParameter.error = parameterValidity;
                    currentParameter.variableName = attribute.value;
                case "type": currentParameter.type = Flowgorithm.StrToVarType(attribute.value);
                case "array": currentParameter.isArray = Flowgorithm.StrToBoolean(attribute.value);
            }
        }
        ownerFunction.parameters.push(currentParameter);
    }
}
function ParseDeclarationTag(currentElement) {
    let declarationTag = new Flowgorithm.DeclarationInstruction();
    let declarationInfo = new Flowgorithm.VariableDeclaration();
    let variableNames = [];
    for (let attribute of currentElement.attributes) {
        switch (attribute.name) {
            case "name":
                let declarationListOrErr = Identifier.ParseDeclarationList(attribute.value);
                if (typeof declarationListOrErr !== "number") {
                    variableNames = declarationListOrErr;
                    break;
                }
                let errorDeclaration = new Flowgorithm.VariableDeclaration();
                errorDeclaration.error = declarationListOrErr;
                declarationTag.declaredVariables.push(errorDeclaration);
                break;
            case "type":
                declarationInfo.type = Flowgorithm.StrToVarType(attribute.value);
                break;
            case "array":
                declarationInfo.isArray = Flowgorithm.StrToBoolean(attribute.value);
                break;
            case "size":
                let resultingSize = Number(attribute.value);
                if (!Number.isNaN(resultingSize))
                    declarationInfo.arraySize = resultingSize;
                break;
        }
    }
    for (let varName of variableNames) {
        let varDeclaration = Flowgorithm.VariableDeclaration.FromInfo(varName, declarationInfo);
        declarationTag.declaredVariables.push(varDeclaration);
    }
    return declarationTag;
}
function ParseAssignmentTag(currentElement) {
    let assignmentTag = new Flowgorithm.AssignmentInstruction();
    for (let attribute of currentElement.attributes) {
        switch (attribute.name) {
            case "variable":
                assignmentTag.lvalue = Expression.FromString(attribute.value);
                break;
            case "expression":
                assignmentTag.rvalue = Expression.FromString(attribute.value);
                break;
        }
    }
    return assignmentTag;
}
function ParseInputTag(currentElement) { return ParseIOTag(currentElement, true); }
function ParseOutputTag(currentElement) { return ParseIOTag(currentElement, false); }
function ParseIOTag(currentElement, isInput) {
    let resultInstruction = new Flowgorithm.IOInstruction();
    resultInstruction.isInput = isInput;
    for (let attribute of currentElement.attributes) {
        switch (attribute.name) {
            case "variable":
                if (isInput) {
                    resultInstruction.expression = Expression.FromString(attribute.value);
                }
                break;
            case "expression":
                if (!isInput) {
                    resultInstruction.expression = Expression.FromString(attribute.value);
                }
                break;
        }
    }
    return resultInstruction;
}
function ParseConditionalTag(currentElement) {
    let conditionalTag = new Flowgorithm.ConditionalStatement();
    let expressionValue = currentElement.getAttribute("expression");
    if (expressionValue !== null)
        conditionalTag.conditional = Expression.FromString(expressionValue);
    let conditionThenTag = currentElement.querySelector("then");
    if (conditionThenTag !== null) {
        ParseElement(conditionThenTag, conditionalTag);
        conditionalTag.MoveSubnodes(true);
    }
    let conditionElseTag = currentElement.querySelector("else");
    if (conditionElseTag !== null) {
        ParseElement(conditionElseTag, conditionalTag);
        conditionalTag.MoveSubnodes(false);
    }
    return conditionalTag;
}
