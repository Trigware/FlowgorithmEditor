import { ArrowPath } from "./ArrowRendering.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import * as Utils from "./Utils.js"
import * as Flowgorithm from "./ProgramRepresentation.js"

type ProgramNodeOpt = ProgramNode | null;
export type SidesWidths = [number, number];

export enum SizeCountType {
    CountAll, OnlyLeft, OnlyRight
}

export enum AssociatedDirection {
    None, Left, Right
}

export enum SubnodeCountType {
    HeadOnly, SubnodeOnly, CountAll, Entirety
}

export const mergePointSizeMultiplier: number = 1.65;

export class CachedSize {
    public leftPortion: Utils.Vec2 = Utils.Vec2.Zero(); public rightPortion: Utils.Vec2 = Utils.Vec2.Zero();
    public subLeftPortion: Utils.Vec2 = Utils.Vec2.Zero(); public subRightPortion: Utils.Vec2 = Utils.Vec2.Zero();
    public totalLeftWidth: number = 0; public totalRightWidth: number = 0;
    public isCached: boolean = false;

    public GetByCountType(countType: SizeCountType = SizeCountType.CountAll, countSubnodesMode: SubnodeCountType = SubnodeCountType.HeadOnly): Utils.Vec2 {
        let usedLeftPortion: Utils.Vec2 = this.leftPortion;
        let usedRightPortion: Utils.Vec2 = this.rightPortion;
        
        switch (countSubnodesMode) {
            case SubnodeCountType.SubnodeOnly: usedLeftPortion = this.subLeftPortion; usedRightPortion = this.subRightPortion; break;
            case SubnodeCountType.CountAll:
                usedLeftPortion = new Utils.Vec2(
                    Math.max(this.leftPortion.x, this.subLeftPortion.x), this.leftPortion.y + this.subLeftPortion.y
                );
                usedRightPortion = new Utils.Vec2(
                    Math.max(this.rightPortion.x, this.subRightPortion.x), this.rightPortion.y + this.subRightPortion.y
                )
                break;
            case SubnodeCountType.Entirety:
                usedLeftPortion = new Utils.Vec2(this.totalLeftWidth, 0); usedRightPortion = new Utils.Vec2(this.totalRightWidth, 0);
                break;
        }

        switch (countType) {
            case SizeCountType.CountAll: return new Utils.Vec2(
                usedLeftPortion.x + usedRightPortion.x,
                Math.max(usedLeftPortion.y, usedRightPortion.y)
            );
            case SizeCountType.OnlyLeft: return usedLeftPortion;
            case SizeCountType.OnlyRight: return usedRightPortion;
        }
    }

    public ApplyToSub(x: number, y: number) {
        this.subLeftPortion = this.subLeftPortion.Plus(x, y); this.subRightPortion = this.subRightPortion.Plus(x, y);
    }
}

export class ProgramNode {
    public subNodes: ProgramNode[] = [];
    public subArrows: ArrowPath[] = [];
    public parentNode: ProgramNodeOpt = null;
    public linkedShape: ShapeRenderer.RenderedShape = new ShapeRenderer.RenderedShape();
    public sizeCache: CachedSize = new CachedSize();
    public readonly associatedDir: AssociatedDirection = AssociatedDirection.None;

    public constructor(parent: ProgramNodeOpt = null, dir: AssociatedDirection = AssociatedDirection.None) {
        this.parentNode = parent; this.associatedDir = dir;
    }

    public Clear() { this.subNodes = []; if (this.linkedShape !== null) this.linkedShape.Delete(); }
    public GetContent(): ShapeRenderer.ShapeContent { return Flowgorithm.GetEmptyContent(); }
    public GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.Unknown; }
    public DrawsAfterArrow(): boolean { return false; }
    public BeforeArrowHasEnding(): boolean { return true; }
    public Render(position: Utils.Vec2) {}

    public Delete() {
        this.linkedShape.Delete();
        for (let childNode of this.subNodes) childNode.Delete();
        for (let currentArrow of this.subArrows) currentArrow.Delete();
    }

    protected AddShape(position: Utils.Vec2) {
        this.linkedShape = ShapeRenderer.AddShape(this.GetType(), position, this.GetContent());
    }

    public GetSize(countType: SizeCountType = SizeCountType.CountAll, countSubnodesMode: SubnodeCountType = SubnodeCountType.HeadOnly): Utils.Vec2 {
        if (!this.sizeCache.isCached) {
            this.sizeCache = this.CalculateSizeCache();
            this.sizeCache.isCached = true;
            this.SetSubnodeCache(this.sizeCache);
            this.sizeCache.totalLeftWidth = this.GetSideTotalWidth(SizeCountType.OnlyLeft);
            this.sizeCache.totalRightWidth = this.GetSideTotalWidth(SizeCountType.OnlyRight);
        }

        return this.sizeCache.GetByCountType(countType, countSubnodesMode);
    }

    public RenderSubnodes(position: Utils.Vec2, renderFirstArrow: boolean = true): Utils.Vec2 {
        for (let i = 0; i < this.subNodes.length; i++) {
            let isFirstNode: boolean = i === 0;
            if (!isFirstNode || renderFirstArrow) this.HandleArrowRender(position, i);
            let currentNode: ProgramNode = this.subNodes[i];

            currentNode.Render(position);
            let currentNodeSize: Utils.Vec2 = currentNode.GetSize(SizeCountType.CountAll, SubnodeCountType.CountAll);
            position.y += currentNodeSize.y;
        }

        return position.Copy();
    }

    private HandleArrowRender(position: Utils.Vec2, nodeIndex: number) {
        let previousNode: ProgramNodeOpt = this.GetSubnode(nodeIndex - 1), currentNode: ProgramNodeOpt = this.GetSubnode(nodeIndex);
        let drawsAfterArrow: boolean = previousNode === null ? false : previousNode.DrawsAfterArrow();
        if (drawsAfterArrow) { position.y += Flowgorithm.defaultArrowLength; return; }

        let renderArrowEnding: boolean = currentNode === null ? true : currentNode.BeforeArrowHasEnding();
        let arrowLength: number = Flowgorithm.defaultArrowLength;        
        let renderedArrow: ArrowPath = this.RenderDefaultArrow(position, arrowLength, renderArrowEnding);
        this.subArrows.push(renderedArrow);
    }

    public RenderDefaultArrow(position: Utils.Vec2, arrowLength: number = Flowgorithm.defaultArrowLength, drawEnding: boolean = true): ArrowPath {
        let renderedArrow: ArrowPath = new ArrowPath(position, [arrowLength], [Flowgorithm.defaultArrowAngle], drawEnding);
        let arrowTotalSize: Utils.Vec2 = renderedArrow.GetArrowSize();
        position.y += arrowTotalSize.y;
        return renderedArrow;
    }

    private GetSubnode(nodeIndex: number): ProgramNodeOpt {
        let isIndexInvalid: boolean = nodeIndex < 0 || nodeIndex >= this.subNodes.length;
        if (isIndexInvalid) return null;
        return this.subNodes[nodeIndex];
    }

    public CalculateSizeCache(): CachedSize {
        let sizeCache: CachedSize = new CachedSize();
       
        let headSize: Utils.Vec2 = this.linkedShape.GetSize(this.GetContent(), this.GetType());
        let headPortionHalfSize: Utils.Vec2 = new Utils.Vec2(headSize.x / 2, headSize.y);
        sizeCache.leftPortion = headPortionHalfSize; sizeCache.rightPortion = headPortionHalfSize;
        sizeCache.subLeftPortion = Utils.Vec2.Zero(); sizeCache.subRightPortion = Utils.Vec2.Zero();

        return sizeCache;
    }

    public SetSubnodeCache(currentSizeCache: CachedSize) {
        for (let currentSubnode of this.subNodes) {
            let totalLeftSize: Utils.Vec2 = currentSubnode.GetSize(SizeCountType.OnlyLeft, SubnodeCountType.CountAll),
                totalRightSize: Utils.Vec2 = currentSubnode.GetSize(SizeCountType.OnlyRight, SubnodeCountType.CountAll);
            
            let totalLeftWidth: number = currentSubnode.sizeCache.leftPortion.x + currentSubnode.sizeCache.subLeftPortion.x,
                totalRightWidth: number = currentSubnode.sizeCache.rightPortion.x + currentSubnode.sizeCache.subRightPortion.x;
            let subnodeHeight: number = Math.max(totalLeftSize.y, totalRightSize.y);

            currentSizeCache.subLeftPortion.x = Math.max(currentSizeCache.subLeftPortion.x, totalLeftWidth, Flowgorithm.defaultArrowLength);
            currentSizeCache.subRightPortion.x = Math.max(currentSizeCache.subRightPortion.x, totalRightWidth);
            currentSizeCache.ApplyToSub(0, subnodeHeight + Flowgorithm.defaultArrowLength);
        }
    }

    public WillSpecialArrowsHaveArrowEnd(checkedIndex: number = 0): boolean {
        let renderBranchArrowEnd: boolean = true;
        if (this.subNodes.length > checkedIndex) {
            let firstSubnode: ProgramNode = this.subNodes[checkedIndex];
            renderBranchArrowEnd = firstSubnode.BeforeArrowHasEnding();
        }

        return renderBranchArrowEnd;
    }

    public GetSideTotalWidth(checkedSide: SizeCountType): number {
        if (checkedSide === SizeCountType.CountAll)
            return this.GetSize(SizeCountType.OnlyLeft, SubnodeCountType.Entirety).x +
                   this.GetSize(SizeCountType.OnlyRight, SubnodeCountType.Entirety).x;

        let currentHeadSize: Utils.Vec2 = this.GetSize(checkedSide, SubnodeCountType.HeadOnly);
        let totalWidth: number = currentHeadSize.x;
        for (let currentSubnode of this.subNodes) {
            let subnodeWidth: number = currentSubnode.GetSize(checkedSide, SubnodeCountType.Entirety).x;
            totalWidth = Math.max(totalWidth, subnodeWidth);
        }

        return totalWidth;
    }
}