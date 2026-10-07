import * as Utils from "./Utils.js";
import * as Identifier from "./Identifier.js";
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Unknown"] = -1] = "Unknown";
    TokenType[TokenType["Identifier"] = 0] = "Identifier";
    TokenType[TokenType["UnaryOperator"] = 1] = "UnaryOperator";
    TokenType[TokenType["BinaryOperator"] = 2] = "BinaryOperator";
    TokenType[TokenType["IntegerLiteral"] = 3] = "IntegerLiteral";
    TokenType[TokenType["RealLiteral"] = 4] = "RealLiteral";
    TokenType[TokenType["StringLiteral"] = 5] = "StringLiteral";
    TokenType[TokenType["BooleanLiteral"] = 6] = "BooleanLiteral";
    TokenType[TokenType["GroupingOpen"] = 7] = "GroupingOpen";
    TokenType[TokenType["GroupingClose"] = 8] = "GroupingClose";
    TokenType[TokenType["InvocationOpen"] = 9] = "InvocationOpen";
    TokenType[TokenType["InvocationClose"] = 10] = "InvocationClose";
    TokenType[TokenType["SubscriptOpen"] = 11] = "SubscriptOpen";
    TokenType[TokenType["SubscriptClose"] = 12] = "SubscriptClose";
})(TokenType || (TokenType = {}));
export var IdentifierError;
(function (IdentifierError) {
    IdentifierError[IdentifierError["None"] = 0] = "None";
    IdentifierError[IdentifierError["NonAlphanumeric"] = 1] = "NonAlphanumeric";
    IdentifierError[IdentifierError["NumberAtStart"] = 2] = "NumberAtStart";
    IdentifierError[IdentifierError["ReservedWord"] = 3] = "ReservedWord";
    IdentifierError[IdentifierError["IntrinsicFunction"] = 4] = "IntrinsicFunction";
    IdentifierError[IdentifierError["MissingIdentifier"] = 5] = "MissingIdentifier";
})(IdentifierError || (IdentifierError = {}));
class ExprToken {
    type = TokenType.Unknown;
    value = null;
    constructor(tokenType = TokenType.Unknown, tokenValue = null) {
        this.type = tokenType;
        this.value = tokenValue;
    }
}
var OperatorType;
(function (OperatorType) {
    OperatorType[OperatorType["Unknown"] = -1] = "Unknown";
    OperatorType[OperatorType["LogicalOR"] = 0] = "LogicalOR";
    OperatorType[OperatorType["LogicalAND"] = 1] = "LogicalAND";
    OperatorType[OperatorType["GreaterThan"] = 2] = "GreaterThan";
    OperatorType[OperatorType["LesserThan"] = 3] = "LesserThan";
    OperatorType[OperatorType["GreaterOrEqualTo"] = 4] = "GreaterOrEqualTo";
    OperatorType[OperatorType["LesserOrEqualTo"] = 5] = "LesserOrEqualTo";
    OperatorType[OperatorType["EqualTo"] = 6] = "EqualTo";
    OperatorType[OperatorType["NotEqualTo"] = 7] = "NotEqualTo";
    OperatorType[OperatorType["Concatenate"] = 8] = "Concatenate";
    OperatorType[OperatorType["Addition"] = 9] = "Addition";
    OperatorType[OperatorType["Subtraction"] = 10] = "Subtraction";
    OperatorType[OperatorType["Multiplication"] = 11] = "Multiplication";
    OperatorType[OperatorType["Division"] = 12] = "Division";
    OperatorType[OperatorType["Modulo"] = 13] = "Modulo";
    OperatorType[OperatorType["Exponentiation"] = 14] = "Exponentiation";
    OperatorType[OperatorType["UnaryOpposite"] = 15] = "UnaryOpposite";
    OperatorType[OperatorType["UnaryNOT"] = 16] = "UnaryNOT";
    OperatorType[OperatorType["CommaOperator"] = 17] = "CommaOperator";
})(OperatorType || (OperatorType = {}));
class OperatorInfo {
    operatorType = OperatorType.Unknown;
    tokenType = TokenType.Unknown;
    operatorIdentifiers = [];
    precedenceLevel = 0;
    constructor(operatorType = OperatorType.Unknown, tokenType = TokenType.Unknown, identifiers = [], precedence = 0) {
        this.operatorType = operatorType;
        this.tokenType = tokenType;
        this.operatorIdentifiers = identifiers;
        this.precedenceLevel = precedence;
    }
    static Binary(type, identifiers, precedence) {
        return new OperatorInfo(type, TokenType.BinaryOperator, identifiers, precedence);
    }
    static Unary(type, identifiers) {
        return new OperatorInfo(type, TokenType.UnaryOperator, identifiers, -1);
    }
}
const ignoredIdentifierErrors = [
    Identifier.IdentifierError.None, Identifier.IdentifierError.ReservedWord, Identifier.IdentifierError.IntrinsicFunction
];
const possibleOperatorArray = [
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
const booleanLiterals = ["true", "false"];
var ExpressionError;
(function (ExpressionError) {
    ExpressionError[ExpressionError["Unknown"] = -1] = "Unknown";
    ExpressionError[ExpressionError["UnmatchedParenthesis"] = 0] = "UnmatchedParenthesis";
    ExpressionError[ExpressionError["InvalidParenthesis"] = 1] = "InvalidParenthesis";
    ExpressionError[ExpressionError["UnterminatedString"] = 2] = "UnterminatedString";
    ExpressionError[ExpressionError["InvalidBinaryOperator"] = 3] = "InvalidBinaryOperator";
    ExpressionError[ExpressionError["InvalidUnaryOperator"] = 4] = "InvalidUnaryOperator";
    ExpressionError[ExpressionError["InvalidOperatorTokenType"] = 5] = "InvalidOperatorTokenType";
})(ExpressionError || (ExpressionError = {}));
export class Expression {
    tokens = [];
    expressionErrors = [];
    accumilatedStr = "";
    previousTokenStr = "";
    currentOperatorStr = "";
    inStringLiteral = false;
    accumilatedSpecialToken = "";
    opennedGroupers = [];
    static FromString(exprAsStr) {
        let resultingExpr = new Expression();
        for (let i = 0; i < exprAsStr.length; i++) {
            let ch = exprAsStr[i];
            let isAlphanum = Utils.IsLetter(ch) || Utils.IsNumber(ch);
            if (ch === '"') {
                resultingExpr.ParseApostrophe();
                continue;
            }
            if (isAlphanum || resultingExpr.inStringLiteral) {
                resultingExpr.accumilatedStr += ch;
                continue;
            }
            resultingExpr.ParseToken(resultingExpr.accumilatedStr);
            resultingExpr.ParseToken(ch);
            resultingExpr.accumilatedStr = "";
        }
        resultingExpr.ParseToken(resultingExpr.accumilatedStr);
        resultingExpr.ParseSymbol();
        let hasUnmatchedParenthesis = resultingExpr.opennedGroupers.length > 0;
        if (hasUnmatchedParenthesis)
            resultingExpr.AddError(ExpressionError.UnmatchedParenthesis);
        if (resultingExpr.inStringLiteral)
            resultingExpr.AddError(ExpressionError.UnterminatedString);
        return resultingExpr;
    }
    ParseApostrophe() {
        this.ParseSymbol();
        this.inStringLiteral = !this.inStringLiteral;
        let literalEnded = !this.inStringLiteral;
        if (!literalEnded)
            return;
        this.AddToken(TokenType.StringLiteral, this.accumilatedStr);
        this.accumilatedStr = "";
    }
    ParseToken(tokenAsStr) {
        if (tokenAsStr.length === 0 || tokenAsStr === " ")
            return;
        let latestToken = this.GetLatestToken();
        let tokenAsNumber = Number(tokenAsStr);
        let isTokenNumber = !Number.isNaN(tokenAsNumber);
        let isRealLiteral = latestToken.type === TokenType.IntegerLiteral && isTokenNumber && this.previousTokenStr === '.';
        let identifierValidity = Identifier.GetIdentifierValidity(tokenAsStr);
        let isTokenIdentifier = ignoredIdentifierErrors.includes(identifierValidity);
        let loweredToken = tokenAsStr.toLowerCase();
        let isSymbol = tokenAsStr.length === 1 && !Utils.IsNumber(tokenAsStr) && !Utils.IsLetter(tokenAsStr);
        let symbolEnded = !isSymbol && this.accumilatedSpecialToken.length > 0;
        this.previousTokenStr = tokenAsStr;
        if (isSymbol) {
            this.accumilatedSpecialToken += tokenAsStr;
            return;
        }
        if (symbolEnded)
            this.ParseSymbol();
        if (isRealLiteral) {
            this.ParseRealLiteral(latestToken, tokenAsStr);
            return;
        }
        if (isTokenNumber) {
            this.AddToken(TokenType.IntegerLiteral, tokenAsNumber);
            return;
        }
        if (isTokenIdentifier) {
            this.ParseIdentifier(loweredToken);
            return;
        }
    }
    AddToken(tokenType = TokenType.Unknown, tokenValue = null) {
        let currentToken = new ExprToken(tokenType, tokenValue);
        this.tokens.push(currentToken);
    }
    ParseRealLiteral(latestToken, tokenAsStr) {
        let specialTokenLength = this.accumilatedSpecialToken.length;
        this.accumilatedSpecialToken = this.accumilatedSpecialToken.substring(0, specialTokenLength - 2);
        let valueAsStr = latestToken.value.toString();
        valueAsStr += '.' + tokenAsStr;
        let tokenValue = Number(valueAsStr);
        this.ReplaceLatestToken(TokenType.RealLiteral, tokenValue);
    }
    AddError(expressionError) { this.expressionErrors.push(expressionError); }
    ReplaceLatestToken(tokenType, tokenValue = null) {
        let tokenCount = this.tokens.length;
        if (tokenCount === 0)
            return;
        let currentToken = new ExprToken(tokenType, tokenValue);
        this.tokens.pop();
        this.tokens.push(currentToken);
    }
    GetLatestToken() {
        let tokenCount = this.tokens.length;
        let tokenListIsEmpty = tokenCount === 0;
        if (tokenListIsEmpty)
            return new ExprToken();
        let latestToken = this.tokens[tokenCount - 1];
        return latestToken;
    }
    ParseIdentifier(identifierName) {
        let isBooleanLiteral = booleanLiterals.includes(identifierName);
        if (isBooleanLiteral) {
            this.AddToken(TokenType.BooleanLiteral, identifierName === "true");
            return;
        }
        let identifierAsOperator = GetOperatorByIdentifier(identifierName);
        let isValidOperator = identifierAsOperator.operatorType !== OperatorType.Unknown;
        if (!isValidOperator) {
            this.AddToken(TokenType.Identifier, identifierName);
            return;
        }
        let previousToken = this.GetLatestToken();
        let previousTokenType = previousToken.type;
        let shouldBeBinaryOp = IsOperand(previousTokenType);
        let intendedOperatorType = shouldBeBinaryOp ? TokenType.BinaryOperator : TokenType.UnaryOperator;
        let matchesIntendedOperatorType = identifierAsOperator.tokenType === intendedOperatorType;
        if (!matchesIntendedOperatorType)
            this.AddError(ExpressionError.InvalidOperatorTokenType);
        this.AddToken(identifierAsOperator.tokenType, identifierAsOperator.operatorType);
    }
    ParseSymbol() {
        if (this.accumilatedSpecialToken.length === 0)
            return;
        this.currentOperatorStr = "";
        for (let ch of this.accumilatedSpecialToken) {
            let charAsGrouping = GetGroupingBySymbol(ch);
            if (charAsGrouping !== null) {
                this.ParseParenthesis(charAsGrouping);
                this.ParseOperator();
                continue;
            }
            this.currentOperatorStr += ch;
        }
        this.ParseOperator();
        this.accumilatedSpecialToken = "";
    }
    ParseParenthesis(groupingInfo) {
        let latestToken = this.GetLatestToken();
        let isLatestOperand = IsOperand(latestToken.type);
        if (!groupingInfo.isClosing) {
            let followsIdentifier = latestToken.type == TokenType.Identifier;
            let openningGroupingTokenType = followsIdentifier ? groupingInfo.afterIdentifierType : groupingInfo.withoutIdentifierType;
            groupingInfo.followsIdentifier = followsIdentifier;
            this.opennedGroupers.push(groupingInfo);
            this.AddToken(openningGroupingTokenType);
            return;
        }
        if (this.opennedGroupers.length === 0) {
            this.AddError(ExpressionError.UnmatchedParenthesis);
            return;
        }
        let matchingGrouper = this.opennedGroupers.pop();
        let isInvalidGrouper = groupingInfo.parenthesisType !== matchingGrouper.parenthesisType;
        if (isInvalidGrouper) {
            this.AddError(ExpressionError.InvalidParenthesis);
            return;
        }
        let closesIdentifierGrouper = matchingGrouper.followsIdentifier;
        let closingGroupingTokenType = closesIdentifierGrouper ? groupingInfo.afterIdentifierType : groupingInfo.withoutIdentifierType;
        this.AddToken(closingGroupingTokenType);
    }
    ParseOperator() {
        if (this.currentOperatorStr === "")
            return;
        let latestToken = this.GetLatestToken();
        let startsWithBinary = IsOperand(latestToken.type);
        let unaryParseStart = 0;
        if (startsWithBinary)
            unaryParseStart = this.ParseBinaryOperator();
        this.ParseUnaryOperators(unaryParseStart);
        this.currentOperatorStr = "";
    }
    ParseBinaryOperator() {
        let biggestBinaryOperator = OperatorType.Unknown;
        let biggestOperatorAsStr = "";
        for (let i = 0; i < this.currentOperatorStr.length; i++) {
            let currentOpStr = this.currentOperatorStr.substring(0, i + 1);
            let currentOperator = GetOperatorByIdentifier(currentOpStr, TokenType.BinaryOperator);
            let isOperatorValid = currentOperator.tokenType === TokenType.BinaryOperator;
            if (!isOperatorValid)
                continue;
            biggestBinaryOperator = currentOperator.operatorType;
            biggestOperatorAsStr = currentOpStr;
        }
        let isBinaryOperatorInvalid = biggestBinaryOperator === OperatorType.Unknown;
        if (isBinaryOperatorInvalid)
            this.AddError(ExpressionError.InvalidBinaryOperator);
        this.AddToken(TokenType.BinaryOperator, biggestBinaryOperator);
        return biggestOperatorAsStr.length;
    }
    ParseUnaryOperators(unaryParseStart) {
        for (let i = unaryParseStart; i < this.currentOperatorStr.length; i++) {
            let ch = this.currentOperatorStr[i];
            let chAsOperator = GetOperatorByIdentifier(ch, TokenType.UnaryOperator);
            let isUnaryInvalid = chAsOperator.tokenType === TokenType.Unknown;
            if (isUnaryInvalid) {
                this.AddError(ExpressionError.InvalidBinaryOperator);
                continue;
            }
            this.AddToken(TokenType.UnaryOperator, chAsOperator.operatorType);
        }
    }
}
var ParenthesisType;
(function (ParenthesisType) {
    ParenthesisType[ParenthesisType["Unknown"] = -1] = "Unknown";
    ParenthesisType[ParenthesisType["Regular"] = 0] = "Regular";
    ParenthesisType[ParenthesisType["Bracketed"] = 1] = "Bracketed";
})(ParenthesisType || (ParenthesisType = {}));
class GroupingInfo {
    afterIdentifierType = TokenType.Unknown;
    withoutIdentifierType = TokenType.Unknown;
    parenthesisType = ParenthesisType.Unknown;
    isClosing = false;
    followsIdentifier = false;
    constructor(parenthesisType = ParenthesisType.Unknown, closing, afterIdentifierType, withoutIdentifierType = TokenType.Unknown) {
        this.parenthesisType = parenthesisType;
        this.afterIdentifierType = afterIdentifierType;
        this.withoutIdentifierType = withoutIdentifierType;
        this.isClosing = closing;
    }
}
const specialGroupingSymbolsMap = new Map([
    ["(", new GroupingInfo(ParenthesisType.Regular, false, TokenType.InvocationOpen, TokenType.GroupingOpen)],
    [")", new GroupingInfo(ParenthesisType.Regular, true, TokenType.InvocationClose, TokenType.GroupingClose)],
    ["[", new GroupingInfo(ParenthesisType.Bracketed, false, TokenType.SubscriptOpen)],
    ["]", new GroupingInfo(ParenthesisType.Bracketed, true, TokenType.SubscriptClose)]
]);
const operatorTypesAsTokens = [TokenType.UnaryOperator, TokenType.BinaryOperator];
function GetOperatorByIdentifier(operatorIdentifier, filterMode = TokenType.Unknown) {
    operatorIdentifier = operatorIdentifier.toLowerCase();
    for (let currentOperator of possibleOperatorArray) {
        let foundOperator = currentOperator.operatorIdentifiers.includes(operatorIdentifier);
        let isFilterApplied = operatorTypesAsTokens.includes(filterMode);
        if (isFilterApplied && foundOperator)
            foundOperator = currentOperator.tokenType === filterMode;
        if (foundOperator)
            return currentOperator;
    }
    return new OperatorInfo();
}
function GetGroupingBySymbol(symbol) {
    if (specialGroupingSymbolsMap.has(symbol))
        return specialGroupingSymbolsMap.get(symbol);
    return null;
}
const operandTokens = [
    TokenType.Identifier,
    TokenType.IntegerLiteral, TokenType.RealLiteral, TokenType.StringLiteral, TokenType.BooleanLiteral,
    TokenType.GroupingClose, TokenType.InvocationClose, TokenType.SubscriptClose
];
function IsOperand(tokenType) { return operandTokens.includes(tokenType); }
