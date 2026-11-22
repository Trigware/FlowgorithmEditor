import { ShapeType } from "./ShapeRenderer.js";
import * as WindowLayout from "./VirtualWindowData.js"
import * as Utils from "./Utils.js"

let headerSection: HTMLDivElement = document.getElementById("HeaderSection") as HTMLDivElement;
let absolutePlane: HTMLDivElement = document.getElementById("AbsolutePlane") as HTMLDivElement;

const windowIconPath: string = "Assets/SaveFile.png";
const borderInteractSize: number = 5;
const windowSpawnSizeMultiplier: number = 0.4;

enum WindowResizeSide {
    None,
    Left = 2**0, Right = 2**1, Top = 2**2, Bottom = 2**3,
    TopLeft = Top | Left, TopRight = Top | Right, BottomLeft = Bottom | Left, BottomRight = Bottom | Right
}

const orthogonalResizeSideArr: WindowResizeSide[] = [
    WindowResizeSide.Left, WindowResizeSide.Right, WindowResizeSide.Top, WindowResizeSide.Bottom
];

let cursorModeMap: Map<WindowResizeSide, string> = new Map([
    [WindowResizeSide.Left, "ew-resize"], [WindowResizeSide.Right, "ew-resize"],
    [WindowResizeSide.Top, "ns-resize"], [WindowResizeSide.Bottom, "ns-resize"],
    [WindowResizeSide.TopLeft, "nwse-resize"], [WindowResizeSide.TopRight, "nesw-resize"],
    [WindowResizeSide.BottomLeft, "nesw-resize"], [WindowResizeSide.BottomRight, "nwse-resize"]
]);

export class VirtualWindow {
    public isOpen: boolean = false;
    private layoutData: WindowLayout.EditDialog | null = null;

    private windowRoot: HTMLDivElement | null = null;
    private windowHeader: HTMLDivElement | null = null;
    private titleSection: HTMLDivElement | null = null;
    private buttonsContainer: HTMLDivElement | null = null;

    private isDraggingWindow: boolean = false;
    private dragOffset: Utils.Vec2 = Utils.Vec2.Zero();
    private activeResizeSide: WindowResizeSide = WindowResizeSide.None;
    private isClosing: boolean = false;

    public Open(windowLayout: WindowLayout.EditDialog) {
        this.isOpen = true;
        this.windowRoot = Utils.CreateDiv("VirtualWindow", absolutePlane);
        this.layoutData = windowLayout;

        this.windowHeader = Utils.CreateDiv("WindowHeader", this.windowRoot);
        this.titleSection = Utils.CreateDiv("WindowTitle", this.windowHeader);
        this.buttonsContainer = Utils.CreateDiv("WindowButtons", this.windowHeader);
        
        let windowIconElement: HTMLImageElement = Utils.CreateElement("img", "", this.titleSection) as HTMLImageElement;
        windowIconElement.src = windowIconPath;
        windowIconElement.draggable = false;
        let windowTitleElement: HTMLSpanElement = Utils.CreateElement("span", "", this.titleSection);
        windowTitleElement.textContent = this.layoutData.windowTitle;

        let windowExitButton: HTMLDivElement = Utils.CreateDiv("WindowButtonExit", this.buttonsContainer);
        windowExitButton.addEventListener("click", () => { this.Close(); });

        let absolutePlaneSize: Utils.Vec2 = GetPlaneSize();
        let initialSize: Utils.Vec2 = absolutePlaneSize.Times(windowSpawnSizeMultiplier);
        Utils.SetVectorPropertyPX(this.windowRoot, "--size", initialSize);
        Utils.SetVectorPropertyPX(this.windowRoot, "--init-size", initialSize);
    }

    public Close() {
        if (this.windowRoot === null) return;

        this.isClosing = true;
        Utils.PlayAnimation(this.windowRoot, "WindowShowAnimation", true, () => {
            this.windowRoot?.remove();
            this.isOpen = false;
            document.documentElement.style.cursor = "default";
            this.isClosing = false;
        });
    }

    public HandleEvents() {
        if (!this.isOpen) return;

        this.HandleResizing();
        this.HandleDragging();
    }

    private IsHoveringOverAnyHeaderButton(): boolean {
        if (this.buttonsContainer === null) return false;

        for (let currentButton of this.buttonsContainer.children) {
            let hoversOverCurrentButton: boolean = Utils.HoversOverElement(currentButton);
            if (hoversOverCurrentButton) return true;
        }

        return false;
    }

    private HandleDragging() {
        if (this.windowRoot === null || this.windowHeader === null) return;

        let isHoveringOverHeader: boolean = Utils.HoversOverElement(this.windowHeader), isHoveringOverAnyButton: boolean = this.IsHoveringOverAnyHeaderButton();
        let isDraggingAllowed: boolean = isHoveringOverHeader && !isHoveringOverAnyButton;
        let canResize: boolean = cursorModeMap.has(this.activeResizeSide);

        let hasStartedToDrag: boolean = Utils.activeMouse.IsTapped() && isDraggingAllowed && !canResize, hasStoppedToDrag: boolean = Utils.activeMouse.IsReleased() || canResize;
        if (hasStoppedToDrag) this.isDraggingWindow = false;

        if (hasStartedToDrag) { this.isDraggingWindow = true; this.dragOffset = this.MouseDiffFromOrigin(); }
        if (!this.isDraggingWindow) return;
        
        let mousePos: Utils.Vec2 = Utils.activeMouse.GetPosition();
        let headerHeight: number = headerSection.clientHeight + Utils.GetFromRootPX("--header-border-size");
        mousePos.y -= headerHeight;
        let windowOffset: Utils.Vec2 = Utils.GetVectorPropertyPX(this.windowRoot, "--offset");

        let updatedWindowPos: Utils.Vec2 = mousePos.Minus(windowOffset.x, windowOffset.y).Minus(this.dragOffset.x, this.dragOffset.y);
        updatedWindowPos.x = Utils.Clamp(updatedWindowPos.x, -windowOffset.x, windowOffset.x);
        updatedWindowPos.y = Utils.Clamp(updatedWindowPos.y, -windowOffset.y, windowOffset.y);

        Utils.SetVectorPropertyPX(this.windowRoot, "--position", updatedWindowPos);
    }

    private HandleResizing() {
        if (this.windowRoot === null) return;
        
        let mouseDiff: Utils.Vec2 = this.MouseDiffFromOrigin(), windowSize: Utils.Vec2 = Utils.GetVectorPropertyPX(this.windowRoot, "--size");
        let vecDistFromTopLeft: Utils.Vec2 = mouseDiff.Abs(), vecDistFromBottomRight: Utils.Vec2 = windowSize.Minus(mouseDiff.x, mouseDiff.y).Abs();

        let currentResizeSide: WindowResizeSide = WindowResizeSide.None;
        if (vecDistFromTopLeft.x <= borderInteractSize) currentResizeSide |= WindowResizeSide.Left;
        if (vecDistFromTopLeft.y <= borderInteractSize) currentResizeSide |= WindowResizeSide.Top;
        if (vecDistFromBottomRight.x <= borderInteractSize) currentResizeSide |= WindowResizeSide.Right;
        if (vecDistFromBottomRight.y <= borderInteractSize) currentResizeSide |= WindowResizeSide.Bottom;

        let hasTappedMouse: boolean = Utils.activeMouse.IsTapped(), hasReleasedMouse: boolean = Utils.activeMouse.IsReleased();
        let isCurrentResizingAllowed: boolean = cursorModeMap.has(currentResizeSide);
        let startedToResize: boolean = isCurrentResizingAllowed && hasTappedMouse;
        if (startedToResize) this.activeResizeSide = currentResizeSide;
        if (hasReleasedMouse) this.activeResizeSide = WindowResizeSide.None;

        let currentMouseMode: WindowResizeSide = this.activeResizeSide;
        if (this.activeResizeSide === WindowResizeSide.None) currentMouseMode = currentResizeSide;
        let isMouseModeNonDefault: boolean = cursorModeMap.has(currentMouseMode) && !this.isDraggingWindow && !this.isClosing;
        document.documentElement.style.cursor = isMouseModeNonDefault ? cursorModeMap.get(currentMouseMode)! : "default";

        let isActiveResizeAllowed: boolean = cursorModeMap.has(this.activeResizeSide);
        if (isActiveResizeAllowed) this.ResizeWindow();
    }

    private MouseDiffFromOrigin(): Utils.Vec2 {
        if (this.windowRoot === null) return Utils.Vec2.Zero();

        let mousePos: Utils.Vec2 = Utils.activeMouse.GetPosition();
        let headerHeight: number = headerSection.clientHeight + Utils.GetFromRootPX("--header-border-size");
        mousePos.y -= headerHeight;

        let windowPos: Utils.Vec2 = Utils.GetVectorPropertyPX(this.windowRoot, "--position"),
            windowOffset: Utils.Vec2 = Utils.GetVectorPropertyPX(this.windowRoot, "--offset"),
            absolutePlaneWinPos: Utils.Vec2 = windowPos.Plus(windowOffset.x, windowOffset.y);
        
        return mousePos.Minus(absolutePlaneWinPos.x, absolutePlaneWinPos.y);
    }

    private ResizeWindow() {
        if (this.windowRoot === null || this.titleSection === null || this.buttonsContainer === null) return;

        let mouseDiff: Utils.Vec2 = Utils.activeMouse.GetMousePosDiff();
        let windowSize: Utils.Vec2 = Utils.GetVectorPropertyPX(this.windowRoot, "--size"),
            windowPos: Utils.Vec2 = Utils.GetVectorPropertyPX(this.windowRoot, "--position");

        for (let currentResizeDir of orthogonalResizeSideArr) {
            let isResizingTowardDir: boolean = (this.activeResizeSide & currentResizeDir) !== 0;
            if (!isResizingTowardDir) continue;

            let isResizingWidth: boolean = currentResizeDir === WindowResizeSide.Left || currentResizeDir === WindowResizeSide.Right,
                willNegateSizeDiff: boolean = currentResizeDir === WindowResizeSide.Left || currentResizeDir === WindowResizeSide.Top,
                willChangePosition: boolean = willNegateSizeDiff;
            
            let resizedAxisIndex: number = isResizingWidth ? 0 : 1;
            let affectedAxisWinSize: number = windowSize.GetAxis(resizedAxisIndex),
                affectedAxisDiffValue: number = mouseDiff.GetAxis(resizedAxisIndex),
                affectedAxisWinPos: number = windowPos.GetAxis(resizedAxisIndex);

            let changedSizeValue: number = affectedAxisDiffValue;
            if (willNegateSizeDiff) changedSizeValue = -changedSizeValue;

            windowSize.SetAxis(resizedAxisIndex, affectedAxisWinSize + changedSizeValue);
            if (willChangePosition) windowPos.SetAxis(resizedAxisIndex, affectedAxisWinPos + affectedAxisDiffValue);
        }

        let windowHeaderHeight: number = Utils.GetFromRootPX("--window-header-height") + Utils.GetFromRootPX("--window-header-border-size"),
            minimumHeaderWidth: number = this.titleSection.clientWidth, hoveredButtonWidthMultiplier: number = Number(Utils.GetFromRoot("--button-max-width-multiplier"));
        
        for (let i: number = 0; i < this.buttonsContainer.children.length; i++) {
            let windowButton: HTMLElement = this.buttonsContainer.children[i] as HTMLElement;
            let currentButtonWidth: number = windowButton.clientWidth;
            if (i === 0) currentButtonWidth *= hoveredButtonWidthMultiplier;
            let widthPaddingAndMargin: number = (Utils.GetPropertyPX(windowButton, "--button-border-size") + Utils.GetPropertyPX(windowButton, "--button-margin-width")) * 2;

            let totalButtonWidth: number = currentButtonWidth + widthPaddingAndMargin;
            minimumHeaderWidth += totalButtonWidth;
        }

        minimumHeaderWidth += Utils.GetFromRootPX("--window-buttons-container-padding") * 2;
        windowSize = new Utils.Vec2(Math.max(windowSize.x, minimumHeaderWidth), Math.max(windowSize.y, windowHeaderHeight));
        Utils.SetVectorPropertyPX(this.windowRoot, "--size", windowSize);
        Utils.SetVectorPropertyPX(this.windowRoot, "--position", windowPos);
    }
}

export let currentEditDialog: VirtualWindow = new VirtualWindow();

export function OpenEditDialog(shapeType: ShapeType) {
    let currentLayout: WindowLayout.EditDialog | null = WindowLayout.windowsLayoutRoot.GetLayout(shapeType);
    if (currentLayout === null) return;

    currentEditDialog.Open(currentLayout);
    UpdateAbsolutePlaneElements();
}

export function UpdateAbsolutePlaneElements() {
    let planeSize: Utils.Vec2 = GetPlaneSize();

    for (let i: number = 0; i < absolutePlane.children.length; i++) {
        let currentElement: HTMLElement = absolutePlane.children[i] as HTMLElement;
        let offsetIgnoreValue: string = Utils.GetProperty(currentElement, "--offset-ignore");
        let ignoreOffsetInElement: boolean = offsetIgnoreValue === "true";
        if (ignoreOffsetInElement) continue;

        let elementScale: number = Number(Utils.GetProperty(currentElement, "scale"));
        if (Number.isNaN(elementScale)) elementScale = 1;

        let initialSizeScaled: Utils.Vec2 = Utils.GetVectorPropertyPX(currentElement, "--init-size").Times(elementScale);
        let elementOffset: Utils.Vec2 = planeSize.Minus(initialSizeScaled.x, initialSizeScaled.y).Divide(2);
        Utils.SetProperty(currentElement, "--offset-x", elementOffset.x.toString() + "px");
        Utils.SetProperty(currentElement, "--offset-y", elementOffset.y.toString() + "px");
    }

    currentEditDialog.HandleEvents();
}

function GetPlaneSize(): Utils.Vec2 {
    let planeSize: Utils.Vec2 = new Utils.Vec2(absolutePlane.clientWidth, absolutePlane.clientHeight);
    let headerHeight: number = headerSection.clientHeight + Utils.GetFromRootPX("--header-border-size");
    planeSize.y -= headerHeight;

    return planeSize;
}