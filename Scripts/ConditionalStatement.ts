import { Expression } from "./Expression.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Utils from "./Utils.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import { ArrowPath } from "./ArrowRendering.js"

type ArrowPathOpt = ArrowPath | null;

const leftPointingRotation: number = 0; const rightPointingRotation: number = 180;
const mergePointSizeMultiplier: number = 1.65;

export class ConditionalStatement extends Flowgorithm.ProgramNode {
    public conditional: Expression = new Expression();
    public thenNode: Flowgorithm.ProgramNode = new Flowgorithm.ProgramNode();
    public elseNode: Flowgorithm.ProgramNode = new Flowgorithm.ProgramNode();

    private thenBranchArrow: ArrowPathOpt = null; private elseBranchArrow: ArrowPathOpt = null;
    private thenMergeArrow: ArrowPathOpt = null; private elseMergeArrow: ArrowPathOpt = null;
    private thenBlockSize: Utils.Vec2 = Utils.Vec2.Zero(); private elseBlockSize: Utils.Vec2 = Utils.Vec2.Zero();
    private mergePoint: HTMLDivElement | null = null;

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

        let thenBlockSize: Utils.Vec2 = this.thenNode.GetEntireNodeSize(true),
            elseBlockSize: Utils.Vec2 = this.elseNode.GetEntireNodeSize(true);
        let statementWidth: number = thenBlockSize.x + elseBlockSize.x;
        let greaterBlockHeight: number = Math.max(thenBlockSize.y, elseBlockSize.y);
        statementSize = statementSize.Plus(statementWidth, greaterBlockHeight);
        statementSize.y += Flowgorithm.defaultArrowLength;

        return statementSize;
    }

    public override Render(position: Utils.Vec2) {
        this.currentPosition = position.Copy();
        this.linkedShape = ShapeRenderer.AddShape(ShapeRenderer.ShapeType.Conditional, position.Copy(), this.GetContent());

        this.thenBlockSize = this.thenNode.GetEntireNodeSize();
        this.elseBlockSize = this.elseNode.GetEntireNodeSize();

        let thenBranchEndPos: Utils.Vec2 = this.RenderBranch(true);
        let elseBranchEndPos: Utils.Vec2 = this.RenderBranch(false);
        this.mergePoint = Utils.CreateElement("div", "ShapeArrowConnector", ShapeRenderer.currentPlane) as HTMLDivElement;
        this.RenderMergeArrow(thenBranchEndPos, true);
        this.RenderMergeArrow(elseBranchEndPos, false);
    }

    public override Delete() {
        super.Delete();
        let arrowsMarkedForDeletion: ArrowPathOpt[] = [
            this.thenBranchArrow, this.elseBranchArrow, this.thenMergeArrow, this.elseMergeArrow
        ];

        for (let currentArrowPath of arrowsMarkedForDeletion) {
            if (currentArrowPath !== null) currentArrowPath.Delete();
        }
        if (this.mergePoint !== null) this.mergePoint.remove();
    }

    private RenderBranchArrow(isThen: boolean): ArrowPath {
        let blockSize: Utils.Vec2 = isThen ? this.thenBlockSize : this.elseBlockSize;
        let bodySize: Utils.Vec2 = this.linkedShape.GetSize();
        let diamondCenter: Utils.Vec2 = this.currentPosition.Plus(0, bodySize.y / 2);
        let arrowOffset: Utils.Vec2 = Utils.Vec2.Zero();
        arrowOffset.x = bodySize.x / 2 - bodySize.x / 2;
        if (!isThen) arrowOffset.x = -arrowOffset.x;
        if (this.linkedShape.shadowShape !== null)
            arrowOffset.y = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;
        let arrowPosition: Utils.Vec2 = diamondCenter.Plus(arrowOffset.x, arrowOffset.y);

        let arrowRotation: number = isThen ? leftPointingRotation : rightPointingRotation;
        let horizontalArrowLength: number = Math.max(Flowgorithm.defaultArrowLength, blockSize.x / 2);
        horizontalArrowLength += bodySize.x;
        let downwardArrowLength: number = this.linkedShape.GetSize().y / 2 + Flowgorithm.defaultArrowLength - arrowOffset.y;
        let branchArrow: ArrowPath = new ArrowPath(
            arrowPosition, [horizontalArrowLength, downwardArrowLength], [arrowRotation, Flowgorithm.defaultArrowAngle]
        );

        if (isThen) this.thenBranchArrow = branchArrow;
        else this.elseBranchArrow = branchArrow;
        return branchArrow;
    }

    private RenderBranch(isThen: boolean): Utils.Vec2 {
        let branchArrow: ArrowPath = this.RenderBranchArrow(isThen);
        let branchNode: Flowgorithm.ProgramNode = isThen ? this.thenNode : this.elseNode;
        let arrowEndPos: Utils.Vec2 = branchArrow.GetArrowEndPos();
        return branchNode.RenderSubnodes(arrowEndPos, false);
    }

    private RenderMergeArrow(arrowPosition: Utils.Vec2, isThen: boolean) {
        let currentBranchingArrow: ArrowPathOpt = isThen ? this.thenBranchArrow : this.elseBranchArrow;
        if (currentBranchingArrow === null || this.mergePoint === null) return;

        let greaterBlockHeight: number = Math.max(this.thenBlockSize.y, this.elseBlockSize.y);
        let currentBlockSize: Utils.Vec2 = isThen ? this.thenBlockSize : this.elseBlockSize;
        let mergePointSize: number = Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size"));
        if (isThen) mergePointSize *= mergePointSizeMultiplier;
        Utils.SetProperty(this.mergePoint, "--connector-size", mergePointSize.toString() + "px");
        let mergePointColor: string = ShapeRenderer.GetColorInfo(ShapeRenderer.ShapeType.Conditional).mergePointColor;
        Utils.SetProperty(this.mergePoint, "background-color", mergePointColor);

        let mergingArrowDownwardLength: number = greaterBlockHeight - currentBlockSize.y + Flowgorithm.defaultArrowLength;
        let mergePointXOffset: number = currentBranchingArrow.GetSegmentLengths()[0];
        let mergingHorizontalArrowAngle: number = isThen ? 180 : 0;
        let mergePointPos: Utils.Vec2 = arrowPosition.Plus(mergePointXOffset, mergingArrowDownwardLength);
        let mergingHorizontalLength: number = mergePointXOffset - mergePointSize / 2;
        ShapeRenderer.SetShapePosition(this.mergePoint, mergePointPos);

        let mergingArrow: ArrowPath = new ArrowPath(
            arrowPosition, [mergingArrowDownwardLength, mergingHorizontalLength], [Flowgorithm.defaultArrowAngle, mergingHorizontalArrowAngle]
        );
        if (isThen) this.thenMergeArrow = mergingArrow;
        else this.elseMergeArrow = mergingArrow;
    }
}