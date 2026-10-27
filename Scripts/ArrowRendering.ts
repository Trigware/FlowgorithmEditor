import * as Utils from "./Utils.js"
import * as ShapeRenderer from "./ShapeRenderer.js"

const arrowEndingOffsetMultiplier: number = 0.475;

export class ArrowPath {
    private position: Utils.Vec2 = Utils.Vec2.Zero();
    private segmentLengths: number[] = [];
    private segmentAngles: number[] = [];

    private arrowSegments: HTMLDivElement[] = [];
    private arrowConnections: HTMLDivElement[] = [];
    private arrowSize: Utils.Vec2 = Utils.Vec2.Zero();
    private currentPosition: Utils.Vec2 = Utils.Vec2.Zero();
    private willRenderEnding: boolean = false;

    public constructor(pos: Utils.Vec2, lengthsArr: number[], directions: number[], renderEnding: boolean = true) {
        this.position = pos;
        this.segmentLengths = lengthsArr;
        this.segmentAngles = directions;
        this.willRenderEnding = renderEnding;
        this.ConstructArrow();
    }

    public GetArrowSize(): Utils.Vec2 { return this.arrowSize; }
    public GetArrowEndPos(): Utils.Vec2 { return this.currentPosition; }
    public GetSegmentLengths(): number[] { return [...this.segmentLengths] }

    private ConstructArrow() {
        let segmentCount: number = this.segmentLengths.length;
        let invalidArrayInfo: boolean = this.segmentLengths.length != this.segmentAngles.length || segmentCount === 0;
        if (invalidArrayInfo) return;

        this.currentPosition = this.position;
        for (let i: number = 0; i < segmentCount; i++) this.RenderSegment(i);
        this.CalculateArrowSize();
    }

    private RenderSegment(segmentIndex: number) {
        let segmentLength: number = this.segmentLengths[segmentIndex];
        let segmentAngle: number = this.segmentAngles[segmentIndex];
        let isLastSegment: boolean = segmentIndex === this.segmentLengths.length - 1;
        let arrowEndingSize: number = ArrowPath.GetArrowEndSize();
        if (isLastSegment) segmentLength -= arrowEndingSize / 2;

        let currentSegment: HTMLDivElement = Utils.CreateElement("div", "ShapeArrowSegment", ShapeRenderer.currentPlane) as HTMLDivElement;
        let angleAsVec: Utils.Vec2 = Utils.Vec2.FromAngleDeg(segmentAngle);
        let segmentDirVec: Utils.Vec2 = angleAsVec.Times(segmentLength);
        this.currentPosition = this.currentPosition.Plus(segmentDirVec.x / 2, segmentDirVec.y / 2);

        this.arrowSegments.push(currentSegment);
        ShapeRenderer.SetShapePosition(currentSegment, this.currentPosition);
        Utils.SetProperty(currentSegment, "--arrow-length", segmentLength.toString() + "px");
        Utils.SetProperty(currentSegment, "--rotation", segmentAngle.toString() + "deg")
        this.currentPosition = this.currentPosition.Plus(segmentDirVec.x / 2, segmentDirVec.y / 2);

        this.RenderConnection(segmentIndex);
    }

    private RenderConnection(segmentIndex: number) {
        let isLastConnection: boolean = segmentIndex === this.segmentLengths.length - 1;
        if (!this.willRenderEnding && isLastConnection) return;
        let connectionClass: string = isLastConnection ? "ShapeArrowEnding" : "ShapeArrowConnector"; 
        let segmentConnection: HTMLDivElement = Utils.CreateElement("div", connectionClass, ShapeRenderer.currentPlane) as HTMLDivElement;

        let connectionRotation: number = this.segmentAngles[segmentIndex];
        ShapeRenderer.SetShapePosition(segmentConnection, this.currentPosition);
        Utils.SetProperty(segmentConnection, "--rotation", connectionRotation.toString() + "deg");
        this.arrowConnections.push(segmentConnection);
    }

    private CalculateArrowSize() {
        let lastSegmentRotation: number = this.segmentAngles[this.segmentAngles.length - 1];
        let arrowEndingSize: number = ArrowPath.GetArrowEndSize();
        let lastRotationVec: Utils.Vec2 = Utils.Vec2.FromAngleDeg(lastSegmentRotation);
        let endingOffset: Utils.Vec2 = lastRotationVec.Times(arrowEndingSize / 2);

        this.currentPosition = this.currentPosition.Plus(endingOffset.x, endingOffset.y);
        this.arrowSize = this.currentPosition.Minus(this.position.x, this.position.y);
    }

    public Delete() {
        let allArrowDivs: HTMLDivElement[] = [...this.arrowSegments, ...this.arrowConnections];
        for (let currentArrowDiv of allArrowDivs) {
            currentArrowDiv.remove();
        }

        this.arrowSegments = [];
        this.arrowConnections = [];
    }

    public static GetArrowEndSize(): number {
        let arrowEnding: HTMLDivElement = Utils.CreateElement("div", "ShapeArrowEnding", ShapeRenderer.currentPlane) as HTMLDivElement;
        let endingSize: number = Utils.GetNumericPixels(Utils.GetProperty(arrowEnding, "--arrow-ending-size"));
        arrowEnding.remove();
        return endingSize;
    }
}