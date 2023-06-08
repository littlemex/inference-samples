import torch
import torch_neuron
from transformers import AutoTokenizer, AutoModelForQuestionAnswering

model_name = "ybelkada/japanese-roberta-question-answering"
ptname = "transformers_neuron.pt"
processor = "inf1"
LENGTH = 512

tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.save_pretrained("./tokenizer")
model = AutoModelForQuestionAnswering.from_pretrained(model_name, return_dict=False)
model.eval()

Path("traced_model/").mkdir(exist_ok=True)

question = "What's my name?"
context = "My name is Clara and I live in Berkeley."

inputs = tokenizer.encode_plus(
    question, context, add_special_tokens=True, return_tensors="pt", max_length=LENGTH, padding='max_length', truncation=True)

example_inputs = (
    torch.cat([inputs["input_ids"]], 0),
    torch.cat([inputs["attention_mask"]], 0),
)

ins = [inputs['input_ids'], inputs['attention_mask']]

if "inf1" in processor:
    model_traced = torch.neuron.trace(model, example_inputs)
else:
    model_traced = torch.jit.trace(model, example_inputs)

model_traced.save(ptname)

print("Done.")
