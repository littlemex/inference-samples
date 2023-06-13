# サンプルアプリ概要

BERT japanese question answering をサンプルアプリケーションとして、
CPU, GPU, Inf1, Inf2/Trn1 それぞれでの推論を実行できるように構築した。
BERT を用いたチャットアプリの簡単なサンプルとして利用できる。

## how to build and run

env.hcl.sample に環境変数を設定する。作り込めば IMAGEPATH も INSTANCE_TYPE も自動判断可能だが、環境変数で指定する形をとっている。(FIXME)

```bash
CDK_DEFAULT_REGION="us-east-1"
CDK_DEFAULT_ACCOUNT="xxxx"
REGION="us-east-1"
ACCOUNT_ID="$CDK_DEFAULT_ACCOUNT"
## Inf1
# IMAGEPATH="pytorch-inference-neuron:1.13.1-neuron-py38-sdk2.10.0-ubuntu20.04"
# INSTANCE_TYPE="inf1"
## Inf2/Trn1
# IMAGEPATH="pytorch-inference-neuronx:1.13.1-neuronx-py38-sdk2.10.0-ubuntu20.04"
# INSTANCE_TYPE="inf2"
# GPU
IMAGEPATH="pytorch-inference:1.13.1-gpu-py39-cu117-ubuntu20.04-ec2"
INSTANCE_TYPE="gpu"
```

/tmp/env.hcl ファイルをマスタとして設定を編集する。あとは build, run スクリプトを順次実行すれば良い。

```bash
# edit env.hcl.sample
# IMAGEPATH: Please check here. https://github.com/aws/deep-learning-containers/blob/master/available_images.md
cp env.hcl.sample /tmp/env.hcl

cd scripts && ./build.sh && cd -
cd trace && ./trace.sh && cd -
cd scripts && ./build-and-run.sh && sleep 10 && ./curl.sh
```

curl での単純なレイテンシ計測をする場合。

```bash
cd scripts
time ./get-latency-simple.sh
```

## ディレクトリ構成

- app: fastapi で構築された推論用のアプリケーション
- trace: コンパイル用のスクリプト実行ディレクトリ
- build: Dockerfile の実体
- scripts: 各種ビルド、Run スクリプト群

```
.
├── README.md
├── app
│   ├── main.py
│   ├── requirements.txt
│   └── run.sh
├── build
│   └── Dockerfile
├── docker-bake.hcl
├── env.hcl.sample
├── performances
│   └── README.md
├── scripts
│   ├── build-and-run.sh
│   ├── build.sh
│   ├── curl.sh
│   ├── get-latency-simple.sh
│   ├── logs.sh
│   ├── push.sh
│   └── run-model-server.sh
└── trace
    ├── original.py
    ├── requirements_cpu.txt
    ├── requirements_gpu.txt
    ├── requirements_inf1.txt
    ├── requirements_inf2.txt
    ├── tokenizer
    │   ├── special_tokens_map.json
    │   ├── spiece.model
    │   ├── tokenizer.json
    │   └── tokenizer_config.json
    ├── trace.sh
    ├── tracer.py
    ├── tracer.py.bak
    └── transformers_neuron.pt
```

## イメージビルド

Inf1, Inf2 などでコンパイル時に必要なライブラリが異なるためマルチステージビルドを利用して requirements.txt を切り替えるように構成した。ステージは大きく 3 つあり、base, trace, model である。base には trace, model の両方のステージで必要となる共通の処理を実行させ、trace はコンパイル用、model は推論用のステージである。

```docker
...
FROM base-stage AS trace-inf1-stage
ONBUILD ADD ./trace/requirements_inf1.txt /tmp/requirements.txt

FROM base-stage AS trace-inf2-stage
ONBUILD ADD ./trace/requirements_inf2.txt /tmp/requirements.txt

FROM base-stage AS trace-gpu-stage
ONBUILD ADD ./trace/requirements_gpu.txt /tmp/requirements.txt

FROM base-stage AS trace-cpu-stage
ONBUILD ADD ./trace/requirements_cpu.txt /tmp/requirements.txt

FROM trace-${INSTANCE_TYPE}-stage AS trace-stage
...
```

## コンパイル

コンパイル処理は docker 内で実行するように構築した。ホスト側でのコンパイルの場合は環境差異が発生する可能性があり、再現性の観点でコンテナを利用した。INSTANCE_TYPE 環境変数ごとにコンパイルのライブラリが異なるため、条件分岐で利用するライブラリを切り替える実装とした。こちらも自動判断できるので自動化したい(FIXME)

```python
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
```

question answering のサンプルでは、question に質問内容、context に質問に回答するための情報を与える。Inf1, Inf2 では Python の動的機能をサポートしないため、可変長引数を渡すことができない。
LENGTH は BERT のシーケンスの最大長である 512 とした。コンパイルされたモデルは .pt ファイルとして保存され、推論アプリケーション側で読み込んで利用する。

```python
question = "What's my name?"
context = "My name is Clara and I live in Berkeley."

inputs = tokenizer(
    question, context, add_special_tokens=True, return_tensors="pt", max_length=LENGTH, padding='max_length', truncation=True)


inputs_tuple = (inputs['input_ids'], inputs['attention_mask'])
model_traced = torch_jit.trace(model, inputs_tuple)
model_traced.save(ptname)
```

## 推論用アプリケーション

コンテナを起動する。コンパイル時同様、INSTANCE_TYPE 環境変数の値によって import するライブラリを変更するようにした。GPU にも対応するため、to(device) で GPU か CPU かを指定する際に cuda.is_available() と INSTANCE_TYPE の値を見て GPU か CPU を判断する。Inf1, Inf2 を利用する場合は CPU が指定される。to('cpu) と指定しても CPU が利用されるわけではなく Inf1, Inf2 で問題なく動く。

```python
if instance_type == 'inf1':
    import torch_neuron
elif instance_type == 'inf2' or instance_type == 'trn1':
    import torch_neuronx
...
device = torch.device("cuda:0" if torch.cuda.is_available() and instance_type == 'gpu' else "cpu")
```

## 推論実行

以下のようにリクエストを投げることができる。

```bash
curl -X 'POST' \
  'http://localhost/inferences' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "question": "アレクサンダー・グラハム・ベルは、どこで生まれたの?",
  "context": "アレクサンダー・グラハム・ベルは、スコットランド生まれの科学者、発明家、工学者である。世界初の>実用的電話の発明で知られている。"
}'
```