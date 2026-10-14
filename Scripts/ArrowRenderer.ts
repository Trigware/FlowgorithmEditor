import * as Utils from "./Utils.js"
import * as ShapeRenderer from "./ShapeRenderer.js"

const arrowEndingOffsetMultiplier: number = 0.475;

export class ArrowPath {
    public position: Utils.Vec2 = Utils.Vec2.Zero();
    public segmentLengths: number[] = [];
    public segmentAngles: number[] = [];

    private segmentElements: HTMLDivElement[] = [];
    private connectionElements: HTMLDivElement[] = [];
    private arrowSize: Utils.Vec2 = Utils.Vec2.Zero();
    private latestSegmentPos: Utils.Vec2 = Utils.Vec2.Zero();

    public constructor(pos: Utils.Vec2, lengthsArr: number[], directions: number[]) {
        this.position = pos;
        this.segmentLengths = lengthsArr;
        this.segmentAngles = directions;
        this.arrowSize = this.ConstructArrow();
    }

    public GetSize(): Utils.Vec2 { return this.arrowSize; }
    public GetLatestSegmentPos(): Utils.Vec2 { return this.latestSegmentPos; }

    private ConstructArrow(): Utils.Vec2 {
        let segmentCount: number = this.segmentLengths.length;
        let invalidArrayInfo: boolean = this.segmentLengths.length != this.segmentAngles.length || segmentCount === 0;
        if (invalidArrayInfo) return Utils.Vec2.Zero();

        this.latestSegmentPos = this.position;
        for (let i: number = 0; i < segmentCount; i++) this.DrawArrowSegment(i);

        this.DrawArrowEnding();
        let arrowSize: Utils.Vec2 = this.latestSegmentPos.Minus(this.position.x, this.position.y);
        return arrowSize;
    }

    public Delete() {
        for (let segment of this.segmentElements) segment.remove();
        for (let connection of this.connectionElements) connection.remove();
    }

    private DrawArrowEnding() {
        let arrowEnding: HTMLDivElement = Utils.CreateElement("div", "ShapeArrowEnding", ShapeRenderer.currentPlane) as HTMLDivElement;
        this.connectionElements.push(arrowEnding);

        let segmentCount: number = this.segmentAngles.length;
        let latestAngleDegrees: number = this.segmentAngles[segmentCount - 1];
        let latestAngleVec: Utils.Vec2 = Utils.Vec2.FromAngleDeg(latestAngleDegrees);

        Utils.SetProperty(arrowEnding, "--rotation", latestAngleDegrees.toString() + "deg");
        ShapeRenderer.SetShapePosition(arrowEnding, this.latestSegmentPos);

        let arrowEndingSize: number = GetArrowEndSize();
        let arrowEndingOffset: Utils.Vec2 = latestAngleVec.Times(arrowEndingSize / 2);
        this.latestSegmentPos = this.latestSegmentPos.Plus(arrowEndingOffset.x, arrowEndingOffset.y);
    }

    private DrawArrowSegment(segmentNumber: number) {
        let segmentLength: number = this.segmentLengths[segmentNumber];
        let segmentAngle: number = this.segmentAngles[segmentNumber];
        let segmentCount: number = this.segmentLengths.length;

        let arrowSegment: HTMLDivElement = Utils.CreateElement("div", "ShapeArrowSegment", ShapeRenderer.currentPlane) as HTMLDivElement;
        this.segmentElements.push(arrowSegment);
        let isLastSegment: boolean = segmentNumber === segmentCount - 1;

        let segmentDirVec: Utils.Vec2 = Utils.Vec2.FromAngleDeg(segmentAngle);
        let segmentOffset: Utils.Vec2 = segmentDirVec.Times(segmentLength / 2);
        this.latestSegmentPos = this.latestSegmentPos.Plus(segmentOffset.x, segmentOffset.y);
            
        Utils.SetProperty(arrowSegment, "--arrow-length", segmentLength.toString() + "px");
        Utils.SetProperty(arrowSegment, "--rotation", segmentAngle.toString() + "deg");
        ShapeRenderer.SetShapePosition(arrowSegment, this.latestSegmentPos);

        this.latestSegmentPos = this.latestSegmentPos.Plus(segmentOffset.x, segmentOffset.y);
        if (!isLastSegment) { 
            let arrowConnector: HTMLDivElement = Utils.CreateElement("div", "ShapeArrowConnector", ShapeRenderer.currentPlane) as HTMLDivElement;
            this.connectionElements.push(arrowConnector);
            ShapeRenderer.SetShapePosition(arrowConnector, this.latestSegmentPos);
            return;
        }
    }
}

export function GetArrowEndSize(): number {
    let arrowEnding: HTMLDivElement = Utils.CreateElement("div", "ShapeArrowEnding", ShapeRenderer.currentPlane) as HTMLDivElement;
    let arrowEndingSize: number = Utils.GetNumericPixels(Utils.GetProperty(arrowEnding, "--arrow-ending-size"));
    arrowEnding.remove();
    return arrowEndingSize;
}