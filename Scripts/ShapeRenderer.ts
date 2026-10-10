import * as Utils from "./Utils.js"

let currentPlane: HTMLDivElement;

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
    [ShapeColorType.Red, new ShapeColorInfo("#af2b2b", "#6d2626")],
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

const arrowEndingOffsetMultiplier: number = 0.475;

export class ArrowPath {
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

    public ConstructArrow(): Utils.Vec2 {
        let segmentCount: number = this.segmentLengths.length;
        let invalidArrayInfo: boolean = this.segmentLengths.length != this.segmentAngles.length || segmentCount === 0;
        if (invalidArrayInfo) return Utils.Vec2.Zero();

        let currentPosition: Utils.Vec2 = this.position;
        let arrowEnding: HTMLDivElement = Utils.CreateElement("div", "ShapeArrowEnding", currentPlane) as HTMLDivElement;
        let arrowEndingSize: number = Utils.GetNumericPixels(Utils.GetProperty(arrowEnding, "--arrow-ending-size"));
        let endingOffset: Utils.Vec2 = Utils.Vec2.Zero();

        for (let i: number = 0; i < segmentCount; i++) {
            let segmentLength: number = this.segmentLengths[i];
            let segmentAngle: number = this.segmentAngles[i];
            let arrowSegment: HTMLDivElement = Utils.CreateElement("div", "ShapeArrowSegment", currentPlane) as HTMLDivElement;
            this.segmentElements.push(arrowSegment);
            let isLastSegment: boolean = i === segmentCount - 1;

            let segmentDirVec: Utils.Vec2 = Utils.Vec2.FromAngleDeg(segmentAngle);
            let segmentOffset: Utils.Vec2 = segmentDirVec.Times(segmentLength / 2);
            currentPosition = currentPosition.Plus(segmentOffset.x, segmentOffset.y);

            let arrowConnector: HTMLDivElement | null = null;
            if (!isLastSegment) {
                arrowConnector = Utils.CreateElement("div", "ShapeArrowConnector", currentPlane) as HTMLDivElement;
                this.segmentConnections.push(arrowConnector);
            }
            
            Utils.SetProperty(arrowSegment, "--arrow-length", segmentLength.toString() + "px");
            Utils.SetProperty(arrowSegment, "--rotation", segmentAngle.toString() + "deg");
            SetShapePosition(arrowSegment, currentPosition);

            endingOffset = segmentDirVec.Times(arrowEndingSize * arrowEndingOffsetMultiplier);
            if (isLastSegment) segmentOffset = segmentOffset.Plus(endingOffset.x, endingOffset.y);
            currentPosition = currentPosition.Plus(segmentOffset.x, segmentOffset.y);
            if (arrowConnector !== null) SetShapePosition(arrowConnector, currentPosition);
        }

        this.segmentConnections.push(arrowEnding);
        let latestAngleDegrees = this.segmentAngles[segmentCount - 1];
        Utils.SetProperty(arrowEnding, "--rotation", latestAngleDegrees.toString() + "deg");
        SetShapePosition(arrowEnding, currentPosition);

        let arrowSize: Utils.Vec2 = currentPosition.Minus(this.position.x, this.position.y);
        arrowSize = arrowSize.Plus(endingOffset.x, endingOffset.y);
        return arrowSize;
    }
}

function SetShapePosition(currentShape: HTMLDivElement, shapePosition: Utils.Vec2) {
    Utils.SetProperty(currentShape, "--shape-x", shapePosition.x.toString() + "px");
    Utils.SetProperty(currentShape, "--shape-y", shapePosition.y.toString() + "px");
}

function ConstructShape(shapeType: ShapeType, position: Utils.Vec2, shapeContent: string, offsetShape: boolean, isShadow: boolean): HTMLDivElement {
    let shapeDisplayInfo: ShapeDisplayInfo = shapeDisplayArr.get(shapeType)!;
    let shapeColorInfo: ShapeColorInfo = shapeColorsArr.get(shapeDisplayInfo.colorType)!;
    let shapeClass: string = displayTypeToClassMap.get(shapeDisplayInfo.displayType)!;
    let constructedShape: HTMLDivElement = Utils.CreateElement("div", shapeClass, currentPlane) as HTMLDivElement;
    let usedShapeColor: string = isShadow ? shapeColorInfo.shadowColor : shapeColorInfo.shapeColor;

    let offsetPosition: Utils.Vec2 = Utils.Vec2.Zero();
    let shapeHeight: number = Utils.GetNumericPixels(Utils.GetProperty(constructedShape, "height"));
    if (offsetShape) offsetPosition.y = shapeHeight / 2;
    position = position.Plus(offsetPosition.x, offsetPosition.y);

    SetShapePosition(constructedShape, position);
    constructedShape.style.backgroundColor = usedShapeColor;

    if (isShadow) constructedShape.classList.add("ShapeShadow");
    constructedShape.textContent = shapeContent;
    return constructedShape;
}

export function AddShape(shapeType: ShapeType, position: Utils.Vec2, shapeContent: string, offsetShape: boolean = true): RenderedShape {
    let renderedShape: RenderedShape = new RenderedShape();
    renderedShape.mainShape = ConstructShape(shapeType, position, shapeContent, offsetShape, true);
    renderedShape.shadowShape = ConstructShape(shapeType, position, shapeContent, offsetShape, false);
    return renderedShape;
}

export function ClearPlane() { currentPlane.replaceChildren(); }

export class RenderedShape {
    public mainShape: HTMLDivElement | null = null;
    public shadowShape: HTMLDivElement | null = null;

    public GetSize(): Utils.Vec2 {
        if (this.mainShape === null) return Utils.Vec2.Zero();
        let widthAsStr: string = Utils.GetProperty(this.mainShape, "width"),
            heightAsStr: string = Utils.GetProperty(this.mainShape, "height");
        let shapeSize: Utils.Vec2 = new Utils.Vec2(Utils.GetNumericPixels(widthAsStr), Utils.GetNumericPixels(heightAsStr));

        return shapeSize;
    }
}