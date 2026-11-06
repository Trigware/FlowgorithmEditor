import * as Utils from "./Utils.js"

export let currentPlane: HTMLDivElement;
let measuringCanvas: HTMLCanvasElement = document.createElement("canvas");
let measuringContext: CanvasRenderingContext2D = measuringCanvas.getContext("2d")!;
let bodyElement: HTMLBodyElement = document.getElementById("DocumentBody") as HTMLBodyElement;

export function SetPlane(plane: HTMLDivElement) { currentPlane = plane; }

export enum ShapeType {
    Unknown = -1,
    FunctionSignature, FunctionEnd, Call,
    VariableDeclaration, Assignment,
    Input, Output, Conditional,
    While, For, Do, Breakpoint, Comment
}

enum ShapeDisplayType { Unknown = -1, Parallelogram, Diamond, Hexagon, Elipse, Rectangle, Octagon, Comment }
enum ShapeColorType { Unknown = -1, Purple, Blue, Green, Yellow, Red, Orange, LightPurple, LightRed, LightGray }

export class ShapeColorInfo {
    public shapeColor: string = ""; public shadowColor: string = ""; public mergePointColor: string = "";
    public constructor(colorOfShape: string, colorOfShadow: string = "#000000", colorOfMergePoint: string = "#000000") {
        this.shapeColor = colorOfShape; this.shadowColor = colorOfShadow; this.mergePointColor = colorOfMergePoint;
    }
    public static Default(): ShapeColorInfo {
        return new ShapeColorInfo("#000000", "#000000");
    }
}

class ShapeDisplayInfo {
    public displayType: ShapeDisplayType = ShapeDisplayType.Unknown;
    public colorType: ShapeColorType = ShapeColorType.Unknown;
    public constructor(type: ShapeDisplayType, displayColorType: ShapeColorType) {
        this.displayType = type; this.colorType = displayColorType;
    }
}

const shapeColorsArr: Map<ShapeColorType, ShapeColorInfo> = new Map([
    [ShapeColorType.Purple, new ShapeColorInfo("#906eb8", "#5b4278")],
    [ShapeColorType.LightPurple, new ShapeColorInfo("#b794e0", "#6e5c82")],
    [ShapeColorType.Blue, new ShapeColorInfo("#62a2de", "#376fa3")],
    [ShapeColorType.Green, new ShapeColorInfo("#4fc26a", "#2f8a5b")],
    [ShapeColorType.Yellow, new ShapeColorInfo("#edd040", "#a08d30")],
    [ShapeColorType.Red, new ShapeColorInfo("#d13434", "#7d1e1e", "#992323")],
    [ShapeColorType.Orange, new ShapeColorInfo("#d67345", "#944c29", "#ba592d")],
    [ShapeColorType.LightRed, new ShapeColorInfo("#ed5c5c", "#c24444")],
    [ShapeColorType.LightGray, new ShapeColorInfo("#cccccc")]
]);

export const incompleteShapeColors: ShapeColorInfo = new ShapeColorInfo("#858585", "#404040", "#707070");

const shapeDisplayArr: Map<ShapeType, ShapeDisplayInfo> = new Map([
    [ShapeType.FunctionSignature, new ShapeDisplayInfo(ShapeDisplayType.Elipse, ShapeColorType.Purple)],
    [ShapeType.FunctionEnd, new ShapeDisplayInfo(ShapeDisplayType.Elipse, ShapeColorType.Purple)],
    [ShapeType.Call, new ShapeDisplayInfo(ShapeDisplayType.Rectangle, ShapeColorType.LightPurple)],
    [ShapeType.VariableDeclaration, new ShapeDisplayInfo(ShapeDisplayType.Rectangle, ShapeColorType.Yellow)],
    [ShapeType.Assignment, new ShapeDisplayInfo(ShapeDisplayType.Rectangle, ShapeColorType.Yellow)],
    [ShapeType.Input, new ShapeDisplayInfo(ShapeDisplayType.Parallelogram, ShapeColorType.Blue)],
    [ShapeType.Output, new ShapeDisplayInfo(ShapeDisplayType.Parallelogram, ShapeColorType.Green)],
    [ShapeType.Conditional, new ShapeDisplayInfo(ShapeDisplayType.Diamond, ShapeColorType.Red)],
    [ShapeType.While, new ShapeDisplayInfo(ShapeDisplayType.Hexagon, ShapeColorType.Orange)],
    [ShapeType.For, new ShapeDisplayInfo(ShapeDisplayType.Hexagon, ShapeColorType.Orange)],
    [ShapeType.Do, new ShapeDisplayInfo(ShapeDisplayType.Hexagon, ShapeColorType.Orange)],
    [ShapeType.Breakpoint, new ShapeDisplayInfo(ShapeDisplayType.Octagon, ShapeColorType.LightRed)],
    [ShapeType.Comment, new ShapeDisplayInfo(ShapeDisplayType.Comment, ShapeColorType.LightGray)]
]);

const displayTypeToClassMap: Map<ShapeDisplayType, string> = new Map([
    [ShapeDisplayType.Parallelogram, "ParallelogramShape"], [ShapeDisplayType.Diamond, "DiamondShape"],
    [ShapeDisplayType.Hexagon, "HexagonShape"], [ShapeDisplayType.Elipse, "ElipticShape"],
    [ShapeDisplayType.Rectangle, "RectangleShape"], [ShapeDisplayType.Octagon, "OctagonShape"],
    [ShapeDisplayType.Comment, "CommentShape"]
]);

export function SetShapePosition(currentShape: HTMLDivElement, shapePosition: Utils.Vec2) {
    Utils.SetProperty(currentShape, "--shape-x", shapePosition.x.toString() + "px");
    Utils.SetProperty(currentShape, "--shape-y", shapePosition.y.toString() + "px");
}

const nonBreakingSpace: string = '\u00A0';

export enum TextType { Bolded, Italic, Underline }
const textStylingMap: Map<TextType, string> = new Map([
    [TextType.Bolded, "bold"], [TextType.Italic, "italic"]
]);

export class TextSegment {
    public segmentContent: string = "";
    public appliedTypes: TextType[] = [];

    public constructor(content: string, type: TextType | TextType[] = []) {
        this.segmentContent = content;
        if (!Array.isArray(type)) { this.appliedTypes = [type]; return; }
        this.appliedTypes = type;
    }

    public Equals(otherSegment: TextSegment) {
        let contentMatches: boolean = this.segmentContent === otherSegment.segmentContent;
        let stylingCountMatches: boolean = this.appliedTypes.length === otherSegment.appliedTypes.length;
        if (!contentMatches || !stylingCountMatches) return false;

        let stylingCount: number = this.appliedTypes.length;
        for (let i: number = 0; i < stylingCount; i++) {
            let firstStyle: TextType = this.appliedTypes[i], otherStyle: TextType = otherSegment.appliedTypes[i];
            if (firstStyle !== otherStyle) return false;
        }

        return true;
    }
}

class TextStylingElement {
    public textType: Utils.ElementType = "span";
    public elementClass: string = "";

    public constructor(type: Utils.ElementType = "span", cssClass: string = "") {
        this.textType = type; this.elementClass = cssClass;
    }
}

function GetElementInfoByTextType(appliedTypes: TextType[]): TextStylingElement[] {
    if (appliedTypes.length === 0) return [new TextStylingElement("span")];
    let stylingElementsArr: TextStylingElement[] = [];

    for (let i: number = 0; i < appliedTypes.length; i++) {
        let currentTextType: TextType = appliedTypes[i];
        let currentStylingElement: TextStylingElement = new TextStylingElement("span");

        switch (currentTextType) {
            case TextType.Bolded: currentStylingElement = new TextStylingElement("strong"); break;
            case TextType.Italic: currentStylingElement = new TextStylingElement("em"); break;
            case TextType.Underline: currentStylingElement = new TextStylingElement("span", "ContentUnderlined"); break;
        }

        stylingElementsArr.push(currentStylingElement);
    }

    return stylingElementsArr;
}

export class ShapeContent {
    public segments: TextSegment[] = [];
    public isIncomplete: boolean = false;

    public constructor(segmentContent: string = "", textTypes: TextType | TextType[] = []) {
        this.Append(segmentContent, textTypes);
    }

    public Append(segmentContent: string, textTypes: TextType | TextType[] = []) {
        if (segmentContent.length === 0) return;
        let appendedSegment: TextSegment = new TextSegment(segmentContent, textTypes);
        this.segments.push(appendedSegment);
    }

    public AppendContent(appendedContent: ShapeContent) {
        for (let currentSegment of appendedContent.segments) {
            this.segments.push(currentSegment);
        }
    }

    public Equals(comparedContent: ShapeContent | null) {
        if (comparedContent === null) return false;

        let segmentCountMatches: boolean = this.segments.length === comparedContent.segments.length;
        if (!segmentCountMatches) return false;

        let segmentCount: number = this.segments.length;
        for (let i: number = 0; i < segmentCount; i++) {
            let firstSegment: TextSegment = this.segments[i], otherSegment: TextSegment = comparedContent.segments[i];
            if (!firstSegment.Equals(otherSegment)) return false;
        }

        return true;
    }

    public ToString(): string {
        let result: string = "";
        for (let currentSegment of this.segments) result += currentSegment.segmentContent;
        return result;
    }

    public SetContent(contentParent: HTMLDivElement) {
        for (let currentTextSegment of this.segments) {
            let usedSegmentContent: string = Utils.ReplaceSurrounding(currentTextSegment.segmentContent, ' ', nonBreakingSpace);
            let isSegmentEmpty: boolean = usedSegmentContent.length === 0;
            if (isSegmentEmpty) continue;

            let stylingElementsArr: TextStylingElement[] = GetElementInfoByTextType(currentTextSegment.appliedTypes);
            let stylingElementsCount: number = stylingElementsArr.length;
            let latestStylingParent: HTMLElement = contentParent;

            for (let i: number = 0; i < stylingElementsArr.length; i++) {
                let currentStylingInfo: TextStylingElement = stylingElementsArr[i];
                let isLastStylingElement: boolean = i === stylingElementsCount - 1;
                let currentStylingElemnt: HTMLElement = Utils.CreateElement(currentStylingInfo.textType, currentStylingInfo.elementClass, latestStylingParent);
                if (isLastStylingElement) currentStylingElemnt.textContent = usedSegmentContent;
                latestStylingParent = currentStylingElemnt;
            }
        }
    }
}

export function GetColorInfo(shapeType: ShapeType): ShapeColorInfo {
    let shapeDisplayInfo: ShapeDisplayInfo | undefined = shapeDisplayArr.get(shapeType);
    if (shapeDisplayInfo === undefined) return ShapeColorInfo.Default();
    let shapeColorInfo: ShapeColorInfo | undefined = shapeColorsArr.get(shapeDisplayInfo.colorType);
    if (shapeColorInfo === undefined) return ShapeColorInfo.Default();

    return shapeColorInfo;
}

function ConstructShape(shapeType: ShapeType, position: Utils.Vec2, shapeContent: ShapeContent, offsetShape: boolean, isShadow: boolean): HTMLDivElement {
    let shapeDisplayInfo: ShapeDisplayInfo = shapeDisplayArr.get(shapeType)!;
    let shapeColorInfo: ShapeColorInfo = shapeColorsArr.get(shapeDisplayInfo.colorType)!;
    if (shapeContent.isIncomplete) shapeColorInfo = incompleteShapeColors;

    let shapeClass: string = displayTypeToClassMap.get(shapeDisplayInfo.displayType)!;
    let constructedShape: HTMLDivElement = Utils.CreateElement("div", shapeClass, currentPlane) as HTMLDivElement;
    let usedShapeColor: string = isShadow ? shapeColorInfo.shadowColor : shapeColorInfo.shapeColor;

    constructedShape.style.backgroundColor = usedShapeColor;
    if (isShadow) constructedShape.classList.add("ShapeShadow");
    shapeContent.SetContent(constructedShape);

    let offsetPosition: Utils.Vec2 = Utils.Vec2.Zero();
    UpdateShapeProperties(constructedShape);
    let shapeHeight: number = Utils.GetNumericPixels(Utils.GetProperty(constructedShape, "height"));
    if (offsetShape) offsetPosition.y = shapeHeight / 2;
    position = position.Plus(offsetPosition.x, offsetPosition.y);
    SetShapePosition(constructedShape, position);

    return constructedShape;
}

export const shapeOffsetMultiplier: Utils.Vec2 = new Utils.Vec2(0.5, 0.075);

export function UpdateShapeProperties(currentShape: HTMLDivElement) {
    let planeSize: Utils.Vec2 = new Utils.Vec2(currentPlane.clientWidth, currentPlane.clientHeight);
    let shapeWidth: number = currentShape.clientWidth;

    let shapeOffset: Utils.Vec2 = planeSize.Times(shapeOffsetMultiplier.x, shapeOffsetMultiplier.y)
        .Minus(shapeWidth / 2, currentShape.clientHeight / 2);
        
    Utils.SetProperty(currentShape, "--offset-x", shapeOffset.x.toString() + "px");
    Utils.SetProperty(currentShape, "--offset-y", shapeOffset.y.toString() + "px");
    let defaultWidth: number = Utils.GetNumericPixels(Utils.GetProperty(currentShape, "--default-shape-width"));
    let widthSizeIncrease: number = shapeWidth / defaultWidth;
    Utils.SetProperty(currentShape, "--width-size-increase", widthSizeIncrease.toString());
}

export function AddShape(shapeType: ShapeType, position: Utils.Vec2, shapeContent: ShapeContent,
    offsetShape: boolean = true, renderShadow: boolean = true
): RenderedShape {
    let renderedShape: RenderedShape = new RenderedShape(shapeContent, shapeType);
    renderedShape.mainShape = ConstructShape(shapeType, position, shapeContent, offsetShape, false);
    if (renderShadow) renderedShape.shadowShape = ConstructShape(shapeType, position, shapeContent, offsetShape, true);
    return renderedShape;
}

export function ClearPlane() { currentPlane.replaceChildren(); }

export enum HAlign { Left = -1, Center, Right }
export enum VAlign { Up = -1, Center, Down }

export class LabelRenderInfo {
    public originalPosition: Utils.Vec2 = Utils.Vec2.Zero();
    public contents: string = "";
    public horizontalAlignment: HAlign = HAlign.Center; public verticalOffset: number = VAlign.Up;
    public containerHeight: number = 0;

    public constructor(pos: Utils.Vec2, text: string, horizontalAlign: HAlign = HAlign.Center, verticalOffset: number = VAlign.Up) {
        this.originalPosition = pos; this.contents = text;
        this.horizontalAlignment = horizontalAlign; this.verticalOffset = verticalOffset;
    }

    public CreateLabel(): HTMLDivElement {
        return ConstructLabel(
            this.originalPosition, this.contents,
            this.horizontalAlignment, this.verticalOffset,
            this.containerHeight
        );
    }
}

export function ConstructLabel(originalPosition: Utils.Vec2, labelContents: string,
    horizontalAlignment: HAlign = HAlign.Center, verticalOffset: number = VAlign.Up,
    containerHeight: number = 0
) {
    let constructedLabel: HTMLDivElement = Utils.CreateElement("div", "LabelObject", currentPlane) as HTMLDivElement;
    let labelContent: ShapeContent = new ShapeContent(labelContents, TextType.Bolded);
    labelContent.SetContent(constructedLabel);

    let labelSize: Utils.Vec2 = new Utils.Vec2(
        Utils.GetPropertyPX(constructedLabel, "width"), Utils.GetPropertyPX(constructedLabel, "height")
    );
    let verticalOffsetSpace: number = Math.max(containerHeight - labelSize.y, 0);

    let offsetX: number = horizontalAlignment;
    let labelOffset: Utils.Vec2 = new Utils.Vec2(labelSize.x * offsetX / 2, verticalOffsetSpace / 2);

    labelOffset.y += labelSize.y / 2 * verticalOffset;
    let renderPosition: Utils.Vec2 = originalPosition.Plus(labelOffset.x, labelOffset.y);
    SetShapePosition(constructedLabel, renderPosition);

    return constructedLabel;
}

export class RenderedShape {
    public mainShape: HTMLDivElement | null = null;
    public shadowShape: HTMLDivElement | null = null;

    private shapeContent: ShapeContent = new ShapeContent();
    private shapeType: ShapeType = ShapeType.Unknown;
    private cachedSize: Utils.Vec2 = Utils.Vec2.Zero();
    private isSizeCached: boolean = false;

    public constructor(content: ShapeContent = new ShapeContent(), type: ShapeType = ShapeType.Unknown) {
        this.shapeContent = content; this.shapeType = type;
    }

    public SetProperty(propertyName: string, propertyValue: string) {
        if (this.mainShape !== null) Utils.SetProperty(this.mainShape, propertyName, propertyValue);
        if (this.shadowShape !== null) Utils.SetProperty(this.shadowShape, propertyName, propertyValue);
    }

    public GetSize(content: ShapeContent | null = null, type: ShapeType | null = null): Utils.Vec2 {
        if (type === ShapeType.Unknown) return Utils.Vec2.Zero();
        let paramsTypedExplicly: boolean = content !== null || type !== null;
        let sizeParamsChanged: boolean = paramsTypedExplicly && (this.shapeContent.Equals(content) || this.shapeType === type);
        let willUseCache: boolean = !sizeParamsChanged && this.isSizeCached;
        if (willUseCache) return this.cachedSize;

        if (content !== null) this.shapeContent = content;
        if (type !== null) this.shapeType = type;

        let isConditional: boolean = this.shapeType === ShapeType.Conditional,
            isCommentShape: boolean = this.shapeType === ShapeType.Comment;
        let textSize: Utils.Vec2 = MeasureTextSize(this.shapeContent);
        let defaultShapeWidth: number = Utils.GetNumericPixels(Utils.GetProperty(document.documentElement, "--default-shape-width"));
        let defaultAspectRatio: number = Number(Utils.GetProperty(document.documentElement, "--shape-aspect-ratio"));

        let paddingPropertyName: string = isConditional ? "--diamond-horizonal-padding" : "--shape-horizontal-padding";
        let horizontalPadding: number = Utils.GetNumericPixels(Utils.GetProperty(document.documentElement, paddingPropertyName));
        let shapeWidth: number = Math.max(textSize.x, defaultShapeWidth);
        shapeWidth += horizontalPadding * 2;

        if (isCommentShape) {
            let commentBorderSize: number = Utils.GetFromRootPX("--comment-border-size");
            shapeWidth += commentBorderSize * 2;
        }

        let widthSizeIncrease: number = shapeWidth / defaultShapeWidth;
        let actualAspectRatio: number = isConditional ? defaultAspectRatio / widthSizeIncrease : defaultAspectRatio;
        let shapeHeight: number = defaultShapeWidth / actualAspectRatio;

        let shapeSize: Utils.Vec2 = new Utils.Vec2(shapeWidth, shapeHeight);
        this.isSizeCached = true;
        this.cachedSize = shapeSize;
        return shapeSize;
    }

    public Delete() {
        if (this.mainShape !== null) this.mainShape.remove();
        if (this.shadowShape !== null) this.shadowShape.remove();
        this.mainShape = null; this.shadowShape = null;
    }
}

export function MeasureTextSize(shapeContent: ShapeContent): Utils.Vec2 {
    let shapeSize: Utils.Vec2 = Utils.Vec2.Zero();

    for (let currentSegment of shapeContent.segments) {
        let fontValue: string = GetFontValue(currentSegment);
        measuringContext.font = fontValue;
        let segmentMeasurement: TextMetrics = measuringContext.measureText(currentSegment.segmentContent);

        shapeSize.x += segmentMeasurement.width;
        let segmentHeight: number = segmentMeasurement.actualBoundingBoxAscent + segmentMeasurement.actualBoundingBoxDescent;
        shapeSize.y = Math.max(shapeSize.y, segmentHeight);
    }

    return shapeSize;
}

function GetFontValue(currentSegment: TextSegment): string {
    let fontStylesStr: string = "";
    let pageFontFamily: string = Utils.GetProperty(bodyElement, "font-family");
    let shapeFontSize: string = Utils.GetProperty(document.documentElement, "--shape-font-size");

    for (let appliedStyle of currentSegment.appliedTypes) {
        if (!textStylingMap.has(appliedStyle)) continue;

        let styleAsStr: string = textStylingMap.get(appliedStyle)!;
        if (fontStylesStr !== "") fontStylesStr += ' ';
        fontStylesStr += styleAsStr;
    }

    let fontValue: string = "";
    fontValue += fontStylesStr;
    if (fontValue !== "") fontValue += ' ';
    fontValue += shapeFontSize;

    if (fontValue !== "") fontValue += ' ';
    fontValue += pageFontFamily;

    return fontValue;
}