import os
import sys
from logging import DEBUG, StreamHandler, getLogger
from typing import List

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, constr
from transformers import BertJapaneseTokenizer

app = FastAPI()

logger = getLogger(__name__)
handler = StreamHandler(sys.stdout)
handler.setLevel(DEBUG)
logger.addHandler(handler)
logger.setLevel(DEBUG)

PATH_PREFIX = os.getenv("PATH_PREFIX", "/app/server/models/")
model_path = os.path.join(PATH_PREFIX, "transformers.pt")
tokenizer_path = os.path.join(PATH_PREFIX, "tokenizer")

LENGTH = 512

# このロジックはベタ書きじゃなくてなんらか綺麗にしたい
processor='gpu'
device_type='cpu'
try:
    import torch_neuron
    device_type='inf'
except ImportError: 
    print('[WARN] Torch Neuron not Found') 
    pass

if device_type != 'inf':
    if torch.cuda.is_available():
        device = torch.device("cuda")
        device_type = "gpu"
    else:
        device = torch.device("cpu")
        device_type = 'cpu'

if device_type == processor:
    print(f"   ... Using device: {device_type}")
else:
    print(f"[WARN] detected device_type ({device_type}) does not match the configured processor ({processor})")


class ModelInference:
    def __init__(self):
        self.tokenizer = BertJapaneseTokenizer.from_pretrained(tokenizer_path)
        self.model = torch.jit.load(model_path)
        self.model.to(device)

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


@app.head("/", status_code=200)
@app.get("/", status_code=200)
def read_root():
    return {"Status": "Healthy"}


@app.post("/inferences", response_model=MaskedTextOut, status_code=200)
def inferences(message: UserRequestIn):
    try:
        infered = model_class.infer(message)
    except Exception as e:
        msg = f"Internal Server Error, {e}"
        raise HTTPException(status_code=500, detail=msg)

    return {"labels": infered}


if __name__ == "__main__":
    request = {"text": "お爺さんは森に狩りへ出かける", "mask_index": 7}
    message = UserRequestIn(**request)
    print(model_class.infer(message))
