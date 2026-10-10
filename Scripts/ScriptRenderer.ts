import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Utils from "./Utils.js"

let currentPlane: HTMLDivElement;

export function RenderScript(currentProgram: Flowgorithm.Program, shapePlane: HTMLDivElement) {
    currentPlane = shapePlane;

    for (let i = 0; i < currentProgram.subNodes.length; i++) {
        if (i > 0) break;
        let currentFunction: Flowgorithm.FunctionSignature = currentProgram.subNodes[i] as Flowgorithm.FunctionSignature;
        RenderFunction(currentFunction);
    }
}

enum ShapeType {
    Unknown = -1,
    FunctionSignature, FunctionEnd, Call,
    VariableDeclaration, Assignment,
    Input, Output, Conditional,
    While, For, Do
}

enum ShapeDisplayType { Unknown = -1, Parallelogram, Diamond, Hexagon, Elipse, Rectangle }
enum ShapeColorType { Unknown = -1, Purple, Blue, Green, Yellow, Red, Orange }

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
    [ShapeColorType.Purple, new ShapeColorInfo("#7a55a6", "#5b4278")],
    [ShapeColorType.Blue, new ShapeColorInfo("#3e82c2", "#376fa3")],
    [ShapeColorType.Green, new ShapeColorInfo("#33a369", "#2f8a5b")],
    [ShapeColorType.Yellow, new ShapeColorInfo("#b9c424", "#7c8320")],
    [ShapeColorType.Red, new ShapeColorInfo("#af2b2b", "#6d2626")],
    [ShapeColorType.Orange, new ShapeColorInfo("#c06e22", "#a56020")]
]);

const shapeDisplayArr: Map<ShapeType, ShapeDisplayInfo> = new Map([
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

const displayTypeToClassMap: Map<ShapeDisplayType, string> = new Map([
    [ShapeDisplayType.Parallelogram, "ParallelogramShape"], [ShapeDisplayType.Diamond, "DiamondShape"],
    [ShapeDisplayType.Hexagon, "HexagonShape"], [ShapeDisplayType.Elipse, "ElipticShape"],
    [ShapeDisplayType.Rectangle, "RectangleShape"]
]);

class ArrowPath {
    public position: Utils.Vec2 = Utils.Vec2.Zero();
    public segmentLengths: number[] = [];
    public segmentAngles: number[] = [];

    private segmentElements: HTMLDivElement[] = [];
    private segmentConnections: HTMLDivElement[] = [];

    public constructor(pos: Utils.Vec2, lengthsArr: number[], directions: number[]) {
        this.position = pos;
        this.segmentLengths = lengthsArr;
        this.segmentAngles = directions;
    }
    
    public ConstructArrow() {
        let segmentCount: number = this.segmentLengths.length;
        let invalidArrayInfo: boolean = this.segmentLengths.length != this.segmentAngles.length || segmentCount === 0;
        if (invalidArrayInfo) return;

        let currentPosition: Utils.Vec2 = this.position;

        for (let i: number = 0; i < segmentCount; i++) {
            let segmentLength: number = this.segmentLengths[i];
            let segmentAngle: number = this.segmentAngles[i];
            let arrowSegment: HTMLDivElement = Utils.CreateElement("div", "ShapeArrowSegment", currentPlane) as HTMLDivElement;
            this.segmentElements.push(arrowSegment);
            let isLastSegment: boolean = i === segmentCount - 1;

            let segmentDirVec: Utils.Vec2 = Utils.Vec2.FromAngleDeg(segmentAngle);
            let segmentOffset: Utils.Vec2 = segmentDirVec.Times(segmentLength).Divide(2);
            currentPosition = currentPosition.Plus(segmentOffset.x, segmentOffset.y);

            let arrowConnector: HTMLDivElement | null = null;
            if (!isLastSegment) {
                arrowConnector = Utils.CreateElement("div", "ShapeArrowConnector", currentPlane) as HTMLDivElement;
                this.segmentConnections.push(arrowConnector);
            }
            
            Utils.SetProperty(arrowSegment, "--arrow-length", segmentLength.toString() + "px");
            Utils.SetProperty(arrowSegment, "--rotation", segmentAngle.toString() + "deg");
            SetShapePosition(arrowSegment, currentPosition);

            currentPosition = currentPosition.Plus(segmentOffset.x, segmentOffset.y);
            if (arrowConnector !== null) SetShapePosition(arrowConnector, currentPosition);
        }

        let arrowEnding: HTMLDivElement = Utils.CreateElement("div", "ShapeArrowEnding", currentPlane) as HTMLDivElement;
        this.segmentConnections.push(arrowEnding);
        let latestAngleDegrees = this.segmentAngles[segmentCount - 1];
        Utils.SetProperty(arrowEnding, "--rotation", latestAngleDegrees.toString() + "deg");
        SetShapePosition(arrowEnding, currentPosition);
    }
}

function SetShapePosition(currentShape: HTMLDivElement, shapePosition: Utils.Vec2) {
    Utils.SetProperty(currentShape, "--shape-x", shapePosition.x.toString() + "px");
    Utils.SetProperty(currentShape, "--shape-y", shapePosition.y.toString() + "px");
}

function RenderFunction(currentFunction: Flowgorithm.FunctionSignature) {
    let arrowPath: ArrowPath = new ArrowPath(new Utils.Vec2(0, 24), [50, 120, 80], [70, 30, 300]);
    arrowPath.ConstructArrow();
    AddShape(ShapeType.FunctionSignature, Utils.Vec2.Zero(), currentFunction.name);
}

function ConstructShape(shapeType: ShapeType, position: Utils.Vec2, shapeContent: string, isShadow: boolean) {
    let shapeDisplayInfo: ShapeDisplayInfo = shapeDisplayArr.get(shapeType)!;
    let shapeColorInfo: ShapeColorInfo = shapeColorsArr.get(shapeDisplayInfo.colorType)!;
    let shapeClass: string = displayTypeToClassMap.get(shapeDisplayInfo.displayType)!;
    let constructedShape: HTMLDivElement = Utils.CreateElement("div", shapeClass, currentPlane) as HTMLDivElement;
    let usedShapeColor: string = isShadow ? shapeColorInfo.shadowColor : shapeColorInfo.shapeColor;

    SetShapePosition(constructedShape, position);
    constructedShape.style.backgroundColor = usedShapeColor;

    if (isShadow) constructedShape.classList.add("ShapeShadow");
    constructedShape.textContent = shapeContent;
}

function AddShape(shapeType: ShapeType, position: Utils.Vec2, shapeContent: string) {
    ConstructShape(shapeType, position, shapeContent, true);
    ConstructShape(shapeType, position, shapeContent, false);
}