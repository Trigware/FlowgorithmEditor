import { ShapeType } from "./ShapeRenderer.js";
import * as Utils from "./Utils.js";
export var WindowElementType;
(function (WindowElementType) {
    WindowElementType[WindowElementType["Unknown"] = -1] = "Unknown";
    WindowElementType[WindowElementType["Section"] = 0] = "Section";
    WindowElementType[WindowElementType["Expression"] = 1] = "Expression";
    WindowElementType[WindowElementType["Multiple"] = 2] = "Multiple";
    WindowElementType[WindowElementType["Line"] = 3] = "Line";
    WindowElementType[WindowElementType["Variable"] = 4] = "Variable";
    WindowElementType[WindowElementType["NewButton"] = 5] = "NewButton";
    WindowElementType[WindowElementType["DropDown"] = 6] = "DropDown";
    WindowElementType[WindowElementType["Note"] = 7] = "Note";
    WindowElementType[WindowElementType["Item"] = 8] = "Item";
    WindowElementType[WindowElementType["Datatype"] = 9] = "Datatype";
    WindowElementType[WindowElementType["Exclusive"] = 10] = "Exclusive";
})(WindowElementType || (WindowElementType = {}));
export class WindowElement {
    subElements = [];
    elementType = WindowElementType.Unknown;
    constructor(type) { this.elementType = type; }
    Parse(currentElement) {
        for (let currentChild of currentElement.children) {
            let currentElementType = Utils.GetEnumValueFromLoweredName(WindowElementType, currentChild.tagName);
            if (currentElementType === null)
                continue;
            let currentSubElement = new WindowElement(currentElementType);
            currentSubElement.Parse(currentChild);
            this.subElements.push(currentSubElement);
        }
    }
}
export class EditDialog {
    windowTitle = "";
    summaryText = "";
    sectionMap = new Map();
    Parse(currentElement) {
        for (let currentChild of currentElement.children) {
            let currentTextContent = Utils.RemoveTrailingWhitespace(currentChild.textContent);
            switch (currentChild.tagName) {
                case "title":
                    this.windowTitle = currentTextContent;
                    break;
                case "summary":
                    this.summaryText = currentTextContent;
                    break;
                case "section":
                    let sectionText = currentChild.getAttribute("heading");
                    if (sectionText === null)
                        continue;
                    let currentSection = new WindowElement(WindowElementType.Section);
                    currentSection.Parse(currentChild);
                    this.sectionMap.set(sectionText, currentSection);
                    break;
            }
        }
    }
}
export class WindowsRoot {
    editDialogMap = new Map();
    AddLayout(editDialog, shapeType) { this.editDialogMap.set(shapeType, editDialog); }
    GetLayout(shapeType) {
        let hasWindowLayout = this.editDialogMap.has(shapeType);
        if (!hasWindowLayout)
            return null;
        return this.editDialogMap.get(shapeType);
    }
}
export let windowsLayoutRoot = new WindowsRoot();
let parsedEditDialog = new EditDialog();
export function LoadEditDialogData(fileContents) {
    const xmlParser = new DOMParser();
    const xmlDocument = xmlParser.parseFromString(fileContents, "application/xml");
    let rootElement = xmlDocument.documentElement;
    ParseAllWindowLayouts(rootElement);
}
function ParseAllWindowLayouts(rootElement) {
    for (let currentElement of rootElement.children) {
        let hasCurrentName = currentElement.hasAttribute("name");
        if (!hasCurrentName)
            continue;
        let currentElementName = currentElement.getAttribute("name");
        let currentShapeType = Utils.GetEnumValueFromName(ShapeType, currentElementName);
        if (currentShapeType === null)
            continue;
        parsedEditDialog = new EditDialog();
        parsedEditDialog.Parse(currentElement);
        windowsLayoutRoot.AddLayout(parsedEditDialog, currentShapeType);
    }
}
