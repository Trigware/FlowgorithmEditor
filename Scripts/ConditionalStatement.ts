import { Expression } from "./Expression.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Utils from "./Utils.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import { ArrowPath } from "./ArrowRendering.js"

type ArrowPathOpt = ArrowPath | null;

const leftPointingRotation: number = 0; const rightPointingRotation: number = 180;
const conditionalArrowXOffset: number = 10;

export class ConditionalStatement extends Flowgorithm.ProgramNode {
    public conditional: Expression = new Expression();
    public thenNode: Flowgorithm.ProgramNode = new Flowgorithm.ProgramNode();
    public elseNode: Flowgorithm.ProgramNode = new Flowgorithm.ProgramNode();

    private thenBranchArrow: ArrowPathOpt = null; private elseBranchArrow: ArrowPathOpt = null;
    private thenMergeArrow: ArrowPathOpt = null; private elseMergeArrow: ArrowPathOpt = null;

    private currentPosition: Utils.Vec2 = Utils.Vec2.Zero();

    public MoveSubnodes(moveToThen: boolean) {
        let selectedNode: Flowgorithm.ProgramNode = moveToThen ? this.thenNode : this.elseNode;
        selectedNode.subNodes = this.subNodes.slice();
        this.subNodes = [];
    }

    public override GetContent(): ShapeRenderer.ShapeContent {
        let resultContent: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent("if ");
        resultContent.Append(this.conditional.expressionAsStr, ShapeRenderer.TextType.Bolded);
        return resultContent;
    }

    public override CalculateSize(): Utils.Vec2 {
        let blockSize: Utils.Vec2 = super.CalculateSize();
        return blockSize;
    }

    public override Render(position: Utils.Vec2) {
        this.currentPosition = position.Copy();
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Conditional, this.currentPosition, this.GetContent());
        this.RenderBranchArrow(true); this.RenderBranchArrow(false);
    }

    public override Delete() {
        this.linkedShape.Delete();
        let divsMarkedForDeletion: ArrowPathOpt[] = [
            this.thenBranchArrow, this.elseBranchArrow, this.thenMergeArrow, this.elseMergeArrow
        ];

        for (let currentArrowPath of divsMarkedForDeletion) {
            if (currentArrowPath !== null) currentArrowPath.Delete();
        }
    }

    private RenderBranchArrow(isThen: boolean) {
        if (this.linkedShape.shadowShape === null) return;

        let bodySize: Utils.Vec2 = this.linkedShape.GetSize();
        let diamondCenter: Utils.Vec2 = this.currentPosition.Plus(0, bodySize.y / 2);
        let arrowOffset: Utils.Vec2 = Utils.Vec2.Zero();
        arrowOffset.x = bodySize.x / 2 - conditionalArrowXOffset;
        if (!isThen) arrowOffset.x = -arrowOffset.x;
        arrowOffset.y = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;
        let arrowPosition: Utils.Vec2 = diamondCenter.Plus(arrowOffset.x, arrowOffset.y);

        let arrowRotation: number = isThen ? leftPointingRotation : rightPointingRotation;
        let horizontalArrowLength: number = Flowgorithm.defaultArrowLength + conditionalArrowXOffset;
        let branchArrow: ArrowPath = new ArrowPath(arrowPosition, [horizontalArrowLength], [arrowRotation]);

        if (isThen) this.thenBranchArrow = branchArrow;
        else this.elseBranchArrow = branchArrow;
    }
}