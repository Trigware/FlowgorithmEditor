import { Expression } from "./Expression.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as BaseNode from "./ProgramNode.js";
import * as Utils from "./Utils.js";
import * as ShapeInteract from "./ShapeIntersect.js";
const octagonShadowYOffset = 5, breakpointVericalPadding = 30, labelXOffset = 0.3;
export class Breakpoint extends BaseNode.ProgramNode {
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
    GetIntersectInfo(displayType) {
        let intersectInfo = new ShapeInteract.IntersectInfo(displayType);
        intersectInfo.isConditionalBreakpoint = this.isConditional;
        return intersectInfo;
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
        let segmentPortionProperty = this.isConditional ? "--default-conditional-breakpoint-segment-portion" : "--default-breakpoint-segment-portion";
        let segmentPortion = Number(Utils.GetFromRoot(segmentPortionProperty));
        let segmentPortionValue = (segmentPortion * 100).toString() + "%";
        this.linkedShape.SetProperty("--segment-portion", segmentPortionValue);
    }
    GetLabelContents() {
        let labelContents = this.isConditional ? "Condition" : "Breakpoint";
        let useExpressionAsContent = !this.conditionalExpression.IsEmpty() && this.isConditional;
        if (useExpressionAsContent)
            labelContents = this.conditionalExpression.expressionAsStr;
        return labelContents;
    }
    CalculateSizeCache() {
        let resultCache = new BaseNode.CachedSize();
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
    GetSideTotalWidth(checkedSize) {
        return GetAnnotationSideTotalWidth(this, checkedSize);
    }
}
const inlineCommentArrowVerticalOffset = -0.4;
export class InlineComment extends BaseNode.ProgramNode {
    commentContent = "";
    connectingDots = null;
    BeforeArrowHasEnding() { return false; }
    GetType() { return ShapeRenderer.ShapeType.Comment; }
    GetContent() {
        let actualText = this.commentContent.length === 0 ? "Comment" : this.commentContent;
        let shapeContent = new ShapeRenderer.ShapeContent(actualText, ShapeRenderer.TextType.Italic);
        return shapeContent;
    }
    Render(position) {
        let arrowLesserSize = Utils.GetFromRootPX("--arrow-lesser-size");
        this.connectingDots = Utils.CreateElement("div", "CommentDots", ShapeRenderer.currentPlane);
        let dotGapSize = Utils.GetFromRootPX("--default-comment-dot-gap"), totalXOffset = arrowLesserSize / 2 + dotGapSize;
        let connectingDotsPos = position.Plus(totalXOffset, 0);
        ShapeRenderer.SetShapePosition(this.connectingDots, connectingDotsPos);
        let shapeContent = this.GetContent();
        let connectingDotsWidth = this.GetConnectingDotsWidth();
        let commentShapeSize = this.linkedShape.GetSize(shapeContent, this.GetType());
        let commentXOffset = commentShapeSize.x / 2 + connectingDotsWidth;
        commentXOffset += totalXOffset;
        let commentShapePos = position.Plus(commentXOffset, -commentShapeSize.y / 2);
        this.linkedShape = ShapeRenderer.AddShape(this.GetType(), commentShapePos, shapeContent);
    }
    GetConnectingDotsWidth() {
        let dotRadius = Utils.GetFromRootPX("--default-comment-dot-radius"), dotGap = Utils.GetFromRootPX("--default-comment-dot-gap"), dotCount = Number(Utils.GetFromRoot("--default-comment-dot-count")), connectingDotsWidth = (dotRadius * 2 + dotGap) * dotCount;
        return connectingDotsWidth;
    }
    CalculateSizeCache() {
        let sizeCache = new BaseNode.CachedSize();
        let connectingDotsWidth = this.GetConnectingDotsWidth(), dotGapSize = Utils.GetFromRootPX("--default-comment-dot-gap");
        let commentShapeSize = this.linkedShape.GetSize(this.GetContent(), this.GetType());
        let arrowLesserSize = Utils.GetFromRootPX("--arrow-lesser-size");
        let dotsXOffset = arrowLesserSize / 2 + dotGapSize + 1;
        sizeCache.rightPortion.x = connectingDotsWidth + commentShapeSize.x + dotsXOffset;
        sizeCache.leftPortion.y = sizeCache.rightPortion.y = inlineCommentArrowVerticalOffset;
        return sizeCache;
    }
    GetSideTotalWidth(checkedSide) {
        return GetAnnotationSideTotalWidth(this, checkedSide);
    }
}
function GetAnnotationSideTotalWidth(programNode, checkedSide) {
    if (checkedSide === BaseNode.SizeCountType.OnlyLeft)
        return 0;
    let commentSize = programNode.GetSize(checkedSide, BaseNode.SubnodeCountType.CountAll);
    let commentWidth = commentSize.x;
    let isParentHorizonzalArrowLengthCounted = programNode.parentNode !== null && programNode.parentNode.associatedDir === BaseNode.AssociatedDirection.Right;
    if (isParentHorizonzalArrowLengthCounted)
        commentWidth += Flowgorithm.defaultArrowLength;
    return commentWidth;
}
