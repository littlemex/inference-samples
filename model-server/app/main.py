import os
import sys
from logging import DEBUG, StreamHandler, getLogger
from typing import List

import torch
import torch_neuron
from fastapi import FastAPI
from pydantic import BaseModel, constr
from transformers import BertJapaneseTokenizer

app = FastAPI()

logger = getLogger(__name__)
handler = StreamHandler(sys.stdout)
handler.setLevel(DEBUG)
logger.addHandler(handler)
logger.setLevel(DEBUG)

path_prefix = "/app/server/models/"
model_path = os.path.join(path_prefix, "transformers_neuron.pt")

LENGTH = 512


class ModelInference:
    def __init__(self):
        pretrained = "cl-tohoku/bert-base-japanese-whole-word-masking"
        self.tokenizer = BertJapaneseTokenizer.from_pretrained(pretrained)
        self.model = torch.jit.load(model_path)

    def _conv_to_tokens_from_(self, index):
        return self.tokenizer.convert_ids_to_tokens([index.item()])[0]

    def infer(self, message):

        text = message.text
        mask_index = message.mask_index

        logger.info(f"Input text : {text}")
        tokenized_text = self.tokenizer.tokenize(text)
        logger.info("Tokenized text : " + ",".join(tokenized_text))
        tokenized_text[mask_index] = "[MASK]"
        logger.info("Masked text : " + ",".join(tokenized_text))
        encoding = self.tokenizer.encode_plus(
            text,
            return_tensors="pt",
            max_length=LENGTH,
            padding="max_length",
            truncation=True,
        )
        model_input = (encoding["input_ids"], encoding["attention_mask"])
        with torch.no_grad():
            outputs = self.model(*model_input)
            preds = outputs[0][0, mask_index].topk(5)

        tokens = [self._conv_to_tokens_from_(idx) for idx in preds.indices]

        return tokens


class UserRequestIn(BaseModel):
    text: constr(min_length=1)
    mask_index: int


class MaskedTextOut(BaseModel):
    labels: List[str]


model_class = ModelInference()


@app.get("/")
async def read_root():
    return {"Status": "Healthy"}


@app.post("/inferences", response_model=MaskedTextOut)
async def inferences(message: UserRequestIn):
    infered = model_class.infer(message)
    return {"labels": infered}


if __name__ == "__main__":
    request = {"text": "お爺さんは森に狩りへ出かける", "mask_index": 7}
    message = UserRequestIn(**request)
    print(model_class.predict(message))
