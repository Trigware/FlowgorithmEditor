import { Expression } from "./Expression.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Utils from "./Utils.js"

const octagonShadowYOffset: number = 5, breakpointVericalPadding: number = 30, labelXOffset: number = 0.3;
type OptionalDiv = HTMLDivElement | null;
const conditionalBreakpointSegmentPortion: number = 0.5;

export class Breakpoint extends Flowgorithm.ProgramNode {
    public isConditional: boolean = false;
    public conditionalExpression: Expression = new Expression();
    private expressionLabel: OptionalDiv = null;

    public override BeforeArrowHasEnding(): boolean { return false; }
    public override GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.Breakpoint; }

    public override GetContent(): ShapeRenderer.ShapeContent {
        let shapeContent: ShapeRenderer.ShapeContent = Flowgorithm.GetEmptyContent();
        shapeContent.isIncomplete = this.conditionalExpression.IsEmpty() && this.isConditional;
        return shapeContent;
    }

    public override Render(position: Utils.Vec2) {
        let renderPosition: Utils.Vec2 = position.Plus(0, breakpointVericalPadding / 2);
        let shapeSize: Utils.Vec2 = this.GetOctagonShapeSize();
        let labelPosition: Utils.Vec2 = renderPosition.Plus(shapeSize.x / 2, shapeSize.y / 2);
        labelPosition.x += shapeSize.x * labelXOffset;

        let labelContents: string = this.GetLabelContents();
        this.expressionLabel = ShapeRenderer.ConstructLabel(
            labelPosition, labelContents,
            ShapeRenderer.LabelAlign.Right | ShapeRenderer.LabelAlign.Down, new Utils.Vec2(1, -0.5)
        );

        this.AddShape(renderPosition);
        let conditionalSegmentPortion: string = (conditionalBreakpointSegmentPortion * 100).toString() + "%";
        if (this.isConditional) this.linkedShape.SetProperty("--segment-portion", conditionalSegmentPortion);
    }

    private GetLabelContents(): string {
        let labelContents: string = this.isConditional ? "Condition" : "Breakpoint";
        let useExpressionAsContent: boolean = !this.conditionalExpression.IsEmpty() && this.isConditional;
        if (useExpressionAsContent) labelContents = this.conditionalExpression.expressionAsStr;

        return labelContents;
    }
    
    public override CalculateSizeCache(): Flowgorithm.CachedSize {
        let resultCache: Flowgorithm.CachedSize = new Flowgorithm.CachedSize();
        let octagonShapeSize: Utils.Vec2 = this.GetOctagonShapeSize();
        resultCache.leftPortion.y = resultCache.rightPortion.y = octagonShapeSize.y;

        let labelContents: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent(
            this.GetLabelContents(), ShapeRenderer.TextType.Bolded
        );
        let contentsSize: Utils.Vec2 = ShapeRenderer.MeasureTextSize(labelContents), shapeSize: Utils.Vec2 = this.GetOctagonShapeSize();
        let contentsXOffset: number = shapeSize.x * labelXOffset;
        resultCache.leftPortion.x = resultCache.rightPortion.x = shapeSize.x / 2;
        resultCache.rightPortion.x += contentsSize.x + contentsXOffset;

        return resultCache;
    }

    private GetOctagonShapeSize(): Utils.Vec2 {
        let defaultShapeWidth: number = Utils.GetPropertyPX(document.documentElement, "--default-shape-width"),
            shapeAspectRatio: number = Number(Utils.GetProperty(document.documentElement, "--shape-aspect-ratio")),
            shapeMainSize: number = defaultShapeWidth / shapeAspectRatio,
            shapeTotalHeight: number = shapeMainSize + octagonShadowYOffset + breakpointVericalPadding;

        return new Utils.Vec2(shapeMainSize, shapeTotalHeight);
    }
}

export class InlineComment extends Flowgorithm.ProgramNode {
    public commentContent: string = "";
}