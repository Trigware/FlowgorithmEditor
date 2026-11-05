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
        let shapeSize = this.GetOctagonShapeSize(false);
        let labelPosition = renderPosition.Copy();
        labelPosition.x += shapeSize.x / 2 + shapeSize.x * labelXOffset;
        let labelContents = this.GetLabelContents();
        let labelInfo = new ShapeRenderer.LabelRenderInfo(labelPosition, labelContents, ShapeRenderer.HAlign.Right, ShapeRenderer.VAlign.Down);
        labelInfo.containerHeight = shapeSize.y;
        this.expressionLabel = labelInfo.CreateLabel();
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
        let entireShapeHeight = octagonShapeSize.y + breakpointVericalPadding;
        resultCache.leftPortion.y = resultCache.rightPortion.y = entireShapeHeight;
        let labelContents = new ShapeRenderer.ShapeContent(this.GetLabelContents(), ShapeRenderer.TextType.Bolded);
        let contentsSize = ShapeRenderer.MeasureTextSize(labelContents);
        let contentsXOffset = octagonShapeSize.x * labelXOffset;
        resultCache.leftPortion.x = resultCache.rightPortion.x = octagonShapeSize.x / 2;
        resultCache.rightPortion.x += contentsSize.x + contentsXOffset;
        return resultCache;
    }
    GetOctagonShapeSize(includeShadow = true) {
        let defaultShapeWidth = Utils.GetPropertyPX(document.documentElement, "--default-shape-width"), shapeAspectRatio = Number(Utils.GetProperty(document.documentElement, "--shape-aspect-ratio")), octagonWidth = defaultShapeWidth / shapeAspectRatio;
        let shapeSize = new Utils.Vec2(octagonWidth, octagonWidth);
        if (includeShadow)
            shapeSize.y += octagonShadowYOffset;
        return shapeSize;
    }
}
export class InlineComment extends Flowgorithm.ProgramNode {
    commentContent = "";
}
