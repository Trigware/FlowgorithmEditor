import * as WindowLayout from "./VirtualWindowData.js";
import * as Utils from "./Utils.js";
let headerSection = document.getElementById("HeaderSection");
let absolutePlane = document.getElementById("AbsolutePlane");
const windowIconPath = "Assets/SaveFile.png";
const borderInteractSize = 5;
const windowSpawnSizeMultiplier = 0.4;
var WindowResizeSide;
(function (WindowResizeSide) {
    WindowResizeSide[WindowResizeSide["None"] = 0] = "None";
    WindowResizeSide[WindowResizeSide["Left"] = 1] = "Left";
    WindowResizeSide[WindowResizeSide["Right"] = 2] = "Right";
    WindowResizeSide[WindowResizeSide["Top"] = 4] = "Top";
    WindowResizeSide[WindowResizeSide["Bottom"] = 8] = "Bottom";
    WindowResizeSide[WindowResizeSide["TopLeft"] = 5] = "TopLeft";
    WindowResizeSide[WindowResizeSide["TopRight"] = 6] = "TopRight";
    WindowResizeSide[WindowResizeSide["BottomLeft"] = 9] = "BottomLeft";
    WindowResizeSide[WindowResizeSide["BottomRight"] = 10] = "BottomRight";
})(WindowResizeSide || (WindowResizeSide = {}));
const orthogonalResizeSideArr = [
    WindowResizeSide.Left, WindowResizeSide.Right, WindowResizeSide.Top, WindowResizeSide.Bottom
];
let cursorModeMap = new Map([
    [WindowResizeSide.Left, "ew-resize"], [WindowResizeSide.Right, "ew-resize"],
    [WindowResizeSide.Top, "ns-resize"], [WindowResizeSide.Bottom, "ns-resize"],
    [WindowResizeSide.TopLeft, "nwse-resize"], [WindowResizeSide.TopRight, "nesw-resize"],
    [WindowResizeSide.BottomLeft, "nesw-resize"], [WindowResizeSide.BottomRight, "nwse-resize"]
]);
export class VirtualWindow {
    isOpen = false;
    layoutData = null;
    windowRoot = null;
    windowHeader = null;
    titleSection = null;
    buttonsContainer = null;
    isDraggingWindow = false;
    dragOffset = Utils.Vec2.Zero();
    activeResizeSide = WindowResizeSide.None;
    isClosing = false;
    Open(windowLayout) {
        this.isOpen = true;
        this.windowRoot = Utils.CreateDiv("VirtualWindow", absolutePlane);
        this.layoutData = windowLayout;
        this.windowHeader = Utils.CreateDiv("WindowHeader", this.windowRoot);
        this.titleSection = Utils.CreateDiv("WindowTitle", this.windowHeader);
        this.buttonsContainer = Utils.CreateDiv("WindowButtons", this.windowHeader);
        let windowIconElement = Utils.CreateElement("img", "", this.titleSection);
        windowIconElement.src = windowIconPath;
        windowIconElement.draggable = false;
        let windowTitleElement = Utils.CreateElement("span", "", this.titleSection);
        windowTitleElement.textContent = this.layoutData.windowTitle;
        let windowExitButton = Utils.CreateDiv("WindowButtonExit", this.buttonsContainer);
        windowExitButton.addEventListener("click", () => { this.Close(); });
        let absolutePlaneSize = GetPlaneSize();
        let initialSize = absolutePlaneSize.Times(windowSpawnSizeMultiplier);
        Utils.SetVectorPropertyPX(this.windowRoot, "--size", initialSize);
        Utils.SetVectorPropertyPX(this.windowRoot, "--init-size", initialSize);
    }
    Close() {
        if (this.windowRoot === null)
            return;
        this.isClosing = true;
        Utils.PlayAnimation(this.windowRoot, "WindowShowAnimation", true, () => {
            this.windowRoot?.remove();
            this.isOpen = false;
            document.documentElement.style.cursor = "default";
            this.isClosing = false;
        });
    }
    HandleEvents() {
        if (!this.isOpen)
            return;
        this.HandleResizing();
        this.HandleDragging();
    }
    IsHoveringOverAnyHeaderButton() {
        if (this.buttonsContainer === null)
            return false;
        for (let currentButton of this.buttonsContainer.children) {
            let hoversOverCurrentButton = Utils.HoversOverElement(currentButton);
            if (hoversOverCurrentButton)
                return true;
        }
        return false;
    }
    HandleDragging() {
        if (this.windowRoot === null || this.windowHeader === null)
            return;
        let isHoveringOverHeader = Utils.HoversOverElement(this.windowHeader), isHoveringOverAnyButton = this.IsHoveringOverAnyHeaderButton();
        let isDraggingAllowed = isHoveringOverHeader && !isHoveringOverAnyButton;
        let canResize = cursorModeMap.has(this.activeResizeSide);
        let hasStartedToDrag = Utils.activeMouse.IsTapped() && isDraggingAllowed && !canResize, hasStoppedToDrag = Utils.activeMouse.IsReleased() || canResize;
        if (hasStoppedToDrag)
            this.isDraggingWindow = false;
        if (hasStartedToDrag) {
            this.isDraggingWindow = true;
            this.dragOffset = this.MouseDiffFromOrigin();
        }
        if (!this.isDraggingWindow)
            return;
        let mousePos = Utils.activeMouse.GetPosition();
        let headerHeight = headerSection.clientHeight + Utils.GetFromRootPX("--header-border-size");
        mousePos.y -= headerHeight;
        let windowOffset = Utils.GetVectorPropertyPX(this.windowRoot, "--offset");
        let updatedWindowPos = mousePos.Minus(windowOffset.x, windowOffset.y).Minus(this.dragOffset.x, this.dragOffset.y);
        updatedWindowPos.x = Utils.Clamp(updatedWindowPos.x, -windowOffset.x, windowOffset.x);
        updatedWindowPos.y = Utils.Clamp(updatedWindowPos.y, -windowOffset.y, windowOffset.y);
        Utils.SetVectorPropertyPX(this.windowRoot, "--position", updatedWindowPos);
    }
    HandleResizing() {
        if (this.windowRoot === null)
            return;
        let mouseDiff = this.MouseDiffFromOrigin(), windowSize = Utils.GetVectorPropertyPX(this.windowRoot, "--size");
        let vecDistFromTopLeft = mouseDiff.Abs(), vecDistFromBottomRight = windowSize.Minus(mouseDiff.x, mouseDiff.y).Abs();
        let currentResizeSide = WindowResizeSide.None;
        if (vecDistFromTopLeft.x <= borderInteractSize)
            currentResizeSide |= WindowResizeSide.Left;
        if (vecDistFromTopLeft.y <= borderInteractSize)
            currentResizeSide |= WindowResizeSide.Top;
        if (vecDistFromBottomRight.x <= borderInteractSize)
            currentResizeSide |= WindowResizeSide.Right;
        if (vecDistFromBottomRight.y <= borderInteractSize)
            currentResizeSide |= WindowResizeSide.Bottom;
        let hasTappedMouse = Utils.activeMouse.IsTapped(), hasReleasedMouse = Utils.activeMouse.IsReleased();
        let isCurrentResizingAllowed = cursorModeMap.has(currentResizeSide);
        let startedToResize = isCurrentResizingAllowed && hasTappedMouse;
        if (startedToResize)
            this.activeResizeSide = currentResizeSide;
        if (hasReleasedMouse)
            this.activeResizeSide = WindowResizeSide.None;
        let currentMouseMode = this.activeResizeSide;
        if (this.activeResizeSide === WindowResizeSide.None)
            currentMouseMode = currentResizeSide;
        let isMouseModeNonDefault = cursorModeMap.has(currentMouseMode) && !this.isDraggingWindow && !this.isClosing;
        document.documentElement.style.cursor = isMouseModeNonDefault ? cursorModeMap.get(currentMouseMode) : "default";
        let isActiveResizeAllowed = cursorModeMap.has(this.activeResizeSide);
        if (isActiveResizeAllowed)
            this.ResizeWindow();
    }
    MouseDiffFromOrigin() {
        if (this.windowRoot === null)
            return Utils.Vec2.Zero();
        let mousePos = Utils.activeMouse.GetPosition();
        let headerHeight = headerSection.clientHeight + Utils.GetFromRootPX("--header-border-size");
        mousePos.y -= headerHeight;
        let windowPos = Utils.GetVectorPropertyPX(this.windowRoot, "--position"), windowOffset = Utils.GetVectorPropertyPX(this.windowRoot, "--offset"), absolutePlaneWinPos = windowPos.Plus(windowOffset.x, windowOffset.y);
        return mousePos.Minus(absolutePlaneWinPos.x, absolutePlaneWinPos.y);
    }
    ResizeWindow() {
        if (this.windowRoot === null || this.titleSection === null || this.buttonsContainer === null)
            return;
        let mouseDiff = Utils.activeMouse.GetMousePosDiff();
        let windowSize = Utils.GetVectorPropertyPX(this.windowRoot, "--size"), windowPos = Utils.GetVectorPropertyPX(this.windowRoot, "--position");
        for (let currentResizeDir of orthogonalResizeSideArr) {
            let isResizingTowardDir = (this.activeResizeSide & currentResizeDir) !== 0;
            if (!isResizingTowardDir)
                continue;
            let isResizingWidth = currentResizeDir === WindowResizeSide.Left || currentResizeDir === WindowResizeSide.Right, willNegateSizeDiff = currentResizeDir === WindowResizeSide.Left || currentResizeDir === WindowResizeSide.Top, willChangePosition = willNegateSizeDiff;
            let resizedAxisIndex = isResizingWidth ? 0 : 1;
            let affectedAxisWinSize = windowSize.GetAxis(resizedAxisIndex), affectedAxisDiffValue = mouseDiff.GetAxis(resizedAxisIndex), affectedAxisWinPos = windowPos.GetAxis(resizedAxisIndex);
            let changedSizeValue = affectedAxisDiffValue;
            if (willNegateSizeDiff)
                changedSizeValue = -changedSizeValue;
            windowSize.SetAxis(resizedAxisIndex, affectedAxisWinSize + changedSizeValue);
            if (willChangePosition)
                windowPos.SetAxis(resizedAxisIndex, affectedAxisWinPos + affectedAxisDiffValue);
        }
        let windowHeaderHeight = Utils.GetFromRootPX("--window-header-height") + Utils.GetFromRootPX("--window-header-border-size"), minimumHeaderWidth = this.titleSection.clientWidth, hoveredButtonWidthMultiplier = Number(Utils.GetFromRoot("--button-max-width-multiplier"));
        for (let i = 0; i < this.buttonsContainer.children.length; i++) {
            let windowButton = this.buttonsContainer.children[i];
            let currentButtonWidth = windowButton.clientWidth;
            if (i === 0)
                currentButtonWidth *= hoveredButtonWidthMultiplier;
            let widthPaddingAndMargin = (Utils.GetPropertyPX(windowButton, "--button-border-size") + Utils.GetPropertyPX(windowButton, "--button-margin-width")) * 2;
            let totalButtonWidth = currentButtonWidth + widthPaddingAndMargin;
            minimumHeaderWidth += totalButtonWidth;
        }
        minimumHeaderWidth += Utils.GetFromRootPX("--window-buttons-container-padding") * 2;
        windowSize = new Utils.Vec2(Math.max(windowSize.x, minimumHeaderWidth), Math.max(windowSize.y, windowHeaderHeight));
        Utils.SetVectorPropertyPX(this.windowRoot, "--size", windowSize);
        Utils.SetVectorPropertyPX(this.windowRoot, "--position", windowPos);
    }
}
export let currentEditDialog = new VirtualWindow();
export function OpenEditDialog(shapeType) {
    let currentLayout = WindowLayout.windowsLayoutRoot.GetLayout(shapeType);
    if (currentLayout === null)
        return;
    currentEditDialog.Open(currentLayout);
    UpdateAbsolutePlaneElements();
}
export function UpdateAbsolutePlaneElements() {
    let planeSize = GetPlaneSize();
    for (let i = 0; i < absolutePlane.children.length; i++) {
        let currentElement = absolutePlane.children[i];
        let offsetIgnoreValue = Utils.GetProperty(currentElement, "--offset-ignore");
        let ignoreOffsetInElement = offsetIgnoreValue === "true";
        if (ignoreOffsetInElement)
            continue;
        let elementScale = Number(Utils.GetProperty(currentElement, "scale"));
        if (Number.isNaN(elementScale))
            elementScale = 1;
        let initialSizeScaled = Utils.GetVectorPropertyPX(currentElement, "--init-size").Times(elementScale);
        let elementOffset = planeSize.Minus(initialSizeScaled.x, initialSizeScaled.y).Divide(2);
        Utils.SetProperty(currentElement, "--offset-x", elementOffset.x.toString() + "px");
        Utils.SetProperty(currentElement, "--offset-y", elementOffset.y.toString() + "px");
    }
    currentEditDialog.HandleEvents();
}
function GetPlaneSize() {
    let planeSize = new Utils.Vec2(absolutePlane.clientWidth, absolutePlane.clientHeight);
    let headerHeight = headerSection.clientHeight + Utils.GetFromRootPX("--header-border-size");
    planeSize.y -= headerHeight;
    return planeSize;
}
