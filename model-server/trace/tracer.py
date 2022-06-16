import torch
import torch_neuron
from transformers import BertForMaskedLM, BertJapaneseTokenizer

model_name = "cl-tohoku/bert-base-japanese-whole-word-masking"
ptname = "transformers_neuron.pt"
processor = "inf1"

LENGTH = 512

model = BertForMaskedLM.from_pretrained(model_name, return_dict=False)
model.eval()
tokenizer = BertJapaneseTokenizer.from_pretrained(model_name)

text = "お爺さんは森に狩りへ出かける"
inputs = tokenizer.encode_plus(
    text, return_tensors="pt", max_length=LENGTH, padding="max_length", truncation=True
)

example_inputs = (
    torch.cat([inputs["input_ids"]], 0),
    torch.cat([inputs["attention_mask"]], 0),
)

if "inf1" in processor:
    model_traced = torch.neuron.trace(model, example_inputs)
else:
    model_traced = torch.jit.trace(model, example_inputs)

model_traced.save(ptname)

print("Done.")