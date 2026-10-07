const startPerformance = performance.now();
export class Vec2 {
    x = 0;
    y = 0;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static Zero() {
        return new Vec2(0, 0);
    }
    Plus(x, y) {
        return new Vec2(this.x + x, this.y + y);
    }
    Minus(x, y) {
        return new Vec2(this.x - x, this.y - y);
    }
    IsInsideOf(x, y, w, h) {
        return this.x >= x && this.y >= y && this.x <= w && this.y <= h;
    }
    Equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    ToString() {
        return `(x: ${this.x}, y: ${this.y})`;
    }
    Copy() {
        let copiedVector = Vec2.Zero();
        copiedVector.x = this.x;
        copiedVector.y = this.y;
        return copiedVector;
    }
}
export function GetTimeSinceStarted() {
    return (performance.now() - startPerformance) / 1000.0;
}
export function EaseInOut(t, power = 2) {
    if (t < 0.5)
        return Math.pow(2 * t, power) / 2;
    return 1 - Math.pow(2 * (1 - t), power) / 2;
}
export function EaseIn(t, power = 2) {
    return Math.pow(t, power);
}
export function Lerp(a, b, t) {
    return a + (b - a) * t;
}
export async function UseFileContents(fileDir, useFunction) {
    const usedDirectory = "./" + fileDir;
    const response = await fetch(usedDirectory);
    if (!response.ok)
        return;
    let fileContents = response.text();
    fileContents.then(useFunction);
}
export function GetPercentage(value) {
    return (value * 100).toString() + "%";
}
export function GetNumericPixels(value) {
    let suffixStartIndex = value.indexOf("px");
    let valueWithoutSuffix = value.substring(0, suffixStartIndex);
    let numericalValue = Number(valueWithoutSuffix);
    return numericalValue;
}
export function Clamp(value, min, max) {
    if (value < min)
        return min;
    if (value > max)
        return max;
    return value;
}
export function GetAnimationProgress(animationDelay, animationDuration) {
    let timeSinceStarted = GetTimeSinceStarted();
    let timeSinceAnimationStarted = Math.max(timeSinceStarted - animationDelay, 0);
    let animationProgress = Math.min(timeSinceAnimationStarted / animationDuration, 1);
    return animationProgress;
}
export function InverseLerp(a, b, v) {
    return (v - a) / b;
}
let mousePos = Vec2.Zero();
export function GetMousePos() { return mousePos; }
export function IsMouseInBox(box, offset = Vec2.Zero()) {
    let boxRect = box.getBoundingClientRect();
    boxRect.x += offset.x;
    boxRect.y += offset.y;
    let mousePos = GetMousePos();
    let mouseBoxOriginDiff = mousePos.Minus(boxRect.left, boxRect.top);
    let isMouseInBox = mouseBoxOriginDiff.IsInsideOf(0, 0, boxRect.width, boxRect.height);
    return isMouseInBox;
}
export function CreateElement(elementType, className, parent = null) {
    let createdElement = document.createElement(elementType);
    if (className !== "")
        createdElement.classList.add(className);
    if (parent !== null)
        parent.appendChild(createdElement);
    return createdElement;
}
const fsJSONFileName = "fs.json";
class ItemPath {
    itemPath = [];
    metadata = new Map();
    Extend(lastItemName) {
        let extendedItemPath = new ItemPath();
        for (let itemName of this.itemPath) {
            extendedItemPath.itemPath.push(itemName);
        }
        extendedItemPath.itemPath.push(lastItemName);
        return extendedItemPath;
    }
    static FromString(pathAsStr) {
        let result = new ItemPath();
        let splitPath = pathAsStr.split('/');
        let isLastSlash = splitPath.length > 0 && splitPath[splitPath.length - 1] === "";
        if (isLastSlash)
            splitPath.pop();
        result.itemPath = splitPath;
        return result;
    }
    GetName() {
        let pathLength = this.itemPath.length;
        if (pathLength === 0)
            return "";
        return this.itemPath[pathLength - 1];
    }
}
const directoryMetaKey = "*.meta";
class Directory {
    dirPath = new ItemPath();
    subFiles = [];
    subDirectories = [];
    constructor(directoryObject = null, itemPath = null) {
        if (directoryObject === null)
            return;
        let directoryMap = new Map(Object.entries(directoryObject));
        if (itemPath !== null)
            this.dirPath = itemPath;
        for (const itemKey of directoryMap.keys()) {
            if (itemKey === directoryMetaKey)
                continue;
            let itemObject = directoryMap.get(itemKey);
            let isDirectory = itemKey.endsWith("/");
            let subItemPath = this.dirPath.Extend(itemKey);
            let itemValueMap = new Map(Object.entries(itemObject));
            if (!isDirectory) {
                this.subFiles.push(subItemPath);
                subItemPath.metadata = itemValueMap;
                continue;
            }
            let nestedDir = new Directory(itemObject, subItemPath);
            let containsMetadata = itemValueMap.has(directoryMetaKey);
            if (containsMetadata)
                nestedDir.dirPath.metadata = itemValueMap.get(directoryMetaKey);
            this.subDirectories.push(nestedDir);
        }
    }
}
let projectRootDirectory = new Directory();
const doesContainFSJson = false;
let isMouseButtonHeld = false;
function OnStart() {
    document.addEventListener("mousemove", (event) => {
        mousePos.x = event.clientX;
        mousePos.y = event.clientY;
    });
    document.addEventListener("mousedown", () => { isMouseButtonHeld = true; });
    document.addEventListener("mouseup", () => { isMouseButtonHeld = false; });
    if (!doesContainFSJson)
        return;
    UseFileContents(fsJSONFileName, (jsonContents) => {
        let projectObject = JSON.parse(jsonContents);
        projectRootDirectory = new Directory(projectObject);
    });
}
export function IsMouseButtonHeld() {
    return isMouseButtonHeld;
}
export function GetFilesInDir(directoryPath) {
    let dirPath = ItemPath.FromString(directoryPath);
    let currentDirectory = projectRootDirectory;
    for (let itemName of dirPath.itemPath) {
        itemName += '/';
        let foundDirectory = false;
        for (let subDir of currentDirectory.subDirectories) {
            let dirPath = subDir.dirPath;
            let dirName = dirPath.GetName();
            let isSearchedDir = itemName === dirName;
            if (!isSearchedDir)
                continue;
            currentDirectory = subDir;
            foundDirectory = true;
            break;
        }
        if (!foundDirectory)
            throw new Error("Attempting to access invalid project file path!");
    }
    return currentDirectory.subFiles;
}
const localhostNames = ["localhost", "127.0.0.1", "::1"];
export function IsLocalHost() {
    return localhostNames.includes(window.location.hostname);
}
export function GetEnumValueFromName(enumObject, identifierName) {
    if (!(identifierName in enumObject))
        return null;
    return enumObject[identifierName];
}
export function RemoveTrailingSpaces(originalIdentifier) {
    let modifiedIdentifier = originalIdentifier;
    for (let i = 0; i < originalIdentifier.length; i++) {
        let ch = originalIdentifier[i];
        if (ch === ' ')
            continue;
        modifiedIdentifier = modifiedIdentifier.substring(i);
        break;
    }
    return modifiedIdentifier;
}
export function IsLetter(ch) {
    let letterRegex = /^\p{L}$/u;
    return letterRegex.test(ch);
}
export function IsNumber(ch) {
    return ch.length === 1 && ch >= '0' && ch <= '9';
}
export function IsSymbol(ch) {
    return ch.length === 1 && !IsLetter(ch) && !IsNumber(ch);
}
OnStart();
