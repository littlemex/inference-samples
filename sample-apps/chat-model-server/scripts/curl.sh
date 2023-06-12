#!/bin/sh

while true
do
curl -X 'POST' \
  'http://localhost/inferences' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "question": "アレクサンダー・グラハム・ベルは、どこで生まれたの?",
  "context": "アレクサンダー・グラハム・ベルは、スコットランド生まれの科学者、発明家、工学者である。世界初の>実用的電話の発明で知られている。"
}'
sleep 10
done
