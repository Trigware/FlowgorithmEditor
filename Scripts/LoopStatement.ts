import * as Utils from "./Utils.js"
import { Expression } from "./Expression.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import { ArrowPath } from "./ArrowRendering.js"
import * as BaseNode from "./ProgramNode.js"

type ArrowPathOpt = ArrowPath | null;
type OptionalDiv = HTMLDivElement | null;
type MergeArrowData = [number[], number[]];

const cycleDoneYOffset: number = 0.5, doWhileDoneYOffset: number = 1.5;
const cycleDoneArrowAnnotationExtension: number = 1.5;

class CycleStatement extends BaseNode.ProgramNode {
    protected branchArrow: ArrowPathOpt = null; protected mergeArrow: ArrowPathOpt = null; private doneArrow: ArrowPathOpt = null;
    protected nextLabel: OptionalDiv = null; protected doneLabel: OptionalDiv = null;
    public subnodeParent: BaseNode.ProgramNode = new BaseNode.ProgramNode(this, BaseNode.AssociatedDirection.Right);

    public MoveToSubnodeParent() {
        this.subnodeParent.subNodes = this.subNodes.slice();
        for (let currentSubnode of this.subnodeParent.subNodes) {
            currentSubnode.parentNode = this.subnodeParent;
        }
        this.subNodes = [];
    }

    public override Render(position: Utils.Vec2) {
        this.AddShape(position);
        this.RenderBranch(position);
        this.RenderMergingArrow();
        this.RenderDoneArrow(position);
        this.RenderLabels(position);
    }

    private RenderBranch(position: Utils.Vec2) {
        let headSize: Utils.Vec2 = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.HeadOnly);
        let horizontalSegmentLength: number = this.GetHorizontalSegmentLength();

        let arrowYOffset: number = 0;
        if (this.linkedShape.shadowShape !== null)
            arrowYOffset = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--additional-offset-y")) / 2;
        let branchArrowPos: Utils.Vec2 = position.Plus(0, headSize.y / 2 + arrowYOffset);
        let verticalSegmentLength: number = headSize.y / 2 + Flowgorithm.defaultArrowLength;

        let hasSubnodes: boolean = this.subnodeParent.subNodes.length > 0;
        let mergeArrowData: MergeArrowData = this.GetMergeArrowData();
        let mergeLengthArr: number[] = hasSubnodes ? [] : mergeArrowData[0],
            mergeRotationArr: number[] = hasSubnodes ? [] : mergeArrowData[1];

        let renderBranchArrowEnd: boolean = this.subnodeParent.WillSpecialArrowsHaveArrowEnd();
        this.branchArrow = new ArrowPath(
            branchArrowPos,
            [horizontalSegmentLength, verticalSegmentLength, ...mergeLengthArr],
            [Flowgorithm.rightPointingRotation, Flowgorithm.defaultArrowAngle, ...mergeRotationArr], renderBranchArrowEnd
        );
        this.subnodeParent.RenderSubnodes(this.branchArrow.GetArrowEndPos(), false);
    }

    private RenderMergingArrow() {
        if (this.branchArrow === null || this.subnodeParent.subNodes.length === 0) return;

        let lastNode: BaseNode.ProgramNode = this.subnodeParent.subNodes[this.subnodeParent.subNodes.length - 1];
        let isExtendingMergeArrow: boolean = lastNode.DrawsAfterArrow();
        let extensionLength: number = 0;
        if (isExtendingMergeArrow) {
            let lastNodeSubnodeSize: Utils.Vec2 = lastNode.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.SubnodeOnly);
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
        if (this.parentNode === null) return;

        let nodeIndex: number = this.parentNode.subNodes.indexOf(this);
        let isLastNode: boolean = nodeIndex === this.parentNode.subNodes.length - 1;
        let drawDoneArrow: boolean = !isLastNode || this.parentNode instanceof Flowgorithm.FunctionSignature;
        if (!drawDoneArrow) return;

        let subnodeSize: Utils.Vec2 = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.SubnodeOnly),
            headSize: Utils.Vec2 = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.HeadOnly);
        let arrowEndingSize: number = ArrowPath.GetArrowEndSize();
        let doneArrowPos: Utils.Vec2 = position.Plus(0, headSize.y);
        let arrowLength: number = subnodeSize.y + headSize.y + arrowEndingSize / 2;

        let hasNextNodeArrowEnd: boolean = true;
        if (!isLastNode) {
            let nextNode: BaseNode.ProgramNode = this.parentNode.subNodes[nodeIndex + 1];
            hasNextNodeArrowEnd = nextNode.BeforeArrowHasEnding();
        }
        if (!hasNextNodeArrowEnd) arrowLength += cycleDoneArrowAnnotationExtension;

        let willRenderArrowEnd: boolean = this.parentNode.WillSpecialArrowsHaveArrowEnd(nodeIndex + 1);
        this.doneArrow = new ArrowPath(
            doneArrowPos, [arrowLength], [Flowgorithm.defaultArrowAngle], willRenderArrowEnd
        );
    }

    private GetMergeArrowData(): MergeArrowData {
        let arrowEndSize: number = ArrowPath.GetArrowEndSize();
        let mergeHorizontalLength: number = this.GetHorizontalSegmentLength() - arrowEndSize;
        let subNodeSize: Utils.Vec2 = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.SubnodeOnly);
        let shadowYOffset: number = this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--additional-offset-y"));
        let mergeVericalLength: number = subNodeSize.y - shadowYOffset / 2;

        let resultData: MergeArrowData = [
            [mergeHorizontalLength, mergeVericalLength],
            [Flowgorithm.leftPointingRotation, Flowgorithm.upwardPointingRotation]
        ];

        return resultData;
    }

    private GetHorizontalSegmentLength(): number {
        let subNodeSize: Utils.Vec2 = this.subnodeParent.GetSize(BaseNode.SizeCountType.OnlyLeft, BaseNode.SubnodeCountType.Entirety);
        let headSize: Utils.Vec2 = this.GetSize(BaseNode.SizeCountType.OnlyRight, BaseNode.SubnodeCountType.HeadOnly);
        let actualSubnodesWidth: number = Math.max(subNodeSize.x, Flowgorithm.defaultArrowLength);
        let horizontalSegmentLength: number = headSize.x + actualSubnodesWidth;

        return horizontalSegmentLength;
    }

    private RenderLabels(position: Utils.Vec2) {
        let headSize: Utils.Vec2 = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.HeadOnly);
        let arrowEndSize: number = ArrowPath.GetArrowEndSize();
        let nextLabelPos: Utils.Vec2 = position.Plus(headSize.x / 2, headSize.y / 2), 
            doneLabelPos: Utils.Vec2 = position.Plus(-arrowEndSize / 2, headSize.y);

        doneLabelPos.y += this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--additional-offset-y")) * 2;
        
        let isForLoop: boolean = this instanceof ForLoop;
        let nextLabelInfo: ShapeRenderer.LabelRenderInfo = new ShapeRenderer.LabelRenderInfo(
            nextLabelPos, isForLoop ? "Next" : "True", ShapeRenderer.HAlign.Right
        ), doneLabelInfo: ShapeRenderer.LabelRenderInfo = new ShapeRenderer.LabelRenderInfo(
            doneLabelPos, isForLoop ? "Done" : "False", ShapeRenderer.HAlign.Left, cycleDoneYOffset
        );

        this.nextLabel = nextLabelInfo.CreateLabel();
        this.doneLabel = doneLabelInfo.CreateLabel();
    }

    public override SetSubnodeCache(currentSizeCache: BaseNode.CachedSize) {
        let totalSubnodeSize: Utils.Vec2 = this.subnodeParent.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.CountAll);
        let arrowConnectorSize: number = Utils.GetPropertyPX(document.documentElement, "--default-connector-size");
        let actualSubnodeWidth: number = Math.max(Flowgorithm.defaultArrowLength + arrowConnectorSize / 2, totalSubnodeSize.x);

        currentSizeCache.subRightPortion.x = currentSizeCache.rightPortion.x + actualSubnodeWidth;
        currentSizeCache.subRightPortion.y += totalSubnodeSize.y + Flowgorithm.defaultArrowLength;
    }

    public override GetSideTotalWidth(checkedSide: BaseNode.SizeCountType): number {
        if (checkedSide === BaseNode.SizeCountType.CountAll)
            return this.GetSize(BaseNode.SizeCountType.OnlyLeft, BaseNode.SubnodeCountType.Entirety).x +
                   this.GetSize(BaseNode.SizeCountType.OnlyRight, BaseNode.SubnodeCountType.Entirety).x;

        let headWidth: number = this.GetSize(checkedSide, BaseNode.SubnodeCountType.HeadOnly).x,
            minimumBranchWidth: number = Flowgorithm.defaultArrowLength + Utils.GetFromRootPX("--default-connector-size") / 2;
        let totalWidth: number = headWidth;

        if (checkedSide === BaseNode.SizeCountType.OnlyRight) {
            let branchWidth: number = Math.max(
                this.subnodeParent.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.Entirety).x,
                minimumBranchWidth
            );
            totalWidth += branchWidth;
        }

        return totalWidth;
    } 

    protected IsForLoop(): boolean { return false; }
}

export class ForLoop extends CycleStatement {
    public iteratorName: string = "";
    public loopStart: Expression = new Expression();
    public loopEnd: Expression = new Expression();
    public iterationStep: Expression = new Expression();
    public isIncreasing: boolean = true;

    public override GetContent(): ShapeRenderer.ShapeContent {
        let unboldedSection: string = "For";
        let isIncomplete: boolean = this.iteratorName.length === 0 || this.loopStart.IsEmpty() ||
            this.loopEnd.IsEmpty() || this.iterationStep.IsEmpty();
        if (!isIncomplete) unboldedSection += ' ';
        
        let shapeContent: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent(unboldedSection);
        shapeContent.isIncomplete = isIncomplete;
        if (isIncomplete) return shapeContent;

        shapeContent.Append(`${this.iteratorName} = ${this.loopStart.expressionAsStr}`, ShapeRenderer.TextType.Bolded);
        shapeContent.Append(" to ");
        shapeContent.Append(this.loopEnd.expressionAsStr, ShapeRenderer.TextType.Bolded);
        let showStepSize: boolean = !this.iterationStep.IsLiteralOne();
        if (showStepSize) {
            shapeContent.Append(` with step size `);
            shapeContent.Append(this.iterationStep.expressionAsStr, ShapeRenderer.TextType.Bolded);
        }
        if (!this.isIncreasing) shapeContent.Append(" decreasing", ShapeRenderer.TextType.Italic);

        return shapeContent;
    }

    public override GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.For; }
    public override DrawsAfterArrow(): boolean { return true; }
}

export class ConditionalCycle extends CycleStatement {
    public expression: Expression = new Expression();
    public isDoWhile: boolean = false;

    private mergePoint: OptionalDiv = null;
    private currentPosition: Utils.Vec2 = Utils.Vec2.Zero(); private headPosition: Utils.Vec2 = Utils.Vec2.Zero();
    private renderPosition: Utils.Vec2 = Utils.Vec2.Zero();
    private arrowToPoint: ArrowPathOpt = null;

    public override GetContent(): ShapeRenderer.ShapeContent {
        let unboldedSection: string = this.isDoWhile ? "Do While" : "While";
        let isIncomplete: boolean = this.expression.IsEmpty();
        if (!isIncomplete) unboldedSection += ' ';

        let shapeContent: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent(unboldedSection);
        shapeContent.Append(this.expression.expressionAsStr, ShapeRenderer.TextType.Bolded);
        shapeContent.isIncomplete = isIncomplete;

        return shapeContent;
    }

    public override GetType(): ShapeRenderer.ShapeType { return this.isDoWhile ? ShapeRenderer.ShapeType.Do : ShapeRenderer.ShapeType.While; }
    public override DrawsAfterArrow(): boolean { return !this.isDoWhile; }

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
        Utils.SetProperty(this.mergePoint, "--connector-size-multiplier", BaseNode.mergePointSizeMultiplier.toString());
        let mergePointSize: number = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * BaseNode.mergePointSizeMultiplier;

        this.currentPosition.y += mergePointSize / 2;
        ShapeRenderer.SetShapePosition(this.mergePoint, this.currentPosition);
        let mergePointColorInfo: ShapeRenderer.ShapeColorInfo = ShapeRenderer.GetColorInfo(this.GetType());
        if (this.expression.IsEmpty()) mergePointColorInfo = ShapeRenderer.incompleteShapeColors;
        let mergePointColor: string = mergePointColorInfo.mergePointColor;
        Utils.SetProperty(this.mergePoint, "background-color", mergePointColor);
    }

    private RenderDoWhileBody() {
        if (this.mergePoint === null) return;

        let subnodeWidth: number = this.subnodeParent.GetSize(BaseNode.SizeCountType.OnlyLeft, BaseNode.SubnodeCountType.Entirety).x;
        let headSize: Utils.Vec2 = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.HeadOnly);
        let mergePointSize: number = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * BaseNode.mergePointSizeMultiplier;
        
        let mergeSegmentLength: number = Math.max(subnodeWidth, Flowgorithm.defaultArrowLength),
            firstSegmentLength: number = mergeSegmentLength + headSize.x / 2,
            verticalSegmentLength: number = Flowgorithm.defaultArrowLength + mergePointSize / 2,
            connectorSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * BaseNode.mergePointSizeMultiplier;

        let containsSubnodes: boolean = this.subnodeParent.subNodes.length > 0;
        let mergeLengthArr: number[] = containsSubnodes ? [] : [mergeSegmentLength],
            mergeAnglesArr: number[] = containsSubnodes ? [] : [Flowgorithm.leftPointingRotation];

        let willRenderArrowEnd: boolean = this.subnodeParent.WillSpecialArrowsHaveArrowEnd();
        this.branchArrow = new ArrowPath(
            this.currentPosition,
            [firstSegmentLength, verticalSegmentLength, ...mergeLengthArr],
            [Flowgorithm.rightPointingRotation, Flowgorithm.defaultArrowAngle, ...mergeAnglesArr], willRenderArrowEnd
        );

        this.currentPosition = this.currentPosition.Plus(firstSegmentLength, verticalSegmentLength);
        this.headPosition = this.renderPosition.Plus(0, connectorSize / 2 + verticalSegmentLength - headSize.y / 2);

        this.subnodeParent.RenderSubnodes(this.currentPosition, false);
        this.RenderDoWhileMergeArrow(mergeSegmentLength);
    }

    private RenderDoWhileMergeArrow(mergeSegmentLength: number) {
        let containsSubnodes: boolean = this.subnodeParent.subNodes.length > 0;
        if (!containsSubnodes) return;

        let lastSubnode: BaseNode.ProgramNode = this.subnodeParent.subNodes[this.subnodeParent.subNodes.length - 1];
        let willDrawAfterArrow: boolean = lastSubnode.DrawsAfterArrow();
        let mergeArrowPos: Utils.Vec2 = this.currentPosition.Copy();
        let mergeArrowVerticalLength: number = Flowgorithm.defaultArrowLength;

        if (willDrawAfterArrow) {
            let lastSubnodeSize: Utils.Vec2 = lastSubnode.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.SubnodeOnly);
            mergeArrowPos.y -= lastSubnodeSize.y;
            mergeArrowVerticalLength += lastSubnodeSize.y;
        }

        this.mergeArrow = new ArrowPath(
            mergeArrowPos, [mergeArrowVerticalLength, mergeSegmentLength],
            [Flowgorithm.defaultArrowAngle, Flowgorithm.leftPointingRotation]
        );

        let subnodeHeight: number = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.SubnodeOnly).y;
        subnodeHeight -= Flowgorithm.defaultArrowLength;
        this.headPosition.y += subnodeHeight;
    }

    private RenderDoWhileArrowToMergePoint() {
        if (this.mergePoint === null) return;
        
        let mergePointSize: number = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * BaseNode.mergePointSizeMultiplier;
        let arrowLength: number = this.headPosition.y - this.renderPosition.y - mergePointSize;
        this.arrowToPoint = new ArrowPath(
            this.headPosition, [arrowLength], [Flowgorithm.upwardPointingRotation]
        );
    }

    private RenderDoWhileLabels() {
        let arrowEndPos: number = ArrowPath.GetArrowEndSize();
        let nextLabelPos: Utils.Vec2 = this.headPosition.Minus(arrowEndPos / 2, 0);

        let headSize: Utils.Vec2 = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.HeadOnly);
        let shadowYOffset: number = this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--additional-offset-y"));
        let doneLabelPos: Utils.Vec2 = nextLabelPos.Plus(0, headSize.y + shadowYOffset);

        let nextLabelInfo: ShapeRenderer.LabelRenderInfo = new ShapeRenderer.LabelRenderInfo(
            nextLabelPos, "True", ShapeRenderer.HAlign.Left
        ), doneLabelInfo: ShapeRenderer.LabelRenderInfo = new ShapeRenderer.LabelRenderInfo(
            doneLabelPos, "False", ShapeRenderer.HAlign.Left, doWhileDoneYOffset
        );
        
        this.nextLabel = nextLabelInfo.CreateLabel();
        this.doneLabel = doneLabelInfo.CreateLabel();
    }
}