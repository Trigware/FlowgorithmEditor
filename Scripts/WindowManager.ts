import { ShapeType } from "./ShapeRenderer.js";
import * as WindowLayout from "./VirtualWindowData.js"
import * as Utils from "./Utils.js"

let headerSection: HTMLDivElement = document.getElementById("HeaderSection") as HTMLDivElement;
let absolutePlane: HTMLDivElement = document.getElementById("AbsolutePlane") as HTMLDivElement;

const windowIconPath: string = "Assets/SaveFile.png";

enum CardinalDirection { Left, Right, Up, Down }

export class VirtualWindow {
    public isOpen: boolean = false;

    private windowRoot: HTMLDivElement | null = null;
    private windowHeader: HTMLDivElement | null = null;
    private layoutData: WindowLayout.EditDialog | null = null;

    private isDraggingWindow: boolean = false;
    private dragExceedLimitPoints: Map<CardinalDirection, Utils.Vec2> = new Map();

    public Open(windowLayout: WindowLayout.EditDialog) {
        this.isOpen = true;
        this.windowRoot = Utils.CreateDiv("VirtualWindow", absolutePlane);
        this.layoutData = windowLayout;

        this.windowHeader = Utils.CreateDiv("WindowHeader", this.windowRoot);
        let titleSection: HTMLDivElement = Utils.CreateDiv("WindowTitle", this.windowHeader),
            buttonsContainer: HTMLDivElement = Utils.CreateDiv("WindowButtons", this.windowHeader);
        
        let windowIconElement: HTMLImageElement = Utils.CreateElement("img", "", titleSection) as HTMLImageElement;
        windowIconElement.src = windowIconPath;
        let windowTitleElement: HTMLSpanElement = Utils.CreateElement("span", "", titleSection);
        windowTitleElement.textContent = this.layoutData.windowTitle;

        let windowExitButton: HTMLDivElement = Utils.CreateDiv("WindowButtonExit", buttonsContainer);
        windowExitButton.addEventListener("click", () => { this.Close(); });
    }

    public Close() {
        if (this.windowRoot === null) return;

        Utils.PlayAnimation(this.windowRoot, "WindowShowAnimation", true, () => {
            this.windowRoot?.remove();
            this.isOpen = false;
        });
    }

    public HandleEvents() {
        this.HandleDragging();
    }

    private HandleDragging() {
        if (!this.isOpen || this.windowRoot === null || this.windowHeader === null) return;

        let isHoveringOverHeader: boolean = Utils.HoversOverElement(this.windowHeader);
        let hasStartedToDrag: boolean = Utils.activeMouse.IsTapped() && isHoveringOverHeader, hasStoppedToDrag: boolean = Utils.activeMouse.IsReleased();
        if (hasStartedToDrag) this.isDraggingWindow = true;
        if (hasStoppedToDrag) this.isDraggingWindow = false;
        if (!this.isDraggingWindow) return;

        let mouseDiff: Utils.Vec2 = Utils.activeMouse.GetMousePosDiff();
        let latestWindowPos: Utils.Vec2 = Utils.GetVectorPropertyPX(this.windowRoot, "--position");
        let updatedWindowPos: Utils.Vec2 = latestWindowPos.Plus(mouseDiff.x, mouseDiff.y);

        let windowOffset: Utils.Vec2 = Utils.GetVectorPropertyPX(this.windowRoot, "--offset");
        let windowAbsolutePos: Utils.Vec2 = updatedWindowPos.Plus(windowOffset.x, windowOffset.y);
        let windowSpaceSize: Utils.Vec2 = new Utils.Vec2(absolutePlane.clientWidth, absolutePlane.clientHeight);
        windowSpaceSize.y -= headerSection.clientHeight;
        let currentWindowSize: Utils.Vec2 = Utils.GetVectorPropertyPX(this.windowRoot, "--size");


        if (windowAbsolutePos.x < 0) updatedWindowPos.x = latestWindowPos.x;
        if (windowAbsolutePos.y < 0) updatedWindowPos.y = latestWindowPos.y;
        if (windowAbsolutePos.x > windowSpaceSize.x) updatedWindowPos.x = latestWindowPos.x;
        if (windowAbsolutePos.y > windowSpaceSize.y) updatedWindowPos.y = latestWindowPos.y;

        Utils.SetVectorPropertyPX(this.windowRoot, "--position", updatedWindowPos);
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
    let planeSize: Utils.Vec2 = new Utils.Vec2(absolutePlane.clientWidth, absolutePlane.clientHeight);
    planeSize.y -= headerSection.clientHeight;

    for (let i: number = 0; i < absolutePlane.children.length; i++) {
        let currentElement: HTMLElement = absolutePlane.children[i] as HTMLElement;
        let offsetIgnoreValue: string = Utils.GetProperty(currentElement, "--offset-ignore");
        let ignoreOffsetInElement: boolean = offsetIgnoreValue === "true";
        if (ignoreOffsetInElement) continue;

        let elementScale: number = Number(Utils.GetProperty(currentElement, "scale"));
        if (Number.isNaN(elementScale)) elementScale = 1;

        let elementSize: Utils.Vec2 = new Utils.Vec2(
            Utils.GetPropertyPX(currentElement, "--size-x"), Utils.GetPropertyPX(currentElement, "--size-y")
        ).Times(elementScale);

        let elementOffset: Utils.Vec2 = planeSize.Minus(elementSize.x, elementSize.y).Divide(2);
        Utils.SetProperty(currentElement, "--offset-x", elementOffset.x.toString() + "px");
        Utils.SetProperty(currentElement, "--offset-y", elementOffset.y.toString() + "px");
    }

    currentEditDialog.HandleEvents();
}