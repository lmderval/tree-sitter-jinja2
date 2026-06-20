/**
 * @file Jinja2 grammar for tree-sitter
 * @author Louis-Maël DERVAL <louismaelderval@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  TERNARY: 1,
  PIPE: 2,
  OR: 3,
  AND: 4,
  TEST: 5,
  EQUAL: 6,
  RELATIONAL: 7,
  ADD: 8,
  MULTIPLY: 9,
  POWER: 10,
  NOT: 11,
  CALL: 12,
  ACCESS: 13,
};

const sep = (rule, separator) => seq(
  rule,
  repeat(seq(separator, rule))
);

const optional_sep = (rule, separator) => optional(
  seq(
    sep(rule, separator),
    optional(separator)
  )
)

module.exports = grammar({
  name: "jinja2",

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($.body),

    body: $ => choice(
      $.text,
      $.control,
      $.expression
    ),

    text: $ => token(/([^{]|\{[^{#%])+/),

    identifier: $ => token(/[a-zA-Z_][a-zA-Z_0-9]*/),

    exp_bool: $ => choice(
      "True",
      "true",
      "False",
      "false"
    ),

    exp_int: $ => token(/[0-9]+/),

    exp_string: $ => choice(
      /"([^"]|\\"|\\\\)*"/,
      /'([^']|\\')*'/
    ),

    exp_list: $ => seq(
      "[",
      optional_sep($.exp, ","),
      "]"
    ),

    exp_tuple: $ => seq(
      "(",
      seq(
        $.exp,
        ",",
        optional_sep($.exp, ",")
      ),
      ")"
    ),

    exp_dict_item: $ => seq(
      field(
        "key",
        choice(
          $.exp_bool,
          $.exp_int,
          $.exp_string
        )
      ),
      ":",
      field("value", $.exp)
    ),

    exp_dict: $ => seq(
      "{",
      optional_sep($.exp_dict_item, ","),
      "}"
    ),

    exp_binary: $ => {
      const binops = [
        [token('|'), PREC.PIPE],
        [token('or'), PREC.OR],
        [token('and'), PREC.AND],
        [token('is'), PREC.TEST],
        [token('in'), PREC.TEST],
        [seq('is', 'not'), PREC.TEST],
        [seq('not', 'in'), PREC.TEST],
        [token('=='), PREC.EQUAL],
        [token('!='), PREC.EQUAL],
        [token('>'), PREC.RELATIONAL],
        [token('>='), PREC.RELATIONAL],
        [token('<'), PREC.RELATIONAL],
        [token('<='), PREC.RELATIONAL],
        [token('+'), PREC.ADD],
        [token('-'), PREC.ADD],
        [token('~'), PREC.ADD],
        [token('/'), PREC.MULTIPLY],
        [token('//'), PREC.MULTIPLY],
        [token('%'), PREC.MULTIPLY],
        [token('*'), PREC.MULTIPLY],
        [token('**'), PREC.POWER],
      ];
      return choice(...binops.map(([operator, precedence]) => prec.left(
        precedence,
        seq(
          field('left', $.exp),
          field('op', operator),
          field('right', $.exp)
        )
      )));
    },

    exp_call_argument: $ => seq(
      optional(
        seq(
          field('argument', $.identifier),
          '='
        )
      ),
      field('value', $.exp)
    ),

    exp_call: $ => prec(
      PREC.CALL,
      seq(
        field("function", $.exp),
        "(",
        optional_sep($.exp_call_argument, ","),
        ")"
      )
    ),

    exp_array_access: $ => prec(
      PREC.ACCESS,
      seq(
        field("array", $.exp),
        "[",
        field("index", $.exp),
        "]"
      )
    ),

    exp_field_access: $ => prec(
      PREC.ACCESS,
      seq(
        field("object", $.exp),
        ".",
        field("field", $.identifier)
      )
    ),

    exp_ternary: $ => prec.left(
      PREC.TERNARY,
      seq(
        field('then_branch', $.exp),
        'if',
        field('condition', $.exp),
        optional(
          seq(
            'else',
            field('else_branch', $.exp)
          )
        )
      )
    ),

    exp_not: $ => prec(
      PREC.NOT,
      seq(
        'not',
        $.exp
      )
    ),

    exp: $ => choice(
      $.identifier,
      $.exp_bool,
      $.exp_int,
      $.exp_string,
      $.exp_list,
      $.exp_tuple,
      $.exp_dict,
      $.exp_binary,
      $.exp_call,
      $.exp_array_access,
      $.exp_field_access,
      $.exp_ternary,
      $.exp_not,
      seq('(', $.exp, ')')
    ),

    control_begin: $ => token(
      choice(
        '{%',
        '{%-',
        '{%+'
      )
    ),

    control_end: $ => token(
      choice(
        '%}',
        '-%}',
        '+%}'
      )
    ),

    control_if: $ => seq(
      seq($.control_begin, 'if', $.exp, $.control_end),
      repeat($.body),
      choice(
        $.control_elif,
        $.control_else,
        $.control_endif
      )
    ),

    control_elif: $ => seq(
      seq($.control_begin, 'elif', $.exp, $.control_end),
      repeat($.body),
      choice(
        $.control_elif,
        $.control_else,
        $.control_endif
      )
    ),

    control_else: $ => seq(
      seq($.control_begin, 'else', $.control_end),
      repeat($.body),
      $.control_endif
    ),

    control_endif: $ => seq(
      $.control_begin,
      'endif',
      $.control_end
    ),

    control_for: $ => seq(
      seq(
        $.control_begin,
        'for',
        sep($.identifier, ','),
        'in',
        $.exp,
        optional(seq('if', $.exp)),
        $.control_end
      ),
      repeat($.body),
      optional(
        seq(
          seq($.control_begin, 'else', $.control_end),
          repeat($.body)
        )
      ),
      seq($.control_begin, 'endfor', $.control_end)
    ),

    control_macro_parameter: $ => seq(
      field('parameter', $.identifier),
      optional(seq('=', $.exp))
    ),

    control_macro: $ => seq(
      seq(
        $.control_begin,
        'macro',
        field('name', $.identifier),
        '(',
        optional(sep($.control_macro_parameter, ',')),
        ')',
        $.control_end
      ),
      repeat($.body),
      seq($.control_begin, 'endmacro', $.control_end)
    ),

    control_set: $ => choice(
      seq(
        $.control_begin,
        'set',
        field('name', $.identifier),
        '=',
        $.exp,
        $.control_end
      ),
      seq(
        seq(
          $.control_begin,
          'set',
          field('name', $.identifier),
          $.control_end
        ),
        repeat($.body),
        seq($.control_begin, 'endset', $.control_end)
      )
    ),

    control_do: $ => seq(
      $.control_begin,
      "do",
      $.exp,
      $.control_end
    ),

    control_call: $ => seq(
      seq(
        $.control_begin,
        'call',
        optional(
          seq(
            '(',
            optional(sep($.control_macro_parameter, ',')),
            ')'
          )
        ),
        field('function', $.identifier),
        '(',
        optional_sep($.exp_call_argument, ','),
        ')',
        $.control_end
      ),
      repeat($.body),
      seq(
        $.control_begin,
        'endcall',
        $.control_end
      )
    ),

    control: $ => choice(
      $.control_if,
      $.control_for,
      $.control_macro,
      $.control_set,
      $.control_do,
      $.control_call
    ),

    expression_begin: $ => token(
      choice(
        '{{',
        '{{-',
        '{{+'
      )
    ),

    expression_end: $ => token(
      choice(
        '}}',
        '-}}',
        '+}}'
      )
    ),

    expression: $ => seq(
      $.expression_begin,
      $.exp,
      $.expression_end
    )
  }
});
