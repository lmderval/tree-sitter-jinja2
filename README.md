# Tree-Sitter Jinja2

A tree-sitter parser for Jinja2.

## Handled Features

This parser doesn't currently handle all Jinja2 structures. It handles the
following features:

* most expressions (literals, lists, dicts, operators, field accesses, array
accesses, calls, ternaries);

* `if` control structure;

* `for` control structure;

* `macro` control structure;

* `set` control structure (block and inline).
