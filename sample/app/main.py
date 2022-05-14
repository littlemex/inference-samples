import sys
from logging import DEBUG, StreamHandler, getLogger
from typing import List

import torch
import yaml
from fastapi import FastAPI
from pydantic import BaseModel, constr
from transformers import BertForMaskedLM, BertJapaneseTokenizer

app = FastAPI()

logger = getLogger(__name__)
handler = StreamHandler(sys.stdout)
handler.setLevel(DEBUG)
logger.addHandler(handler)
logger.setLevel(DEBUG)

# Load config
basedir = "."
f = "{0}/config.yaml".format(basedir)
with open(f, "r") as yml:
    configs = yaml.safe_load(yml)

processor = configs["processor"]

# Detect runtime device type inf,gpu, or cpu
device_type = ""
try:
    import torch_neuron

    device_type = "inf"
except ImportError:
    logger.warning("Inferentia chip not detected")
    pass

if device_type == "inf":
    pass
elif torch.cuda.is_available():
    device_type = "gpu"
    device = torch.device("cuda")
    logger.warning(torch.cuda.get_device_name(0))
else:
    device_type = "cpu"
    device = torch.device(device_type)

if processor != device_type:
    logger.warning(
        f"Configured target processor {processor} \
        differs from actual processor {device_type}"
    )
logger.warning(f"Running models on processor: {device_type}")


class ModelInference:
    def __init__(self):
        pretrained = "cl-tohoku/bert-base-japanese-whole-word-masking"
        self.tokenizer = BertJapaneseTokenizer.from_pretrained(pretrained)
        self.model = BertForMaskedLM.from_pretrained(pretrained)

    def _to_tokens_from_(self, index):
        return self.tokenizer.convert_ids_to_tokens([index.item()])[0]

    def predict(self, message):

        text = message.text
        masked_index = message.masked_index

        logger.debug(f"Input text : {text}")
        tokenized_text = self.tokenizer.tokenize(text)
        logger.info("Tokenized text : " + ",".join(tokenized_text))
        tokenized_text[masked_index] = "[MASK]"
        logger.info("Masked text : " + ",".join(tokenized_text))
        indexed_tokens = self.tokenizer.convert_tokens_to_ids(tokenized_text)
        tokens_tensor = torch.tensor([indexed_tokens])
        with torch.no_grad():
            outputs = self.model(tokens_tensor)
            predictions = outputs[0][0, masked_index].topk(5)

        tokens = [self._to_tokens_from_(idx) for idx in predictions.indices]

        return tokens


class UserRequestIn(BaseModel):
    text: constr(min_length=1)
    masked_index: int


class MaskedTextOut(BaseModel):
    labels: List[str]


model_class = ModelInference()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/prediction", response_model=MaskedTextOut)
def prediction(message: UserRequestIn):
    prediction = model_class.predict(message)
    return {"labels": prediction}


if __name__ == "__main__":
    request = {"text": "私は東京へ行く", "masked_index": 2}
    message = UserRequestIn(**request)
    print(model_class.predict(message))
