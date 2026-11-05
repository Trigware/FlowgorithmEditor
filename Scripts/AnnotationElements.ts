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
        let shapeSize: Utils.Vec2 = this.GetOctagonShapeSize(false);
        let labelPosition: Utils.Vec2 = renderPosition.Copy();
        labelPosition.x += shapeSize.x / 2 + shapeSize.x * labelXOffset;

        let labelContents: string = this.GetLabelContents();
        let labelInfo: ShapeRenderer.LabelRenderInfo = new ShapeRenderer.LabelRenderInfo(
            labelPosition, labelContents, ShapeRenderer.HAlign.Right, ShapeRenderer.VAlign.Down
        );
        labelInfo.containerHeight = shapeSize.y;
        this.expressionLabel = labelInfo.CreateLabel();

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
        let entireShapeHeight: number = octagonShapeSize.y + breakpointVericalPadding;
        resultCache.leftPortion.y = resultCache.rightPortion.y = entireShapeHeight;

        let labelContents: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent(
            this.GetLabelContents(), ShapeRenderer.TextType.Bolded
        );
        let contentsSize: Utils.Vec2 = ShapeRenderer.MeasureTextSize(labelContents);
        let contentsXOffset: number = octagonShapeSize.x * labelXOffset;
        resultCache.leftPortion.x = resultCache.rightPortion.x = octagonShapeSize.x / 2;
        resultCache.rightPortion.x += contentsSize.x + contentsXOffset;

        return resultCache;
    }

    private GetOctagonShapeSize(includeShadow: boolean = true): Utils.Vec2 {
        let defaultShapeWidth: number = Utils.GetPropertyPX(document.documentElement, "--default-shape-width"),
            shapeAspectRatio: number = Number(Utils.GetProperty(document.documentElement, "--shape-aspect-ratio")),
            octagonWidth: number = defaultShapeWidth / shapeAspectRatio;
        
        let shapeSize: Utils.Vec2 = new Utils.Vec2(octagonWidth, octagonWidth);
        if (includeShadow) shapeSize.y += octagonShadowYOffset;
        return shapeSize;
    }
}

export class InlineComment extends Flowgorithm.ProgramNode {
    public commentContent: string = "";
}