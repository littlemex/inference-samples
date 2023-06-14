import re
import json
import torch
from transformers import AutoTokenizer, AutoModelForQuestionAnswering

import os
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
instance_type = re.sub(r'[^a-zA-Z0-9]', '', os.environ['INSTANCE_TYPE'])
print(instance_type)

def get_torch_jit(instance_type, model, inputs_tuple):
    print(f"{instance_type}, analyze start")
    if instance_type == 'inf1':
        import torch_neuron
        torch_jit = torch.neuron
        try:
            torch_jit.analyze_model(model, inputs_tuple)
        except:
            pass
    elif instance_type == 'inf2' or instance_type == 'trn1':
        import torch_neuronx
        torch_jit =torch_neuronx
        try:
            torch_jit.analyze(model, inputs_tuple)
        except:
            pass
    else:
        torch_jit = torch.jit
        print("nothing to do.")
    print(f"{instance_type}, analyze end")
    return torch_jit

model_name = "ybelkada/japanese-roberta-question-answering"
ptname = "transformers_neuron.pt"
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

torch_jit = get_torch_jit(instance_type, model, inputs_tuple)
model_traced = torch_jit.trace(model, inputs_tuple)
model_traced.save(ptname)

print("Done.")
