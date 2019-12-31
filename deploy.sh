#!/bin/sh
rm -f package.zip
npm pack
aws lambda update-function-code --function-name besure-aggregator --zip-file fileb://package.zip --profile besure