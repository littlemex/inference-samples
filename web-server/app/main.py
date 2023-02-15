import json
import os
import sys
from logging import DEBUG, StreamHandler, getLogger
from typing import List

import requests
from fastapi import FastAPI, HTTPException, responses
from pydantic import BaseModel, constr

app = FastAPI()

ENDPOINT_URL = os.environ["ENDPOINT_URL"]

logger = getLogger(__name__)
handler = StreamHandler(sys.stdout)
handler.setLevel(DEBUG)
logger.addHandler(handler)
logger.setLevel(DEBUG)


class Invocation:
    def __init__(self):
        pass

    def invoke(self, message):
        try:
            headers = {
                "accept": "application/json",
                "Content-Type": "application/json",
            }
            payload = {
                "mask_index": message.mask_index,
                "text": message.text,
            }
            data = json.dumps(payload)
            response = requests.post(ENDPOINT_URL, headers=headers, data=data).json()
            logger.info(response)

        except Exception as e:
            raise HTTPException(status_code=500, detail="Model Server invoke exception")
        return response


class UserRequestIn(BaseModel):
    text: constr(min_length=1)
    mask_index: int


class MaskedTextOut(BaseModel):
    labels: List[str]


web_class = Invocation()


@app.get("/")
async def read_root():
    return {"Status": "Healthy"}


@app.post("/invocations", response_model=MaskedTextOut)
async def invocations(message: UserRequestIn):
    return web_class.invoke(message)


if __name__ == "__main__":
    request = {"text": "お爺さんは森に狩りへ出かける", "mask_index": 7}
    message = UserRequestIn(**request)
    print(web_class.invoke(message))
