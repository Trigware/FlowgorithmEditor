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
        let blockSize = super.CalculateSize();
        return blockSize;
    }
    Render(position) {
        this.currentPosition = position.Copy();
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Conditional, this.currentPosition, this.GetContent());
        this.RenderBranchArrow(true);
        this.RenderBranchArrow(false);
    }
    Delete() {
        this.linkedShape.Delete();
        let divsMarkedForDeletion = [
            this.thenBranchArrow, this.elseBranchArrow, this.thenMergeArrow, this.elseMergeArrow
        ];
        for (let currentArrowPath of divsMarkedForDeletion) {
            if (currentArrowPath !== null)
                currentArrowPath.Delete();
        }
    }
    RenderBranchArrow(isThen) {
        if (this.linkedShape.shadowShape === null)
            return;
        let bodySize = this.linkedShape.GetSize();
        let diamondCenter = this.currentPosition.Plus(0, bodySize.y / 2);
        let arrowOffset = Utils.Vec2.Zero();
        arrowOffset.x = bodySize.x / 2 - conditionalArrowXOffset;
        if (!isThen)
            arrowOffset.x = -arrowOffset.x;
        arrowOffset.y = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;
        let arrowPosition = diamondCenter.Plus(arrowOffset.x, arrowOffset.y);
        let arrowRotation = isThen ? leftPointingRotation : rightPointingRotation;
        let horizontalArrowLength = Flowgorithm.defaultArrowLength + conditionalArrowXOffset;
        let branchArrow = new ArrowPath(arrowPosition, [horizontalArrowLength], [arrowRotation]);
        if (isThen)
            this.thenBranchArrow = branchArrow;
        else
            this.elseBranchArrow = branchArrow;
    }
}
