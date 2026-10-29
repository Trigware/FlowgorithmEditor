import * as Utils from "./Utils.js"
import { Expression } from "./Expression.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import { ArrowPath } from "./ArrowRendering.js"

type ArrowPathOpt = ArrowPath | null;
type OptionalDiv = HTMLDivElement | null;
type MergeArrowData = [number[], number[]];

const cycleDoneLabelVerticalMultiplier: number = 1.4;
const doWhileDoneLabelVerticalMultiplier: number = 2.4;

class CycleStatement extends Flowgorithm.ProgramNode {
    protected branchArrow: ArrowPathOpt = null; protected mergeArrow: ArrowPathOpt = null; private doneArrow: ArrowPathOpt = null;
    protected nextLabel: OptionalDiv = null; protected doneLabel: OptionalDiv = null;

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
        let shadowYOffset: number = this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y"));
        let mergeVericalLength: number = subNodeSize.y - shadowYOffset / 2;

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
        let doneAlignMultiplier: Utils.Vec2 = new Utils.Vec2(1, cycleDoneLabelVerticalMultiplier);

        this.nextLabel = ShapeRenderer.ConstructLabel(nextLabelPos, "Next", ShapeRenderer.LabelAlign.Right);
        this.doneLabel = ShapeRenderer.ConstructLabel(doneLabelPos, "Done", doneLabelAlignment, doneAlignMultiplier);
    }
}

export class ForLoop extends CycleStatement {
    public iteratorName: string = "";
    public loopStart: Expression = new Expression();
    public loopEnd: Expression = new Expression();
    public iterationStep: Expression = new Expression();
    public isIncreasing: boolean = true;

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
}

export class ConditionalCycle extends CycleStatement {
    public expression: Expression = new Expression();
    public isDoWhile: boolean = false;

    private mergePoint: OptionalDiv = null;
    private currentPosition: Utils.Vec2 = Utils.Vec2.Zero(); private headPosition: Utils.Vec2 = Utils.Vec2.Zero();
    private renderPosition: Utils.Vec2 = Utils.Vec2.Zero();
    private arrowToPoint: ArrowPathOpt = null;

    public override GetContent(): ShapeRenderer.ShapeContent {
        let unboldedSection: string = this.isDoWhile ? "do while" : "while";
        if (this.expression.expressionAsStr !== "") unboldedSection += ' ';
        let shapeContent: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent(unboldedSection);

        shapeContent.Append(this.expression.expressionAsStr, ShapeRenderer.TextType.Bolded);
        return shapeContent;
    }

    public override GetType(): ShapeRenderer.ShapeType { return this.isDoWhile ? ShapeRenderer.ShapeType.Do : ShapeRenderer.ShapeType.While; }
    public override DrawsAfterArrow(): boolean { return !this.isDoWhile; }

    public override CalculateSizeCache(): Flowgorithm.CachedSize {
        let sizeCache: Flowgorithm.CachedSize = super.CalculateSizeCache();
        sizeCache.subRightPortion.y += Flowgorithm.defaultArrowLength;
        return sizeCache;
    }

    public override Render(position: Utils.Vec2) {
        this.renderPosition = position.Copy(); this.currentPosition = position.Copy();
        if (!this.isDoWhile) { super.Render(position); return; }
        this.RenderDoWhile();
    }

    private RenderDoWhile() {
        this.RenderDoWhileMergePoint();
        this.RenderDoWhileBody();
        this.RenderDoWhileArrowToMergePoint();
        this.RenderDoWhileLabels();
        this.AddShape(this.headPosition);
    }

    private RenderDoWhileMergePoint() {
        this.mergePoint = Utils.CreateElement("div", "ShapeArrowConnector", ShapeRenderer.currentPlane) as HTMLDivElement;
        let mergePointSize = Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size")) * Flowgorithm.mergePointSizeMultiplier;
        Utils.SetProperty(this.mergePoint, "--connector-size", mergePointSize.toString() + "px");

        this.currentPosition.y += mergePointSize / 2;
        ShapeRenderer.SetShapePosition(this.mergePoint, this.currentPosition);
        let mergePointColor: string = ShapeRenderer.GetColorInfo(this.GetType()).mergePointColor;
        Utils.SetProperty(this.mergePoint, "background-color", mergePointColor);
    }

    private RenderDoWhileBody() {
        if (this.mergePoint === null) return;

        let subnodeSize: Utils.Vec2 = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.SubnodeOnly),
            headSize: Utils.Vec2 = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let mergePointSize: number = Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size"));
        
        let mergeSegmentLength: number = Math.max(subnodeSize.x / 2, Flowgorithm.defaultArrowLength),
            firstSegmentLength: number = mergeSegmentLength + headSize.x / 2,
            verticalSegmentLength: number = Flowgorithm.defaultArrowLength + mergePointSize / 2;

        let containsSubnodes: boolean = this.subNodes.length > 0;
        let mergeLengthArr: number[] = containsSubnodes ? [] : [mergeSegmentLength],
            mergeAnglesArr: number[] = containsSubnodes ? [] : [Flowgorithm.leftPointingRotation];

        this.branchArrow = new ArrowPath(
            this.currentPosition,
            [firstSegmentLength, verticalSegmentLength, ...mergeLengthArr],
            [Flowgorithm.rightPointingRotation, Flowgorithm.defaultArrowAngle, ...mergeAnglesArr]
        );

        this.currentPosition = this.currentPosition.Plus(firstSegmentLength, verticalSegmentLength);
        this.headPosition = this.currentPosition.Plus(-mergeSegmentLength - headSize.x / 2, -headSize.y / 2);
        this.RenderSubnodes(this.currentPosition, false);
        if (!containsSubnodes) return;

        this.headPosition.y += Flowgorithm.defaultArrowLength + headSize.y;
        this.mergeArrow = new ArrowPath(
            this.currentPosition, [Flowgorithm.defaultArrowLength, mergeSegmentLength],
            [Flowgorithm.defaultArrowAngle, Flowgorithm.leftPointingRotation]
        );
    }

    private RenderDoWhileArrowToMergePoint() {
        if (this.mergePoint === null) return;
        
        let mergePointSize: number = Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size"));
        let arrowLength: number = this.headPosition.y - this.renderPosition.y - mergePointSize;
        this.arrowToPoint = new ArrowPath(
            this.headPosition, [arrowLength], [Flowgorithm.upwardPointingRotation]
        );
    }

    private RenderDoWhileLabels() {
        let arrowEndPos: number = ArrowPath.GetArrowEndSize();
        let nextLabelPos: Utils.Vec2 = this.headPosition.Minus(arrowEndPos / 2, 0);
        this.nextLabel = ShapeRenderer.ConstructLabel(nextLabelPos, "True", ShapeRenderer.LabelAlign.Left);

        let headSize: Utils.Vec2 = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let shadowYOffset: number = this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y"));

        let doneLabelPos: Utils.Vec2 = nextLabelPos.Plus(0, headSize.y + shadowYOffset);
        let doneAlignMultiplier: Utils.Vec2 = new Utils.Vec2(1, doWhileDoneLabelVerticalMultiplier);
        this.doneLabel = ShapeRenderer.ConstructLabel(
            doneLabelPos, "False", ShapeRenderer.LabelAlign.Left | ShapeRenderer.LabelAlign.Down, doneAlignMultiplier
        );
    }
}