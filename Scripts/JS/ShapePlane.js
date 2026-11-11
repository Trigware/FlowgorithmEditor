import * as Utils from "./Utils.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Parser from "./ProgramParser.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
let prevMousePos = Utils.Vec2.Zero();
let planeCameraPos = Utils.Vec2.Zero();
let shapePlane = document.getElementById("ShapePlane");
let openFileInput = document.getElementById("OpenFileInput");
let headerSection = document.getElementById("HeaderSection");
let openedProgram = Flowgorithm.Program.Create();
function OnStart() {
    prevMousePos = Utils.GetMousePos();
    openFileInput.addEventListener("change", OnFileSelected);
    document.addEventListener("wheel", OnWheelScrolled);
    ShapeRenderer.SetPlane(shapePlane);
    openedProgram.Render(Utils.Vec2.Zero());
    UpdateAllShapes(true);
    OnDraw();
}
let previousCameraPos = Utils.Vec2.Zero();
let previousTimeSinceStarted = 0;
let hasZoomedSinceLastFrame = false;
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
    requestAnimationFrame(OnDraw);
}
function MoveShapePlane(mouseDiff) {
    let zoomLevel = GetZoomLevel();
    mouseDiff = mouseDiff.Divide(zoomLevel);
    planeCameraPos = planeCameraPos.Plus(mouseDiff.x, mouseDiff.y);
    SetCameraPos(planeCameraPos);
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
        openedProgram.Render(Utils.Vec2.Zero());
        UpdateAllShapes(true);
    });
}
const scrollingMultiplier = 3.5;
const maximumZoomLevel = 50;
const allowZooming = true;
function GetZoomLevel() { return Number(Utils.GetProperty(shapePlane, "--zoom-level")); }
function OnWheelScrolled(event) {
    if (!allowZooming)
        return;
    let usedScrollingMultiplier = 1 + (scrollingMultiplier - 1) * deltaTime;
    let scrollDirection = Math.sign(event.deltaY), currentZoomLevel = GetZoomLevel();
    if (scrollDirection == +1)
        currentZoomLevel /= usedScrollingMultiplier;
    if (scrollDirection == -1)
        currentZoomLevel *= usedScrollingMultiplier;
    let minimumZoomingLevel = 1.0 / maximumZoomLevel;
    currentZoomLevel = Utils.Clamp(currentZoomLevel, minimumZoomingLevel, maximumZoomLevel);
    Utils.SetProperty(shapePlane, "--zoom-level", currentZoomLevel.toString());
    hasZoomedSinceLastFrame = true;
}
function UpdateAllShapes(forcedUpdate = false) {
    let currentCameraPos = new Utils.Vec2(Utils.GetPropertyPX(shapePlane, "--camera-x"), Utils.GetPropertyPX(shapePlane, "--camera-y"));
    let hasCameraMoved = !currentCameraPos.Equals(previousCameraPos);
    let willUpdate = forcedUpdate || hasCameraMoved || hasZoomedSinceLastFrame;
    previousCameraPos = currentCameraPos.Copy();
    hasZoomedSinceLastFrame = false;
    if (!willUpdate)
        return;
    for (let i = 0; i < shapePlane.children.length; i++) {
        let currentShape = shapePlane.children[i];
        ShapeRenderer.UpdateShapeProperties(currentShape);
    }
}
OnStart();
