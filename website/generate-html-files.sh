#!/bin/bash
./php.ts clean
./php.ts build --root catchsup
rm -rf ../docs
mv -fv build/ ../docs
