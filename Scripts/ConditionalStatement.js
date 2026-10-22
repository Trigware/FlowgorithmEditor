import { Expression } from "./Expression.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Utils from "./Utils.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import { ArrowPath } from "./ArrowRendering.js";
const leftPointingRotation = 180;
const rightPointingRotation = 0;
const mergePointSizeMultiplier = 1.65;
export class ConditionalStatement extends Flowgorithm.ProgramNode {
    conditional = new Expression();
    thenNode = new Flowgorithm.ProgramNode();
    elseNode = new Flowgorithm.ProgramNode();
    thenBranchArrow = null;
    elseBranchArrow = null;
    thenMergeArrow = null;
    elseMergeArrow = null;
    thenBlockSize = Utils.Vec2.Zero();
    elseBlockSize = Utils.Vec2.Zero();
    mergePoint = null;
    currentPosition = Utils.Vec2.Zero();
    MoveSubnodes(moveToThen) {
        let selectedNode = moveToThen ? this.thenNode : this.elseNode;
        selectedNode.subNodes = this.subNodes.slice();
        this.subNodes = [];
    }
    GetContent() {
        let resultContent = new ShapeRenderer.ShapeContent("if ");
        resultContent.Append(this.conditional.expressionAsStr, ShapeRenderer.TextType.Bolded);
        return resultContent;
    }
    CalculateSize() {
        let statementSize = super.CalculateSize();
        let thenBlockSize = this.thenNode.GetEntireNodeSize(true), elseBlockSize = this.elseNode.GetEntireNodeSize(true);
        let statementWidth = thenBlockSize.x + elseBlockSize.x;
        let greaterBlockHeight = Math.max(thenBlockSize.y, elseBlockSize.y);
        statementSize = statementSize.Plus(statementWidth, greaterBlockHeight);
        statementSize.y += Flowgorithm.defaultArrowLength;
        return statementSize;
    }
    Render(position) {
        this.currentPosition = position.Copy();
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Conditional, position.Copy(), this.GetContent());
        this.thenBlockSize = this.thenNode.GetEntireNodeSize();
        this.elseBlockSize = this.elseNode.GetEntireNodeSize();
        this.mergePoint = Utils.CreateElement("div", "ShapeArrowConnector", ShapeRenderer.currentPlane);
        let mergePointSize = Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size")) * mergePointSizeMultiplier;
        Utils.SetProperty(this.mergePoint, "--connector-size", mergePointSize.toString() + "px");
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
        if (this.mergePoint !== null)
            this.mergePoint.remove();
    }
    RenderMergePoint() {
        if (this.mergePoint === null)
            return;
        let mergePointColor = ShapeRenderer.GetColorInfo(ShapeRenderer.ShapeType.Conditional).mergePointColor;
        Utils.SetProperty(this.mergePoint, "background-color", mergePointColor);
        let mergePointPosition = this.currentPosition;
        let greaterBlockHeight = Math.max(this.thenBlockSize.y, this.elseBlockSize.y);
        let conditionalBodySize = this.linkedShape.GetSize();
        mergePointPosition.y += greaterBlockHeight + conditionalBodySize.y + Flowgorithm.defaultArrowLength;
        ShapeRenderer.SetShapePosition(this.mergePoint, mergePointPosition);
    }
    RenderBranchArrow(isThen) {
        let bodySize = this.linkedShape.GetSize();
        let diamondCenter = this.currentPosition.Plus(0, bodySize.y / 2);
        let arrowOffset = Utils.Vec2.Zero();
        arrowOffset.x = bodySize.x / 2 - bodySize.x / 2;
        if (!isThen)
            arrowOffset.x = -arrowOffset.x;
        if (this.linkedShape.shadowShape !== null)
            arrowOffset.y = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;
        let arrowPosition = diamondCenter.Plus(arrowOffset.x, arrowOffset.y);
        let branchArrow = this.CreateBranchArrow(isThen, arrowPosition, arrowOffset);
        if (isThen)
            this.thenBranchArrow = branchArrow;
        else
            this.elseBranchArrow = branchArrow;
        return branchArrow;
    }
    CreateBranchArrow(isThen, arrowPosition, arrowOffset) {
        let currentNode = isThen ? this.thenNode : this.elseNode;
        let bodySize = this.linkedShape.GetSize();
        let currentBlockSize = isThen ? this.thenBlockSize : this.elseBlockSize;
        let greaterBlockHeight = Math.max(this.thenBlockSize.y, this.elseBlockSize.y);
        let emptyBlockArrowExtension = greaterBlockHeight - currentBlockSize.y;
        let mergePointSize = this.mergePoint === null ? 0 : Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size"));
        let arrowRotation = isThen ? rightPointingRotation : leftPointingRotation;
        let horizontalArrowLength = Math.max(Flowgorithm.defaultArrowLength, currentBlockSize.x / 2);
        horizontalArrowLength += bodySize.x;
        let downwardArrowLength = this.linkedShape.GetSize().y / 2 + Flowgorithm.defaultArrowLength - arrowOffset.y;
        let isBlockEmpty = currentNode.subNodes.length === 0;
        if (isBlockEmpty)
            downwardArrowLength += emptyBlockArrowExtension;
        let arrowLengthsArray = [horizontalArrowLength, downwardArrowLength];
        let arrowAnglesArray = [arrowRotation, Flowgorithm.defaultArrowAngle];
        if (isBlockEmpty) {
            let mergeArrowAngle = isThen ? leftPointingRotation : rightPointingRotation;
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
        let greaterBlockHeight = Math.max(this.thenBlockSize.y, this.elseBlockSize.y);
        let currentBlockSize = isThen ? this.thenBlockSize : this.elseBlockSize;
        let mergePointSize = Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size"));
        let mergingArrowDownwardLength = greaterBlockHeight - currentBlockSize.y + Flowgorithm.defaultArrowLength;
        let mergePointXOffset = currentBranchingArrow.GetSegmentLengths()[0];
        let mergingHorizontalArrowAngle = isThen ? leftPointingRotation : rightPointingRotation;
        let mergingHorizontalLength = mergePointXOffset - mergePointSize / 2;
        let mergingArrow = new ArrowPath(arrowPosition, [mergingArrowDownwardLength, mergingHorizontalLength], [Flowgorithm.defaultArrowAngle, mergingHorizontalArrowAngle]);
        if (isThen)
            this.thenMergeArrow = mergingArrow;
        else
            this.elseMergeArrow = mergingArrow;
    }
}
