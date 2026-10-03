import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Utils from "./Utils.js";
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
    currentProgram = program;
    const xmlParser = new DOMParser();
    const xmlDocument = xmlParser.parseFromString(scriptContents, "application/xml");
    ParseElement(xmlDocument.documentElement);
    console.log(currentProgram);
}
function ParseElement(currentElement) {
    let currentTagName = currentElement.tagName;
    if (currentTagName.length == 0)
        return;
    let firstLetterUpper = currentTagName[0].toUpperCase();
    currentTagName = firstLetterUpper + currentTagName.substring(1);
    let actualTag = Utils.GetEnumValueFromName(ProgramTag, currentTagName);
    if (actualTag !== null)
        ParseSpecificTag(currentElement, actualTag);
    for (let childElement of currentElement.children)
        ParseElement(childElement);
}
function ParseSpecificTag(currentElement, currentTag) {
    let hasParsingFunction = tagParsingFunctionMap.has(currentTag);
    if (!hasParsingFunction)
        return;
    let parsingFunction = tagParsingFunctionMap.get(currentTag);
    parsingFunction.call(undefined, currentElement);
}
const tagParsingFunctionMap = new Map([
    [ProgramTag.Function, ParseFunctionTag]
]);
function ParseFunctionTag(currentElement) {
    let functionSignature = new Flowgorithm.FunctionSignature();
    for (let attribute of currentElement.attributes) {
        switch (attribute.name) {
            case "name":
                functionSignature.name = attribute.value;
                break;
            case "type": functionSignature.returnType = Flowgorithm.StrToVarType(attribute.value);
        }
    }
    currentProgram.availableFunctions.push(functionSignature);
}
