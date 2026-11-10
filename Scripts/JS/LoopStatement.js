import * as Utils from "./Utils.js";
import { Expression } from "./Expression.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import { ArrowPath } from "./ArrowRendering.js";
import * as BaseNode from "./ProgramNode.js";
const cycleDoneYOffset = 0.5, doWhileDoneYOffset = 1.5;
class CycleStatement extends BaseNode.ProgramNode {
    branchArrow = null;
    mergeArrow = null;
    doneArrow = null;
    nextLabel = null;
    doneLabel = null;
    subnodeParent = new BaseNode.ProgramNode();
    MoveToSubnodeParent() {
        this.subnodeParent.subNodes = this.subNodes.slice();
        for (let currentSubnode of this.subnodeParent.subNodes) {
            currentSubnode.parentNode = this.subnodeParent;
        }
        this.subNodes = [];
    }
    Render(position) {
        this.AddShape(position);
        this.RenderBranch(position);
        this.RenderMergingArrow();
        this.RenderDoneArrow(position);
        this.RenderLabels(position);
    }
    RenderBranch(position) {
        let headSize = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.HeadOnly);
        let horizontalSegmentLength = this.GetHorizontalSegmentLength();
        let arrowYOffset = 0;
        if (this.linkedShape.shadowShape !== null)
            arrowYOffset = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--additional-offset-y")) / 2;
        let branchArrowPos = position.Plus(0, headSize.y / 2 + arrowYOffset);
        let verticalSegmentLength = headSize.y / 2 + Flowgorithm.defaultArrowLength;
        let hasSubnodes = this.subnodeParent.subNodes.length > 0;
        let mergeArrowData = this.GetMergeArrowData();
        let mergeLengthArr = hasSubnodes ? [] : mergeArrowData[0], mergeRotationArr = hasSubnodes ? [] : mergeArrowData[1];
        let renderBranchArrowEnd = this.subnodeParent.WillSpecialArrowsHaveArrowEnd();
        this.branchArrow = new ArrowPath(branchArrowPos, [horizontalSegmentLength, verticalSegmentLength, ...mergeLengthArr], [Flowgorithm.rightPointingRotation, Flowgorithm.defaultArrowAngle, ...mergeRotationArr], renderBranchArrowEnd);
        this.subnodeParent.RenderSubnodes(this.branchArrow.GetArrowEndPos(), false);
    }
    RenderMergingArrow() {
        if (this.branchArrow === null || this.subnodeParent.subNodes.length === 0)
            return;
        let lastNode = this.subnodeParent.subNodes[this.subnodeParent.subNodes.length - 1];
        let isExtendingMergeArrow = lastNode.DrawsAfterArrow();
        let extensionLength = 0;
        if (isExtendingMergeArrow) {
            /*let lastNodeSubnodeSize: Utils.Vec2 = lastNode.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.SubnodeOnly);
            extensionLength = lastNodeSubnodeSize.y;*/
        }
        let mergeArrowData = this.GetMergeArrowData();
        let arrowEndPos = this.branchArrow.GetArrowEndPos(), mergeArrowPos = arrowEndPos.Minus(0, extensionLength);
        let firstSegmentLength = Flowgorithm.defaultArrowLength + extensionLength;
        this.mergeArrow = new ArrowPath(mergeArrowPos, [firstSegmentLength, ...mergeArrowData[0]], [Flowgorithm.defaultArrowAngle, ...mergeArrowData[1]]);
    }
    RenderDoneArrow(position) {
        if (this.parentNode === null)
            return;
        let nodeIndex = this.parentNode.subNodes.indexOf(this);
        let isLastNode = nodeIndex === this.parentNode.subNodes.length - 1;
        let drawDoneArrow = !isLastNode || this.parentNode instanceof Flowgorithm.FunctionSignature;
        if (!drawDoneArrow)
            return;
        let subnodeSize = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.SubnodeOnly), headSize = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.HeadOnly);
        let arrowEndingSize = ArrowPath.GetArrowEndSize();
        let doneArrowPos = position.Plus(0, headSize.y);
        let arrowLength = subnodeSize.y + headSize.y + arrowEndingSize / 2;
        let willRenderArrowEnd = this.parentNode.WillSpecialArrowsHaveArrowEnd(nodeIndex + 1);
        this.doneArrow = new ArrowPath(doneArrowPos, [arrowLength], [Flowgorithm.defaultArrowAngle], willRenderArrowEnd);
    }
    GetMergeArrowData() {
        let arrowEndSize = ArrowPath.GetArrowEndSize();
        let mergeHorizontalLength = this.GetHorizontalSegmentLength() - arrowEndSize;
        let subNodeSize = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.SubnodeOnly);
        let shadowYOffset = this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--additional-offset-y"));
        let mergeVericalLength = subNodeSize.y - shadowYOffset / 2;
        let resultData = [
            [mergeHorizontalLength, mergeVericalLength],
            [Flowgorithm.leftPointingRotation, Flowgorithm.upwardPointingRotation]
        ];
        return resultData;
    }
    GetHorizontalSegmentLength() {
        let subNodeSize = this.subnodeParent.GetSize(BaseNode.SizeCountType.OnlyLeft, BaseNode.SubnodeCountType.CountAll);
        let headSize = this.GetSize(BaseNode.SizeCountType.OnlyRight, BaseNode.SubnodeCountType.HeadOnly);
        let actualSubnodesWidth = Math.max(subNodeSize.x, Flowgorithm.defaultArrowLength);
        let horizontalSegmentLength = headSize.x + actualSubnodesWidth;
        return horizontalSegmentLength;
    }
    RenderLabels(position) {
        let headSize = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.HeadOnly);
        let arrowEndSize = ArrowPath.GetArrowEndSize();
        let nextLabelPos = position.Plus(headSize.x / 2, headSize.y / 2), doneLabelPos = position.Plus(-arrowEndSize / 2, headSize.y);
        doneLabelPos.y += this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--additional-offset-y")) * 2;
        let isForLoop = this instanceof ForLoop;
        let nextLabelInfo = new ShapeRenderer.LabelRenderInfo(nextLabelPos, isForLoop ? "Next" : "True", ShapeRenderer.HAlign.Right), doneLabelInfo = new ShapeRenderer.LabelRenderInfo(doneLabelPos, isForLoop ? "Done" : "False", ShapeRenderer.HAlign.Left, cycleDoneYOffset);
        this.nextLabel = nextLabelInfo.CreateLabel();
        this.doneLabel = doneLabelInfo.CreateLabel();
    }
    SetSubnodeCache(currentSizeCache) {
        let totalSubnodeSize = this.subnodeParent.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.CountAll);
        let arrowConnectorSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size");
        let actualSubnodeWidth = Math.max(Flowgorithm.defaultArrowLength + arrowConnectorSize / 2, totalSubnodeSize.x);
        currentSizeCache.subRightPortion.x = currentSizeCache.rightPortion.x + actualSubnodeWidth;
        currentSizeCache.subRightPortion.y += totalSubnodeSize.y + Flowgorithm.defaultArrowLength;
    }
    GetSideTotalWidth(checkedSide) {
        if (checkedSide === BaseNode.SizeCountType.CountAll)
            return this.GetSize(BaseNode.SizeCountType.OnlyLeft, BaseNode.SubnodeCountType.Entirety).x +
                this.GetSize(BaseNode.SizeCountType.OnlyRight, BaseNode.SubnodeCountType.Entirety).x;
        let headWidth = this.GetSize(checkedSide, BaseNode.SubnodeCountType.HeadOnly).x, minimumBranchWidth = Flowgorithm.defaultArrowLength + Utils.GetFromRootPX("--default-connector-size") / 2;
        let totalWidth = headWidth;
        if (checkedSide === BaseNode.SizeCountType.OnlyRight) {
            let branchWidth = Math.max(this.subnodeParent.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.Entirety).x, minimumBranchWidth);
            totalWidth += branchWidth;
        }
        return totalWidth;
    }
    IsForLoop() { return false; }
}
export class ForLoop extends CycleStatement {
    iteratorName = "";
    loopStart = new Expression();
    loopEnd = new Expression();
    iterationStep = new Expression();
    isIncreasing = true;
    GetContent() {
        let unboldedSection = "For";
        let isIncomplete = this.iteratorName.length === 0 || this.loopStart.IsEmpty() ||
            this.loopEnd.IsEmpty() || this.iterationStep.IsEmpty();
        if (!isIncomplete)
            unboldedSection += ' ';
        let shapeContent = new ShapeRenderer.ShapeContent(unboldedSection);
        shapeContent.isIncomplete = isIncomplete;
        if (isIncomplete)
            return shapeContent;
        shapeContent.Append(`${this.iteratorName} = ${this.loopStart.expressionAsStr}`, ShapeRenderer.TextType.Bolded);
        shapeContent.Append(" to ");
        shapeContent.Append(this.loopEnd.expressionAsStr, ShapeRenderer.TextType.Bolded);
        let showStepSize = !this.iterationStep.IsLiteralOne();
        if (showStepSize) {
            shapeContent.Append(` with step size `);
            shapeContent.Append(this.iterationStep.expressionAsStr, ShapeRenderer.TextType.Bolded);
        }
        if (!this.isIncreasing)
            shapeContent.Append(" decreasing", ShapeRenderer.TextType.Italic);
        return shapeContent;
    }
    GetType() { return ShapeRenderer.ShapeType.For; }
    DrawsAfterArrow() { return true; }
}
export class ConditionalCycle extends CycleStatement {
    expression = new Expression();
    isDoWhile = false;
    mergePoint = null;
    currentPosition = Utils.Vec2.Zero();
    headPosition = Utils.Vec2.Zero();
    renderPosition = Utils.Vec2.Zero();
    arrowToPoint = null;
    GetContent() {
        let unboldedSection = this.isDoWhile ? "Do While" : "While";
        let isIncomplete = this.expression.IsEmpty();
        if (!isIncomplete)
            unboldedSection += ' ';
        let shapeContent = new ShapeRenderer.ShapeContent(unboldedSection);
        shapeContent.Append(this.expression.expressionAsStr, ShapeRenderer.TextType.Bolded);
        shapeContent.isIncomplete = isIncomplete;
        return shapeContent;
    }
    GetType() { return this.isDoWhile ? ShapeRenderer.ShapeType.Do : ShapeRenderer.ShapeType.While; }
    DrawsAfterArrow() { return !this.isDoWhile; }
    Render(position) {
        this.renderPosition = position.Copy();
        this.currentPosition = position.Copy();
        if (!this.isDoWhile) {
            super.Render(position);
            return;
        }
        this.RenderDoWhile();
    }
    RenderDoWhile() {
        this.RenderDoWhileMergePoint();
        this.RenderDoWhileBody();
        this.RenderDoWhileArrowToMergePoint();
        this.RenderDoWhileLabels();
        this.AddShape(this.headPosition);
    }
    RenderDoWhileMergePoint() {
        this.mergePoint = Utils.CreateElement("div", "ShapeArrowConnector", ShapeRenderer.currentPlane);
        Utils.SetProperty(this.mergePoint, "--connector-size-multiplier", BaseNode.mergePointSizeMultiplier.toString());
        let mergePointSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * BaseNode.mergePointSizeMultiplier;
        this.currentPosition.y += mergePointSize / 2;
        ShapeRenderer.SetShapePosition(this.mergePoint, this.currentPosition);
        let mergePointColorInfo = ShapeRenderer.GetColorInfo(this.GetType());
        if (this.expression.IsEmpty())
            mergePointColorInfo = ShapeRenderer.incompleteShapeColors;
        let mergePointColor = mergePointColorInfo.mergePointColor;
        Utils.SetProperty(this.mergePoint, "background-color", mergePointColor);
    }
    RenderDoWhileBody() {
        if (this.mergePoint === null)
            return;
        let subnodeSize = this.subnodeParent.GetSize(BaseNode.SizeCountType.OnlyLeft, BaseNode.SubnodeCountType.CountAll), headSize = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.HeadOnly);
        let mergePointSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * BaseNode.mergePointSizeMultiplier;
        let mergeSegmentLength = Math.max(subnodeSize.x, Flowgorithm.defaultArrowLength), firstSegmentLength = mergeSegmentLength + headSize.x / 2, verticalSegmentLength = Flowgorithm.defaultArrowLength + mergePointSize / 2, connectorSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * BaseNode.mergePointSizeMultiplier;
        let containsSubnodes = this.subnodeParent.subNodes.length > 0;
        let mergeLengthArr = containsSubnodes ? [] : [mergeSegmentLength], mergeAnglesArr = containsSubnodes ? [] : [Flowgorithm.leftPointingRotation];
        let willRenderArrowEnd = this.subnodeParent.WillSpecialArrowsHaveArrowEnd();
        this.branchArrow = new ArrowPath(this.currentPosition, [firstSegmentLength, verticalSegmentLength, ...mergeLengthArr], [Flowgorithm.rightPointingRotation, Flowgorithm.defaultArrowAngle, ...mergeAnglesArr], willRenderArrowEnd);
        this.currentPosition = this.currentPosition.Plus(firstSegmentLength, verticalSegmentLength);
        this.headPosition = this.renderPosition.Plus(0, connectorSize / 2 + verticalSegmentLength - headSize.y / 2);
        this.subnodeParent.RenderSubnodes(this.currentPosition, false);
        this.RenderDoWhileMergeArrow(subnodeSize, mergeSegmentLength);
    }
    RenderDoWhileMergeArrow(subnodeSize, mergeSegmentLength) {
        let containsSubnodes = this.subnodeParent.subNodes.length > 0;
        if (!containsSubnodes)
            return;
        let lastSubnode = this.subnodeParent.subNodes[this.subnodeParent.subNodes.length - 1];
        let willDrawAfterArrow = lastSubnode.DrawsAfterArrow();
        let mergeArrowPos = this.currentPosition.Copy();
        let mergeArrowVerticalLength = Flowgorithm.defaultArrowLength;
        if (willDrawAfterArrow) {
            let lastSubnodeSize = lastSubnode.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.SubnodeOnly);
            mergeArrowPos.y -= lastSubnodeSize.y;
            mergeArrowVerticalLength += lastSubnodeSize.y;
        }
        this.mergeArrow = new ArrowPath(mergeArrowPos, [mergeArrowVerticalLength, mergeSegmentLength], [Flowgorithm.defaultArrowAngle, Flowgorithm.leftPointingRotation]);
        this.headPosition.y += subnodeSize.y;
    }
    RenderDoWhileArrowToMergePoint() {
        if (this.mergePoint === null)
            return;
        let mergePointSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * BaseNode.mergePointSizeMultiplier;
        let arrowLength = this.headPosition.y - this.renderPosition.y - mergePointSize;
        this.arrowToPoint = new ArrowPath(this.headPosition, [arrowLength], [Flowgorithm.upwardPointingRotation]);
    }
    RenderDoWhileLabels() {
        let arrowEndPos = ArrowPath.GetArrowEndSize();
        let nextLabelPos = this.headPosition.Minus(arrowEndPos / 2, 0);
        let headSize = this.GetSize(BaseNode.SizeCountType.CountAll, BaseNode.SubnodeCountType.HeadOnly);
        let shadowYOffset = this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--additional-offset-y"));
        let doneLabelPos = nextLabelPos.Plus(0, headSize.y + shadowYOffset);
        let nextLabelInfo = new ShapeRenderer.LabelRenderInfo(nextLabelPos, "True", ShapeRenderer.HAlign.Left), doneLabelInfo = new ShapeRenderer.LabelRenderInfo(doneLabelPos, "False", ShapeRenderer.HAlign.Left, doWhileDoneYOffset);
        this.nextLabel = nextLabelInfo.CreateLabel();
        this.doneLabel = doneLabelInfo.CreateLabel();
    }
}
