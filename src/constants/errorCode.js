const ERROR_CODES = {

    // auth
    INVALID_CREDENTIALS:
        "INVALID_CREDENTIALS",

    TOKEN_EXPIRED:
        "TOKEN_EXPIRED",

    UNAUTHORIZED:
        "UNAUTHORIZED",

    FORBIDDEN:
        "FORBIDDEN",

    // user
    USER_NOT_FOUND:
        "USER_NOT_FOUND",

    // not found
    NOT_FOUND: "NOT_FOUND",

    // bad request
    BAD_REQUEST: "BAD_REQUEST",

    // rate limit
    TOO_MANY_REQUESTS:
        "TOO_MANY_REQUESTS",

    // exist
    EXIST: "ID_EXIST_IN_OTHER_TABLE",

    EMAIL_ALREADY_EXISTS:
        "EMAIL_ALREADY_EXISTS",

    USER_ALREADY_EXISTS:
        "USER_ALREADY_EXISTS",

    // validation
    VALIDATION_ERROR:
        "VALIDATION_ERROR",

    // server
    INTERNAL_SERVER_ERROR:
        "INTERNAL_SERVER_ERROR",

    ACCESS_DENIED:
        "ACCESS_DENIED"
};

module.exports = ERROR_CODES;
