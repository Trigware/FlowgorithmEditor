import * as Utils from "./Utils.js";
import { Expression } from "./Expression.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import { ArrowPath } from "./ArrowRendering.js";
const cycleDoneLabelVerticalMultiplier = 1.4;
const doWhileDoneLabelVerticalMultiplier = 2.4;
class CycleStatement extends Flowgorithm.ProgramNode {
    branchArrow = null;
    mergeArrow = null;
    doneArrow = null;
    nextLabel = null;
    doneLabel = null;
    subnodeParent = new Flowgorithm.ProgramNode();
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
        let headSize = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let horizontalSegmentLength = this.GetHorizontalSegmentLength();
        let arrowYOffset = 0;
        if (this.linkedShape.shadowShape !== null)
            arrowYOffset = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;
        let branchArrowPos = position.Plus(0, headSize.y / 2 + arrowYOffset);
        let verticalSegmentLength = headSize.y / 2 + Flowgorithm.defaultArrowLength;
        let hasSubnodes = this.subnodeParent.subNodes.length > 0;
        let mergeArrowData = this.GetMergeArrowData();
        let mergeLengthArr = hasSubnodes ? [] : mergeArrowData[0], mergeRotationArr = hasSubnodes ? [] : mergeArrowData[1];
        this.branchArrow = new ArrowPath(branchArrowPos, [horizontalSegmentLength, verticalSegmentLength, ...mergeLengthArr], [Flowgorithm.rightPointingRotation, Flowgorithm.defaultArrowAngle, ...mergeRotationArr]);
        this.subnodeParent.RenderSubnodes(this.branchArrow.GetArrowEndPos(), false);
    }
    RenderMergingArrow() {
        if (this.branchArrow === null || this.subnodeParent.subNodes.length === 0)
            return;
        let lastNode = this.subnodeParent.subNodes[this.subnodeParent.subNodes.length - 1];
        let isExtendingMergeArrow = lastNode.DrawsAfterArrow();
        let extensionLength = 0;
        if (isExtendingMergeArrow) {
            let lastNodeSubnodeSize = lastNode.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.SubnodeOnly);
            extensionLength = lastNodeSubnodeSize.y;
        }
        let mergeArrowData = this.GetMergeArrowData();
        let arrowEndPos = this.branchArrow.GetArrowEndPos(), mergeArrowPos = arrowEndPos.Minus(0, extensionLength);
        let firstSegmentLength = Flowgorithm.defaultArrowLength + extensionLength;
        this.mergeArrow = new ArrowPath(mergeArrowPos, [firstSegmentLength, ...mergeArrowData[0]], [Flowgorithm.defaultArrowAngle, ...mergeArrowData[1]]);
    }
    RenderDoneArrow(position) {
        let nodeIndex = this.parentNode === null ? -1 : this.parentNode.subNodes.indexOf(this);
        let isLastNode = this.parentNode === null ? false : nodeIndex === this.parentNode.subNodes.length - 1;
        let drawDoneArrow = !isLastNode || this.parentNode instanceof Flowgorithm.FunctionSignature;
        if (!drawDoneArrow)
            return;
        let subnodeSize = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.SubnodeOnly), headSize = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let arrowEndingSize = ArrowPath.GetArrowEndSize();
        let doneArrowPos = position.Plus(0, headSize.y);
        let arrowLength = subnodeSize.y + headSize.y + arrowEndingSize / 2;
        this.doneArrow = new ArrowPath(doneArrowPos, [arrowLength], [Flowgorithm.defaultArrowAngle]);
    }
    GetMergeArrowData() {
        let arrowEndSize = ArrowPath.GetArrowEndSize();
        let mergeHorizontalLength = this.GetHorizontalSegmentLength() - arrowEndSize;
        let subNodeSize = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.SubnodeOnly);
        let shadowYOffset = this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y"));
        let mergeVericalLength = subNodeSize.y - shadowYOffset / 2;
        let resultData = [
            [mergeHorizontalLength, mergeVericalLength],
            [Flowgorithm.leftPointingRotation, Flowgorithm.upwardPointingRotation]
        ];
        return resultData;
    }
    GetHorizontalSegmentLength() {
        let subNodeSize = this.subnodeParent.GetSize(Flowgorithm.SizeCountType.OnlyLeft, Flowgorithm.SubnodeCountType.CountAll);
        let headSize = this.GetSize(Flowgorithm.SizeCountType.OnlyRight, Flowgorithm.SubnodeCountType.HeadOnly);
        let actualSubnodesWidth = Math.max(subNodeSize.x, Flowgorithm.defaultArrowLength);
        let horizontalSegmentLength = headSize.x + actualSubnodesWidth;
        return horizontalSegmentLength;
    }
    RenderLabels(position) {
        let headSize = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let arrowEndSize = ArrowPath.GetArrowEndSize();
        let nextLabelPos = position.Plus(headSize.x / 2, headSize.y / 2);
        let doneLabelPos = position.Plus(-arrowEndSize / 2, headSize.y);
        doneLabelPos.y += this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) * 2;
        let doneLabelAlignment = ShapeRenderer.LabelAlign.Left | ShapeRenderer.LabelAlign.Down;
        let doneAlignMultiplier = new Utils.Vec2(1, cycleDoneLabelVerticalMultiplier);
        this.nextLabel = ShapeRenderer.ConstructLabel(nextLabelPos, "Next", ShapeRenderer.LabelAlign.Right);
        this.doneLabel = ShapeRenderer.ConstructLabel(doneLabelPos, "Done", doneLabelAlignment, doneAlignMultiplier);
    }
    SetSubnodeCache(currentSizeCache) {
        let totalSubnodeSize = this.subnodeParent.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.CountAll);
        let arrowConnectorSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size");
        let actualSubnodeWidth = Math.max(Flowgorithm.defaultArrowLength + arrowConnectorSize / 2, totalSubnodeSize.x);
        currentSizeCache.subRightPortion.x = currentSizeCache.rightPortion.x + actualSubnodeWidth;
        currentSizeCache.subRightPortion.y += totalSubnodeSize.y + Flowgorithm.defaultArrowLength;
    }
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
        Utils.SetProperty(this.mergePoint, "--connector-size-multiplier", Flowgorithm.mergePointSizeMultiplier.toString());
        let mergePointSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * Flowgorithm.mergePointSizeMultiplier;
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
        let subnodeSize = this.subnodeParent.GetSize(Flowgorithm.SizeCountType.OnlyLeft, Flowgorithm.SubnodeCountType.CountAll), headSize = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let mergePointSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * Flowgorithm.mergePointSizeMultiplier;
        let mergeSegmentLength = Math.max(subnodeSize.x, Flowgorithm.defaultArrowLength), firstSegmentLength = mergeSegmentLength + headSize.x / 2, verticalSegmentLength = Flowgorithm.defaultArrowLength + mergePointSize / 2, connectorSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * Flowgorithm.mergePointSizeMultiplier;
        let containsSubnodes = this.subnodeParent.subNodes.length > 0;
        let mergeLengthArr = containsSubnodes ? [] : [mergeSegmentLength], mergeAnglesArr = containsSubnodes ? [] : [Flowgorithm.leftPointingRotation];
        this.branchArrow = new ArrowPath(this.currentPosition, [firstSegmentLength, verticalSegmentLength, ...mergeLengthArr], [Flowgorithm.rightPointingRotation, Flowgorithm.defaultArrowAngle, ...mergeAnglesArr]);
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
            let lastSubnodeSize = lastSubnode.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.SubnodeOnly);
            mergeArrowPos.y -= lastSubnodeSize.y;
            mergeArrowVerticalLength += lastSubnodeSize.y;
        }
        this.mergeArrow = new ArrowPath(mergeArrowPos, [mergeArrowVerticalLength, mergeSegmentLength], [Flowgorithm.defaultArrowAngle, Flowgorithm.leftPointingRotation]);
        this.headPosition.y += subnodeSize.y;
    }
    RenderDoWhileArrowToMergePoint() {
        if (this.mergePoint === null)
            return;
        let mergePointSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * Flowgorithm.mergePointSizeMultiplier;
        let arrowLength = this.headPosition.y - this.renderPosition.y - mergePointSize;
        this.arrowToPoint = new ArrowPath(this.headPosition, [arrowLength], [Flowgorithm.upwardPointingRotation]);
    }
    RenderDoWhileLabels() {
        let arrowEndPos = ArrowPath.GetArrowEndSize();
        let nextLabelPos = this.headPosition.Minus(arrowEndPos / 2, 0);
        this.nextLabel = ShapeRenderer.ConstructLabel(nextLabelPos, "True", ShapeRenderer.LabelAlign.Left);
        let headSize = this.GetSize(Flowgorithm.SizeCountType.CountAll, Flowgorithm.SubnodeCountType.HeadOnly);
        let shadowYOffset = this.linkedShape.shadowShape === null ? 0 :
            Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y"));
        let doneLabelPos = nextLabelPos.Plus(0, headSize.y + shadowYOffset);
        let doneAlignMultiplier = new Utils.Vec2(1, doWhileDoneLabelVerticalMultiplier);
        this.doneLabel = ShapeRenderer.ConstructLabel(doneLabelPos, "False", ShapeRenderer.LabelAlign.Left | ShapeRenderer.LabelAlign.Down, doneAlignMultiplier);
    }
}
