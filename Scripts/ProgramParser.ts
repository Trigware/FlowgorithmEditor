import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Utils from "./Utils.js"

let currentProgram: Flowgorithm.Program = new Flowgorithm.Program();

enum ProgramTag {
    Unknown, Function, Declare, Assign, Input, Output, If, Call, For, While, Do
}

export function Setup(program: Flowgorithm.Program, scriptContents: string) {
    currentProgram = program;
    const xmlParser: DOMParser = new DOMParser();
    const xmlDocument: XMLDocument = xmlParser.parseFromString(scriptContents, "application/xml") as XMLDocument;
    ParseElement(xmlDocument.documentElement);
    console.log(currentProgram);
}

function ParseElement(currentElement: Element) {
    let currentTagName: string = currentElement.tagName;
    if (currentTagName.length == 0) return;

    let firstLetterUpper: string = currentTagName[0].toUpperCase();
    currentTagName = firstLetterUpper + currentTagName.substring(1);
    let actualTag: ProgramTag | null = Utils.GetEnumValueFromName(ProgramTag, currentTagName);
    
    if (actualTag !== null) ParseSpecificTag(currentElement, actualTag);
    for (let childElement of currentElement.children) ParseElement(childElement);
}

function ParseSpecificTag(currentElement: Element, currentTag: ProgramTag) {
    let hasParsingFunction: boolean = tagParsingFunctionMap.has(currentTag);
    if (!hasParsingFunction) return;
    let parsingFunction: (currentElement: Element) => void = tagParsingFunctionMap.get(currentTag)!;
    parsingFunction.call(undefined, currentElement);
}

const tagParsingFunctionMap: Map<ProgramTag, (currentElement: Element) => void> = new Map([
    [ProgramTag.Function, ParseFunctionTag]
]);

function ParseFunctionTag(currentElement: Element): void {
    let functionSignature: Flowgorithm.FunctionSignature = new Flowgorithm.FunctionSignature();

    for (let attribute of currentElement.attributes) {
        switch (attribute.name) {
            case "name": functionSignature.name = attribute.value; break;
            case "type": functionSignature.returnType = Flowgorithm.StrToVarType(attribute.value);
        }
    }
    currentProgram.availableFunctions.push(functionSignature);
}