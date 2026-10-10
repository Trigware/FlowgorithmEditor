import * as Utils from "./Utils.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Parser from "./ProgramParser.js";
import * as Renderer from "./ScriptRenderer.js";
let prevMousePos = Utils.Vec2.Zero();
let planeCameraPos = Utils.Vec2.Zero();
let shapePlane = document.getElementById("ShapePlane");
let openFileInput = document.getElementById("OpenFileInput");
let openedProgram = Flowgorithm.Program.Create();
function OnStart() {
    prevMousePos = Utils.GetMousePos();
    openFileInput.addEventListener("change", OnFileSelected);
    document.addEventListener("wheel", OnWheelScrolled);
    Renderer.RenderScript(openedProgram, shapePlane);
    OnDraw();
}
let previousTimeSinceStarted = 0;
let deltaTime = 0;
const shapeOffsetMultiplier = new Utils.Vec2(0.5, 0.075);
function OnDraw() {
    let currentTimeSinceStarted = Utils.GetTimeSinceStarted();
    let mousePos = Utils.GetMousePos();
    let holdingMouse = Utils.IsMouseButtonHeld();
    let mouseDiff = mousePos.Minus(prevMousePos.x, prevMousePos.y);
    deltaTime = currentTimeSinceStarted - previousTimeSinceStarted;
    prevMousePos = mousePos.Copy();
    if (holdingMouse)
        MoveShapePlane(mouseDiff);
    previousTimeSinceStarted = currentTimeSinceStarted;
    UpdateShapeOffset();
    requestAnimationFrame(OnDraw);
}
function MoveShapePlane(mouseDiff) {
    planeCameraPos = planeCameraPos.Plus(mouseDiff.x, mouseDiff.y);
    shapePlane.style.setProperty("--camera-x", `${planeCameraPos.x.toString()}px`);
    shapePlane.style.setProperty("--camera-y", `${planeCameraPos.y.toString()}px`);
}
function OnFileSelected() {
    if (openFileInput.files === null || openFileInput.files.length === 0)
        return;
    let selectedFile = openFileInput.files[0];
    selectedFile.text().then((fileContent) => {
        Parser.Setup(openedProgram, fileContent);
        Renderer.RenderScript(openedProgram, shapePlane);
        console.log(openedProgram);
    });
}
const scrollingMultiplier = 3.5;
const maximumZoomLevel = 5;
function GetZoomLevel() { return Number(Utils.GetProperty(shapePlane, "--zoom-level")); }
function OnWheelScrolled(event) {
    let scrollDirection = Math.sign(event.deltaY);
    let currentZoomLevel = GetZoomLevel();
    let usedScrollMultiplier = 1 + (scrollingMultiplier - 1) * deltaTime;
    if (scrollDirection === -1)
        currentZoomLevel *= usedScrollMultiplier;
    if (scrollDirection === +1)
        currentZoomLevel /= usedScrollMultiplier;
    let minimumZoomLevel = 1.0 / maximumZoomLevel;
    currentZoomLevel = Utils.Clamp(currentZoomLevel, minimumZoomLevel, maximumZoomLevel);
    shapePlane.style.setProperty("--zoom-level", currentZoomLevel.toString());
}
function UpdateShapeOffset() {
    let planeSize = new Utils.Vec2(shapePlane.clientWidth, shapePlane.clientHeight);
    for (let i = 0; i < shapePlane.children.length; i++) {
        let currentShape = shapePlane.children[i];
        let shapeWidth = currentShape.clientWidth;
        let shapeOffset = planeSize.Times(shapeOffsetMultiplier.x, shapeOffsetMultiplier.y)
            .Minus(shapeWidth / 2, currentShape.clientHeight / 2);
        Utils.SetProperty(currentShape, "--offset-x", shapeOffset.x.toString() + "px");
        Utils.SetProperty(currentShape, "--offset-y", shapeOffset.y.toString() + "px");
        let defaultWidth = Utils.GetNumericPixels(Utils.GetProperty(currentShape, "--default-width"));
        let widthSizeIncrease = shapeWidth / defaultWidth;
        Utils.SetProperty(currentShape, "--width-size-increase", widthSizeIncrease.toString());
    }
}
OnStart();
