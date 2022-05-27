#!/bin/sh

while true
do
curl -X 'POST' \
  'http://localhost/inferences' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "text": "お爺さんは森に狩りへ出かける",
  "mask_index": 7
}'
sleep 10
done
