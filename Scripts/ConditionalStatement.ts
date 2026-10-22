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
        let statementSize: Utils.Vec2 = super.CalculateSize();
        let thenBlockSize: Utils.Vec2 = this.thenNode.GetEntireNodeSize(), elseBlockSize: Utils.Vec2 = this.elseNode.GetEntireNodeSize();
        let greaterBlockHeight: number = Math.max(thenBlockSize.y, elseBlockSize.y);
        statementSize.y += greaterBlockHeight;
        console.log(statementSize);

        return statementSize;
    }

    public override Render(position: Utils.Vec2) {
        this.currentPosition = position.Copy();
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Conditional, this.currentPosition, this.GetContent());
        this.RenderBranch(true); this.RenderBranch(false);
    }

    public override Delete() {
        super.Delete();
        let divsMarkedForDeletion: ArrowPathOpt[] = [
            this.thenBranchArrow, this.elseBranchArrow, this.thenMergeArrow, this.elseMergeArrow
        ];

        for (let currentArrowPath of divsMarkedForDeletion) {
            if (currentArrowPath !== null) currentArrowPath.Delete();
        }
    }

    private RenderBranchArrow(isThen: boolean): ArrowPath {
        let currentNode: Flowgorithm.ProgramNode = isThen ? this.thenNode : this.elseNode;
        let blockSize: Utils.Vec2 = currentNode.GetEntireNodeSize();

        let bodySize: Utils.Vec2 = this.linkedShape.GetSize();
        let diamondCenter: Utils.Vec2 = this.currentPosition.Plus(0, bodySize.y / 2);
        let arrowOffset: Utils.Vec2 = Utils.Vec2.Zero();
        arrowOffset.x = bodySize.x / 2 - conditionalArrowXOffset;
        if (!isThen) arrowOffset.x = -arrowOffset.x;
        if (this.linkedShape.shadowShape !== null)
            arrowOffset.y = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;
        let arrowPosition: Utils.Vec2 = diamondCenter.Plus(arrowOffset.x, arrowOffset.y);

        let arrowRotation: number = isThen ? leftPointingRotation : rightPointingRotation;
        let horizontalArrowLength: number = Math.max(Flowgorithm.defaultArrowLength, blockSize.x / 2);
        horizontalArrowLength += conditionalArrowXOffset;
        let downwardArrowLength: number = this.linkedShape.GetSize().y / 2 + Flowgorithm.defaultArrowLength - arrowOffset.y;
        let branchArrow: ArrowPath = new ArrowPath(
            arrowPosition, [horizontalArrowLength, downwardArrowLength], [arrowRotation, Flowgorithm.defaultArrowAngle]
        );

        if (isThen) this.thenBranchArrow = branchArrow;
        else this.elseBranchArrow = branchArrow;
        return branchArrow;
    }

    private RenderBranch(isThen: boolean) {
        let branchArrow: ArrowPath = this.RenderBranchArrow(isThen);
        let branchNode: Flowgorithm.ProgramNode = isThen ? this.thenNode : this.elseNode;
        let arrowEndPos: Utils.Vec2 = branchArrow.GetArrowEndPos();
        branchNode.RenderSubnodes(arrowEndPos, false);
    }
}