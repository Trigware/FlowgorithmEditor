import * as Utils from "./Utils.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Parser from "./ProgramParser.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
import * as ShapeSelect from "./ShapeSelect.js";
let prevMousePos = Utils.Vec2.Zero();
let shapePlane = document.getElementById("ShapePlane");
let openFileInput = document.getElementById("OpenFileInput");
let headerSection = document.getElementById("HeaderSection");
let openedProgram = Flowgorithm.Program.Create();
function OnStart() {
    prevMousePos = Utils.GetMousePos();
    openFileInput.addEventListener("change", OnFileSelected);
    ShapeSelect.SetProgram(openedProgram);
    ResetCameraData();
    ShapeRenderer.SetPlane(shapePlane);
    openedProgram.Render(Utils.Vec2.Zero());
    OnDraw();
}
let previousTimeSinceStarted = 0;
let deltaTime = 0;
function OnDraw() {
    let currentTimeSinceStarted = Utils.GetTimeSinceStarted();
    let mousePos = Utils.GetMousePos();
    let isHoldingMiddleButton = Utils.activeMouse.IsHeld(Utils.MouseButton.Middle);
    let mouseDiff = mousePos.Minus(prevMousePos.x, prevMousePos.y);
    deltaTime = currentTimeSinceStarted - previousTimeSinceStarted;
    prevMousePos = mousePos.Copy();
    if (isHoldingMiddleButton)
        MoveShapePlane(mouseDiff);
    previousTimeSinceStarted = currentTimeSinceStarted;
    UpdateAllShapes();
    HandleZooming();
    ShapeSelect.HandleShapeSelect();
    requestAnimationFrame(OnDraw);
}
function MoveShapePlane(mouseDiff) {
    let zoomLevel = GetZoomLevel();
    mouseDiff = mouseDiff.Divide(zoomLevel);
    let currentCameraPos = new Utils.Vec2(Utils.GetPropertyPX(shapePlane, "--camera-x"), Utils.GetPropertyPX(shapePlane, "--camera-y"));
    let updatedCameraPos = currentCameraPos.Plus(mouseDiff.x, mouseDiff.y);
    SetCameraPos(updatedCameraPos);
}
function SetCameraPos(cameraPos) {
    Utils.SetProperty(shapePlane, "--camera-x", cameraPos.x.toString() + "px");
    Utils.SetProperty(shapePlane, "--camera-y", cameraPos.y.toString() + "px");
}
function OnFileSelected() {
    if (openFileInput.files === null || openFileInput.files.length === 0)
        return;
    let selectedFile = openFileInput.files[0];
    selectedFile.text().then((fileContent) => {
        Parser.Setup(openedProgram, fileContent);
        ResetCameraData();
        ShapeRenderer.selectedShapes.clear();
        openedProgram.Render(Utils.Vec2.Zero());
    });
}
const scrollingMultiplier = 3.5;
const minimumZoomLevel = 0.02, maximumZoomLevel = 5, defaultZoomLevel = 1;
const allowZooming = true;
function GetZoomLevel() { return Number(Utils.GetProperty(shapePlane, "--zoom-level")); }
function HandleZooming() {
    let skipZooming = !Utils.activeMouse.IsScrolling() || !allowZooming;
    if (skipZooming)
        return;
    let verticalScrollDir = Utils.activeMouse.GetScrollDir().y;
    let usedScrollingMultiplier = 1 + (scrollingMultiplier - 1) * deltaTime;
    let scrollDirection = Math.sign(verticalScrollDir), currentZoomLevel = GetZoomLevel();
    if (scrollDirection == +1)
        currentZoomLevel /= usedScrollingMultiplier;
    if (scrollDirection == -1)
        currentZoomLevel *= usedScrollingMultiplier;
    currentZoomLevel = Utils.Clamp(currentZoomLevel, minimumZoomLevel, maximumZoomLevel);
    Utils.SetProperty(shapePlane, "--zoom-level", currentZoomLevel.toString());
}
function UpdateAllShapes() {
    for (let i = 0; i < shapePlane.children.length; i++) {
        let currentShape = shapePlane.children[i];
        ShapeRenderer.UpdateShapeProperties(currentShape);
    }
}
const defaultCameraOffset = new Utils.Vec2(0.5, 0.075);
function ResetCameraData() {
    Utils.SetProperty(shapePlane, "--zoom-level", defaultZoomLevel.toString());
    let planeSize = new Utils.Vec2(shapePlane.clientWidth, shapePlane.clientHeight);
    let headerHeight = headerSection.clientHeight;
    planeSize.y -= headerHeight;
    planeSize = planeSize.Divide(defaultZoomLevel);
    let defaultCameraPos = new Utils.Vec2(-planeSize.x / 2, -planeSize.y / 2);
    defaultCameraPos = defaultCameraPos.Plus(planeSize.x * defaultCameraOffset.x, planeSize.y * defaultCameraOffset.y);
    SetCameraPos(defaultCameraPos);
}
OnStart();
