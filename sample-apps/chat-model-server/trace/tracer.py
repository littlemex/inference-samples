import torch
import torch_neuron
from transformers import AutoTokenizer, AutoModelForQuestionAnswering

import os
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

model_name = "ybelkada/japanese-roberta-question-answering"
ptname = "transformers_neuron.pt"
processor = "inf1"
LENGTH = 512

tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.save_pretrained("./tokenizer")
model = AutoModelForQuestionAnswering.from_pretrained(model_name, return_dict=False)
model.eval()

question = "What's my name?"
context = "My name is Clara and I live in Berkeley."

inputs = tokenizer(
    question, context, add_special_tokens=True, return_tensors="pt", max_length=LENGTH, padding='max_length', truncation=True)


inputs_tuple = (inputs['input_ids'], inputs['attention_mask'])
if "inf1" in processor:
    print(333334)
    model_traced = torch.neuron.trace(model, inputs_tuple, strict=False)
else:
    model_traced = torch.jit.trace(model, inputs_tuple, strict=False)

model_traced.save(ptname)

print("Done.")
