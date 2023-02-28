import torch
from transformers import BertForMaskedLM, BertJapaneseTokenizer

model_name = "cl-tohoku/bert-base-japanese-whole-word-masking"
ptname = "transformers.pt"
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
    print("cuda is available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        device = torch.device("cuda:0")
        device_type = "gpu"
    else:
        device = torch.device("cpu")
        device_type = 'cpu'

if device_type == processor:
    print(f"   ... Using device: {device_type}")
else:
    print(f"[WARN] detected device_type ({device_type}) does not match the configured processor ({processor})")

model = BertForMaskedLM.from_pretrained(model_name, return_dict=False)

model.eval()
tokenizer = BertJapaneseTokenizer.from_pretrained(model_name)
tokenizer.save_pretrained("./tokenizer")

text = "お爺さんは森に狩りへ出かける"
inputs = tokenizer.encode_plus(
    text, return_tensors="pt", max_length=LENGTH, padding="max_length", truncation=True
)

if device_type == 'gpu':
    model.to(device)
    inputs.to(device)

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
