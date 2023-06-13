import re
import torch
from transformers import AutoTokenizer, AutoModelForQuestionAnswering

import os
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
instance_type = re.sub(r'[^a-zA-Z0-9]', '', os.environ['INSTANCE_TYPE'])
print(instance_type)

if instance_type == 'inf1':
    import torch_neuron
    torch_jit = torch.neuron
elif instance_type == 'inf2' or instance_type == 'trn1':
    import torch_neuronx
    torch_jit = torch_neuronx
else:
    torch_jit = torch.jit


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
model_traced = torch_jit.trace(model, inputs_tuple)
model_traced.save(ptname)

print("Done.")
