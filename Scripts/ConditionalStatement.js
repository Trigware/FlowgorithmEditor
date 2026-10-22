import { Expression } from "./Expression.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Utils from "./Utils.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import { ArrowPath } from "./ArrowRendering.js";
const leftPointingRotation = 0;
const rightPointingRotation = 180;
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
        let thenBranchEndPos = this.RenderBranch(true);
        let elseBranchEndPos = this.RenderBranch(false);
        this.mergePoint = Utils.CreateElement("div", "ShapeArrowConnector", ShapeRenderer.currentPlane);
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
    RenderBranchArrow(isThen) {
        let blockSize = isThen ? this.thenBlockSize : this.elseBlockSize;
        let bodySize = this.linkedShape.GetSize();
        let diamondCenter = this.currentPosition.Plus(0, bodySize.y / 2);
        let arrowOffset = Utils.Vec2.Zero();
        arrowOffset.x = bodySize.x / 2 - bodySize.x / 2;
        if (!isThen)
            arrowOffset.x = -arrowOffset.x;
        if (this.linkedShape.shadowShape !== null)
            arrowOffset.y = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;
        let arrowPosition = diamondCenter.Plus(arrowOffset.x, arrowOffset.y);
        let arrowRotation = isThen ? leftPointingRotation : rightPointingRotation;
        let horizontalArrowLength = Math.max(Flowgorithm.defaultArrowLength, blockSize.x / 2);
        horizontalArrowLength += bodySize.x;
        let downwardArrowLength = this.linkedShape.GetSize().y / 2 + Flowgorithm.defaultArrowLength - arrowOffset.y;
        let branchArrow = new ArrowPath(arrowPosition, [horizontalArrowLength, downwardArrowLength], [arrowRotation, Flowgorithm.defaultArrowAngle]);
        if (isThen)
            this.thenBranchArrow = branchArrow;
        else
            this.elseBranchArrow = branchArrow;
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
        if (currentBranchingArrow === null || this.mergePoint === null)
            return;
        let greaterBlockHeight = Math.max(this.thenBlockSize.y, this.elseBlockSize.y);
        let currentBlockSize = isThen ? this.thenBlockSize : this.elseBlockSize;
        let mergePointSize = Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size"));
        if (isThen)
            mergePointSize *= mergePointSizeMultiplier;
        Utils.SetProperty(this.mergePoint, "--connector-size", mergePointSize.toString() + "px");
        let mergePointColor = ShapeRenderer.GetColorInfo(ShapeRenderer.ShapeType.Conditional).mergePointColor;
        Utils.SetProperty(this.mergePoint, "background-color", mergePointColor);
        let mergingArrowDownwardLength = greaterBlockHeight - currentBlockSize.y + Flowgorithm.defaultArrowLength;
        let mergePointXOffset = currentBranchingArrow.GetSegmentLengths()[0];
        let mergingHorizontalArrowAngle = isThen ? 180 : 0;
        let mergePointPos = arrowPosition.Plus(mergePointXOffset, mergingArrowDownwardLength);
        let mergingHorizontalLength = mergePointXOffset - mergePointSize / 2;
        ShapeRenderer.SetShapePosition(this.mergePoint, mergePointPos);
        let mergingArrow = new ArrowPath(arrowPosition, [mergingArrowDownwardLength, mergingHorizontalLength], [Flowgorithm.defaultArrowAngle, mergingHorizontalArrowAngle]);
        if (isThen)
            this.thenMergeArrow = mergingArrow;
        else
            this.elseMergeArrow = mergingArrow;
    }
}
