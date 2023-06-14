# how to use

```bash
export PATH="/opt/bin/:/opt/aws/neuron/bin:${PATH}"

neuron-monitor -c monitor.conf
neuron-monitor | neuron-monitor-cloudwatch.py --namespace sample-chat-app-neuron-mon2 --region us-east-1
```
