#!/bin/sh
# Wraps each src/*.html in a full HTML document so it opens with a double click.
cd "$(dirname "$0")" || exit 1
for f in src/*.html; do
  { printf '<!doctype html>\n<html lang="ca">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n</head>\n<body>\n'; cat "$f"; printf '</body>\n</html>\n'; } > "$(basename "$f")"
done
