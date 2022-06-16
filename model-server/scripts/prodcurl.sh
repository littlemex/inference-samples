#!/bin/sh

while true
do
curl -X 'POST' \
  'http://EcsSt-LB8A1-1ELUKBP3IS0BY-2034780270.ap-northeast-1.elb.amazonaws.com/inferences' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "text": "お爺さんは森に狩りへ出かける",
  "mask_index": 7
}'
sleep 10
done
