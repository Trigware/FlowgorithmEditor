const startPerformance = performance.now();

export class Vec2 {
    public x: number = 0;
    public y: number = 0;

    public constructor(x: number, y: number) { this.x = x; this.y = y; }
    public static Zero() { return new Vec2(0, 0); }

    public Plus(x: number, y: number): Vec2 { return new Vec2(this.x + x, this.y + y); }
    public Minus(x: number, y: number): Vec2 { return new Vec2(this.x - x, this.y - y); }
    public Times(x: number, y: number = x): Vec2 { return new Vec2(this.x * x, this.y * y); }
    public Divide(x: number, y: number = x): Vec2 { return new Vec2(this.x / x, this.y / y); }

    public IsInsideOf(x: number, y: number, w: number, h: number): boolean {
        return this.x >= x && this.y >= y && this.x <= w && this.y <= h;
    }
    public static FromAngleDeg(angleDegrees: number): Vec2 { return Vec2.FromAngleRad(DegToRad(angleDegrees)); }
    public static FromAngleRad(angleRadians: number): Vec2 { return new Vec2(Math.cos(angleRadians), Math.sin(angleRadians)); }

    public Equals(other: Vec2): boolean { return this.x === other.x && this.y === other.y; }
    public ToString(): string { return `(x: ${this.x}, y: ${this.y})`; }
    public Copy(): Vec2 {
        let copiedVector: Vec2 = Vec2.Zero();
        copiedVector.x = this.x; copiedVector.y = this.y;
        return copiedVector;
    }
}

export function GetTimeSinceStarted(): number {
    return (performance.now() - startPerformance) / 1000.0;
}

export function EaseInOut(t: number, power: number = 2): number {
    if (t < 0.5) return Math.pow(2 * t, power) / 2;
    return 1 - Math.pow(2 * (1 - t), power) / 2;
}

export function EaseIn(t: number, power: number = 2): number {
    return Math.pow(t, power);
}

export function Lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export async function UseFileContents(fileDir: string, useFunction: (fileContent: string) => void) {
    const usedDirectory: string = "./" + fileDir;
    const response: Response = await fetch(usedDirectory);
    if (!response.ok) return;
    let fileContents: Promise<string> = response.text();
    fileContents.then(useFunction);
}

export function GetPercentage(value: number): string {
    return (value * 100).toString() + "%";
}

export function GetNumericPixels(value: string): number {
    let suffixStartIndex: number = value.indexOf("px");
    let valueWithoutSuffix: string = value.substring(0, suffixStartIndex);
    let numericalValue: number = Number(valueWithoutSuffix);
    return numericalValue;
}

export function Clamp(value: number, min: number, max: number): number {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

export function GetAnimationProgress(animationDelay: number, animationDuration: number): number {
    let timeSinceStarted: number = GetTimeSinceStarted();
    let timeSinceAnimationStarted: number = Math.max(timeSinceStarted - animationDelay, 0);
    let animationProgress: number = Math.min(timeSinceAnimationStarted / animationDuration, 1);
    return animationProgress;
}

export function InverseLerp(a: number, b: number, v: number): number {
    return (v - a) / b;
}

let mousePos: Vec2 = Vec2.Zero();

export function GetMousePos(): Vec2 { return mousePos; }

export function IsMouseInBox(box: HTMLElement, offset: Vec2 = Vec2.Zero()) {
    let boxRect: DOMRect = box.getBoundingClientRect();
    boxRect.x += offset.x; boxRect.y += offset.y;
    let mousePos: Vec2 = GetMousePos();
    let mouseBoxOriginDiff: Vec2 = mousePos.Minus(boxRect.left, boxRect.top);
    let isMouseInBox: boolean = mouseBoxOriginDiff.IsInsideOf(0, 0, boxRect.width, boxRect.height);
    return isMouseInBox;
}

export function CreateElement<K extends keyof HTMLElementTagNameMap>(
    elementType: K, className: string, parent: HTMLElement | null = null
): HTMLElement {
    let createdElement: HTMLElement = document.createElement(elementType);
    if (className !== "") createdElement.classList.add(className);
    if (parent !== null) parent.appendChild(createdElement);
    return createdElement;
}

const fsJSONFileName: string = "fs.json";

class ItemPath {
    public itemPath: string[] = [];
    public metadata: Map<string, string> = new Map();

    public Extend(lastItemName: string) {
        let extendedItemPath: ItemPath = new ItemPath();
        for (let itemName of this.itemPath) { extendedItemPath.itemPath.push(itemName); }
        extendedItemPath.itemPath.push(lastItemName);
        return extendedItemPath;
    }

    public static FromString(pathAsStr: string): ItemPath {
        let result: ItemPath = new ItemPath();
        let splitPath: string[] = pathAsStr.split('/');

        let isLastSlash: boolean = splitPath.length > 0 && splitPath[splitPath.length - 1] === "";
        if (isLastSlash) splitPath.pop();
        result.itemPath = splitPath;

        return result;
    }

    public GetName(): string {
        let pathLength: number = this.itemPath.length;
        if (pathLength === 0) return "";
        return this.itemPath[pathLength - 1];
    }
}

const directoryMetaKey: string = "*.meta";

class Directory {
    public dirPath: ItemPath = new ItemPath();
    public subFiles: ItemPath[] = [];
    public subDirectories: Directory[] = [];

    public constructor(directoryObject: any = null, itemPath: ItemPath | null = null) {
        if (directoryObject === null) return;
        let directoryMap: Map<string, object> = new Map(Object.entries(directoryObject));
        if (itemPath !== null) this.dirPath = itemPath;
        
        for (const itemKey of directoryMap.keys()) {
            if (itemKey === directoryMetaKey) continue;

            let itemObject: object = directoryMap.get(itemKey)!;
            let isDirectory: boolean = itemKey.endsWith("/");
            let subItemPath: ItemPath = this.dirPath.Extend(itemKey);
            let itemValueMap: Map<string, any> = new Map(Object.entries(itemObject));

            if (!isDirectory) {
                this.subFiles.push(subItemPath);
                subItemPath.metadata = itemValueMap;
                continue;
            }

            let nestedDir: Directory = new Directory(itemObject, subItemPath);
            let containsMetadata: boolean = itemValueMap.has(directoryMetaKey);
            if (containsMetadata) nestedDir.dirPath.metadata = itemValueMap.get(directoryMetaKey);
            this.subDirectories.push(nestedDir);
        }
    }
}

let projectRootDirectory: Directory = new Directory();
const doesContainFSJson: boolean = false;
let isMouseButtonHeld: boolean = false;

function OnStart() {
    document.addEventListener("mousemove", (event) => {
        mousePos.x = event.clientX;
        mousePos.y = event.clientY;
    });
    document.addEventListener("mousedown", () => {isMouseButtonHeld = true;});
    document.addEventListener("mouseup", () => {isMouseButtonHeld = false;});

    if (!doesContainFSJson) return;
    UseFileContents(fsJSONFileName, (jsonContents: string) => {
        let projectObject: any = JSON.parse(jsonContents);
        projectRootDirectory = new Directory(projectObject);
    });
}

export function IsMouseButtonHeld() {
    return isMouseButtonHeld;
}

export function GetFilesInDir(directoryPath: string): ItemPath[] {
    let dirPath: ItemPath = ItemPath.FromString(directoryPath);
    let currentDirectory: Directory = projectRootDirectory;

    for (let itemName of dirPath.itemPath) {
        itemName += '/';
        let foundDirectory: boolean = false;

        for (let subDir of currentDirectory.subDirectories) {
            let dirPath: ItemPath = subDir.dirPath;
            let dirName: string = dirPath.GetName();

            let isSearchedDir: boolean = itemName === dirName;
            if (!isSearchedDir) continue;
            currentDirectory = subDir;
            foundDirectory = true;
            break;
        }

        if (!foundDirectory) throw new Error("Attempting to access invalid project file path!");
    }

    return currentDirectory.subFiles;
}

const localhostNames: string[] = ["localhost", "127.0.0.1", "::1"];
export function IsLocalHost(): boolean {
    return localhostNames.includes(window.location.hostname);
}

type EnumObject = Record<string, string | number>;

export function GetEnumValueFromName<T extends EnumObject>(enumObject: T, identifierName: string): T[keyof T] | null {
    if (!(identifierName in enumObject)) return null;
    return enumObject[identifierName as keyof T];
}


export function RemoveTrailingSpaces(originalIdentifier: string): string {
    let modifiedIdentifier: string = originalIdentifier;

    for (let i = 0; i < originalIdentifier.length; i++) {
        let ch: string = originalIdentifier[i];
        if (ch === ' ') continue;
        modifiedIdentifier = modifiedIdentifier.substring(i);
        break;
    }

    return modifiedIdentifier;
}

export function IsLetter(ch: string): boolean {
    let letterRegex: RegExp = /^\p{L}$/u;
    return letterRegex.test(ch);
}

export function IsNumber(ch: string): boolean {
    return ch.length === 1 && ch >= '0' && ch <= '9';
}

export function IsSymbol(ch: string): boolean {
    return ch.length === 1 && !IsLetter(ch) && !IsNumber(ch);
}

export function Log(base: number, result: number): number { return Math.log(result) / Math.log(base); }

export function GetProperty(element: HTMLElement, propertyStr: string): string {
    let computedPlaneStyle: CSSStyleDeclaration = getComputedStyle(element);
    let propertyValue: string = computedPlaneStyle.getPropertyValue(propertyStr);
    return propertyValue;
}

export function SetProperty(element: HTMLElement, propertyStr: string, propertyValue: string) {
    element.style.setProperty(propertyStr, propertyValue);
}

const degreesInPIRad: number = 180;
export function DegToRad(angleDegrees: number) { return angleDegrees * Math.PI / degreesInPIRad; }

OnStart();