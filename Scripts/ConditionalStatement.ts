import { Expression } from "./Expression.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Utils from "./Utils.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import { ArrowPath } from "./ArrowRendering.js"

type ArrowPathOpt = ArrowPath | null;
type OptionalDiv = HTMLDivElement | null;

const leftPointingRotation: number = 180; const rightPointingRotation: number = 0;
const mergePointSizeMultiplier: number = 1.65;

export class ConditionalStatement extends Flowgorithm.ProgramNode {
    public conditional: Expression = new Expression();
    public thenNode: Flowgorithm.ProgramNode = new Flowgorithm.ProgramNode();
    public elseNode: Flowgorithm.ProgramNode = new Flowgorithm.ProgramNode();

    private thenBranchArrow: ArrowPathOpt = null; private elseBranchArrow: ArrowPathOpt = null;
    private thenMergeArrow: ArrowPathOpt = null; private elseMergeArrow: ArrowPathOpt = null;
    private thenBlockSize: Utils.Vec2 = Utils.Vec2.Zero(); private elseBlockSize: Utils.Vec2 = Utils.Vec2.Zero();

    private thenLabel: OptionalDiv = null; private elseLabel: OptionalDiv = null;
    private mergePoint: OptionalDiv = null;

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

        this.mergePoint = Utils.CreateElement("div", "ShapeArrowConnector", ShapeRenderer.currentPlane) as HTMLDivElement;
        let mergePointSize: number = Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size")) * mergePointSizeMultiplier;
        Utils.SetProperty(this.mergePoint, "--connector-size", mergePointSize.toString() + "px");

        let thenBranchEndPos: Utils.Vec2 = this.RenderBranch(true);
        let elseBranchEndPos: Utils.Vec2 = this.RenderBranch(false);
        this.RenderMergePoint();
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

        let divsMarkedForDeletion: OptionalDiv[] = [this.thenLabel, this.elseLabel, this.mergePoint]
        for (let currentDiv of divsMarkedForDeletion) {
            if (currentDiv != null) currentDiv.remove();
        }
    }

    private RenderMergePoint() {
        if (this.mergePoint === null) return;
        let mergePointColor: string = ShapeRenderer.GetColorInfo(ShapeRenderer.ShapeType.Conditional).mergePointColor;
        Utils.SetProperty(this.mergePoint, "background-color", mergePointColor);

        let mergePointPosition: Utils.Vec2 = this.currentPosition;
        let greaterBlockHeight: number = Math.max(this.thenBlockSize.y, this.elseBlockSize.y);
        let conditionalBodySize: Utils.Vec2 = this.linkedShape.GetSize(); 
        mergePointPosition.y += greaterBlockHeight + conditionalBodySize.y + Flowgorithm.defaultArrowLength;
        ShapeRenderer.SetShapePosition(this.mergePoint, mergePointPosition);
    }

    private RenderBranchArrow(isThen: boolean): ArrowPath {
        let bodySize: Utils.Vec2 = this.linkedShape.GetSize();
        let diamondCenter: Utils.Vec2 = this.currentPosition.Plus(0, bodySize.y / 2);
        let arrowYOffset: number = 0;

        if (this.linkedShape.shadowShape !== null)
            arrowYOffset = Utils.GetNumericPixels(Utils.GetProperty(this.linkedShape.shadowShape, "--shadow-offset-y")) / 2;        
        let arrowPosition: Utils.Vec2 = diamondCenter.Plus(0, arrowYOffset);
        let branchArrow: ArrowPath = this.CreateBranchArrow(isThen, arrowPosition, new Utils.Vec2(0, arrowYOffset));
        
        let labelText: string = isThen ? "True" : "False";
        let labelOffset: Utils.Vec2 = new Utils.Vec2(bodySize.x / 2, 0);
        if (!isThen) labelOffset.x *= -1;
        let labelPosition: Utils.Vec2 = diamondCenter.Plus(labelOffset.x, labelOffset.y);

        let labelContent: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent(labelText, ShapeRenderer.TextType.Bolded);
        let labelAlign: ShapeRenderer.LabelAlign = isThen ? ShapeRenderer.LabelAlign.Right : ShapeRenderer.LabelAlign.Left;
        let currentLabel: HTMLDivElement = ShapeRenderer.ConstructLabel(labelPosition, labelContent, labelAlign);
        if (isThen) this.thenLabel = currentLabel;
        else this.elseLabel = currentLabel;

        if (isThen) this.thenBranchArrow = branchArrow;
        else this.elseBranchArrow = branchArrow;
        return branchArrow;
    }

    private CreateBranchArrow(isThen: boolean, arrowPosition: Utils.Vec2, arrowOffset: Utils.Vec2): ArrowPath {
        let currentNode: Flowgorithm.ProgramNode = isThen ? this.thenNode : this.elseNode;
        let bodySize: Utils.Vec2 = this.linkedShape.GetSize();
        let currentBlockSize: Utils.Vec2 = isThen ? this.thenBlockSize : this.elseBlockSize;
        let greaterBlockHeight: number = Math.max(this.thenBlockSize.y, this.elseBlockSize.y);
        let emptyBlockArrowExtension: number = greaterBlockHeight - currentBlockSize.y;
        let mergePointSize: number = this.mergePoint === null ? 0 : Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size"));

        let arrowRotation: number = isThen ? rightPointingRotation : leftPointingRotation;
        let horizontalArrowLength: number = Math.max(Flowgorithm.defaultArrowLength, currentBlockSize.x / 2);
        horizontalArrowLength += bodySize.x / 2;
        let downwardArrowLength: number = this.linkedShape.GetSize().y / 2 + Flowgorithm.defaultArrowLength - arrowOffset.y;

        let isBlockEmpty: boolean = currentNode.subNodes.length === 0;
        if (isBlockEmpty) downwardArrowLength += emptyBlockArrowExtension;

        let arrowLengthsArray: number[] = [horizontalArrowLength, downwardArrowLength];
        let arrowAnglesArray: number[] = [arrowRotation, Flowgorithm.defaultArrowAngle];
        if (isBlockEmpty) {
            let mergeArrowAngle: number = isThen ? leftPointingRotation : rightPointingRotation;
            let mergeArrowLength: number = horizontalArrowLength - mergePointSize / 2;
            arrowLengthsArray.push(mergeArrowLength); arrowAnglesArray.push(mergeArrowAngle);
        }

        let branchArrow: ArrowPath = new ArrowPath(arrowPosition, arrowLengthsArray, arrowAnglesArray);
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
        let currentBlock: Flowgorithm.ProgramNode = isThen ? this.thenNode : this.elseNode;
        let subNodeCount: number = currentBlock.subNodes.length;
        let containsSubnodes: boolean = subNodeCount > 0;
        if (currentBranchingArrow === null || this.mergePoint === null || !containsSubnodes) return;

        let greaterBlockHeight: number = Math.max(this.thenBlockSize.y, this.elseBlockSize.y);
        let currentBlockSize: Utils.Vec2 = isThen ? this.thenBlockSize : this.elseBlockSize;
        let mergePointSize: number = Utils.GetNumericPixels(Utils.GetProperty(this.mergePoint, "--connector-size"));

        let mergingArrowDownwardLength: number = greaterBlockHeight - currentBlockSize.y + Flowgorithm.defaultArrowLength;
        let mergePointXOffset: number = currentBranchingArrow.GetSegmentLengths()[0];
        let mergingHorizontalArrowAngle: number = isThen ? leftPointingRotation : rightPointingRotation;
        let mergingHorizontalLength: number = mergePointXOffset - mergePointSize / 2;

        let mergingArrow: ArrowPath = new ArrowPath(
            arrowPosition, [mergingArrowDownwardLength, mergingHorizontalLength], [Flowgorithm.defaultArrowAngle, mergingHorizontalArrowAngle]
        );
        if (isThen) this.thenMergeArrow = mergingArrow;
        else this.elseMergeArrow = mergingArrow;
    }
}