# how to use

- total_latency: Neuron ランタイムによって測定された実行のレイテンシを表すパーセンタイル (秒単位) 
- device_latency: Neuron デバイスのみでの実行時間を表すパーセンタイル (秒単位)

```bash
export PATH="/opt/bin/:/opt/aws/neuron/bin:${PATH}"

neuron-monitor -c monitor.conf
neuron-monitor | neuron-monitor-cloudwatch.py --namespace sample-chat-app-neuron-mon2 --region us-east-1
```
