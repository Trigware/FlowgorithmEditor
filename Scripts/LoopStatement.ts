import * as Utils from "./Utils.js"
import { Expression } from "./Expression.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import { ArrowPath } from "./ArrowRendering.js"

type ArrowPathOpt = ArrowPath | null;
type OptionalDiv = HTMLDivElement | null;
type MergeArrowData = [number[], number[]];

const doneLabelVerticalOffsetMultiplier: number = 1.4;

export class ForLoop extends Flowgorithm.ProgramNode {
    public iteratorName: string = "";
    public loopStart: Expression = new Expression();
    public loopEnd: Expression = new Expression();
    public iterationStep: Expression = new Expression();
    public isIncreasing: boolean = true;

    private branchArrow: ArrowPathOpt = null; private mergeArrow: ArrowPathOpt = null; private doneArrow: ArrowPathOpt = null;
    private nextLabel: OptionalDiv = null; private doneLabel: OptionalDiv = null;

    public override GetContent(): ShapeRenderer.ShapeContent {
        let unboldedSection: string = "for ";
        let shapeContent: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent(unboldedSection);

        let boldedContent: string = `${this.iteratorName} = ${this.loopStart.expressionAsStr} to ${this.loopEnd.expressionAsStr}`;
        shapeContent.Append(boldedContent, ShapeRenderer.TextType.Bolded);
        let additionalInfo: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent();
        if (!this.iterationStep.IsLiteralOne()) additionalInfo.Append(` with step size ${this.iterationStep.expressionAsStr}`);
        if (!this.isIncreasing) additionalInfo.Append(" decreasing", ShapeRenderer.TextType.Italic);
        shapeContent.AppendContent(additionalInfo);

        return shapeContent;
    }

    public override GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.For; }
    public override DrawsAfterArrow(): boolean { return true; }

    public override CalculateSizeCache(): Flowgorithm.CachedSize {
        let sizeCache: Flowgorithm.CachedSize = super.CalculateSizeCache();
        sizeCache.subRightPortion.y += Flowgorithm.defaultArrowLength;
        return sizeCache;
    }

    public override Render(position: Utils.Vec2) {
        this.AddShape(position);
        this.RenderBranch(position);
        this.RenderMergingArrow();
        this.RenderDoneArrow(position);
        this.RenderLabels(position);
    }

    private RenderBranch(position: Utils.Vec2) {
        let headSize: Utils.Vec2 = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let horizontalSegmentLength: number = this.GetHorizontalSegmentLength();

        let arrowYOffset: number = 0;
        if (this.linkedShape.shadowShape !== null)
            arrowYOffset = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;
        let branchArrowPos: Utils.Vec2 = position.Plus(0, headSize.y / 2 + arrowYOffset);
        let verticalSegmentLength: number = headSize.y / 2 + Flowgorithm.defaultArrowLength;

        let hasSubnodes: boolean = this.subNodes.length > 0;
        let mergeArrowData: MergeArrowData = this.GetMergeArrowData();
        let mergeLengthArr: number[] = hasSubnodes ? [] : mergeArrowData[0],
            mergeRotationArr: number[] = hasSubnodes ? [] : mergeArrowData[1];

        this.branchArrow = new ArrowPath(
            branchArrowPos,
            [horizontalSegmentLength, verticalSegmentLength, ...mergeLengthArr],
            [Flowgorithm.rightPointingRotation, Flowgorithm.defaultArrowAngle, ...mergeRotationArr]
        );
        this.RenderSubnodes(this.branchArrow.GetArrowEndPos(), false);
    }

    private RenderMergingArrow() {
        if (this.branchArrow === null || this.subNodes.length === 0) return;

        let lastNode: Flowgorithm.ProgramNode = this.subNodes[this.subNodes.length - 1];
        let isExtendingMergeArrow: boolean = lastNode.DrawsAfterArrow();
        let extensionLength: number = 0;
        if (isExtendingMergeArrow) {
            let lastNodeSubnodeSize: Utils.Vec2 = lastNode.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.SubnodeOnly);
            extensionLength = lastNodeSubnodeSize.y;
        }

        let mergeArrowData: MergeArrowData = this.GetMergeArrowData();
        let arrowEndPos: Utils.Vec2 = this.branchArrow.GetArrowEndPos(),
            mergeArrowPos: Utils.Vec2 = arrowEndPos.Minus(0, extensionLength);
        let firstSegmentLength: number = Flowgorithm.defaultArrowLength + extensionLength;

        this.mergeArrow = new ArrowPath(
            mergeArrowPos, [firstSegmentLength, ...mergeArrowData[0]],
            [Flowgorithm.defaultArrowAngle, ...mergeArrowData[1]]
        );
    }

    private RenderDoneArrow(position: Utils.Vec2) {
        let nodeIndex: number = this.parentNode === null ? -1 : this.parentNode.subNodes.indexOf(this);
        let isLastNode: boolean = this.parentNode === null ? false : nodeIndex === this.parentNode.subNodes.length - 1;
        let drawDoneArrow: boolean = !isLastNode || this.parentNode instanceof Flowgorithm.FunctionSignature;
        if (!drawDoneArrow) return;

        let subnodeSize: Utils.Vec2 = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.SubnodeOnly),
            headSize: Utils.Vec2 = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let arrowEndingSize: number = ArrowPath.GetArrowEndSize();
        let doneArrowPos: Utils.Vec2 = position.Plus(0, headSize.y);
        let arrowLength: number = subnodeSize.y + headSize.y + arrowEndingSize / 2;

        this.doneArrow = new ArrowPath(
            doneArrowPos, [arrowLength], [Flowgorithm.defaultArrowAngle]
        );
    }

    private GetMergeArrowData(): MergeArrowData {
        let arrowEndSize: number = ArrowPath.GetArrowEndSize();
        let mergeHorizontalLength: number = this.GetHorizontalSegmentLength() - arrowEndSize;
        let subNodeSize: Utils.Vec2 = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.SubnodeOnly);
        let mergeVericalLength: number = subNodeSize.y;

        let resultData: MergeArrowData = [
            [mergeHorizontalLength, mergeVericalLength],
            [Flowgorithm.leftPointingRotation, Flowgorithm.upwardPointingRotation]
        ];

        return resultData;
    }

    private GetHorizontalSegmentLength(): number {
        let subNodeSize: Utils.Vec2 = this.GetSize(Flowgorithm.SizeCountType.OnlyLeft, Flowgorithm.SubnodeCountType.SubnodeOnly);
        let headSize: Utils.Vec2 = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let actualSubnodesWidth: number = Math.max(subNodeSize.x, Flowgorithm.defaultArrowLength);
        let horizontalSegmentLength: number = headSize.x / 2 + actualSubnodesWidth;

        return horizontalSegmentLength;
    }

    private RenderLabels(position: Utils.Vec2) {
        let headSize: Utils.Vec2 = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let arrowEndSize: number = ArrowPath.GetArrowEndSize();
        let nextLabelPos: Utils.Vec2 = position.Plus(headSize.x / 2, headSize.y / 2);
        let doneLabelPos: Utils.Vec2 = position.Plus(-arrowEndSize / 2, headSize.y);

        doneLabelPos.y += this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) * 2;
        let doneLabelAlignment: ShapeRenderer.LabelAlign = ShapeRenderer.LabelAlign.Left | ShapeRenderer.LabelAlign.Down;
        let doneAlignMultiplier: Utils.Vec2 = new Utils.Vec2(1, doneLabelVerticalOffsetMultiplier);

        this.nextLabel = ShapeRenderer.ConstructLabel(nextLabelPos, "Next", ShapeRenderer.LabelAlign.Right);
        this.doneLabel = ShapeRenderer.ConstructLabel(doneLabelPos, "Done", doneLabelAlignment, doneAlignMultiplier);
    }
}

export class ConditionalCycle extends Flowgorithm.ProgramNode {
    public expression: Expression = new Expression();
    public isDoWhile: boolean = false;

    public override GetContent(): ShapeRenderer.ShapeContent {
        let unboldedSection: string = "while";
        if (this.expression.expressionAsStr !== "") unboldedSection += ' ';
        let shapeContent: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent(unboldedSection);

        shapeContent.Append(this.expression.expressionAsStr, ShapeRenderer.TextType.Bolded);
        return shapeContent;
    }

    public override Render(position: Utils.Vec2) { this.AddShape(position); }
    public override GetType(): ShapeRenderer.ShapeType { return this.isDoWhile ? ShapeRenderer.ShapeType.Do : ShapeRenderer.ShapeType.While; }
}