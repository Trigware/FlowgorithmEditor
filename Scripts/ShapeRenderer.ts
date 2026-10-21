import * as Utils from "./Utils.js"

export let currentPlane: HTMLDivElement;

export function SetPlane(plane: HTMLDivElement) { currentPlane = plane; }

export enum ShapeType {
    Unknown = -1,
    FunctionSignature, FunctionEnd, Call,
    VariableDeclaration, Assignment,
    Input, Output, Conditional,
    While, For, Do
}

enum ShapeDisplayType { Unknown = -1, Parallelogram, Diamond, Hexagon, Elipse, Rectangle }
enum ShapeColorType { Unknown = -1, Purple, Blue, Green, Yellow, Red, Orange, LightPurple }

class ShapeColorInfo {
    public shapeColor: string = ""; public shadowColor: string = "";
    public constructor(colorOfShape: string, colorOfShadow: string) {
        this.shapeColor = colorOfShape; this.shadowColor = colorOfShadow;
    }
}

class ShapeDisplayInfo {
    public displayType: ShapeDisplayType = ShapeDisplayType.Unknown;
    public colorType: ShapeColorType = ShapeColorType.Unknown;
    public constructor(type: ShapeDisplayType, displayColorType: ShapeColorType) {
        this.displayType = type; this.colorType = displayColorType;
    }
}

const shapeColorsArr: Map<ShapeColorType, ShapeColorInfo> = new Map([
    [ShapeColorType.Purple, new ShapeColorInfo("#906eb8", "#5b4278")],
    [ShapeColorType.LightPurple, new ShapeColorInfo("#b794e0", "#6e5c82")],
    [ShapeColorType.Blue, new ShapeColorInfo("#62a2de", "#376fa3")],
    [ShapeColorType.Green, new ShapeColorInfo("#4fc26a", "#2f8a5b")],
    [ShapeColorType.Yellow, new ShapeColorInfo("#edd040", "#a08d30")],
    [ShapeColorType.Red, new ShapeColorInfo("#d13434", "#7d1e1e")],
    [ShapeColorType.Orange, new ShapeColorInfo("#c06e22", "#a56020")]
]);

const shapeDisplayArr: Map<ShapeType, ShapeDisplayInfo> = new Map([
    [ShapeType.FunctionSignature, new ShapeDisplayInfo(ShapeDisplayType.Elipse, ShapeColorType.Purple)],
    [ShapeType.FunctionEnd, new ShapeDisplayInfo(ShapeDisplayType.Elipse, ShapeColorType.Purple)],
    [ShapeType.Call, new ShapeDisplayInfo(ShapeDisplayType.Rectangle, ShapeColorType.LightPurple)],
    [ShapeType.VariableDeclaration, new ShapeDisplayInfo(ShapeDisplayType.Rectangle, ShapeColorType.Yellow)],
    [ShapeType.Assignment, new ShapeDisplayInfo(ShapeDisplayType.Rectangle, ShapeColorType.Yellow)],
    [ShapeType.Input, new ShapeDisplayInfo(ShapeDisplayType.Parallelogram, ShapeColorType.Blue)],
    [ShapeType.Output, new ShapeDisplayInfo(ShapeDisplayType.Parallelogram, ShapeColorType.Green)],
    [ShapeType.Conditional, new ShapeDisplayInfo(ShapeDisplayType.Diamond, ShapeColorType.Red)],
    [ShapeType.While, new ShapeDisplayInfo(ShapeDisplayType.Hexagon, ShapeColorType.Orange)],
    [ShapeType.For, new ShapeDisplayInfo(ShapeDisplayType.Hexagon, ShapeColorType.Orange)],
    [ShapeType.Do, new ShapeDisplayInfo(ShapeDisplayType.Hexagon, ShapeColorType.Orange)]
]);

const displayTypeToClassMap: Map<ShapeDisplayType, string> = new Map([
    [ShapeDisplayType.Parallelogram, "ParallelogramShape"], [ShapeDisplayType.Diamond, "DiamondShape"],
    [ShapeDisplayType.Hexagon, "HexagonShape"], [ShapeDisplayType.Elipse, "ElipticShape"],
    [ShapeDisplayType.Rectangle, "RectangleShape"]
]);

export function SetShapePosition(currentShape: HTMLDivElement, shapePosition: Utils.Vec2) {
    Utils.SetProperty(currentShape, "--shape-x", shapePosition.x.toString() + "px");
    Utils.SetProperty(currentShape, "--shape-y", shapePosition.y.toString() + "px");
}

const nonBreakingSpace: string = '\u00A0';

export enum TextType { Bolded, Italic, Underline }

export class TextSegment {
    public segmentContent: string = "";
    public appliedTypes: TextType[] = [];

    public constructor(content: string, type: TextType | TextType[] = []) {
        this.segmentContent = content;
        if (!Array.isArray(type)) { this.appliedTypes = [type]; return; }
        this.appliedTypes = type;
    }
}

class TextStylingElement {
    public textType: Utils.ElementType = "span";
    public elementClass: string = "";

    public constructor(type: Utils.ElementType = "span", cssClass: string = "") {
        this.textType = type; this.elementClass = cssClass;
    }
}

function GetElementInfoByTextType(appliedTypes: TextType[]): TextStylingElement[] {
    if (appliedTypes.length === 0) return [new TextStylingElement("span")];
    let stylingElementsArr: TextStylingElement[] = [];

    for (let i: number = 0; i < appliedTypes.length; i++) {
        let currentTextType: TextType = appliedTypes[i];
        let currentStylingElement: TextStylingElement = new TextStylingElement("span");

        switch (currentTextType) {
            case TextType.Bolded: currentStylingElement = new TextStylingElement("strong"); break;
            case TextType.Italic: currentStylingElement = new TextStylingElement("em"); break;
            case TextType.Underline: currentStylingElement = new TextStylingElement("span", "ContentUnderlined"); break;
        }

        stylingElementsArr.push(currentStylingElement);
    }

    return stylingElementsArr;
}

export class ShapeContent {
    public segments: TextSegment[] = [];

    public constructor(segmentContent: string = "", textTypes: TextType | TextType[] = []) { this.Append(segmentContent, textTypes); }

    public Append(segmentContent: string, textTypes: TextType | TextType[] = []) {
        let appendedSegment: TextSegment = new TextSegment(segmentContent, textTypes);
        this.segments.push(appendedSegment);
    }
}

function ConstructShape(shapeType: ShapeType, position: Utils.Vec2, shapeContent: ShapeContent, offsetShape: boolean, isShadow: boolean): HTMLDivElement {
    let shapeDisplayInfo: ShapeDisplayInfo = shapeDisplayArr.get(shapeType)!;
    let shapeColorInfo: ShapeColorInfo = shapeColorsArr.get(shapeDisplayInfo.colorType)!;
    let shapeClass: string = displayTypeToClassMap.get(shapeDisplayInfo.displayType)!;
    let constructedShape: HTMLDivElement = Utils.CreateElement("div", shapeClass, currentPlane) as HTMLDivElement;
    let usedShapeColor: string = isShadow ? shapeColorInfo.shadowColor : shapeColorInfo.shapeColor;

    constructedShape.style.backgroundColor = usedShapeColor;
    if (isShadow) constructedShape.classList.add("ShapeShadow");
    if (typeof shapeContent === "string") { constructedShape.textContent = shapeContent; return constructedShape; }

    for (let currentTextSegment of shapeContent.segments) {
        let usedSegmentContent: string = Utils.ReplaceSurrounding(currentTextSegment.segmentContent, ' ', nonBreakingSpace);
        let isSegmentEmpty: boolean = usedSegmentContent.length === 0;
        if (isSegmentEmpty) continue;

        let stylingElementsArr: TextStylingElement[] = GetElementInfoByTextType(currentTextSegment.appliedTypes);
        let stylingElementsCount: number = stylingElementsArr.length;
        let latestStylingParent: HTMLElement = constructedShape;

        for (let i: number = 0; i < stylingElementsArr.length; i++) {
            let currentStylingInfo: TextStylingElement = stylingElementsArr[i];
            let isLastStylingElement: boolean = i === stylingElementsCount - 1;
            let currentStylingElemnt: HTMLElement = Utils.CreateElement(currentStylingInfo.textType, currentStylingInfo.elementClass, latestStylingParent);
            if (isLastStylingElement) currentStylingElemnt.textContent = usedSegmentContent;
            latestStylingParent = currentStylingElemnt;
        }
    }

    let offsetPosition: Utils.Vec2 = Utils.Vec2.Zero();
    UpdateShapeProperties(constructedShape);
    let shapeHeight: number = Utils.GetNumericPixels(Utils.GetProperty(constructedShape, "height"));
    if (offsetShape) offsetPosition.y = shapeHeight / 2;
    position = position.Plus(offsetPosition.x, offsetPosition.y);
    SetShapePosition(constructedShape, position);

    return constructedShape;
}

const shapeOffsetMultiplier: Utils.Vec2 = new Utils.Vec2(0.5, 0.075);

export function UpdateShapeProperties(currentShape: HTMLDivElement) {
    let planeSize: Utils.Vec2 = new Utils.Vec2(currentPlane.clientWidth, currentPlane.clientHeight);
    let shapeWidth: number = currentShape.clientWidth;

    let shapeOffset: Utils.Vec2 = planeSize.Times(shapeOffsetMultiplier.x, shapeOffsetMultiplier.y)
        .Minus(shapeWidth / 2, currentShape.clientHeight / 2);
        
    Utils.SetProperty(currentShape, "--offset-x", shapeOffset.x.toString() + "px");
    Utils.SetProperty(currentShape, "--offset-y", shapeOffset.y.toString() + "px");
    let defaultWidth: number = Utils.GetNumericPixels(Utils.GetProperty(currentShape, "--default-width"));
    let widthSizeIncrease: number = shapeWidth / defaultWidth;
    Utils.SetProperty(currentShape, "--width-size-increase", widthSizeIncrease.toString());
}

export function AddShape(shapeType: ShapeType, position: Utils.Vec2, shapeContent: ShapeContent, offsetShape: boolean = true): RenderedShape {
    let renderedShape: RenderedShape = new RenderedShape();
    renderedShape.mainShape = ConstructShape(shapeType, position, shapeContent, offsetShape, false);
    renderedShape.shadowShape = ConstructShape(shapeType, position, shapeContent, offsetShape, true);
    return renderedShape;
}

export function ClearPlane() { currentPlane.replaceChildren(); }

export class RenderedShape {
    public mainShape: HTMLDivElement | null = null;
    public shadowShape: HTMLDivElement | null = null;

    public GetSize(): Utils.Vec2 {
        if (this.mainShape === null) return Utils.Vec2.Zero();
        let shapeSize: Utils.Vec2 = new Utils.Vec2(this.mainShape.clientWidth, this.mainShape.clientHeight);
        return shapeSize;
    }

    public Delete() {
        if (this.mainShape !== null) this.mainShape.remove();
        if (this.shadowShape !== null) this.shadowShape.remove();
    }
}