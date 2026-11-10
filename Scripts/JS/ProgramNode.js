import { ArrowPath } from "./ArrowRendering.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import * as Utils from "./Utils.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
export var SizeCountType;
(function (SizeCountType) {
    SizeCountType[SizeCountType["CountAll"] = 0] = "CountAll";
    SizeCountType[SizeCountType["OnlyLeft"] = 1] = "OnlyLeft";
    SizeCountType[SizeCountType["OnlyRight"] = 2] = "OnlyRight";
})(SizeCountType || (SizeCountType = {}));
export var SubnodeCountType;
(function (SubnodeCountType) {
    SubnodeCountType[SubnodeCountType["HeadOnly"] = 0] = "HeadOnly";
    SubnodeCountType[SubnodeCountType["SubnodeOnly"] = 1] = "SubnodeOnly";
    SubnodeCountType[SubnodeCountType["CountAll"] = 2] = "CountAll";
    SubnodeCountType[SubnodeCountType["Entirety"] = 3] = "Entirety";
})(SubnodeCountType || (SubnodeCountType = {}));
export const mergePointSizeMultiplier = 1.65;
export class CachedSize {
    leftPortion = Utils.Vec2.Zero();
    rightPortion = Utils.Vec2.Zero();
    subLeftPortion = Utils.Vec2.Zero();
    subRightPortion = Utils.Vec2.Zero();
    totalLeftWidth = 0;
    totalRightWidth = 0;
    isCached = false;
    GetByCountType(countType = SizeCountType.CountAll, countSubnodesMode = SubnodeCountType.HeadOnly) {
        let usedLeftPortion = this.leftPortion;
        let usedRightPortion = this.rightPortion;
        switch (countSubnodesMode) {
            case SubnodeCountType.SubnodeOnly:
                usedLeftPortion = this.subLeftPortion;
                usedRightPortion = this.subRightPortion;
                break;
            case SubnodeCountType.CountAll:
                usedLeftPortion = new Utils.Vec2(Math.max(this.leftPortion.x, this.subLeftPortion.x), this.leftPortion.y + this.subLeftPortion.y);
                usedRightPortion = new Utils.Vec2(Math.max(this.rightPortion.x, this.subRightPortion.x), this.rightPortion.y + this.subRightPortion.y);
                break;
            case SubnodeCountType.Entirety:
                usedLeftPortion = new Utils.Vec2(this.totalLeftWidth, 0);
                usedRightPortion = new Utils.Vec2(this.totalRightWidth, 0);
                break;
        }
        switch (countType) {
            case SizeCountType.CountAll: return new Utils.Vec2(usedLeftPortion.x + usedRightPortion.x, Math.max(usedLeftPortion.y, usedRightPortion.y));
            case SizeCountType.OnlyLeft: return usedLeftPortion;
            case SizeCountType.OnlyRight: return usedRightPortion;
        }
    }
    ApplyToSub(x, y) {
        this.subLeftPortion = this.subLeftPortion.Plus(x, y);
        this.subRightPortion = this.subRightPortion.Plus(x, y);
    }
}
export class ProgramNode {
    subNodes = [];
    subArrows = [];
    parentNode = null;
    linkedShape = new ShapeRenderer.RenderedShape();
    sizeCache = new CachedSize();
    constructor(parent = null) { this.parentNode = parent; }
    Clear() { this.subNodes = []; if (this.linkedShape !== null)
        this.linkedShape.Delete(); }
    GetContent() { return Flowgorithm.GetEmptyContent(); }
    GetType() { return ShapeRenderer.ShapeType.Unknown; }
    DrawsAfterArrow() { return false; }
    BeforeArrowHasEnding() { return true; }
    Render(position) { }
    Delete() {
        this.linkedShape.Delete();
        for (let childNode of this.subNodes)
            childNode.Delete();
        for (let currentArrow of this.subArrows)
            currentArrow.Delete();
    }
    AddShape(position) {
        this.linkedShape = ShapeRenderer.AddShape(this.GetType(), position, this.GetContent());
    }
    GetSize(countType = SizeCountType.CountAll, countSubnodesMode = SubnodeCountType.HeadOnly) {
        if (!this.sizeCache.isCached) {
            this.sizeCache = this.CalculateSizeCache();
            this.sizeCache.isCached = true;
            this.SetSubnodeCache(this.sizeCache);
            this.sizeCache.totalLeftWidth = this.GetSideTotalWidth(SizeCountType.OnlyLeft);
            this.sizeCache.totalRightWidth = this.GetSideTotalWidth(SizeCountType.OnlyRight);
        }
        return this.sizeCache.GetByCountType(countType, countSubnodesMode);
    }
    RenderSubnodes(position, renderFirstArrow = true) {
        for (let i = 0; i < this.subNodes.length; i++) {
            let isFirstNode = i === 0;
            if (!isFirstNode || renderFirstArrow)
                this.HandleArrowRender(position, i);
            let currentNode = this.subNodes[i];
            currentNode.Render(position);
            let currentNodeSize = currentNode.GetSize(SizeCountType.CountAll, SubnodeCountType.CountAll);
            position.y += currentNodeSize.y;
        }
        return position.Copy();
    }
    HandleArrowRender(position, nodeIndex) {
        let previousNode = this.GetSubnode(nodeIndex - 1), currentNode = this.GetSubnode(nodeIndex);
        let drawsAfterArrow = previousNode === null ? false : previousNode.DrawsAfterArrow();
        if (drawsAfterArrow) {
            position.y += Flowgorithm.defaultArrowLength;
            return;
        }
        let renderArrowEnding = currentNode === null ? true : currentNode.BeforeArrowHasEnding();
        let arrowLength = Flowgorithm.defaultArrowLength;
        let renderedArrow = this.RenderDefaultArrow(position, arrowLength, renderArrowEnding);
        this.subArrows.push(renderedArrow);
    }
    RenderDefaultArrow(position, arrowLength = Flowgorithm.defaultArrowLength, drawEnding = true) {
        let renderedArrow = new ArrowPath(position, [arrowLength], [Flowgorithm.defaultArrowAngle], drawEnding);
        let arrowTotalSize = renderedArrow.GetArrowSize();
        position.y += arrowTotalSize.y;
        return renderedArrow;
    }
    GetSubnode(nodeIndex) {
        let isIndexInvalid = nodeIndex < 0 || nodeIndex >= this.subNodes.length;
        if (isIndexInvalid)
            return null;
        return this.subNodes[nodeIndex];
    }
    CalculateSizeCache() {
        let sizeCache = new CachedSize();
        let headSize = this.linkedShape.GetSize(this.GetContent(), this.GetType());
        let headPortionHalfSize = new Utils.Vec2(headSize.x / 2, headSize.y);
        sizeCache.leftPortion = headPortionHalfSize;
        sizeCache.rightPortion = headPortionHalfSize;
        sizeCache.subLeftPortion = Utils.Vec2.Zero();
        sizeCache.subRightPortion = Utils.Vec2.Zero();
        return sizeCache;
    }
    SetSubnodeCache(currentSizeCache) {
        for (let currentSubnode of this.subNodes) {
            let totalLeftSize = currentSubnode.GetSize(SizeCountType.OnlyLeft, SubnodeCountType.CountAll), totalRightSize = currentSubnode.GetSize(SizeCountType.OnlyRight, SubnodeCountType.CountAll);
            let totalLeftWidth = currentSubnode.sizeCache.leftPortion.x + currentSubnode.sizeCache.subLeftPortion.x, totalRightWidth = currentSubnode.sizeCache.rightPortion.x + currentSubnode.sizeCache.subRightPortion.x;
            let subnodeHeight = Math.max(totalLeftSize.y, totalRightSize.y);
            currentSizeCache.subLeftPortion.x = Math.max(currentSizeCache.subLeftPortion.x, totalLeftWidth, Flowgorithm.defaultArrowLength);
            currentSizeCache.subRightPortion.x = Math.max(currentSizeCache.subRightPortion.x, totalRightWidth);
            currentSizeCache.ApplyToSub(0, subnodeHeight + Flowgorithm.defaultArrowLength);
        }
    }
    WillSpecialArrowsHaveArrowEnd(checkedIndex = 0) {
        let renderBranchArrowEnd = true;
        if (this.subNodes.length > checkedIndex) {
            let firstSubnode = this.subNodes[checkedIndex];
            renderBranchArrowEnd = firstSubnode.BeforeArrowHasEnding();
        }
        return renderBranchArrowEnd;
    }
    GetSideTotalWidth(checkedSide) {
        if (checkedSide === SizeCountType.CountAll)
            return this.GetSize(SizeCountType.OnlyLeft, SubnodeCountType.Entirety).x +
                this.GetSize(SizeCountType.OnlyRight, SubnodeCountType.Entirety).x;
        let currentHeadSize = this.GetSize(checkedSide, SubnodeCountType.HeadOnly);
        let totalWidth = currentHeadSize.x;
        for (let currentSubnode of this.subNodes) {
            let subnodeWidth = currentSubnode.GetSize(checkedSide, SubnodeCountType.Entirety).x;
            totalWidth = Math.max(totalWidth, subnodeWidth);
        }
        return totalWidth;
    }
}
