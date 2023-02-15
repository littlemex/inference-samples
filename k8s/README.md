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