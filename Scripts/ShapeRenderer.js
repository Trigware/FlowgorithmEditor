import * as Utils from "./Utils.js";
let currentPlane;
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
    constructor(colorOfShape, colorOfShadow) {
        this.shapeColor = colorOfShape;
        this.shadowColor = colorOfShadow;
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
    [ShapeColorType.Red, new ShapeColorInfo("#af2b2b", "#6d2626")],
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
const arrowEndingOffsetMultiplier = 0.475;
export class ArrowPath {
    position = Utils.Vec2.Zero();
    segmentLengths = [];
    segmentAngles = [];
    segmentElements = [];
    segmentConnections = [];
    constructor(pos, lengthsArr, directions) {
        this.position = pos;
        this.segmentLengths = lengthsArr;
        this.segmentAngles = directions;
    }
    ConstructArrow() {
        let segmentCount = this.segmentLengths.length;
        let invalidArrayInfo = this.segmentLengths.length != this.segmentAngles.length || segmentCount === 0;
        if (invalidArrayInfo)
            return Utils.Vec2.Zero();
        let currentPosition = this.position;
        let arrowEnding = Utils.CreateElement("div", "ShapeArrowEnding", currentPlane);
        let arrowEndingSize = Utils.GetNumericPixels(Utils.GetProperty(arrowEnding, "--arrow-ending-size"));
        let endingOffset = Utils.Vec2.Zero();
        for (let i = 0; i < segmentCount; i++) {
            let segmentLength = this.segmentLengths[i];
            let segmentAngle = this.segmentAngles[i];
            let arrowSegment = Utils.CreateElement("div", "ShapeArrowSegment", currentPlane);
            this.segmentElements.push(arrowSegment);
            let isLastSegment = i === segmentCount - 1;
            let segmentDirVec = Utils.Vec2.FromAngleDeg(segmentAngle);
            let segmentOffset = segmentDirVec.Times(segmentLength / 2);
            currentPosition = currentPosition.Plus(segmentOffset.x, segmentOffset.y);
            let arrowConnector = null;
            if (!isLastSegment) {
                arrowConnector = Utils.CreateElement("div", "ShapeArrowConnector", currentPlane);
                this.segmentConnections.push(arrowConnector);
            }
            Utils.SetProperty(arrowSegment, "--arrow-length", segmentLength.toString() + "px");
            Utils.SetProperty(arrowSegment, "--rotation", segmentAngle.toString() + "deg");
            SetShapePosition(arrowSegment, currentPosition);
            endingOffset = segmentDirVec.Times(arrowEndingSize * arrowEndingOffsetMultiplier);
            if (isLastSegment)
                segmentOffset = segmentOffset.Plus(endingOffset.x, endingOffset.y);
            currentPosition = currentPosition.Plus(segmentOffset.x, segmentOffset.y);
            if (arrowConnector !== null)
                SetShapePosition(arrowConnector, currentPosition);
        }
        this.segmentConnections.push(arrowEnding);
        let latestAngleDegrees = this.segmentAngles[segmentCount - 1];
        Utils.SetProperty(arrowEnding, "--rotation", latestAngleDegrees.toString() + "deg");
        SetShapePosition(arrowEnding, currentPosition);
        let arrowSize = currentPosition.Minus(this.position.x, this.position.y);
        arrowSize = arrowSize.Plus(endingOffset.x, endingOffset.y);
        return arrowSize;
    }
}
function SetShapePosition(currentShape, shapePosition) {
    Utils.SetProperty(currentShape, "--shape-x", shapePosition.x.toString() + "px");
    Utils.SetProperty(currentShape, "--shape-y", shapePosition.y.toString() + "px");
}
function ConstructShape(shapeType, position, shapeContent, offsetShape, isShadow) {
    let shapeDisplayInfo = shapeDisplayArr.get(shapeType);
    let shapeColorInfo = shapeColorsArr.get(shapeDisplayInfo.colorType);
    let shapeClass = displayTypeToClassMap.get(shapeDisplayInfo.displayType);
    let constructedShape = Utils.CreateElement("div", shapeClass, currentPlane);
    let usedShapeColor = isShadow ? shapeColorInfo.shadowColor : shapeColorInfo.shapeColor;
    let offsetPosition = Utils.Vec2.Zero();
    let shapeHeight = Utils.GetNumericPixels(Utils.GetProperty(constructedShape, "height"));
    if (offsetShape)
        offsetPosition.y = shapeHeight / 2;
    position = position.Plus(offsetPosition.x, offsetPosition.y);
    SetShapePosition(constructedShape, position);
    constructedShape.style.backgroundColor = usedShapeColor;
    if (isShadow)
        constructedShape.classList.add("ShapeShadow");
    constructedShape.textContent = shapeContent;
    return constructedShape;
}
export function AddShape(shapeType, position, shapeContent, offsetShape = true) {
    let renderedShape = new RenderedShape();
    renderedShape.mainShape = ConstructShape(shapeType, position, shapeContent, offsetShape, true);
    renderedShape.shadowShape = ConstructShape(shapeType, position, shapeContent, offsetShape, false);
    return renderedShape;
}
export function ClearPlane() { currentPlane.replaceChildren(); }
export class RenderedShape {
    mainShape = null;
    shadowShape = null;
    GetSize() {
        if (this.mainShape === null)
            return Utils.Vec2.Zero();
        let widthAsStr = Utils.GetProperty(this.mainShape, "width"), heightAsStr = Utils.GetProperty(this.mainShape, "height");
        let shapeSize = new Utils.Vec2(Utils.GetNumericPixels(widthAsStr), Utils.GetNumericPixels(heightAsStr));
        return shapeSize;
    }
}
