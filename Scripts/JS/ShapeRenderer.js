import * as Utils from "./Utils.js";
export let currentPlane;
let measuringCanvas = document.createElement("canvas");
let measuringContext = measuringCanvas.getContext("2d");
let bodyElement = document.getElementById("DocumentBody");
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
    ShapeType[ShapeType["Breakpoint"] = 11] = "Breakpoint";
})(ShapeType || (ShapeType = {}));
export var LabelAlign;
(function (LabelAlign) {
    LabelAlign[LabelAlign["Left"] = 1] = "Left";
    LabelAlign[LabelAlign["HorizontalCenter"] = 2] = "HorizontalCenter";
    LabelAlign[LabelAlign["Right"] = 4] = "Right";
    LabelAlign[LabelAlign["Up"] = 8] = "Up";
    LabelAlign[LabelAlign["VerticalCenter"] = 16] = "VerticalCenter";
    LabelAlign[LabelAlign["Down"] = 32] = "Down";
    LabelAlign[LabelAlign["Center"] = 18] = "Center";
})(LabelAlign || (LabelAlign = {}));
var ShapeDisplayType;
(function (ShapeDisplayType) {
    ShapeDisplayType[ShapeDisplayType["Unknown"] = -1] = "Unknown";
    ShapeDisplayType[ShapeDisplayType["Parallelogram"] = 0] = "Parallelogram";
    ShapeDisplayType[ShapeDisplayType["Diamond"] = 1] = "Diamond";
    ShapeDisplayType[ShapeDisplayType["Hexagon"] = 2] = "Hexagon";
    ShapeDisplayType[ShapeDisplayType["Elipse"] = 3] = "Elipse";
    ShapeDisplayType[ShapeDisplayType["Rectangle"] = 4] = "Rectangle";
    ShapeDisplayType[ShapeDisplayType["Octagon"] = 5] = "Octagon";
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
    ShapeColorType[ShapeColorType["LightRed"] = 7] = "LightRed";
})(ShapeColorType || (ShapeColorType = {}));
export class ShapeColorInfo {
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
    [ShapeColorType.Orange, new ShapeColorInfo("#d67345", "#944c29", "#ba592d")],
    [ShapeColorType.LightRed, new ShapeColorInfo("#ed5c5c", "#c24444")]
]);
export const incompleteShapeColors = new ShapeColorInfo("#858585", "#404040", "#707070");
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
    [ShapeType.Do, new ShapeDisplayInfo(ShapeDisplayType.Hexagon, ShapeColorType.Orange)],
    [ShapeType.Breakpoint, new ShapeDisplayInfo(ShapeDisplayType.Octagon, ShapeColorType.LightRed)]
]);
const displayTypeToClassMap = new Map([
    [ShapeDisplayType.Parallelogram, "ParallelogramShape"], [ShapeDisplayType.Diamond, "DiamondShape"],
    [ShapeDisplayType.Hexagon, "HexagonShape"], [ShapeDisplayType.Elipse, "ElipticShape"],
    [ShapeDisplayType.Rectangle, "RectangleShape"], [ShapeDisplayType.Octagon, "OctagonShape"]
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
const textStylingMap = new Map([
    [TextType.Bolded, "bold"], [TextType.Italic, "italic"]
]);
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
    Equals(otherSegment) {
        let contentMatches = this.segmentContent === otherSegment.segmentContent;
        let stylingCountMatches = this.appliedTypes.length === otherSegment.appliedTypes.length;
        if (!contentMatches || !stylingCountMatches)
            return false;
        let stylingCount = this.appliedTypes.length;
        for (let i = 0; i < stylingCount; i++) {
            let firstStyle = this.appliedTypes[i], otherStyle = otherSegment.appliedTypes[i];
            if (firstStyle !== otherStyle)
                return false;
        }
        return true;
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
    isIncomplete = false;
    constructor(segmentContent = "", textTypes = []) {
        this.Append(segmentContent, textTypes);
    }
    Append(segmentContent, textTypes = []) {
        if (segmentContent.length === 0)
            return;
        let appendedSegment = new TextSegment(segmentContent, textTypes);
        this.segments.push(appendedSegment);
    }
    AppendContent(appendedContent) {
        for (let currentSegment of appendedContent.segments) {
            this.segments.push(currentSegment);
        }
    }
    Equals(comparedContent) {
        if (comparedContent === null)
            return false;
        let segmentCountMatches = this.segments.length === comparedContent.segments.length;
        if (!segmentCountMatches)
            return false;
        let segmentCount = this.segments.length;
        for (let i = 0; i < segmentCount; i++) {
            let firstSegment = this.segments[i], otherSegment = comparedContent.segments[i];
            if (!firstSegment.Equals(otherSegment))
                return false;
        }
        return true;
    }
    ToString() {
        let result = "";
        for (let currentSegment of this.segments)
            result += currentSegment.segmentContent;
        return result;
    }
    SetContent(contentParent) {
        for (let currentTextSegment of this.segments) {
            let usedSegmentContent = Utils.ReplaceSurrounding(currentTextSegment.segmentContent, ' ', nonBreakingSpace);
            let isSegmentEmpty = usedSegmentContent.length === 0;
            if (isSegmentEmpty)
                continue;
            let stylingElementsArr = GetElementInfoByTextType(currentTextSegment.appliedTypes);
            let stylingElementsCount = stylingElementsArr.length;
            let latestStylingParent = contentParent;
            for (let i = 0; i < stylingElementsArr.length; i++) {
                let currentStylingInfo = stylingElementsArr[i];
                let isLastStylingElement = i === stylingElementsCount - 1;
                let currentStylingElemnt = Utils.CreateElement(currentStylingInfo.textType, currentStylingInfo.elementClass, latestStylingParent);
                if (isLastStylingElement)
                    currentStylingElemnt.textContent = usedSegmentContent;
                latestStylingParent = currentStylingElemnt;
            }
        }
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
    if (shapeContent.isIncomplete)
        shapeColorInfo = incompleteShapeColors;
    let shapeClass = displayTypeToClassMap.get(shapeDisplayInfo.displayType);
    let constructedShape = Utils.CreateElement("div", shapeClass, currentPlane);
    let usedShapeColor = isShadow ? shapeColorInfo.shadowColor : shapeColorInfo.shapeColor;
    constructedShape.style.backgroundColor = usedShapeColor;
    if (isShadow)
        constructedShape.classList.add("ShapeShadow");
    shapeContent.SetContent(constructedShape);
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
    let defaultWidth = Utils.GetNumericPixels(Utils.GetProperty(currentShape, "--default-shape-width"));
    let widthSizeIncrease = shapeWidth / defaultWidth;
    Utils.SetProperty(currentShape, "--width-size-increase", widthSizeIncrease.toString());
}
export function AddShape(shapeType, position, shapeContent, offsetShape = true) {
    let renderedShape = new RenderedShape(shapeContent, shapeType);
    renderedShape.mainShape = ConstructShape(shapeType, position, shapeContent, offsetShape, false);
    renderedShape.shadowShape = ConstructShape(shapeType, position, shapeContent, offsetShape, true);
    return renderedShape;
}
export function ClearPlane() { currentPlane.replaceChildren(); }
export function ConstructLabel(labelPosition, labelText, labelAlign = LabelAlign.Center, alignMultiplier = new Utils.Vec2(1, 1)) {
    let constructedLabel = Utils.CreateElement("div", "LabelObject", currentPlane);
    let labelContent = new ShapeContent(labelText, TextType.Bolded);
    labelContent.SetContent(constructedLabel);
    let labelSize = new Utils.Vec2(Utils.GetNumericPixels(Utils.GetProperty(constructedLabel, "width")), Utils.GetNumericPixels(Utils.GetProperty(constructedLabel, "height")));
    let offsetMultiplier = Utils.Vec2.Zero();
    let hasHorizontalAlign = (labelAlign & (LabelAlign.Left | LabelAlign.Right)) !== 0, hasVerticalAlign = (labelAlign & (LabelAlign.Up | LabelAlign.Down)) !== 0;
    if (hasHorizontalAlign)
        offsetMultiplier.x += (labelAlign & LabelAlign.Right) !== 0 ? 1 : -1;
    if (hasVerticalAlign)
        offsetMultiplier.y += (labelAlign & LabelAlign.Down) !== 0 ? 1 : -1;
    offsetMultiplier = offsetMultiplier.Times(alignMultiplier.x, alignMultiplier.y);
    offsetMultiplier.y--;
    let labelOffset = new Utils.Vec2(offsetMultiplier.x * labelSize.x / 2, offsetMultiplier.y * labelSize.y / 2);
    let offsetLabelPos = labelPosition.Plus(labelOffset.x, labelOffset.y);
    SetShapePosition(constructedLabel, offsetLabelPos);
    return constructedLabel;
}
export class RenderedShape {
    mainShape = null;
    shadowShape = null;
    shapeContent = new ShapeContent();
    shapeType = ShapeType.Unknown;
    cachedSize = Utils.Vec2.Zero();
    isSizeCached = false;
    constructor(content = new ShapeContent(), type = ShapeType.Unknown) {
        this.shapeContent = content;
        this.shapeType = type;
    }
    SetProperty(propertyName, propertyValue) {
        if (this.mainShape !== null)
            Utils.SetProperty(this.mainShape, propertyName, propertyValue);
        if (this.shadowShape !== null)
            Utils.SetProperty(this.shadowShape, propertyName, propertyValue);
    }
    GetSize(content = null, type = null) {
        if (type === ShapeType.Unknown)
            return Utils.Vec2.Zero();
        let paramsTypedExplicly = content !== null || type !== null;
        let sizeParamsChanged = paramsTypedExplicly && (this.shapeContent.Equals(content) || this.shapeType === type);
        let willUseCache = !sizeParamsChanged && this.isSizeCached;
        if (willUseCache)
            return this.cachedSize;
        if (content !== null)
            this.shapeContent = content;
        if (type !== null)
            this.shapeType = type;
        let isConditional = this.shapeType === ShapeType.Conditional;
        let textSize = MeasureTextSize(this.shapeContent);
        let defaultShapeWidth = Utils.GetNumericPixels(Utils.GetProperty(document.documentElement, "--default-shape-width"));
        let defaultAspectRatio = Number(Utils.GetProperty(document.documentElement, "--shape-aspect-ratio"));
        let paddingPropertyName = isConditional ? "--diamond-horizonal-padding" : "--shape-horizontal-padding";
        let horizontalPadding = Utils.GetNumericPixels(Utils.GetProperty(document.documentElement, paddingPropertyName));
        let shapeWidth = Math.max(textSize.x, defaultShapeWidth);
        shapeWidth += horizontalPadding * 2;
        let widthSizeIncrease = shapeWidth / defaultShapeWidth;
        let actualAspectRatio = isConditional ? defaultAspectRatio / widthSizeIncrease : defaultAspectRatio;
        let shapeHeight = defaultShapeWidth / actualAspectRatio;
        let shapeSize = new Utils.Vec2(shapeWidth, shapeHeight);
        this.isSizeCached = true;
        this.cachedSize = shapeSize;
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
export function MeasureTextSize(shapeContent) {
    let shapeSize = Utils.Vec2.Zero();
    for (let currentSegment of shapeContent.segments) {
        let fontValue = GetFontValue(currentSegment);
        measuringContext.font = fontValue;
        let segmentMeasurement = measuringContext.measureText(currentSegment.segmentContent);
        shapeSize.x += segmentMeasurement.width;
        let segmentHeight = segmentMeasurement.actualBoundingBoxAscent + segmentMeasurement.actualBoundingBoxDescent;
        shapeSize.y = Math.max(shapeSize.y, segmentHeight);
    }
    return shapeSize;
}
function GetFontValue(currentSegment) {
    let fontStylesStr = "";
    let pageFontFamily = Utils.GetProperty(bodyElement, "font-family");
    let shapeFontSize = Utils.GetProperty(document.documentElement, "--shape-font-size");
    for (let appliedStyle of currentSegment.appliedTypes) {
        if (!textStylingMap.has(appliedStyle))
            continue;
        let styleAsStr = textStylingMap.get(appliedStyle);
        if (fontStylesStr !== "")
            fontStylesStr += ' ';
        fontStylesStr += styleAsStr;
    }
    let fontValue = "";
    fontValue += fontStylesStr;
    if (fontValue !== "")
        fontValue += ' ';
    fontValue += shapeFontSize;
    if (fontValue !== "")
        fontValue += ' ';
    fontValue += pageFontFamily;
    return fontValue;
}
