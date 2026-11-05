import { Expression } from "./Expression.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Utils from "./Utils.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import { ArrowPath } from "./ArrowRendering.js";
export class ConditionalStatement extends Flowgorithm.ProgramNode {
    conditional = new Expression();
    thenNode = new Flowgorithm.ProgramNode();
    elseNode = new Flowgorithm.ProgramNode();
    thenBranchArrow = null;
    elseBranchArrow = null;
    thenMergeArrow = null;
    elseMergeArrow = null;
    thenBlockImportantSize = Utils.Vec2.Zero();
    elseBlockImportantSize = Utils.Vec2.Zero();
    thenLabel = null;
    elseLabel = null;
    mergePoint = null;
    currentPosition = Utils.Vec2.Zero();
    MoveSubnodes(moveToThen) {
        let selectedNode = moveToThen ? this.thenNode : this.elseNode;
        for (let currentSubnode of this.subNodes) {
            currentSubnode.parentNode = selectedNode;
        }
        selectedNode.subNodes = this.subNodes.slice();
        this.subNodes = [];
    }
    GetContent() {
        let regularSectionStr = "If";
        regularSectionStr += ' ';
        let resultContent = new ShapeRenderer.ShapeContent(regularSectionStr);
        resultContent.isIncomplete = this.conditional.IsEmpty();
        resultContent.Append(this.conditional.expressionAsStr, ShapeRenderer.TextType.Bolded);
        return resultContent;
    }
    GetType() { return ShapeRenderer.ShapeType.Conditional; }
    CalculateSizeCache() {
        let sizeCache = super.CalculateSizeCache();
        let thenNodeSize = this.thenNode.GetSize(Flowgorithm.SizeCountType.OnlyLeft, Flowgorithm.SubnodeCountType.CountAll);
        let elseNodeSize = this.elseNode.GetSize(Flowgorithm.SizeCountType.OnlyRight, Flowgorithm.SubnodeCountType.CountAll);
        let subBlockHeight = Math.max(thenNodeSize.y, elseNodeSize.y);
        subBlockHeight += Flowgorithm.defaultArrowLength;
        sizeCache.ApplyToSub(0, subBlockHeight);
        sizeCache.subLeftPortion.x = Math.max(Flowgorithm.defaultArrowLength, elseNodeSize.x);
        sizeCache.subRightPortion.x = Math.max(Flowgorithm.defaultArrowLength, thenNodeSize.x);
        return sizeCache;
    }
    Render(position) {
        this.currentPosition = position.Copy();
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Conditional, position.Copy(), this.GetContent());
        this.thenBlockImportantSize = this.thenNode.GetSize(Flowgorithm.SizeCountType.OnlyRight, Flowgorithm.SubnodeCountType.CountAll);
        this.elseBlockImportantSize = this.elseNode.GetSize(Flowgorithm.SizeCountType.OnlyLeft, Flowgorithm.SubnodeCountType.CountAll);
        this.mergePoint = Utils.CreateElement("div", "ShapeArrowConnector", ShapeRenderer.currentPlane);
        Utils.SetProperty(this.mergePoint, "--connector-size-multiplier", Flowgorithm.mergePointSizeMultiplier.toString());
        let thenBranchEndPos = this.RenderBranch(true);
        let elseBranchEndPos = this.RenderBranch(false);
        this.RenderMergePoint();
        this.RenderMergeArrow(thenBranchEndPos, true);
        this.RenderMergeArrow(elseBranchEndPos, false);
    }
    Delete() {
        super.Delete();
        let arrowsMarkedForDeletion = [
            this.thenBranchArrow, this.elseBranchArrow, this.thenMergeArrow, this.elseMergeArrow
        ];
        for (let currentArrowPath of arrowsMarkedForDeletion) {
            if (currentArrowPath !== null)
                currentArrowPath.Delete();
        }
        let divsMarkedForDeletion = [this.thenLabel, this.elseLabel, this.mergePoint];
        for (let currentDiv of divsMarkedForDeletion) {
            if (currentDiv != null)
                currentDiv.remove();
        }
    }
    RenderMergePoint() {
        if (this.mergePoint === null)
            return;
        let mergePointColorInfo = ShapeRenderer.GetColorInfo(this.GetType());
        if (this.conditional.IsEmpty())
            mergePointColorInfo = ShapeRenderer.incompleteShapeColors;
        let mergePointColor = mergePointColorInfo.mergePointColor;
        Utils.SetProperty(this.mergePoint, "background-color", mergePointColor);
        let mergePointPosition = this.currentPosition;
        let greaterBlockHeight = Math.max(this.thenBlockImportantSize.y, this.elseBlockImportantSize.y);
        let conditionalHeadSize = this.linkedShape.GetSize();
        mergePointPosition.y += greaterBlockHeight + conditionalHeadSize.y + Flowgorithm.defaultArrowLength;
        ShapeRenderer.SetShapePosition(this.mergePoint, mergePointPosition);
    }
    RenderBranchArrow(isThen) {
        let headSize = this.linkedShape.GetSize();
        let diamondCenter = this.currentPosition.Plus(0, headSize.y / 2);
        let arrowYOffset = 0;
        if (this.linkedShape.shadowShape !== null)
            arrowYOffset = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;
        let arrowPosition = diamondCenter.Plus(0, arrowYOffset);
        let branchArrow = this.CreateBranchArrow(isThen, arrowPosition, new Utils.Vec2(0, arrowYOffset));
        let labelText = isThen ? "True" : "False";
        let labelOffset = new Utils.Vec2(headSize.x / 2, 0);
        if (!isThen)
            labelOffset.x *= -1;
        let labelPosition = diamondCenter.Plus(labelOffset.x, labelOffset.y);
        let labelHorizontalAlignment = isThen ? ShapeRenderer.HAlign.Right : ShapeRenderer.HAlign.Left;
        let branchLabelInfo = new ShapeRenderer.LabelRenderInfo(labelPosition, labelText, labelHorizontalAlignment);
        let currentLabel = branchLabelInfo.CreateLabel();
        if (isThen)
            this.thenLabel = currentLabel;
        else
            this.elseLabel = currentLabel;
        if (isThen)
            this.thenBranchArrow = branchArrow;
        else
            this.elseBranchArrow = branchArrow;
        return branchArrow;
    }
    CreateBranchArrow(isThen, arrowPosition, arrowOffset) {
        let currentNode = isThen ? this.thenNode : this.elseNode;
        let bodySize = this.linkedShape.GetSize();
        let currentBlockImportantSize = isThen ? this.thenBlockImportantSize : this.elseBlockImportantSize;
        let greaterBlockHeight = Math.max(this.thenBlockImportantSize.y, this.elseBlockImportantSize.y);
        let emptyBlockArrowExtension = greaterBlockHeight - currentBlockImportantSize.y;
        let mergePointSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * Flowgorithm.mergePointSizeMultiplier;
        let arrowRotation = isThen ? Flowgorithm.rightPointingRotation : Flowgorithm.leftPointingRotation;
        let horizontalArrowLength = Math.max(Flowgorithm.defaultArrowLength, currentBlockImportantSize.x);
        horizontalArrowLength += bodySize.x / 2;
        let downwardArrowLength = this.linkedShape.GetSize().y / 2 + Flowgorithm.defaultArrowLength - arrowOffset.y;
        let isBlockEmpty = currentNode.subNodes.length === 0;
        if (isBlockEmpty)
            downwardArrowLength += emptyBlockArrowExtension;
        let arrowLengthsArray = [horizontalArrowLength, downwardArrowLength];
        let arrowAnglesArray = [arrowRotation, Flowgorithm.defaultArrowAngle];
        if (isBlockEmpty) {
            let mergeArrowAngle = isThen ? Flowgorithm.leftPointingRotation : Flowgorithm.rightPointingRotation;
            let mergeArrowLength = horizontalArrowLength - mergePointSize / 2;
            arrowLengthsArray.push(mergeArrowLength);
            arrowAnglesArray.push(mergeArrowAngle);
        }
        let branchArrow = new ArrowPath(arrowPosition, arrowLengthsArray, arrowAnglesArray);
        return branchArrow;
    }
    RenderBranch(isThen) {
        let branchArrow = this.RenderBranchArrow(isThen);
        let branchNode = isThen ? this.thenNode : this.elseNode;
        let arrowEndPos = branchArrow.GetArrowEndPos();
        return branchNode.RenderSubnodes(arrowEndPos, false);
    }
    RenderMergeArrow(arrowPosition, isThen) {
        let currentBranchingArrow = isThen ? this.thenBranchArrow : this.elseBranchArrow;
        let currentBlock = isThen ? this.thenNode : this.elseNode;
        let subNodeCount = currentBlock.subNodes.length;
        let containsSubnodes = subNodeCount > 0;
        if (currentBranchingArrow === null || this.mergePoint === null || !containsSubnodes)
            return;
        let greaterBlockHeight = Math.max(this.thenBlockImportantSize.y, this.elseBlockImportantSize.y);
        let currentBlockSize = isThen ? this.thenBlockImportantSize : this.elseBlockImportantSize;
        let mergePointSize = Utils.GetPropertyPX(document.documentElement, "--default-connector-size") * Flowgorithm.mergePointSizeMultiplier;
        let mergingArrowDownwardLength = greaterBlockHeight - currentBlockSize.y + Flowgorithm.defaultArrowLength;
        let mergePointXOffset = currentBranchingArrow.GetSegmentLengths()[0];
        let mergingHorizontalArrowAngle = isThen ? Flowgorithm.leftPointingRotation : Flowgorithm.rightPointingRotation;
        let mergingHorizontalLength = mergePointXOffset - mergePointSize / 2;
        let mergingArrow = new ArrowPath(arrowPosition, [mergingArrowDownwardLength, mergingHorizontalLength], [Flowgorithm.defaultArrowAngle, mergingHorizontalArrowAngle]);
        if (isThen)
            this.thenMergeArrow = mergingArrow;
        else
            this.elseMergeArrow = mergingArrow;
    }
}
