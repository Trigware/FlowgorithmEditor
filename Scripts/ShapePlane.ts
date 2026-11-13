import * as Utils from "./Utils.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Parser from "./ProgramParser.js"
import * as ShapeRenderer from "./ShapeRenderer.js"
import * as ShapeSelect from "./ShapeSelect.js"

let prevMousePos: Utils.Vec2 = Utils.Vec2.Zero();
let shapePlane: HTMLDivElement = document.getElementById("ShapePlane") as HTMLDivElement;
let openFileInput: HTMLInputElement = document.getElementById("OpenFileInput") as HTMLInputElement;
let headerSection: HTMLDivElement = document.getElementById("HeaderSection") as HTMLDivElement;
let openedProgram: Flowgorithm.Program = Flowgorithm.Program.Create();

function OnStart() {
    prevMousePos = Utils.GetMousePos();
    openFileInput.addEventListener("change", OnFileSelected);
    ShapeSelect.SetProgram(openedProgram);

    ResetCameraData();
    ShapeRenderer.SetPlane(shapePlane);
    openedProgram.Render(Utils.Vec2.Zero());

    OnDraw();
}

let previousTimeSinceStarted: number = 0;
let deltaTime: number = 0;

function OnDraw() {
    let currentTimeSinceStarted: number = Utils.GetTimeSinceStarted();
    let mousePos: Utils.Vec2 = Utils.GetMousePos();
    let isHoldingMiddleButton: boolean = Utils.activeMouse.IsHeld(Utils.MouseButton.Middle);
    let mouseDiff: Utils.Vec2 = mousePos.Minus(prevMousePos.x, prevMousePos.y);
    deltaTime = currentTimeSinceStarted - previousTimeSinceStarted;

    prevMousePos = mousePos.Copy();
    if (isHoldingMiddleButton) MoveShapePlane(mouseDiff);
    previousTimeSinceStarted = currentTimeSinceStarted;

    UpdateAllShapes();
    HandleZooming();
    ShapeSelect.HandleShapeSelect();
    requestAnimationFrame(OnDraw);
}

function MoveShapePlane(mouseDiff: Utils.Vec2) {
    let zoomLevel: number = GetZoomLevel();
    mouseDiff = mouseDiff.Divide(zoomLevel);
    let currentCameraPos: Utils.Vec2 = new Utils.Vec2(
        Utils.GetPropertyPX(shapePlane, "--camera-x"), Utils.GetPropertyPX(shapePlane, "--camera-y")
    );
    let updatedCameraPos: Utils.Vec2 = currentCameraPos.Plus(mouseDiff.x, mouseDiff.y);
    SetCameraPos(updatedCameraPos);
}

function SetCameraPos(cameraPos: Utils.Vec2) {
    Utils.SetProperty(shapePlane, "--camera-x", cameraPos.x.toString() + "px");
    Utils.SetProperty(shapePlane, "--camera-y", cameraPos.y.toString() + "px");
}

function OnFileSelected() {
    if (openFileInput.files === null || openFileInput.files.length === 0) return;
    let selectedFile: File = openFileInput.files[0];
    selectedFile.text().then((fileContent: string) => {
        Parser.Setup(openedProgram, fileContent);
        ResetCameraData();
        ShapeRenderer.selectedShapes.clear();
        openedProgram.Render(Utils.Vec2.Zero());
    });
}

const scrollingMultiplier: number = 3.5;
const minimumZoomLevel: number = 0.02, maximumZoomLevel: number = 5, defaultZoomLevel = 1;
const allowZooming: boolean = true;

function GetZoomLevel(): number { return Number(Utils.GetProperty(shapePlane, "--zoom-level")); }

function HandleZooming() {
    let skipZooming: boolean = !Utils.activeMouse.IsScrolling() || !allowZooming;
    if (skipZooming) return;
    let verticalScrollDir: number = Utils.activeMouse.GetScrollDir().y;

    let usedScrollingMultiplier: number = 1 + (scrollingMultiplier - 1) * deltaTime;
    let scrollDirection: number = Math.sign(verticalScrollDir), currentZoomLevel: number = GetZoomLevel();
    if (scrollDirection == +1) currentZoomLevel /= usedScrollingMultiplier;
    if (scrollDirection == -1) currentZoomLevel *= usedScrollingMultiplier;
    
    currentZoomLevel = Utils.Clamp(currentZoomLevel, minimumZoomLevel, maximumZoomLevel);
    Utils.SetProperty(shapePlane, "--zoom-level", currentZoomLevel.toString());
}

function UpdateAllShapes() {
    for (let i: number = 0; i < shapePlane.children.length; i++) {
        let currentShape: HTMLDivElement = shapePlane.children[i] as HTMLDivElement;
        ShapeRenderer.UpdateShapeProperties(currentShape);
    }
}

const defaultCameraOffset: Utils.Vec2 = new Utils.Vec2(0.5, 0.075);

function ResetCameraData() {
    Utils.SetProperty(shapePlane, "--zoom-level", defaultZoomLevel.toString());
    let planeSize: Utils.Vec2 = new Utils.Vec2(shapePlane.clientWidth, shapePlane.clientHeight);
    let headerHeight: number = headerSection.clientHeight;
    planeSize.y -= headerHeight;
    planeSize = planeSize.Divide(defaultZoomLevel);

    let defaultCameraPos: Utils.Vec2 = new Utils.Vec2(-planeSize.x / 2, -planeSize.y / 2);
    defaultCameraPos = defaultCameraPos.Plus(planeSize.x * defaultCameraOffset.x, planeSize.y * defaultCameraOffset.y);
    SetCameraPos(defaultCameraPos);
}

OnStart();