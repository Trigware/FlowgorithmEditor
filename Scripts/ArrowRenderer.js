import * as Utils from "./Utils.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
const arrowEndingOffsetMultiplier = 0.475;
export class ArrowPath {
    position = Utils.Vec2.Zero();
    segmentLengths = [];
    segmentAngles = [];
    segmentElements = [];
    connectionElements = [];
    arrowSize = Utils.Vec2.Zero();
    latestSegmentPos = Utils.Vec2.Zero();
    constructor(pos, lengthsArr, directions) {
        this.position = pos;
        this.segmentLengths = lengthsArr;
        this.segmentAngles = directions;
        this.arrowSize = this.ConstructArrow();
    }
    GetSize() { return this.arrowSize; }
    GetLatestSegmentPos() { return this.latestSegmentPos; }
    ConstructArrow() {
        let segmentCount = this.segmentLengths.length;
        let invalidArrayInfo = this.segmentLengths.length != this.segmentAngles.length || segmentCount === 0;
        if (invalidArrayInfo)
            return Utils.Vec2.Zero();
        this.latestSegmentPos = this.position;
        for (let i = 0; i < segmentCount; i++)
            this.DrawArrowSegment(i);
        this.DrawArrowEnding();
        let arrowSize = this.latestSegmentPos.Minus(this.position.x, this.position.y);
        return arrowSize;
    }
    Delete() {
        for (let segment of this.segmentElements)
            segment.remove();
        for (let connection of this.connectionElements)
            connection.remove();
    }
    DrawArrowEnding() {
        let arrowEnding = Utils.CreateElement("div", "ShapeArrowEnding", ShapeRenderer.currentPlane);
        this.connectionElements.push(arrowEnding);
        let segmentCount = this.segmentAngles.length;
        let latestAngleDegrees = this.segmentAngles[segmentCount - 1];
        let latestAngleVec = Utils.Vec2.FromAngleDeg(latestAngleDegrees);
        Utils.SetProperty(arrowEnding, "--rotation", latestAngleDegrees.toString() + "deg");
        ShapeRenderer.SetShapePosition(arrowEnding, this.latestSegmentPos);
        let arrowEndingSize = GetArrowEndSize();
        let arrowEndingOffset = latestAngleVec.Times(arrowEndingSize / 2);
        this.latestSegmentPos = this.latestSegmentPos.Plus(arrowEndingOffset.x, arrowEndingOffset.y);
    }
    DrawArrowSegment(segmentNumber) {
        let segmentLength = this.segmentLengths[segmentNumber];
        let segmentAngle = this.segmentAngles[segmentNumber];
        let segmentCount = this.segmentLengths.length;
        let arrowSegment = Utils.CreateElement("div", "ShapeArrowSegment", ShapeRenderer.currentPlane);
        this.segmentElements.push(arrowSegment);
        let isLastSegment = segmentNumber === segmentCount - 1;
        let segmentDirVec = Utils.Vec2.FromAngleDeg(segmentAngle);
        let segmentOffset = segmentDirVec.Times(segmentLength / 2);
        this.latestSegmentPos = this.latestSegmentPos.Plus(segmentOffset.x, segmentOffset.y);
        Utils.SetProperty(arrowSegment, "--arrow-length", segmentLength.toString() + "px");
        Utils.SetProperty(arrowSegment, "--rotation", segmentAngle.toString() + "deg");
        ShapeRenderer.SetShapePosition(arrowSegment, this.latestSegmentPos);
        this.latestSegmentPos = this.latestSegmentPos.Plus(segmentOffset.x, segmentOffset.y);
        if (!isLastSegment) {
            let arrowConnector = Utils.CreateElement("div", "ShapeArrowConnector", ShapeRenderer.currentPlane);
            this.connectionElements.push(arrowConnector);
            ShapeRenderer.SetShapePosition(arrowConnector, this.latestSegmentPos);
            return;
        }
    }
}
export function GetArrowEndSize() {
    let arrowEnding = Utils.CreateElement("div", "ShapeArrowEnding", ShapeRenderer.currentPlane);
    let arrowEndingSize = Utils.GetNumericPixels(Utils.GetProperty(arrowEnding, "--arrow-ending-size"));
    arrowEnding.remove();
    return arrowEndingSize;
}
