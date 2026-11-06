import * as Utils from "./Utils.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Parser from "./ProgramParser.js"
import * as ShapeRenderer from "./ShapeRenderer.js"

let prevMousePos: Utils.Vec2 = Utils.Vec2.Zero();
let planeCameraPos: Utils.Vec2 = Utils.Vec2.Zero();
let shapePlane: HTMLDivElement = document.getElementById("ShapePlane") as HTMLDivElement;
let openFileInput: HTMLInputElement = document.getElementById("OpenFileInput") as HTMLInputElement;
let headerSection: HTMLDivElement = document.getElementById("HeaderSection") as HTMLDivElement;
let openedProgram: Flowgorithm.Program = Flowgorithm.Program.Create();

function OnStart() {
    prevMousePos = Utils.GetMousePos();
    openFileInput.addEventListener("change", OnFileSelected);
    document.addEventListener("wheel", OnWheelScrolled);

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
    console.log(GetMouseWorldPosition());

    prevMousePos = mousePos.Copy();
    if (isHoldingMiddleButton) MoveShapePlane(mouseDiff);
    previousTimeSinceStarted = currentTimeSinceStarted;

    UpdateAllShapes();
    requestAnimationFrame(OnDraw);
}

function MoveShapePlane(mouseDiff: Utils.Vec2) {
    planeCameraPos = planeCameraPos.Plus(mouseDiff.x, mouseDiff.y);
    SetCameraPos(planeCameraPos);
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
        openedProgram.Render(Utils.Vec2.Zero());
    });
}

const scrollingMultiplier: number = 3.5;
const maximumZoomLevel: number = 5;
const allowZooming: boolean = true;

function GetZoomLevel(): number { return Number(Utils.GetProperty(shapePlane, "--zoom-level")); }

function OnWheelScrolled(event: WheelEvent) {
    if (!allowZooming) return;

    let usedScrollingMultiplier: number = 1 + (scrollingMultiplier - 1) * deltaTime;
    let scrollDirection: number = Math.sign(event.deltaY), currentZoomLevel: number = GetZoomLevel();
    if (scrollDirection == +1) currentZoomLevel /= usedScrollingMultiplier;
    if (scrollDirection == -1) currentZoomLevel *= usedScrollingMultiplier;
    
    let minimumZoomingLevel: number = 1.0 / maximumZoomLevel;
    currentZoomLevel = Utils.Clamp(currentZoomLevel, minimumZoomingLevel, maximumZoomLevel);
    Utils.SetProperty(shapePlane, "--zoom-level", currentZoomLevel.toString());

    let mouseWorldPos: Utils.Vec2 = GetMouseWorldPosition();
    //SetCameraPos(mouseWorldPos);
}

function GetMouseWorldPosition(): Utils.Vec2 {
    let currentZoomLevel: number = GetZoomLevel();

    let cameraPosition: Utils.Vec2 = new Utils.Vec2(Utils.GetPropertyPX(shapePlane, "--camera-x"), Utils.GetPropertyPX(shapePlane, "--camera-y"));
    let planeSize: Utils.Vec2 = new Utils.Vec2(shapePlane.clientWidth, shapePlane.clientHeight);
    let headerHeight: number = headerSection.clientHeight + Utils.GetFromRootPX("--header-border-size");
    let mousePosition: Utils.Vec2 = Utils.activeMouse.GetPosition(); mousePosition.y -= headerHeight;

    let mouseWorldPos: Utils.Vec2 = mousePosition.Minus(
        planeSize.x * ShapeRenderer.shapeOffsetMultiplier.x, planeSize.y * ShapeRenderer.shapeOffsetMultiplier.y
    ).Divide(currentZoomLevel);

    let worldPosOffset: Utils.Vec2 = cameraPosition.Divide(currentZoomLevel);
    mouseWorldPos = mouseWorldPos.Minus(worldPosOffset.x, worldPosOffset.y);

    return mouseWorldPos;
}

function UpdateAllShapes() {
    for (let i: number = 0; i < shapePlane.children.length; i++) {
        let currentShape: HTMLDivElement = shapePlane.children[i] as HTMLDivElement;
        ShapeRenderer.UpdateShapeProperties(currentShape);
    }
}

OnStart();