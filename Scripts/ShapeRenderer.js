import * as Utils from "./Utils.js";
export let currentPlane;
export function SetPlane(plane) { currentPlane = plane; }
export var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["Unknown"] = -1] = "Unknown";
    ShapeType[ShapeType["FunctionSignature"] = 0] = "FunctionSignature";
    ShapeType[ShapeType["FunctionEnd"] = 1] = "FunctionEnd";
    ShapeType[ShapeType["Call"] = 2] = "Call";
    ShapeType[ShapeType["VariableDeclaration"] = 3] = "VariableDeclaration";
    ShapeType[ShapeType["Assignment"] = 4] = "Assignment";
    ShapeType[ShapeType["Input"] = 5] = "Input";
    ShapeType[ShapeType["Output"] = 6] = "Output";
    ShapeType[ShapeType["Conditional"] = 7] = "Conditional";
    ShapeType[ShapeType["While"] = 8] = "While";
    ShapeType[ShapeType["For"] = 9] = "For";
    ShapeType[ShapeType["Do"] = 10] = "Do";
})(ShapeType || (ShapeType = {}));
var ShapeDisplayType;
(function (ShapeDisplayType) {
    ShapeDisplayType[ShapeDisplayType["Unknown"] = -1] = "Unknown";
    ShapeDisplayType[ShapeDisplayType["Parallelogram"] = 0] = "Parallelogram";
    ShapeDisplayType[ShapeDisplayType["Diamond"] = 1] = "Diamond";
    ShapeDisplayType[ShapeDisplayType["Hexagon"] = 2] = "Hexagon";
    ShapeDisplayType[ShapeDisplayType["Elipse"] = 3] = "Elipse";
    ShapeDisplayType[ShapeDisplayType["Rectangle"] = 4] = "Rectangle";
})(ShapeDisplayType || (ShapeDisplayType = {}));
var ShapeColorType;
(function (ShapeColorType) {
    ShapeColorType[ShapeColorType["Unknown"] = -1] = "Unknown";
    ShapeColorType[ShapeColorType["Purple"] = 0] = "Purple";
    ShapeColorType[ShapeColorType["Blue"] = 1] = "Blue";
    ShapeColorType[ShapeColorType["Green"] = 2] = "Green";
    ShapeColorType[ShapeColorType["Yellow"] = 3] = "Yellow";
    ShapeColorType[ShapeColorType["Red"] = 4] = "Red";
    ShapeColorType[ShapeColorType["Orange"] = 5] = "Orange";
    ShapeColorType[ShapeColorType["LightPurple"] = 6] = "LightPurple";
})(ShapeColorType || (ShapeColorType = {}));
class ShapeColorInfo {
    shapeColor = "";
    shadowColor = "";
    mergePointColor = "";
    constructor(colorOfShape, colorOfShadow, colorOfMergePoint = "#000000") {
        this.shapeColor = colorOfShape;
        this.shadowColor = colorOfShadow;
        this.mergePointColor = colorOfMergePoint;
    }
    static Default() {
        return new ShapeColorInfo("#000000", "#000000");
    }
}
class ShapeDisplayInfo {
    displayType = ShapeDisplayType.Unknown;
    colorType = ShapeColorType.Unknown;
    constructor(type, displayColorType) {
        this.displayType = type;
        this.colorType = displayColorType;
    }
}
const shapeColorsArr = new Map([
    [ShapeColorType.Purple, new ShapeColorInfo("#906eb8", "#5b4278")],
    [ShapeColorType.LightPurple, new ShapeColorInfo("#b794e0", "#6e5c82")],
    [ShapeColorType.Blue, new ShapeColorInfo("#62a2de", "#376fa3")],
    [ShapeColorType.Green, new ShapeColorInfo("#4fc26a", "#2f8a5b")],
    [ShapeColorType.Yellow, new ShapeColorInfo("#edd040", "#a08d30")],
    [ShapeColorType.Red, new ShapeColorInfo("#d13434", "#7d1e1e", "#992323")],
    [ShapeColorType.Orange, new ShapeColorInfo("#c06e22", "#a56020")]
]);
const shapeDisplayArr = new Map([
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
const displayTypeToClassMap = new Map([
    [ShapeDisplayType.Parallelogram, "ParallelogramShape"], [ShapeDisplayType.Diamond, "DiamondShape"],
    [ShapeDisplayType.Hexagon, "HexagonShape"], [ShapeDisplayType.Elipse, "ElipticShape"],
    [ShapeDisplayType.Rectangle, "RectangleShape"]
]);
export function SetShapePosition(currentShape, shapePosition) {
    Utils.SetProperty(currentShape, "--shape-x", shapePosition.x.toString() + "px");
    Utils.SetProperty(currentShape, "--shape-y", shapePosition.y.toString() + "px");
}
const nonBreakingSpace = '\u00A0';
export var TextType;
(function (TextType) {
    TextType[TextType["Bolded"] = 0] = "Bolded";
    TextType[TextType["Italic"] = 1] = "Italic";
    TextType[TextType["Underline"] = 2] = "Underline";
})(TextType || (TextType = {}));
export class TextSegment {
    segmentContent = "";
    appliedTypes = [];
    constructor(content, type = []) {
        this.segmentContent = content;
        if (!Array.isArray(type)) {
            this.appliedTypes = [type];
            return;
        }
        this.appliedTypes = type;
    }
}
class TextStylingElement {
    textType = "span";
    elementClass = "";
    constructor(type = "span", cssClass = "") {
        this.textType = type;
        this.elementClass = cssClass;
    }
}
function GetElementInfoByTextType(appliedTypes) {
    if (appliedTypes.length === 0)
        return [new TextStylingElement("span")];
    let stylingElementsArr = [];
    for (let i = 0; i < appliedTypes.length; i++) {
        let currentTextType = appliedTypes[i];
        let currentStylingElement = new TextStylingElement("span");
        switch (currentTextType) {
            case TextType.Bolded:
                currentStylingElement = new TextStylingElement("strong");
                break;
            case TextType.Italic:
                currentStylingElement = new TextStylingElement("em");
                break;
            case TextType.Underline:
                currentStylingElement = new TextStylingElement("span", "ContentUnderlined");
                break;
        }
        stylingElementsArr.push(currentStylingElement);
    }
    return stylingElementsArr;
}
export class ShapeContent {
    segments = [];
    constructor(segmentContent = "", textTypes = []) { this.Append(segmentContent, textTypes); }
    Append(segmentContent, textTypes = []) {
        let appendedSegment = new TextSegment(segmentContent, textTypes);
        this.segments.push(appendedSegment);
    }
    ToString() {
        let result = "";
        for (let currentSegment of this.segments)
            result += currentSegment.segmentContent;
        return result;
    }
}
export function GetColorInfo(shapeType) {
    let shapeDisplayInfo = shapeDisplayArr.get(shapeType);
    if (shapeDisplayInfo === undefined)
        return ShapeColorInfo.Default();
    let shapeColorInfo = shapeColorsArr.get(shapeDisplayInfo.colorType);
    if (shapeColorInfo === undefined)
        return ShapeColorInfo.Default();
    return shapeColorInfo;
}
function ConstructShape(shapeType, position, shapeContent, offsetShape, isShadow) {
    let shapeDisplayInfo = shapeDisplayArr.get(shapeType);
    let shapeColorInfo = shapeColorsArr.get(shapeDisplayInfo.colorType);
    let shapeClass = displayTypeToClassMap.get(shapeDisplayInfo.displayType);
    let constructedShape = Utils.CreateElement("div", shapeClass, currentPlane);
    let usedShapeColor = isShadow ? shapeColorInfo.shadowColor : shapeColorInfo.shapeColor;
    constructedShape.style.backgroundColor = usedShapeColor;
    if (isShadow)
        constructedShape.classList.add("ShapeShadow");
    if (typeof shapeContent === "string") {
        constructedShape.textContent = shapeContent;
        return constructedShape;
    }
    for (let currentTextSegment of shapeContent.segments) {
        let usedSegmentContent = Utils.ReplaceSurrounding(currentTextSegment.segmentContent, ' ', nonBreakingSpace);
        let isSegmentEmpty = usedSegmentContent.length === 0;
        if (isSegmentEmpty)
            continue;
        let stylingElementsArr = GetElementInfoByTextType(currentTextSegment.appliedTypes);
        let stylingElementsCount = stylingElementsArr.length;
        let latestStylingParent = constructedShape;
        for (let i = 0; i < stylingElementsArr.length; i++) {
            let currentStylingInfo = stylingElementsArr[i];
            let isLastStylingElement = i === stylingElementsCount - 1;
            let currentStylingElemnt = Utils.CreateElement(currentStylingInfo.textType, currentStylingInfo.elementClass, latestStylingParent);
            if (isLastStylingElement)
                currentStylingElemnt.textContent = usedSegmentContent;
            latestStylingParent = currentStylingElemnt;
        }
    }
    let offsetPosition = Utils.Vec2.Zero();
    UpdateShapeProperties(constructedShape);
    let shapeHeight = Utils.GetNumericPixels(Utils.GetProperty(constructedShape, "height"));
    if (offsetShape)
        offsetPosition.y = shapeHeight / 2;
    position = position.Plus(offsetPosition.x, offsetPosition.y);
    SetShapePosition(constructedShape, position);
    return constructedShape;
}
const shapeOffsetMultiplier = new Utils.Vec2(0.5, 0.075);
export function UpdateShapeProperties(currentShape) {
    let planeSize = new Utils.Vec2(currentPlane.clientWidth, currentPlane.clientHeight);
    let shapeWidth = currentShape.clientWidth;
    let shapeOffset = planeSize.Times(shapeOffsetMultiplier.x, shapeOffsetMultiplier.y)
        .Minus(shapeWidth / 2, currentShape.clientHeight / 2);
    Utils.SetProperty(currentShape, "--offset-x", shapeOffset.x.toString() + "px");
    Utils.SetProperty(currentShape, "--offset-y", shapeOffset.y.toString() + "px");
    let defaultWidth = Utils.GetNumericPixels(Utils.GetProperty(currentShape, "--default-width"));
    let widthSizeIncrease = shapeWidth / defaultWidth;
    Utils.SetProperty(currentShape, "--width-size-increase", widthSizeIncrease.toString());
}
export function AddShape(shapeType, position, shapeContent, offsetShape = true) {
    let renderedShape = new RenderedShape();
    renderedShape.mainShape = ConstructShape(shapeType, position, shapeContent, offsetShape, false);
    renderedShape.shadowShape = ConstructShape(shapeType, position, shapeContent, offsetShape, true);
    return renderedShape;
}
export function ClearPlane() { currentPlane.replaceChildren(); }
export class RenderedShape {
    mainShape = null;
    shadowShape = null;
    GetSize() {
        if (this.mainShape === null)
            return Utils.Vec2.Zero();
        let shapeSize = new Utils.Vec2(this.mainShape.clientWidth, this.mainShape.clientHeight);
        return shapeSize;
    }
    Delete() {
        if (this.mainShape !== null)
            this.mainShape.remove();
        if (this.shadowShape !== null)
            this.shadowShape.remove();
        this.mainShape = null;
        this.shadowShape = null;
    }
}
