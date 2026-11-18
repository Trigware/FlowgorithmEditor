import * as Utils from "./Utils.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
let pointInsideCheckMap = new Map([
    [ShapeRenderer.ShapeDisplayType.Elipse, IsPointInsideElipticShape],
    [ShapeRenderer.ShapeDisplayType.Rectangle, IsPointInsideRectangleShape],
    [ShapeRenderer.ShapeDisplayType.Parallelogram, IsPointInsideParallelogramShape],
    [ShapeRenderer.ShapeDisplayType.Diamond, IsPointInsideDiamondShape],
    [ShapeRenderer.ShapeDisplayType.Hexagon, IsPointInsideHexagonShape],
    [ShapeRenderer.ShapeDisplayType.Comment, IsPointInsideRectangleShape],
    [ShapeRenderer.ShapeDisplayType.Octagon, IsPointInsideOctagonShape],
    [ShapeRenderer.ShapeDisplayType.Circle, IsPointInsideCircleShape]
]);
const diagonalDirectionsArr = [
    new Utils.Vec2(-1, -1), new Utils.Vec2(1, -1), new Utils.Vec2(-1, 1), new Utils.Vec2(1, 1)
];
const parallelogramGapTrianglePoints = [new Utils.Vec2(-1, -1), new Utils.Vec2(1, 1)];
export class IntersectInfo {
    displayType = ShapeRenderer.ShapeDisplayType.Unknown;
    isConditionalBreakpoint = false;
    constructor(shapeDisplayType) { this.displayType = shapeDisplayType; }
}
export function IsPointInsideShape(relativePos, shapeSize, intersectInfo) {
    let hasDisplayTypeAssociatedFunction = pointInsideCheckMap.has(intersectInfo.displayType);
    if (!hasDisplayTypeAssociatedFunction)
        return false;
    let pointInsideCheckFunction = pointInsideCheckMap.get(intersectInfo.displayType);
    let pointInsideShape = pointInsideCheckFunction(relativePos, shapeSize, intersectInfo);
    if (pointInsideShape)
        return true;
    let hasOffsetInfo = ShapeRenderer.displayTypeOffsetsMap.has(intersectInfo.displayType);
    if (!hasOffsetInfo)
        return false;
    let checkedShapeOffset = ShapeRenderer.displayTypeOffsetsMap.get(intersectInfo.displayType);
    let shadowOffsetedCheckedPos = relativePos.Minus(checkedShapeOffset.x, checkedShapeOffset.y);
    let pointInsideShadow = pointInsideCheckFunction(shadowOffsetedCheckedPos, shapeSize, intersectInfo);
    return pointInsideShadow;
}
function IsPointInsideRectangleShape(relativePos, shapeSize) {
    let distFromCenter = relativePos.Abs();
    return distFromCenter.x <= shapeSize.x / 2 && distFromCenter.y <= shapeSize.y / 2;
}
function IsPointInsideElipticShape(relativePos, shapeSize) {
    let insideRectBounds = IsPointInsideRectangleShape(relativePos, shapeSize);
    if (!insideRectBounds)
        return false;
    let shapeHeight = Utils.GetFromRootPX("--default-shape-width") / Number(Utils.GetFromRoot("--shape-aspect-ratio")), cornerRoundness = shapeHeight * Number(Utils.GetFromRoot("--eliptic-shape-roundness")) / 2;
    for (let currentDir of diagonalDirectionsArr) {
        let invertedDir = new Utils.Vec2(-currentDir.x, -currentDir.y), cornerDiffFromCircleCenter = invertedDir.Times(cornerRoundness);
        let cornerRelativePos = shapeSize.Times(currentDir.x, currentDir.y).Divide(2), circleCenterRelativePos = cornerRelativePos.Plus(cornerDiffFromCircleCenter.x, cornerDiffFromCircleCenter.y);
        let checkedPosDistFromCircleCenter = circleCenterRelativePos.Dist(relativePos);
        let isInsideCircleRadius = checkedPosDistFromCircleCenter <= cornerRoundness;
        if (isInsideCircleRadius)
            continue;
        let isXInGap = currentDir.x === -1 ? relativePos.x < circleCenterRelativePos.x : relativePos.x > circleCenterRelativePos.x, isYInGap = currentDir.y === -1 ? relativePos.y < circleCenterRelativePos.y : relativePos.y > circleCenterRelativePos.y;
        let isBothAxisInGap = isXInGap && isYInGap;
        if (isBothAxisInGap)
            return false;
    }
    return true;
}
function IsPointInsideParallelogramShape(relativePos, shapeSize) {
    let insideRectBounds = IsPointInsideRectangleShape(relativePos, shapeSize);
    if (!insideRectBounds)
        return false;
    let defaultShapeWidth = Utils.GetFromRootPX("--default-shape-width"), widthSizeIncrease = shapeSize.x / defaultShapeWidth;
    let angleSteapness = Number(Utils.GetFromRoot("--parallelogram-base-steapness")) / widthSizeIncrease;
    let triangleSize = new Utils.Vec2(shapeSize.x * angleSteapness, shapeSize.y);
    for (let gapTrianglePoint of parallelogramGapTrianglePoints) {
        let triangleStartPos = shapeSize.Times(gapTrianglePoint.x, gapTrianglePoint.y).Divide(2);
        let clickToStartDiff = relativePos.Minus(triangleStartPos.x, triangleStartPos.y);
        let widthProgress = Math.abs(clickToStartDiff.x) / triangleSize.x;
        if (widthProgress > 1)
            continue;
        let isLeftGapTriangle = gapTrianglePoint.x === -1;
        let distFromShapeTop = relativePos.y + shapeSize.y / 2;
        let actualWidthProgress = isLeftGapTriangle ? 1 - widthProgress : widthProgress;
        let boundingDistFromTop = actualWidthProgress * shapeSize.y;
        let isInGapTriangle = isLeftGapTriangle ? distFromShapeTop < boundingDistFromTop : distFromShapeTop > boundingDistFromTop;
        if (isInGapTriangle)
            return false;
    }
    return true;
}
function IsPointInsideDiamondShape(relativePos, shapeSize) {
    let insideRectBounds = IsPointInsideRectangleShape(relativePos, shapeSize);
    if (!insideRectBounds)
        return false;
    let shapeHalfWidth = shapeSize.x / 2, widthProgress = 1 - Math.abs(relativePos.x) / shapeHalfWidth;
    let maximumYDistFromCenter = widthProgress * shapeSize.y / 2, yDistFromCenter = Math.abs(relativePos.y);
    let isInDiamondShape = yDistFromCenter < maximumYDistFromCenter;
    return isInDiamondShape;
}
function IsPointInsideHexagonShape(relativePos, shapeSize) {
    let insideRectBounds = IsPointInsideRectangleShape(relativePos, shapeSize);
    if (!insideRectBounds)
        return false;
    let defaultShapeWidth = Utils.GetFromRootPX("--default-shape-width"), widthSizeIncrease = shapeSize.x / defaultShapeWidth;
    let angledPartPortion = Number(Utils.GetFromRoot("--default-hexagon-middle-gap")) / widthSizeIncrease;
    let distFromXBounds = shapeSize.x / 2 - Math.abs(relativePos.x), distFromCenterProgress = distFromXBounds / shapeSize.x * 2;
    let isOutsideAngledPortion = distFromCenterProgress > angledPartPortion;
    if (isOutsideAngledPortion)
        return true;
    let anglePartProgress = distFromCenterProgress / angledPartPortion, maximumYDistFromCenter = anglePartProgress * shapeSize.y / 2;
    let distFromYCenter = Math.abs(relativePos.y);
    let isInsideGapTriangle = distFromYCenter > maximumYDistFromCenter;
    if (isInsideGapTriangle)
        return false;
    return true;
}
function IsPointInsideOctagonShape(relativePos, shapeSize, intersectInfo) {
    let insideRectBounds = IsPointInsideRectangleShape(relativePos, shapeSize);
    if (!insideRectBounds)
        return false;
    let segmentPortionProperty = intersectInfo.isConditionalBreakpoint ? "--default-conditional-breakpoint-segment-portion" : "--default-breakpoint-segment-portion";
    let segmentPortion = Number(Utils.GetFromRoot(segmentPortionProperty));
    let distFromCenter = relativePos.Abs(), distFromBounds = new Utils.Vec2(shapeSize.x / 2 - distFromCenter.x, shapeSize.y / 2 - distFromCenter.y);
    let angledSegmentSize = shapeSize.Times(segmentPortion);
    let isOutsideAngledPortion = distFromBounds.x > angledSegmentSize.x || distFromBounds.y > angledSegmentSize.y;
    if (isOutsideAngledPortion)
        return true;
    let sectionWidthProgress = distFromBounds.x / angledSegmentSize.x, maximumYDistFromBounds = angledSegmentSize.y * (1 - sectionWidthProgress);
    let isInGapTriangle = distFromBounds.y < maximumYDistFromBounds;
    return !isInGapTriangle;
}
function IsPointInsideCircleShape(relativePos, shapeSize) {
    let distFromCenter = relativePos.Magnitude();
    return distFromCenter < shapeSize.x / 2;
}
