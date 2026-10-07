import * as Utils from "./Utils.js"
import * as Identifier from "./Identifier.js"

enum TokenType {
    Unknown = -1,
    Identifier, UnaryOperator, BinaryOperator,
    IntegerLiteral, RealLiteral, StringLiteral, BooleanLiteral,
    GroupingOpen, GroupingClose, InvocationOpen, InvocationClose, SubscriptOpen, SubscriptClose
}

export enum IdentifierError {
    None,
    NonAlphanumeric, NumberAtStart, ReservedWord, IntrinsicFunction, MissingIdentifier
}

type TokenValue = number | boolean | string | OperatorType | null;

class ExprToken {
    public type: TokenType = TokenType.Unknown;
    public value: TokenValue = null;

    public constructor(tokenType: TokenType = TokenType.Unknown, tokenValue: TokenValue = null) {
        this.type = tokenType;
        this.value = tokenValue;
    }
}

enum OperatorType {
    Unknown = -1,
    LogicalOR, LogicalAND,
    GreaterThan, LesserThan, GreaterOrEqualTo, LesserOrEqualTo, EqualTo, NotEqualTo,
    Concatenate, Addition, Subtraction, Multiplication, Division, Modulo, Exponentiation,
    UnaryOpposite, UnaryNOT, CommaOperator
}

class OperatorInfo {
    public operatorType: OperatorType = OperatorType.Unknown;
    public tokenType: TokenType = TokenType.Unknown;
    public operatorIdentifiers: string[] = [];
    public precedenceLevel: number = 0;

    public constructor(operatorType: OperatorType = OperatorType.Unknown, tokenType: TokenType = TokenType.Unknown,
        identifiers: string[] = [], precedence: number = 0) {
        this.operatorType = operatorType; this.tokenType = tokenType;
        this.operatorIdentifiers = identifiers; this.precedenceLevel = precedence;
    }

    public static Binary(type: OperatorType, identifiers: string[], precedence: number): OperatorInfo {
        return new OperatorInfo(type, TokenType.BinaryOperator, identifiers, precedence);
    }

    public static Unary(type: OperatorType, identifiers: string[]): OperatorInfo {
        return new OperatorInfo(type, TokenType.UnaryOperator, identifiers, -1);
    }
}

const ignoredIdentifierErrors: Identifier.IdentifierError[] = [
    Identifier.IdentifierError.None, Identifier.IdentifierError.ReservedWord, Identifier.IdentifierError.IntrinsicFunction
];

const possibleOperatorArray: OperatorInfo[] = [
    OperatorInfo.Binary(OperatorType.CommaOperator, [","], 0),
    OperatorInfo.Binary(OperatorType.LogicalOR, ["or", "||", "∨"], 1), OperatorInfo.Binary(OperatorType.LogicalAND, ["and", "&&", "∧"], 2),

    OperatorInfo.Binary(OperatorType.GreaterThan, [">"], 3), OperatorInfo.Binary(OperatorType.LesserThan, ["<"], 3),
    OperatorInfo.Binary(OperatorType.GreaterOrEqualTo, [">=", "≥"], 3), OperatorInfo.Binary(OperatorType.LesserOrEqualTo, ["<=", "≤"], 3),
    OperatorInfo.Binary(OperatorType.EqualTo, ["==", "="], 3), OperatorInfo.Binary(OperatorType.NotEqualTo, ["!=", "<>", "≠"], 3),

    OperatorInfo.Binary(OperatorType.Concatenate, ["&"], 4),
    OperatorInfo.Binary(OperatorType.Addition, ["+"], 5), OperatorInfo.Binary(OperatorType.Subtraction, ["-"], 5),
    OperatorInfo.Binary(OperatorType.Multiplication, ["*", "×"], 6), OperatorInfo.Binary(OperatorType.Division, ["/", "÷"], 6), OperatorInfo.Binary(OperatorType.Modulo, ["mod", "%"], 6),
    OperatorInfo.Binary(OperatorType.Exponentiation, ["^", "↑"], 7),

    OperatorInfo.Unary(OperatorType.UnaryOpposite, ["-"]), OperatorInfo.Unary(OperatorType.UnaryNOT, ["!", "not", "¬"])
];

const booleanLiterals: string[] = ["true", "false"];

enum ExpressionError {
    Unknown = -1,
    UnmatchedParenthesis, InvalidParenthesis, UnterminatedString,
    InvalidBinaryOperator, InvalidUnaryOperator, InvalidOperatorTokenType
}

export class Expression {
    public tokens: ExprToken[] = [];
    public expressionErrors: ExpressionError[] = [];

    private accumilatedStr: string = "";
    private previousTokenStr: string = "";
    private currentOperatorStr: string = "";
    private inStringLiteral: boolean = false;
    private accumilatedSpecialToken: string = "";
    private opennedGroupers: GroupingInfo[] = [];

    public static FromString(exprAsStr: string): Expression {
        let resultingExpr: Expression = new Expression();

        for (let i = 0; i < exprAsStr.length; i++) {
            let ch: string = exprAsStr[i];
            let isAlphanum: boolean = Utils.IsLetter(ch) || Utils.IsNumber(ch);

            if (ch === '"') { resultingExpr.ParseApostrophe(); continue; }
            if (isAlphanum || resultingExpr.inStringLiteral) { resultingExpr.accumilatedStr += ch; continue; }

            resultingExpr.ParseToken(resultingExpr.accumilatedStr);
            resultingExpr.ParseToken(ch);
            resultingExpr.accumilatedStr = "";
        }

        resultingExpr.ParseToken(resultingExpr.accumilatedStr);
        resultingExpr.ParseSymbol();
        let hasUnmatchedParenthesis: boolean = resultingExpr.opennedGroupers.length > 0;
        if (hasUnmatchedParenthesis) resultingExpr.AddError(ExpressionError.UnmatchedParenthesis);
        if (resultingExpr.inStringLiteral) resultingExpr.AddError(ExpressionError.UnterminatedString);

        return resultingExpr;
    }

    private ParseApostrophe() {
        this.ParseSymbol();
        this.inStringLiteral = !this.inStringLiteral;
        let literalEnded: boolean = !this.inStringLiteral;
        if (!literalEnded) return;
        
        this.AddToken(TokenType.StringLiteral, this.accumilatedStr);
        this.accumilatedStr = "";
    }

    private ParseToken(tokenAsStr: string) {
        if (tokenAsStr.length === 0 || tokenAsStr === " ") return;

        let latestToken: ExprToken = this.GetLatestToken();
        let tokenAsNumber: number = Number(tokenAsStr);
        let isTokenNumber: boolean = !Number.isNaN(tokenAsNumber);
        let isRealLiteral: boolean = latestToken.type === TokenType.IntegerLiteral && isTokenNumber && this.previousTokenStr === '.';

        let identifierValidity: Identifier.IdentifierError = Identifier.GetIdentifierValidity(tokenAsStr);
        let isTokenIdentifier: boolean = ignoredIdentifierErrors.includes(identifierValidity);
        let loweredToken: string = tokenAsStr.toLowerCase();
        let isSymbol: boolean = tokenAsStr.length === 1 && !Utils.IsNumber(tokenAsStr) && !Utils.IsLetter(tokenAsStr);
        let symbolEnded: boolean = !isSymbol && this.accumilatedSpecialToken.length > 0;

        this.previousTokenStr = tokenAsStr;

        if (isSymbol) { this.accumilatedSpecialToken += tokenAsStr; return; }
        if (symbolEnded) this.ParseSymbol();

        if (isRealLiteral) { this.ParseRealLiteral(latestToken, tokenAsStr); return; }

        if (isTokenNumber) { this.AddToken(TokenType.IntegerLiteral, tokenAsNumber); return; }
        if (isTokenIdentifier) { this.ParseIdentifier(loweredToken); return; }
    }

    private AddToken(tokenType: TokenType = TokenType.Unknown, tokenValue: TokenValue = null) {
        let currentToken: ExprToken = new ExprToken(tokenType, tokenValue);
        this.tokens.push(currentToken);
    }

    private ParseRealLiteral(latestToken: ExprToken, tokenAsStr: string) {
        let specialTokenLength: number = this.accumilatedSpecialToken.length;
        this.accumilatedSpecialToken = this.accumilatedSpecialToken.substring(0, specialTokenLength - 2);

        let valueAsStr: string = (latestToken.value as number).toString();
        valueAsStr += '.' + tokenAsStr;
        let tokenValue: number = Number(valueAsStr);
        this.ReplaceLatestToken(TokenType.RealLiteral, tokenValue);
    }

    private AddError(expressionError: ExpressionError) { this.expressionErrors.push(expressionError); }

    private ReplaceLatestToken(tokenType: TokenType, tokenValue: TokenValue = null) {
        let tokenCount: number = this.tokens.length;
        if (tokenCount === 0) return;

        let currentToken: ExprToken = new ExprToken(tokenType, tokenValue);
        this.tokens.pop();
        this.tokens.push(currentToken);
    }

    private GetLatestToken(): ExprToken {
        let tokenCount: number = this.tokens.length;
        let tokenListIsEmpty: boolean = tokenCount === 0;
        if (tokenListIsEmpty) return new ExprToken();

        let latestToken: ExprToken = this.tokens[tokenCount - 1];
        return latestToken;
    }

    private ParseIdentifier(identifierName: string) {
        let isBooleanLiteral: boolean = booleanLiterals.includes(identifierName);
        if (isBooleanLiteral) { this.AddToken(TokenType.BooleanLiteral, identifierName === "true"); return; }

        let identifierAsOperator: OperatorInfo = GetOperatorByIdentifier(identifierName);
        let isValidOperator: boolean = identifierAsOperator.operatorType !== OperatorType.Unknown;
        if (!isValidOperator) { this.AddToken(TokenType.Identifier, identifierName); return; }

        let previousToken: ExprToken = this.GetLatestToken();
        let previousTokenType: TokenType = previousToken.type;
        let shouldBeBinaryOp: boolean = IsOperand(previousTokenType);

        let intendedOperatorType: TokenType = shouldBeBinaryOp ? TokenType.BinaryOperator : TokenType.UnaryOperator;
        let matchesIntendedOperatorType: boolean = identifierAsOperator.tokenType === intendedOperatorType;
        if (!matchesIntendedOperatorType) this.AddError(ExpressionError.InvalidOperatorTokenType);
        this.AddToken(identifierAsOperator.tokenType, identifierAsOperator.operatorType);
    }

    private ParseSymbol() {
        if (this.accumilatedSpecialToken.length === 0) return;
        this.currentOperatorStr = "";

        for (let ch of this.accumilatedSpecialToken) {
            let charAsGrouping: GroupingInfo | null = GetGroupingBySymbol(ch);
            if (charAsGrouping !== null) { this.ParseParenthesis(charAsGrouping); this.ParseOperator(); continue; }
            this.currentOperatorStr += ch;
        }

        this.ParseOperator();
        this.accumilatedSpecialToken = "";
    }

    private ParseParenthesis(groupingInfo: GroupingInfo) {
        let latestToken: ExprToken = this.GetLatestToken();
        let isLatestOperand: boolean = IsOperand(latestToken.type);

        if (!groupingInfo.isClosing) {
            let followsIdentifier: boolean = latestToken.type == TokenType.Identifier;
            let openningGroupingTokenType: TokenType = followsIdentifier ? groupingInfo.afterIdentifierType : groupingInfo.withoutIdentifierType;
            groupingInfo.followsIdentifier = followsIdentifier;

            this.opennedGroupers.push(groupingInfo);
            this.AddToken(openningGroupingTokenType);
            return;
        }

        if (this.opennedGroupers.length === 0) { this.AddError(ExpressionError.UnmatchedParenthesis); return; }

        let matchingGrouper: GroupingInfo = this.opennedGroupers.pop()!;
        let isInvalidGrouper: boolean = groupingInfo.parenthesisType !== matchingGrouper.parenthesisType;
        if (isInvalidGrouper) { this.AddError(ExpressionError.InvalidParenthesis); return; }

        let closesIdentifierGrouper: boolean = matchingGrouper.followsIdentifier;
        let closingGroupingTokenType: TokenType = closesIdentifierGrouper ? groupingInfo.afterIdentifierType : groupingInfo.withoutIdentifierType;
        this.AddToken(closingGroupingTokenType);
    }

    private ParseOperator() {
        if (this.currentOperatorStr === "") return;
        let latestToken: ExprToken = this.GetLatestToken();
        let startsWithBinary: boolean = IsOperand(latestToken.type);
        let unaryParseStart: number = 0;
        if (startsWithBinary) unaryParseStart = this.ParseBinaryOperator();

        this.ParseUnaryOperators(unaryParseStart);
        this.currentOperatorStr = "";
    }

    private ParseBinaryOperator(): number {
        let biggestBinaryOperator: OperatorType = OperatorType.Unknown;
        let biggestOperatorAsStr: string = "";

        for (let i = 0; i < this.currentOperatorStr.length; i++) {
            let currentOpStr: string = this.currentOperatorStr.substring(0, i + 1);
            let currentOperator: OperatorInfo = GetOperatorByIdentifier(currentOpStr, TokenType.BinaryOperator);
            let isOperatorValid: boolean = currentOperator.tokenType === TokenType.BinaryOperator;
            if (!isOperatorValid) continue;

            biggestBinaryOperator = currentOperator.operatorType;
            biggestOperatorAsStr = currentOpStr;
        }

        let isBinaryOperatorInvalid: boolean = biggestBinaryOperator === OperatorType.Unknown;
        if (isBinaryOperatorInvalid) this.AddError(ExpressionError.InvalidBinaryOperator);
        this.AddToken(TokenType.BinaryOperator, biggestBinaryOperator);
        return biggestOperatorAsStr.length;
    }

    private ParseUnaryOperators(unaryParseStart: number) {
        for (let i: number = unaryParseStart; i < this.currentOperatorStr.length; i++) {
            let ch: string = this.currentOperatorStr[i];
            let chAsOperator: OperatorInfo = GetOperatorByIdentifier(ch, TokenType.UnaryOperator);
            let isUnaryInvalid: boolean = chAsOperator.tokenType === TokenType.Unknown;
            if (isUnaryInvalid) { this.AddError(ExpressionError.InvalidBinaryOperator); continue; }
            this.AddToken(TokenType.UnaryOperator, chAsOperator.operatorType);
        }
    }
}

enum ParenthesisType {
    Unknown = -1, Regular, Bracketed
}

class GroupingInfo {
    public afterIdentifierType: TokenType = TokenType.Unknown;
    public withoutIdentifierType: TokenType = TokenType.Unknown;
    public parenthesisType: ParenthesisType = ParenthesisType.Unknown;
    public isClosing: boolean = false;
    public followsIdentifier: boolean = false;

    public constructor(parenthesisType: ParenthesisType = ParenthesisType.Unknown,
        closing: boolean, afterIdentifierType: TokenType, withoutIdentifierType: TokenType = TokenType.Unknown) {
        this.parenthesisType = parenthesisType;
        this.afterIdentifierType = afterIdentifierType; this.withoutIdentifierType = withoutIdentifierType;
        this.isClosing = closing;
    }
}

const specialGroupingSymbolsMap: Map<string, GroupingInfo> = new Map([
    ["(", new GroupingInfo(ParenthesisType.Regular, false, TokenType.InvocationOpen, TokenType.GroupingOpen)],
    [")", new GroupingInfo(ParenthesisType.Regular, true, TokenType.InvocationClose, TokenType.GroupingClose)],
    ["[", new GroupingInfo(ParenthesisType.Bracketed, false, TokenType.SubscriptOpen)],
    ["]", new GroupingInfo(ParenthesisType.Bracketed, true, TokenType.SubscriptClose)]
]);

const operatorTypesAsTokens: TokenType[] = [TokenType.UnaryOperator, TokenType.BinaryOperator];

function GetOperatorByIdentifier(operatorIdentifier: string, filterMode: TokenType = TokenType.Unknown): OperatorInfo {
    operatorIdentifier = operatorIdentifier.toLowerCase();

    for (let currentOperator of possibleOperatorArray) {
        let foundOperator: boolean = currentOperator.operatorIdentifiers.includes(operatorIdentifier);
        let isFilterApplied: boolean = operatorTypesAsTokens.includes(filterMode);
        if (isFilterApplied && foundOperator) foundOperator = currentOperator.tokenType === filterMode;

        if (foundOperator) return currentOperator;
    }

    return new OperatorInfo();
}

function GetGroupingBySymbol(symbol: string): GroupingInfo | null {
    if (specialGroupingSymbolsMap.has(symbol)) return specialGroupingSymbolsMap.get(symbol)!;
    return null;
}

const operandTokens: TokenType[] = [
    TokenType.Identifier,
    TokenType.IntegerLiteral, TokenType.RealLiteral, TokenType.StringLiteral, TokenType.BooleanLiteral,
    TokenType.GroupingClose, TokenType.InvocationClose, TokenType.SubscriptClose
];

function IsOperand(tokenType: TokenType): boolean { return operandTokens.includes(tokenType); }