import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Utils from "./Utils.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import * as BaseNode from "./ProgramNode.js";

let selectionBox: HTMLDivElement = document.getElementById("SelectionBox") as HTMLDivElement;
let headerSection: HTMLDivElement = document.getElementById("HeaderSection") as HTMLDivElement;
let shapePlane: HTMLDivElement = document.getElementById("ShapePlane") as HTMLDivElement;

let wasLMBPreviouslyHeld: boolean = false, isInvalidSelection: boolean = false;
let hoveredWorldPosAtSelectStart: Utils.Vec2 = Utils.Vec2.Zero();

let currentProgram: Flowgorithm.Program = new Flowgorithm.Program();

export function SetProgram(program: Flowgorithm.Program) { currentProgram = program; }

export function HandleShapeSelect() {
    let isLMBHeld: boolean = Utils.activeMouse.IsHeld(Utils.MouseButton.Left);
    let isSelectionBoxVisible: boolean = isLMBHeld && !isInvalidSelection;
    Utils.SetProperty(selectionBox, "visibility", isSelectionBoxVisible ? "visible" : "hidden");
    let startedHoldingLMB: boolean = isLMBHeld && !wasLMBPreviouslyHeld;
    wasLMBPreviouslyHeld = isLMBHeld;

    let zoomLevel: number = Number(Utils.GetProperty(shapePlane, "--zoom-level"));
    Utils.SetProperty(selectionBox, "--zoom-level", zoomLevel.toString());
    let attemptingToPointSelect: boolean = Utils.activeMouse.IsTapped(Utils.MouseButton.Left);
    if (attemptingToPointSelect) HandleMouseInteraction();

    if (!isLMBHeld) {
        isInvalidSelection = false;
        return;
    }

    UpdateSelectionBox(startedHoldingLMB);
}

function UpdateSelectionBox(startedHoldingLMB: boolean) {
    let mousePosition: Utils.Vec2 = Utils.activeMouse.GetPosition();
    let headerHeight: number = GetHeaderHeight();

    if (startedHoldingLMB) {
        hoveredWorldPosAtSelectStart = ConvertAbsoluteToWorldPosition(mousePosition);
        isInvalidSelection = IsMouseInHeader();
    }

    let hoverStartAbsolutePos: Utils.Vec2 = ConvertWorldToAbsolutePosition(hoveredWorldPosAtSelectStart);
    let selectionBoxPos: Utils.Vec2 = new Utils.Vec2(
        Math.min(hoverStartAbsolutePos.x, mousePosition.x), Math.min(hoverStartAbsolutePos.y, mousePosition.y)
    ), selectionBoxSize: Utils.Vec2 = hoverStartAbsolutePos.Minus(mousePosition.x, mousePosition.y).Abs();
    selectionBoxPos.y -= headerHeight;

    Utils.SetProperty(selectionBox, "--position-x", selectionBoxPos.x.toString() + "px");
    Utils.SetProperty(selectionBox, "--position-y", selectionBoxPos.y.toString() + "px");
    Utils.SetProperty(selectionBox, "--size-x", selectionBoxSize.x.toString() + "px");
    Utils.SetProperty(selectionBox, "--size-y", selectionBoxSize.y.toString() + "px");
}

function IsMouseInHeader(): boolean {
    let mousePosition: Utils.Vec2 = Utils.activeMouse.GetPosition();
    let headerHeight: number = GetHeaderHeight();
    let isInsideOfHeader: boolean = mousePosition.y < headerHeight;
    return isInsideOfHeader;
}

function GetHeaderHeight(): number { return headerSection.clientHeight + Utils.GetPropertyPX(headerSection, "border-bottom-width") + 1; }
function GetPlaneSize(): Utils.Vec2 {
    let headerHeight: number = GetHeaderHeight();
    return new Utils.Vec2(shapePlane.clientWidth, shapePlane.clientHeight - headerHeight);
}

function ConvertAbsoluteToWorldPosition(absolutePosition: Utils.Vec2): Utils.Vec2 {
    let headerHeight: number = GetHeaderHeight(),
        zoomLevel: number = Number(Utils.GetProperty(shapePlane, "--zoom-level"));
    
    let viewportPosition: Utils.Vec2 = absolutePosition.Minus(0, headerHeight),
        cameraPosition: Utils.Vec2 = new Utils.Vec2(
            Utils.GetPropertyPX(shapePlane, "--camera-x"), Utils.GetPropertyPX(shapePlane, "--camera-y")
        );

    let viewportCenter: Utils.Vec2 = GetPlaneSize().Divide(2);
    
    let positionToCenterDiff: Utils.Vec2 = viewportPosition.Minus(viewportCenter.x, viewportCenter.y),
        scaledViewportToCenterDiff: Utils.Vec2 = positionToCenterDiff.Divide(zoomLevel);
    let worldPosition: Utils.Vec2 = scaledViewportToCenterDiff.Minus(cameraPosition.x, cameraPosition.y);

    return worldPosition;
}

function ConvertWorldToAbsolutePosition(worldPosition: Utils.Vec2): Utils.Vec2 {
    let zoomLevel: number = Number(Utils.GetProperty(shapePlane, "--zoom-level"));

    let scaledWorldPos: Utils.Vec2 = worldPosition.Times(zoomLevel);
    let viewportCenter: Utils.Vec2 = GetPlaneSize().Divide(2);
    let absolutePosition: Utils.Vec2 = scaledWorldPos.Plus(viewportCenter.x, viewportCenter.y);
    let headerHeight: number = GetHeaderHeight();
    absolutePosition.y += headerHeight;

    let cameraPosition: Utils.Vec2 = new Utils.Vec2(
        Utils.GetPropertyPX(shapePlane, "--camera-x"), Utils.GetPropertyPX(shapePlane, "--camera-y")
    ), scaledCameraPos: Utils.Vec2 = cameraPosition.Times(zoomLevel);
    absolutePosition = absolutePosition.Plus(scaledCameraPos.x, scaledCameraPos.y);

    return absolutePosition;
}

function HandleMouseInteraction() {
    let mousePosition: Utils.Vec2 = Utils.activeMouse.GetPosition(),
        clickedWorldPos: Utils.Vec2 = ConvertAbsoluteToWorldPosition(mousePosition);
    
    let clickInfo: BaseNode.ClickInfo = currentProgram.GetClickInformation(clickedWorldPos);
    for (let selectedShape of ShapeRenderer.selectedShapes) {
        let isClickedShape: boolean = clickInfo.clickedShape === selectedShape;
        if (!isClickedShape) selectedShape.OnClick(false);
    }
    if (clickInfo.clickedShape !== null) clickInfo.clickedShape.OnClick();
}