import * as Utils from "./Utils.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Parser from "./ProgramParser.js";
import * as ShapeRenderer from "./ShapeRenderer.js";
let prevMousePos = Utils.Vec2.Zero();
let planeCameraPos = Utils.Vec2.Zero();
let shapePlane = document.getElementById("ShapePlane");
let openFileInput = document.getElementById("OpenFileInput");
let openedProgram = Flowgorithm.Program.Create();
function OnStart() {
    prevMousePos = Utils.GetMousePos();
    openFileInput.addEventListener("change", OnFileSelected);
    document.addEventListener("wheel", OnWheelScrolled);
    ShapeRenderer.SetPlane(shapePlane);
    openedProgram.Render(Utils.Vec2.Zero());
    OnDraw();
}
let previousTimeSinceStarted = 0;
let deltaTime = 0;
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
    UpdateAllShapes();
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
        openedProgram.Render(Utils.Vec2.Zero());
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
function UpdateAllShapes() {
    for (let i = 0; i < shapePlane.children.length; i++) {
        let currentShape = shapePlane.children[i];
        ShapeRenderer.UpdateShapeProperties(currentShape);
    }
}
OnStart();
