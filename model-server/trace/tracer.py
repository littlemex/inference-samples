import torch
import torch_neuron
from transformers import BertForMaskedLM, BertJapaneseTokenizer

model_name = "cl-tohoku/bert-base-japanese-whole-word-masking"
ptname = "transformers_neuron.pt"
processor = 'inf1'
pipeline_cores = 1

model = BertForMaskedLM.from_pretrained(model_name, return_dict=False)
model.eval()
tokenizer = BertJapaneseTokenizer.from_pretrained(model_name)

text = "私は東京へ行く"
inputs = tokenizer.encode(text, return_tensors="pt", padding='max_length')

print(inputs)

example_inputs = (
    inputs
)

if 'inf1' in processor:
    model_traced = torch.neuron.trace(model, example_inputs)
else:
    model_traced = torch.jit.trace(model, example_inputs)

model_traced.save(ptname)
