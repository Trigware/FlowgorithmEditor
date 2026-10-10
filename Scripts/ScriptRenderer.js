import * as Utils from "./Utils.js";
let currentPlane;
export function RenderScript(currentProgram, shapePlane) {
    currentPlane = shapePlane;
    for (let i = 0; i < currentProgram.subNodes.length; i++) {
        if (i > 0)
            break;
        let currentFunction = currentProgram.subNodes[i];
        RenderFunction(currentFunction);
    }
}
var ShapeType;
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
    [ShapeColorType.Purple, new ShapeColorInfo("#7a55a6", "#5b4278")],
    [ShapeColorType.Blue, new ShapeColorInfo("#3e82c2", "#376fa3")],
    [ShapeColorType.Green, new ShapeColorInfo("#33a369", "#2f8a5b")],
    [ShapeColorType.Yellow, new ShapeColorInfo("#b9c424", "#7c8320")],
    [ShapeColorType.Red, new ShapeColorInfo("#af2b2b", "#6d2626")],
    [ShapeColorType.Orange, new ShapeColorInfo("#c06e22", "#a56020")]
]);
const shapeDisplayArr = new Map([
    [ShapeType.FunctionSignature, new ShapeDisplayInfo(ShapeDisplayType.Elipse, ShapeColorType.Purple)],
    [ShapeType.FunctionEnd, new ShapeDisplayInfo(ShapeDisplayType.Elipse, ShapeColorType.Purple)],
    [ShapeType.Call, new ShapeDisplayInfo(ShapeDisplayType.Rectangle, ShapeColorType.Purple)],
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
class ArrowPath {
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
            return;
        let currentPosition = this.position;
        for (let i = 0; i < segmentCount; i++) {
            let segmentLength = this.segmentLengths[i];
            let segmentAngle = this.segmentAngles[i];
            let arrowSegment = Utils.CreateElement("div", "ShapeArrowSegment", currentPlane);
            this.segmentElements.push(arrowSegment);
            let isLastSegment = i === segmentCount - 1;
            let segmentDirVec = Utils.Vec2.FromAngleDeg(segmentAngle);
            let segmentOffset = segmentDirVec.Times(segmentLength).Divide(2);
            currentPosition = currentPosition.Plus(segmentOffset.x, segmentOffset.y);
            let arrowConnector = null;
            if (!isLastSegment) {
                arrowConnector = Utils.CreateElement("div", "ShapeArrowConnector", currentPlane);
                this.segmentConnections.push(arrowConnector);
            }
            Utils.SetProperty(arrowSegment, "--arrow-length", segmentLength.toString() + "px");
            Utils.SetProperty(arrowSegment, "--rotation", segmentAngle.toString() + "deg");
            SetShapePosition(arrowSegment, currentPosition);
            currentPosition = currentPosition.Plus(segmentOffset.x, segmentOffset.y);
            if (arrowConnector !== null)
                SetShapePosition(arrowConnector, currentPosition);
        }
        let arrowEnding = Utils.CreateElement("div", "ShapeArrowEnding", currentPlane);
        this.segmentConnections.push(arrowEnding);
        let latestAngleDegrees = this.segmentAngles[segmentCount - 1];
        Utils.SetProperty(arrowEnding, "--rotation", latestAngleDegrees.toString() + "deg");
        SetShapePosition(arrowEnding, currentPosition);
    }
}
function SetShapePosition(currentShape, shapePosition) {
    Utils.SetProperty(currentShape, "--shape-x", shapePosition.x.toString() + "px");
    Utils.SetProperty(currentShape, "--shape-y", shapePosition.y.toString() + "px");
}
function RenderFunction(currentFunction) {
    let arrowPath = new ArrowPath(new Utils.Vec2(0, 24), [50, 120, 80], [70, 30, 300]);
    arrowPath.ConstructArrow();
    AddShape(ShapeType.FunctionSignature, Utils.Vec2.Zero(), currentFunction.name);
}
function ConstructShape(shapeType, position, shapeContent, isShadow) {
    let shapeDisplayInfo = shapeDisplayArr.get(shapeType);
    let shapeColorInfo = shapeColorsArr.get(shapeDisplayInfo.colorType);
    let shapeClass = displayTypeToClassMap.get(shapeDisplayInfo.displayType);
    let constructedShape = Utils.CreateElement("div", shapeClass, currentPlane);
    let usedShapeColor = isShadow ? shapeColorInfo.shadowColor : shapeColorInfo.shapeColor;
    SetShapePosition(constructedShape, position);
    constructedShape.style.backgroundColor = usedShapeColor;
    if (isShadow)
        constructedShape.classList.add("ShapeShadow");
    constructedShape.textContent = shapeContent;
}
function AddShape(shapeType, position, shapeContent) {
    ConstructShape(shapeType, position, shapeContent, true);
    ConstructShape(shapeType, position, shapeContent, false);
}
