#include "tree_sitter/parser.h"

enum TokenType {
    COMMENT
};

void *tree_sitter_jinja2_external_scanner_create(void) {
    return NULL;
}

void tree_sitter_jinja2_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_jinja2_external_scanner_serialize(void *payload,
                                                       char *buffer) {
    return 0;
}

void tree_sitter_jinja2_external_scanner_deserialize(void *payload,
                                                     const char *buffer,
                                                     unsigned length) {}

static bool scan_comment(void *payload, TSLexer *lexer) {
    if (lexer->lookahead != '{') {
        return false;
    }
    lexer->advance(lexer, false);
    if (lexer->lookahead != '#') {
        return false;
    }
    lexer->advance(lexer, false);
    while (!lexer->eof(lexer)) {
        if (lexer->lookahead != '#') {
            lexer->advance(lexer, false);
            continue;
        }
        lexer->advance(lexer, false);
        if (lexer->lookahead != '}') {
            continue;
        }
        lexer->advance(lexer, false);
        lexer->mark_end(lexer);
        lexer->result_symbol = COMMENT;
        return true;
    }
    return false;
}

bool tree_sitter_jinja2_external_scanner_scan(void *payload, TSLexer *lexer,
                                              const bool *valid_symbols) {
    if (valid_symbols[COMMENT]) {
        return scan_comment(payload, lexer);
    }
    return false;
}
