import { Expression } from "./Expression.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Utils from "./Utils.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import { ArrowPath } from "./ArrowRendering.js";
const leftPointingRotation = 0;
const rightPointingRotation = 180;
const conditionalArrowXOffset = 10;
export class ConditionalStatement extends Flowgorithm.ProgramNode {
    conditional = new Expression();
    thenNode = new Flowgorithm.ProgramNode();
    elseNode = new Flowgorithm.ProgramNode();
    thenBranchArrow = null;
    elseBranchArrow = null;
    thenMergeArrow = null;
    elseMergeArrow = null;
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
        let thenBlockSize = this.thenNode.GetEntireNodeSize(), elseBlockSize = this.elseNode.GetEntireNodeSize();
        let greaterBlockHeight = Math.max(thenBlockSize.y, elseBlockSize.y);
        statementSize.y += greaterBlockHeight;
        return statementSize;
    }
    Render(position) {
        this.currentPosition = position.Copy();
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Conditional, position.Copy(), this.GetContent());
        this.RenderBranch(true);
        this.RenderBranch(false);
    }
    Delete() {
        super.Delete();
        let divsMarkedForDeletion = [
            this.thenBranchArrow, this.elseBranchArrow, this.thenMergeArrow, this.elseMergeArrow
        ];
        for (let currentArrowPath of divsMarkedForDeletion) {
            if (currentArrowPath !== null)
                currentArrowPath.Delete();
        }
    }
    RenderBranchArrow(isThen) {
        let currentNode = isThen ? this.thenNode : this.elseNode;
        let blockSize = currentNode.GetEntireNodeSize();
        let bodySize = this.linkedShape.GetSize();
        let diamondCenter = this.currentPosition.Plus(0, bodySize.y / 2);
        let arrowOffset = Utils.Vec2.Zero();
        arrowOffset.x = bodySize.x / 2 - conditionalArrowXOffset;
        if (!isThen)
            arrowOffset.x = -arrowOffset.x;
        if (this.linkedShape.shadowShape !== null)
            arrowOffset.y = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;
        let arrowPosition = diamondCenter.Plus(arrowOffset.x, arrowOffset.y);
        let arrowRotation = isThen ? leftPointingRotation : rightPointingRotation;
        let horizontalArrowLength = Math.max(Flowgorithm.defaultArrowLength, blockSize.x / 2);
        horizontalArrowLength += conditionalArrowXOffset;
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
        branchNode.RenderSubnodes(arrowEndPos, false);
    }
}
