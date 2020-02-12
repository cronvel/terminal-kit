#!/bin/sh

echo "Base64 of the input: $(base64 -w0)"
echo -ne "\e]52;c;$(base64 -w0)\x07"
