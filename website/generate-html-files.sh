#!/bin/bash
./php.ts clean
./php.ts build --root docs
rm -rf ../docs
mv -fv build/ ../docs
