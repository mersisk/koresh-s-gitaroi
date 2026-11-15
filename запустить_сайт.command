#!/bin/bash
# Двойной клик: запускает сайт и открывает его в браузере.
cd "$(dirname "$0")"
open "http://127.0.0.1:8766/index.html"
python3 -m http.server 8766 --bind 127.0.0.1
