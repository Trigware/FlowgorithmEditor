import { Expression } from "./Expression.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as BaseNode from "./ProgramNode.js"
import * as Utils from "./Utils.js"

type OptionalDiv = HTMLDivElement | null;

const octagonShadowYOffset: number = 5, breakpointVericalPadding: number = 30, labelXOffset: number = 0.3;
const conditionalBreakpointSegmentPortion: number = 0.5;

export class Breakpoint extends BaseNode.ProgramNode {
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
    
    public override CalculateSizeCache(): BaseNode.CachedSize {
        let resultCache: BaseNode.CachedSize = new BaseNode.CachedSize();
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

const inlineCommentArrowVerticalOffset: number = -0.4;

export class InlineComment extends BaseNode.ProgramNode {
    public commentContent: string = "";
    private connectingDots: OptionalDiv = null; 

    public override BeforeArrowHasEnding(): boolean { return false; }
    public override GetType(): ShapeRenderer.ShapeType { return ShapeRenderer.ShapeType.Comment; }

    public override GetContent(): ShapeRenderer.ShapeContent {
        let actualText: string = this.commentContent.length === 0 ? "Comment" : this.commentContent;
        let shapeContent: ShapeRenderer.ShapeContent = new ShapeRenderer.ShapeContent(actualText, ShapeRenderer.TextType.Italic);
        return shapeContent;
    }

    public override Render(position: Utils.Vec2) {
        let arrowLesserSize: number = Utils.GetFromRootPX("--arrow-lesser-size");
        this.connectingDots = Utils.CreateElement("div", "CommentDots", ShapeRenderer.currentPlane) as HTMLDivElement;
        let dotGapSize: number = Utils.GetFromRootPX("--default-comment-dot-gap"), totalXOffset: number = arrowLesserSize / 2 + dotGapSize;
        let connectingDotsPos: Utils.Vec2 = position.Plus(totalXOffset, 0);
        ShapeRenderer.SetShapePosition(this.connectingDots, connectingDotsPos);

        let shapeContent: ShapeRenderer.ShapeContent = this.GetContent();
        let connectingDotsWidth: number = this.GetConnectingDotsWidth();

        let commentShapeSize: Utils.Vec2 = this.linkedShape.GetSize(shapeContent, this.GetType());
        let commentXOffset: number = commentShapeSize.x / 2 + connectingDotsWidth;
        commentXOffset += totalXOffset;
        let commentShapePos: Utils.Vec2 = position.Plus(
            commentXOffset, -commentShapeSize.y / 2
        );
        
        this.linkedShape = ShapeRenderer.AddShape(this.GetType(), commentShapePos, shapeContent);
    }

    private GetConnectingDotsWidth(): number {
        let dotRadius: number = Utils.GetFromRootPX("--default-comment-dot-radius"),
            dotGap: number = Utils.GetFromRootPX("--default-comment-dot-gap"),
            dotCount: number = Number(Utils.GetFromRoot("--default-comment-dot-count")),
            connectingDotsWidth: number = (dotRadius * 2 + dotGap) * dotCount;

        return connectingDotsWidth;
    }

    public override CalculateSizeCache(): BaseNode.CachedSize {
        let sizeCache: BaseNode.CachedSize = new BaseNode.CachedSize();
        let connectingDotsWidth: number = this.GetConnectingDotsWidth(),
            dotGapSize: number = Utils.GetFromRootPX("--default-comment-dot-gap");

        let commentShapeSize: Utils.Vec2 = this.linkedShape.GetSize(this.GetContent(), this.GetType());
        let arrowLesserSize: number = Utils.GetFromRootPX("--arrow-lesser-size");
        let dotsXOffset: number = arrowLesserSize / 2 + dotGapSize + 1;
        sizeCache.rightPortion.x = connectingDotsWidth + commentShapeSize.x + dotsXOffset;
        sizeCache.leftPortion.y = sizeCache.rightPortion.y = inlineCommentArrowVerticalOffset;

        return sizeCache;
    }

    public override GetSideTotalWidth(checkedSide: BaseNode.SizeCountType): number {
        if (checkedSide === BaseNode.SizeCountType.OnlyLeft) return 0;
        let commentSize: Utils.Vec2 = this.GetSize(checkedSide, BaseNode.SubnodeCountType.CountAll);
        return commentSize.x;
    }
}