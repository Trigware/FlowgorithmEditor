import * as Utils from "./Utils.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
const arrowEndingOffsetMultiplier = 0.475;
export class ArrowPath {
    position = Utils.Vec2.Zero();
    segmentLengths = [];
    segmentAngles = [];
    arrowSegments = [];
    arrowConnections = [];
    arrowSize = Utils.Vec2.Zero();
    currentPosition = Utils.Vec2.Zero();
    constructor(pos, lengthsArr, directions) {
        this.position = pos;
        this.segmentLengths = lengthsArr;
        this.segmentAngles = directions;
        this.ConstructArrow();
    }
    GetArrowSize() { return this.arrowSize; }
    GetArrowEndPos() { return this.currentPosition; }
    GetSegmentLengths() { return [...this.segmentLengths]; }
    ConstructArrow() {
        let segmentCount = this.segmentLengths.length;
        let invalidArrayInfo = this.segmentLengths.length != this.segmentAngles.length || segmentCount === 0;
        if (invalidArrayInfo)
            return;
        this.currentPosition = this.position;
        for (let i = 0; i < segmentCount; i++)
            this.RenderSegment(i);
        this.CalculateArrowSize();
    }
    RenderSegment(segmentIndex) {
        let segmentLength = this.segmentLengths[segmentIndex];
        let segmentAngle = this.segmentAngles[segmentIndex];
        let isLastSegment = segmentIndex === this.segmentLengths.length - 1;
        let arrowEndingSize = ArrowPath.GetArrowEndSize();
        if (isLastSegment)
            segmentLength -= arrowEndingSize / 2;
        let currentSegment = Utils.CreateElement("div", "ShapeArrowSegment", ShapeRenderer.currentPlane);
        let angleAsVec = Utils.Vec2.FromAngleDeg(segmentAngle);
        let segmentDirVec = angleAsVec.Times(segmentLength);
        this.currentPosition = this.currentPosition.Plus(segmentDirVec.x / 2, segmentDirVec.y / 2);
        this.arrowSegments.push(currentSegment);
        ShapeRenderer.SetShapePosition(currentSegment, this.currentPosition);
        Utils.SetProperty(currentSegment, "--arrow-length", segmentLength.toString() + "px");
        Utils.SetProperty(currentSegment, "--rotation", segmentAngle.toString() + "deg");
        this.currentPosition = this.currentPosition.Plus(segmentDirVec.x / 2, segmentDirVec.y / 2);
        this.RenderConnection(segmentIndex);
    }
    RenderConnection(segmentIndex) {
        let isLastConnection = segmentIndex === this.segmentLengths.length - 1;
        let connectionClass = isLastConnection ? "ShapeArrowEnding" : "ShapeArrowConnector";
        let segmentConnection = Utils.CreateElement("div", connectionClass, ShapeRenderer.currentPlane);
        let connectionRotation = this.segmentAngles[segmentIndex];
        ShapeRenderer.SetShapePosition(segmentConnection, this.currentPosition);
        Utils.SetProperty(segmentConnection, "--rotation", connectionRotation.toString() + "deg");
        this.arrowConnections.push(segmentConnection);
    }
    CalculateArrowSize() {
        let lastSegmentRotation = this.segmentAngles[this.segmentAngles.length - 1];
        let arrowEndingSize = ArrowPath.GetArrowEndSize();
        let lastRotationVec = Utils.Vec2.FromAngleDeg(lastSegmentRotation);
        let endingOffset = lastRotationVec.Times(arrowEndingSize / 2);
        this.currentPosition = this.currentPosition.Plus(endingOffset.x, endingOffset.y);
        this.arrowSize = this.currentPosition.Minus(this.position.x, this.position.y);
    }
    Delete() {
        let allArrowDivs = [...this.arrowSegments, ...this.arrowConnections];
        for (let currentArrowDiv of allArrowDivs) {
            currentArrowDiv.remove();
        }
        this.arrowSegments = [];
        this.arrowConnections = [];
    }
    static GetArrowEndSize() {
        let arrowEnding = Utils.CreateElement("div", "ShapeArrowEnding", ShapeRenderer.currentPlane);
        let endingSize = Utils.GetNumericPixels(Utils.GetProperty(arrowEnding, "--arrow-ending-size"));
        arrowEnding.remove();
        return endingSize;
    }
}
