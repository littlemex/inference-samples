import os
import sys
from logging import DEBUG, StreamHandler, getLogger
from typing import List

import torch
import torch_neuron
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, constr
from transformers import AutoTokenizer

app = FastAPI()

logger = getLogger(__name__)
handler = StreamHandler(sys.stdout)
handler.setLevel(DEBUG)
logger.addHandler(handler)
logger.setLevel(DEBUG)

PATH_PREFIX = os.getenv("PATH_PREFIX", "/app/server/models/")
model_path = os.path.join(PATH_PREFIX, "transformers_neuron.pt")
tokenizer_path = os.path.join(PATH_PREFIX, "tokenizer")

LENGTH = 512


class ModelInference:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
        self.model = torch.jit.load(model_path)

    def infer(self, message):

        question = message.question
        context = message.context

        logger.info(f"Input question : {question}, context : {context}")
        inputs = self.tokenizer(
            question, context, add_special_tokens=True, return_tensors="pt", max_length=LENGTH, padding='max_length', truncation=True)
        inputs_tuple = (inputs["input_ids"], inputs["attention_mask"])

        with torch.no_grad():
            outputs = self.model(*inputs_tuple)
            answer_start_scores, answer_end_scores = outputs
        answer_start = torch.argmax(answer_start_scores)
        answer_end = torch.argmax(answer_end_scores) + 1
        answer = self.tokenizer.convert_tokens_to_string(
            self.tokenizer.convert_ids_to_tokens(inputs["input_ids"][0][answer_start:answer_end]))

        return answer


class UserRequestIn(BaseModel):
    question: constr(min_length=1)
    context: constr(min_length=1)


class TextOut(BaseModel):
    answer: str


model_class = ModelInference()


@app.head("/", status_code=200)
@app.get("/", status_code=200)
def read_root():
    return {"Status": "Healthy"}


@app.post("/inferences", response_model=TextOut, status_code=200)
def inferences(message: UserRequestIn):
    try:
        infered = model_class.infer(message)
    except Exception as e:
        msg = f"Internal Server Error, {e}"
        raise HTTPException(status_code=500, detail=msg)

    return {"answer": infered}


if __name__ == "__main__":
    request = {
            "question": "アレクサンダー・グラハム・ベルは、どこで生まれたの?",
            "context": "アレクサンダー・グラハム・ベルは、スコットランド生まれの科学者、発明家、工学者である。世界初の実用的電話の発明で知られている。",
            }
    message = UserRequestIn(**request)
    print(model_class.infer(message))
