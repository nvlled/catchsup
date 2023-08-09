#!/bin/bash
./php.ts clean
./php.ts build
mv -v build ../docs
