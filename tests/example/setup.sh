#!/bin/sh
# Monta projeto de exemplo em <destino>: base commitada, mudança cart-discounts sem commit.
set -e
[ -n "$1" ] || { echo "uso: $0 <destino>"; exit 1; }
[ ! -e "$1" ] || { echo "destino já existe: $1"; exit 1; }
src=$(cd "$(dirname "$0")" && pwd)
cp -R "$src/base" "$1"
cd "$1"
git init -q -b main
git add -A
git -c user.name=flow -c user.email=flow@example.com commit -q -m "base"
cp -R "$src/change/." .
echo "pronto: $1 (mudança cart-discounts em execute, sem commit)"
