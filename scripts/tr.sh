#!/bin/bash

DIR="${1:-.}"

if [ ! -d "$DIR" ]; then
    echo "Error: '$DIR' is not a directory"
    exit 1
fi

find "$DIR" | sed \
    -e "s|[^/]*/|│   |g" \
    -e "s|│   \([^│]\)|├── \1|"
