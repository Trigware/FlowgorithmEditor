import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Utils from "./Utils.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
let selectionBox = document.getElementById("SelectionBox");
let headerSection = document.getElementById("HeaderSection");
let shapePlane = document.getElementById("ShapePlane");
let wasLMBPreviouslyHeld = false, isInvalidSelection = false;
let hoveredWorldPosAtSelectStart = Utils.Vec2.Zero();
let currentProgram = new Flowgorithm.Program();
export function SetProgram(program) { currentProgram = program; }
export function HandleShapeSelect() {
    let isLMBHeld = Utils.activeMouse.IsHeld(Utils.MouseButton.Left);
    let isSelectionBoxVisible = isLMBHeld && !isInvalidSelection;
    Utils.SetProperty(selectionBox, "visibility", isSelectionBoxVisible ? "visible" : "hidden");
    let startedHoldingLMB = isLMBHeld && !wasLMBPreviouslyHeld;
    wasLMBPreviouslyHeld = isLMBHeld;
    let zoomLevel = Number(Utils.GetProperty(shapePlane, "--zoom-level"));
    Utils.SetProperty(selectionBox, "--zoom-level", zoomLevel.toString());
    let attemptingToPointSelect = Utils.activeMouse.IsTapped(Utils.MouseButton.Left);
    if (attemptingToPointSelect)
        HandleMouseInteraction();
    if (!isLMBHeld) {
        isInvalidSelection = false;
        return;
    }
    UpdateSelectionBox(startedHoldingLMB);
}
function UpdateSelectionBox(startedHoldingLMB) {
    let mousePosition = Utils.activeMouse.GetPosition();
    let headerHeight = GetHeaderHeight();
    if (startedHoldingLMB) {
        hoveredWorldPosAtSelectStart = ConvertAbsoluteToWorldPosition(mousePosition);
        isInvalidSelection = IsMouseInHeader();
    }
    let hoverStartAbsolutePos = ConvertWorldToAbsolutePosition(hoveredWorldPosAtSelectStart);
    let selectionBoxPos = new Utils.Vec2(Math.min(hoverStartAbsolutePos.x, mousePosition.x), Math.min(hoverStartAbsolutePos.y, mousePosition.y)), selectionBoxSize = hoverStartAbsolutePos.Minus(mousePosition.x, mousePosition.y).Abs();
    selectionBoxPos.y -= headerHeight;
    Utils.SetProperty(selectionBox, "--position-x", selectionBoxPos.x.toString() + "px");
    Utils.SetProperty(selectionBox, "--position-y", selectionBoxPos.y.toString() + "px");
    Utils.SetProperty(selectionBox, "--size-x", selectionBoxSize.x.toString() + "px");
    Utils.SetProperty(selectionBox, "--size-y", selectionBoxSize.y.toString() + "px");
}
function IsMouseInHeader() {
    let mousePosition = Utils.activeMouse.GetPosition();
    let headerHeight = GetHeaderHeight();
    let isInsideOfHeader = mousePosition.y < headerHeight;
    return isInsideOfHeader;
}
function GetHeaderHeight() { return headerSection.clientHeight + Utils.GetPropertyPX(headerSection, "border-bottom-width") + 1; }
function GetPlaneSize() {
    let headerHeight = GetHeaderHeight();
    return new Utils.Vec2(shapePlane.clientWidth, shapePlane.clientHeight - headerHeight);
}
function ConvertAbsoluteToWorldPosition(absolutePosition) {
    let headerHeight = GetHeaderHeight(), zoomLevel = Number(Utils.GetProperty(shapePlane, "--zoom-level"));
    let viewportPosition = absolutePosition.Minus(0, headerHeight), cameraPosition = new Utils.Vec2(Utils.GetPropertyPX(shapePlane, "--camera-x"), Utils.GetPropertyPX(shapePlane, "--camera-y"));
    let viewportCenter = GetPlaneSize().Divide(2);
    let positionToCenterDiff = viewportPosition.Minus(viewportCenter.x, viewportCenter.y), scaledViewportToCenterDiff = positionToCenterDiff.Divide(zoomLevel);
    let worldPosition = scaledViewportToCenterDiff.Minus(cameraPosition.x, cameraPosition.y);
    return worldPosition;
}
function ConvertWorldToAbsolutePosition(worldPosition) {
    let zoomLevel = Number(Utils.GetProperty(shapePlane, "--zoom-level"));
    let scaledWorldPos = worldPosition.Times(zoomLevel);
    let viewportCenter = GetPlaneSize().Divide(2);
    let absolutePosition = scaledWorldPos.Plus(viewportCenter.x, viewportCenter.y);
    let headerHeight = GetHeaderHeight();
    absolutePosition.y += headerHeight;
    let cameraPosition = new Utils.Vec2(Utils.GetPropertyPX(shapePlane, "--camera-x"), Utils.GetPropertyPX(shapePlane, "--camera-y")), scaledCameraPos = cameraPosition.Times(zoomLevel);
    absolutePosition = absolutePosition.Plus(scaledCameraPos.x, scaledCameraPos.y);
    return absolutePosition;
}
function HandleMouseInteraction() {
    let mousePosition = Utils.activeMouse.GetPosition(), clickedWorldPos = ConvertAbsoluteToWorldPosition(mousePosition);
    let clickInfo = currentProgram.GetClickInformation(clickedWorldPos);
    for (let selectedShape of ShapeRenderer.selectedShapes) {
        let isClickedShape = clickInfo.clickedShape === selectedShape;
        if (!isClickedShape)
            selectedShape.OnClick(false);
    }
    if (clickInfo.clickedShape !== null)
        clickInfo.clickedShape.OnClick();
}
