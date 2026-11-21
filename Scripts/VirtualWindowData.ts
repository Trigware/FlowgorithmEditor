import { ShapeType } from "./ShapeRenderer.js";
import * as Utils from "./Utils.js"

type WindowSubElement = WindowElement | string;

export enum WindowElementType {
    Unknown = -1,
    Section, Expression, Multiple, Line, Variable, NewButton, DropDown, Note, Item, Datatype, Exclusive
}

export class WindowElement {
    public subElements: WindowSubElement[] = [];
    public elementType: WindowElementType = WindowElementType.Unknown;

    public constructor(type: WindowElementType) { this.elementType = type; }
    
    public Parse(currentElement: Element) {
        for (let currentChild of currentElement.children) {
            let currentElementType: WindowElementType | null = Utils.GetEnumValueFromLoweredName(WindowElementType, currentChild.tagName);
            if (currentElementType === null) continue;

            let currentSubElement: WindowElement = new WindowElement(currentElementType);
            currentSubElement.Parse(currentChild);
            this.subElements.push(currentSubElement);
        }
    }
}

export class EditDialog {
    public windowTitle: string = ""; public summaryText: string = "";
    public sectionMap: Map<string, WindowElement> = new Map();

    public Parse(currentElement: Element) {
        for (let currentChild of currentElement.children) {
            let currentTextContent: string = Utils.RemoveTrailingWhitespace(currentChild.textContent);

            switch (currentChild.tagName) {
                case "title": this.windowTitle = currentTextContent; break;
                case "summary": this.summaryText = currentTextContent; break;
                case "section":
                    let sectionText: string | null = currentChild.getAttribute("heading");
                    if (sectionText === null) continue;

                    let currentSection: WindowElement = new WindowElement(WindowElementType.Section);
                    currentSection.Parse(currentChild);
                    this.sectionMap.set(sectionText, currentSection);
                    break;
            }
        }
    }
}

export class WindowsRoot {
    private editDialogMap: Map<ShapeType, EditDialog> = new Map();

    public AddLayout(editDialog: EditDialog, shapeType: ShapeType) { this.editDialogMap.set(shapeType, editDialog); }

    public GetLayout(shapeType: ShapeType): EditDialog | null {
        let hasWindowLayout: boolean = this.editDialogMap.has(shapeType);
        if (!hasWindowLayout) return null;
        return this.editDialogMap.get(shapeType)!;
    }
}

export let windowsLayoutRoot: WindowsRoot = new WindowsRoot();
let parsedEditDialog: EditDialog = new EditDialog();

export function LoadEditDialogData(fileContents: string) {
    const xmlParser: DOMParser = new DOMParser();
    const xmlDocument: XMLDocument = xmlParser.parseFromString(fileContents, "application/xml") as XMLDocument;
    let rootElement: Element = xmlDocument.documentElement;
    ParseAllWindowLayouts(rootElement);
}

function ParseAllWindowLayouts(rootElement: Element) {
    for (let currentElement of rootElement.children) {
        let hasCurrentName: boolean = currentElement.hasAttribute("name");
        if (!hasCurrentName) continue;

        let currentElementName: string = currentElement.getAttribute("name")!;
        let currentShapeType: ShapeType | null = Utils.GetEnumValueFromName(ShapeType, currentElementName);
        if (currentShapeType === null) continue;

        parsedEditDialog = new EditDialog();
        parsedEditDialog.Parse(currentElement);
        windowsLayoutRoot.AddLayout(parsedEditDialog, currentShapeType);
    }
}