import { Expression } from "./Expression.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Utils from "./Utils.js";
const octagonShadowYOffset = 5, breakpointVericalPadding = 30, labelXOffset = 0.3;
const conditionalBreakpointSegmentPortion = 0.5;
export class Breakpoint extends Flowgorithm.ProgramNode {
    isConditional = false;
    conditionalExpression = new Expression();
    expressionLabel = null;
    BeforeArrowHasEnding() { return false; }
    GetType() { return ShapeRenderer.ShapeType.Breakpoint; }
    GetContent() {
        let shapeContent = Flowgorithm.GetEmptyContent();
        shapeContent.isIncomplete = this.conditionalExpression.IsEmpty() && this.isConditional;
        return shapeContent;
    }
    Render(position) {
        let renderPosition = position.Plus(0, breakpointVericalPadding / 2);
        let shapeSize = this.GetOctagonShapeSize();
        let labelPosition = renderPosition.Plus(shapeSize.x / 2, shapeSize.y / 2);
        labelPosition.x += shapeSize.x * labelXOffset;
        let labelContents = this.GetLabelContents();
        this.expressionLabel = ShapeRenderer.ConstructLabel(labelPosition, labelContents, ShapeRenderer.LabelAlign.Right | ShapeRenderer.LabelAlign.Down, new Utils.Vec2(1, -0.5));
        this.AddShape(renderPosition);
        let conditionalSegmentPortion = (conditionalBreakpointSegmentPortion * 100).toString() + "%";
        if (this.isConditional)
            this.linkedShape.SetProperty("--segment-portion", conditionalSegmentPortion);
    }
    GetLabelContents() {
        let labelContents = this.isConditional ? "Condition" : "Breakpoint";
        let useExpressionAsContent = !this.conditionalExpression.IsEmpty() && this.isConditional;
        if (useExpressionAsContent)
            labelContents = this.conditionalExpression.expressionAsStr;
        return labelContents;
    }
    CalculateSizeCache() {
        let resultCache = new Flowgorithm.CachedSize();
        let octagonShapeSize = this.GetOctagonShapeSize();
        resultCache.leftPortion.y = resultCache.rightPortion.y = octagonShapeSize.y;
        let labelContents = new ShapeRenderer.ShapeContent(this.GetLabelContents(), ShapeRenderer.TextType.Bolded);
        let contentsSize = ShapeRenderer.MeasureTextSize(labelContents), shapeSize = this.GetOctagonShapeSize();
        let contentsXOffset = shapeSize.x * labelXOffset;
        resultCache.leftPortion.x = resultCache.rightPortion.x = shapeSize.x / 2;
        resultCache.rightPortion.x += contentsSize.x + contentsXOffset;
        return resultCache;
    }
    GetOctagonShapeSize() {
        let defaultShapeWidth = Utils.GetPropertyPX(document.documentElement, "--default-shape-width"), shapeAspectRatio = Number(Utils.GetProperty(document.documentElement, "--shape-aspect-ratio")), shapeMainSize = defaultShapeWidth / shapeAspectRatio, shapeTotalHeight = shapeMainSize + octagonShadowYOffset + breakpointVericalPadding;
        return new Utils.Vec2(shapeMainSize, shapeTotalHeight);
    }
}
export class InlineComment extends Flowgorithm.ProgramNode {
    commentContent = "";
}
