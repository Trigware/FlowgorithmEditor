import * as Utils from "./Utils.js"
import * as ShapeRenderer from "./ShapeRenderer.js"

type IntersectionCheckFunction = (relativePos: Utils.Vec2, shapeSize: Utils.Vec2, intersectInfo: IntersectInfo) => boolean;

let pointInsideCheckMap: Map<ShapeRenderer.ShapeDisplayType, IntersectionCheckFunction> = new Map([
    [ShapeRenderer.ShapeDisplayType.Elipse, IsPointInsideElipticShape],
    [ShapeRenderer.ShapeDisplayType.Rectangle, IsPointInsideRectangleShape],
    [ShapeRenderer.ShapeDisplayType.Parallelogram, IsPointInsideParallelogramShape],
    [ShapeRenderer.ShapeDisplayType.Diamond, IsPointInsideDiamondShape],
    [ShapeRenderer.ShapeDisplayType.Hexagon, IsPointInsideHexagonShape],
    [ShapeRenderer.ShapeDisplayType.Comment, IsPointInsideRectangleShape],
    [ShapeRenderer.ShapeDisplayType.Octagon, IsPointInsideOctagonShape],
    [ShapeRenderer.ShapeDisplayType.Circle, IsPointInsideCircleShape]
]);

const diagonalDirectionsArr: Utils.Vec2[] = [
    new Utils.Vec2(-1, -1), new Utils.Vec2(1, -1), new Utils.Vec2(-1, 1), new Utils.Vec2(1, 1)
]
const parallelogramGapTrianglePoints: Utils.Vec2[] = [new Utils.Vec2(-1, -1), new Utils.Vec2(1, 1)]

export class IntersectInfo {
    public displayType: ShapeRenderer.ShapeDisplayType = ShapeRenderer.ShapeDisplayType.Unknown;
    public isConditionalBreakpoint: boolean = false;

    public constructor(shapeDisplayType: ShapeRenderer.ShapeDisplayType) { this.displayType = shapeDisplayType; }
}

export function IsPointInsideShape(relativePos: Utils.Vec2, shapeSize: Utils.Vec2, intersectInfo: IntersectInfo): boolean {
    let hasDisplayTypeAssociatedFunction: boolean = pointInsideCheckMap.has(intersectInfo.displayType);
    if (!hasDisplayTypeAssociatedFunction) return false;

    let pointInsideCheckFunction: IntersectionCheckFunction = pointInsideCheckMap.get(intersectInfo.displayType)!;
    let pointInsideShape: boolean = pointInsideCheckFunction(relativePos, shapeSize, intersectInfo);
    if (pointInsideShape) return true;

    let hasOffsetInfo: boolean = ShapeRenderer.displayTypeOffsetsMap.has(intersectInfo.displayType);
    if (!hasOffsetInfo) return false;
    let checkedShapeOffset: Utils.Vec2 = ShapeRenderer.displayTypeOffsetsMap.get(intersectInfo.displayType)!;
    let shadowOffsetedCheckedPos: Utils.Vec2 = relativePos.Minus(checkedShapeOffset.x, checkedShapeOffset.y);

    let pointInsideShadow: boolean = pointInsideCheckFunction(shadowOffsetedCheckedPos, shapeSize, intersectInfo);
    return pointInsideShadow;
}

function IsPointInsideRectangleShape(relativePos: Utils.Vec2, shapeSize: Utils.Vec2): boolean {
    let distFromCenter: Utils.Vec2 = relativePos.Abs();
    return distFromCenter.x <= shapeSize.x / 2 && distFromCenter.y <= shapeSize.y / 2;
}

function IsPointInsideElipticShape(relativePos: Utils.Vec2, shapeSize: Utils.Vec2): boolean {
    let insideRectBounds: boolean = IsPointInsideRectangleShape(relativePos, shapeSize);
    if (!insideRectBounds) return false;

    let shapeHeight: number = Utils.GetFromRootPX("--default-shape-width") / Number(Utils.GetFromRoot("--shape-aspect-ratio")),
        cornerRoundness: number = shapeHeight * Number(Utils.GetFromRoot("--eliptic-shape-roundness")) / 2;

    for (let currentDir of diagonalDirectionsArr) {
        let invertedDir: Utils.Vec2 = new Utils.Vec2(-currentDir.x, -currentDir.y),
            cornerDiffFromCircleCenter: Utils.Vec2 = invertedDir.Times(cornerRoundness);
        
        let cornerRelativePos: Utils.Vec2 = shapeSize.Times(currentDir.x, currentDir.y).Divide(2),
            circleCenterRelativePos: Utils.Vec2 = cornerRelativePos.Plus(cornerDiffFromCircleCenter.x, cornerDiffFromCircleCenter.y);
        
        let checkedPosDistFromCircleCenter: number = circleCenterRelativePos.Dist(relativePos);
        let isInsideCircleRadius: boolean = checkedPosDistFromCircleCenter <= cornerRoundness;
        if (isInsideCircleRadius) continue;
        
        let isXInGap: boolean = currentDir.x === -1 ? relativePos.x < circleCenterRelativePos.x : relativePos.x > circleCenterRelativePos.x,
            isYInGap: boolean = currentDir.y === -1 ? relativePos.y < circleCenterRelativePos.y : relativePos.y > circleCenterRelativePos.y;
        let isBothAxisInGap: boolean = isXInGap && isYInGap;
        if (isBothAxisInGap) return false;
    }

    return true;
}

function IsPointInsideParallelogramShape(relativePos: Utils.Vec2, shapeSize: Utils.Vec2): boolean {
    let insideRectBounds: boolean = IsPointInsideRectangleShape(relativePos, shapeSize);
    if (!insideRectBounds) return false;

    let defaultShapeWidth: number = Utils.GetFromRootPX("--default-shape-width"), widthSizeIncrease: number = shapeSize.x / defaultShapeWidth;
    let angleSteapness: number = Number(Utils.GetFromRoot("--parallelogram-base-steapness")) / widthSizeIncrease;
    let triangleSize: Utils.Vec2 = new Utils.Vec2(shapeSize.x * angleSteapness, shapeSize.y);

    for (let gapTrianglePoint of parallelogramGapTrianglePoints) {
        let triangleStartPos: Utils.Vec2 = shapeSize.Times(gapTrianglePoint.x, gapTrianglePoint.y).Divide(2);
        let clickToStartDiff: Utils.Vec2 = relativePos.Minus(triangleStartPos.x, triangleStartPos.y);
        let widthProgress: number = Math.abs(clickToStartDiff.x) / triangleSize.x;
        if (widthProgress > 1) continue;
        
        let isLeftGapTriangle: boolean = gapTrianglePoint.x === -1;
        let distFromShapeTop: number = relativePos.y + shapeSize.y / 2;
        let actualWidthProgress: number = isLeftGapTriangle ? 1 - widthProgress : widthProgress;
        let boundingDistFromTop: number = actualWidthProgress * shapeSize.y;
        let isInGapTriangle: boolean = isLeftGapTriangle ? distFromShapeTop < boundingDistFromTop : distFromShapeTop > boundingDistFromTop;
        if (isInGapTriangle) return false;
    }

    return true;
}

function IsPointInsideDiamondShape(relativePos: Utils.Vec2, shapeSize: Utils.Vec2): boolean {
    let insideRectBounds: boolean = IsPointInsideRectangleShape(relativePos, shapeSize);
    if (!insideRectBounds) return false;

    let shapeHalfWidth: number = shapeSize.x / 2, widthProgress: number = 1 - Math.abs(relativePos.x) / shapeHalfWidth;
    let maximumYDistFromCenter: number = widthProgress * shapeSize.y / 2, yDistFromCenter: number = Math.abs(relativePos.y);
    let isInDiamondShape: boolean = yDistFromCenter < maximumYDistFromCenter;
    return isInDiamondShape;
}

function IsPointInsideHexagonShape(relativePos: Utils.Vec2, shapeSize: Utils.Vec2): boolean {
    let insideRectBounds: boolean = IsPointInsideRectangleShape(relativePos, shapeSize);
    if (!insideRectBounds) return false;

    let defaultShapeWidth: number = Utils.GetFromRootPX("--default-shape-width"), widthSizeIncrease: number = shapeSize.x / defaultShapeWidth;
    let angledPartPortion: number = Number(Utils.GetFromRoot("--default-hexagon-middle-gap")) / widthSizeIncrease;
    let distFromXBounds: number = shapeSize.x / 2 - Math.abs(relativePos.x), distFromCenterProgress: number = distFromXBounds / shapeSize.x * 2;
    let isOutsideAngledPortion: boolean = distFromCenterProgress > angledPartPortion;
    if (isOutsideAngledPortion) return true;

    let anglePartProgress: number = distFromCenterProgress / angledPartPortion, maximumYDistFromCenter: number = anglePartProgress * shapeSize.y / 2;
    let distFromYCenter: number = Math.abs(relativePos.y);
    let isInsideGapTriangle: boolean = distFromYCenter > maximumYDistFromCenter;
    if (isInsideGapTriangle) return false;

    return true;
}

function IsPointInsideOctagonShape(relativePos: Utils.Vec2, shapeSize: Utils.Vec2, intersectInfo: IntersectInfo): boolean {
    let insideRectBounds: boolean = IsPointInsideRectangleShape(relativePos, shapeSize);
    if (!insideRectBounds) return false;
    
    let segmentPortionProperty: string = intersectInfo.isConditionalBreakpoint ? "--default-conditional-breakpoint-segment-portion" : "--default-breakpoint-segment-portion";
    let segmentPortion: number = Number(Utils.GetFromRoot(segmentPortionProperty));
    let distFromCenter: Utils.Vec2 = relativePos.Abs(), distFromBounds: Utils.Vec2 = new Utils.Vec2(shapeSize.x / 2 - distFromCenter.x, shapeSize.y / 2 - distFromCenter.y);
    let angledSegmentSize: Utils.Vec2 = shapeSize.Times(segmentPortion);
    
    let isOutsideAngledPortion: boolean = distFromBounds.x > angledSegmentSize.x || distFromBounds.y > angledSegmentSize.y;
    if (isOutsideAngledPortion) return true;

    let sectionWidthProgress: number = distFromBounds.x / angledSegmentSize.x, maximumYDistFromBounds: number = angledSegmentSize.y * (1 - sectionWidthProgress);
    let isInGapTriangle: boolean = distFromBounds.y < maximumYDistFromBounds;
    return !isInGapTriangle;
}

function IsPointInsideCircleShape(relativePos: Utils.Vec2, shapeSize: Utils.Vec2): boolean {
    let distFromCenter: number = relativePos.Magnitude();
    return distFromCenter < shapeSize.x / 2;
}