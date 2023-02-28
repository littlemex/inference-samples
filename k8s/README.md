# 手順

```bash
export NAMESPACE=pt-inference

./create-cluster.sh
./create-nodegroup.sh
./create-namespace.sh
./create-pod.sh

kubectl port-forward -n ${NAMESPACE} `kubectl get pods -n ${NAMESPACE} --selector=app=my-service -o jsonpath='{.items[0].metadata.name}'` 8080:8080 &
curl -O https://s3.amazonaws.com/model-server/inputs/flower.jpg
curl -X POST http://127.0.0.1:8080/predictions/densenet -T flower.jpg
```

./delete-pod.sh

## 独自のイメージを利用する場合

1. GPU インスタンスを構築する。[CDK の構築サンプル](https://github.com/littlemex/inference-samples/tree/main/cdk/ec2/gpu)
1. GPU が利用できるインスタンス上で [サンプルアプリのイメージを作成して ECR にプッシュする](https://github.com/littlemex/inference-samples/tree/main/sample-apps/gpu-server)
1. 以降の手順で k8s へデプロイする

[Amazon EKS での Amazon ECR イメージの使用](https://docs.aws.amazon.com/ja_jp/AmazonECR/latest/userguide/ECR_on_EKS.html) を確認する

上記の手順でノードを構築している場合、ノードから ECR へのイメージ取得の権限は自動で付与されているはず。  

yaml ファイルのモデルイメージ URI を自身のものに変更する

```yaml
# pt_myimage_inference.yaml
      containers:
      - name: my-image-service
        image: "xxxxx.dkr.ecr.us-east-1.amazonaws.com/model:v002" # ECR においているイメージに変更
```

./create-myimage-pod.sh

kubectl port-forward -n ${NAMESPACE} `kubectl get pods -n ${NAMESPACE} --selector=app=my-image-service -o jsonpath='{.items[0].metadata.name}'` 8081:80 &

curl -X 'POST' \
  'http://127.0.0.1:8081/inferences' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "text": "お爺さんは森に狩りへ出かける",
  "mask_index": 7
}'