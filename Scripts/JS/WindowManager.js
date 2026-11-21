import * as WindowLayout from "./VirtualWindowData.js";
import * as Utils from "./Utils.js";
let headerSection = document.getElementById("HeaderSection");
let absolutePlane = document.getElementById("AbsolutePlane");
const windowIconPath = "Assets/SaveFile.png";
var CardinalDirection;
(function (CardinalDirection) {
    CardinalDirection[CardinalDirection["Left"] = 0] = "Left";
    CardinalDirection[CardinalDirection["Right"] = 1] = "Right";
    CardinalDirection[CardinalDirection["Up"] = 2] = "Up";
    CardinalDirection[CardinalDirection["Down"] = 3] = "Down";
})(CardinalDirection || (CardinalDirection = {}));
export class VirtualWindow {
    isOpen = false;
    windowRoot = null;
    windowHeader = null;
    layoutData = null;
    isDraggingWindow = false;
    dragExceedLimitPoints = new Map();
    Open(windowLayout) {
        this.isOpen = true;
        this.windowRoot = Utils.CreateDiv("VirtualWindow", absolutePlane);
        this.layoutData = windowLayout;
        this.windowHeader = Utils.CreateDiv("WindowHeader", this.windowRoot);
        let titleSection = Utils.CreateDiv("WindowTitle", this.windowHeader), buttonsContainer = Utils.CreateDiv("WindowButtons", this.windowHeader);
        let windowIconElement = Utils.CreateElement("img", "", titleSection);
        windowIconElement.src = windowIconPath;
        let windowTitleElement = Utils.CreateElement("span", "", titleSection);
        windowTitleElement.textContent = this.layoutData.windowTitle;
        let windowExitButton = Utils.CreateDiv("WindowButtonExit", buttonsContainer);
        windowExitButton.addEventListener("click", () => { this.Close(); });
    }
    Close() {
        if (this.windowRoot === null)
            return;
        Utils.PlayAnimation(this.windowRoot, "WindowShowAnimation", true, () => {
            this.windowRoot?.remove();
            this.isOpen = false;
        });
    }
    HandleEvents() {
        this.HandleDragging();
    }
    HandleDragging() {
        if (!this.isOpen || this.windowRoot === null || this.windowHeader === null)
            return;
        let isHoveringOverHeader = Utils.HoversOverElement(this.windowHeader);
        let hasStartedToDrag = Utils.activeMouse.IsTapped() && isHoveringOverHeader, hasStoppedToDrag = Utils.activeMouse.IsReleased();
        if (hasStartedToDrag)
            this.isDraggingWindow = true;
        if (hasStoppedToDrag)
            this.isDraggingWindow = false;
        if (!this.isDraggingWindow)
            return;
        let mouseDiff = Utils.activeMouse.GetMousePosDiff();
        let latestWindowPos = Utils.GetVectorPropertyPX(this.windowRoot, "--position");
        let updatedWindowPos = latestWindowPos.Plus(mouseDiff.x, mouseDiff.y);
        let windowOffset = Utils.GetVectorPropertyPX(this.windowRoot, "--offset");
        let windowAbsolutePos = updatedWindowPos.Plus(windowOffset.x, windowOffset.y);
        let windowSpaceSize = new Utils.Vec2(absolutePlane.clientWidth, absolutePlane.clientHeight);
        windowSpaceSize.y -= headerSection.clientHeight;
        if (windowAbsolutePos.x < 0)
            updatedWindowPos.x = latestWindowPos.x;
        if (windowAbsolutePos.y < 0)
            updatedWindowPos.y = latestWindowPos.y;
        if (windowAbsolutePos.x > windowSpaceSize.x)
            updatedWindowPos.x = latestWindowPos.x;
        if (windowAbsolutePos.y > windowSpaceSize.y)
            updatedWindowPos.y = latestWindowPos.y;
        console.log(`ABS POS: ${windowAbsolutePos.ToString()}, SPACE SIZE: ${windowSpaceSize.ToString()}`);
        Utils.SetVectorPropertyPX(this.windowRoot, "--position", updatedWindowPos);
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
    let planeSize = new Utils.Vec2(absolutePlane.clientWidth, absolutePlane.clientHeight);
    planeSize.y -= headerSection.clientHeight;
    for (let i = 0; i < absolutePlane.children.length; i++) {
        let currentElement = absolutePlane.children[i];
        let offsetIgnoreValue = Utils.GetProperty(currentElement, "--offset-ignore");
        let ignoreOffsetInElement = offsetIgnoreValue === "true";
        if (ignoreOffsetInElement)
            continue;
        let elementScale = Number(Utils.GetProperty(currentElement, "scale"));
        if (Number.isNaN(elementScale))
            elementScale = 1;
        let elementSize = new Utils.Vec2(Utils.GetPropertyPX(currentElement, "--size-x"), Utils.GetPropertyPX(currentElement, "--size-y")).Times(elementScale);
        let elementOffset = planeSize.Minus(elementSize.x, elementSize.y).Divide(2);
        Utils.SetProperty(currentElement, "--offset-x", elementOffset.x.toString() + "px");
        Utils.SetProperty(currentElement, "--offset-y", elementOffset.y.toString() + "px");
    }
    currentEditDialog.HandleEvents();
}
