# 計測結果

- Neuron の Batch, Pipeline は使用せず

|コンピュート|インスタンスタイプ|平均レイテンシ(ms)/req|レイテンシ削減割合(CPU比)|Neuron Monitor total latency p100(ms)|
|:--|:--|:--|:--|:--|
|CPU|g4dn.xlarge|233|100%|-|
|GPU|g4dn.xlarge|62.5|26.8%|-|
|INF1|inf1.xlarge|30.8|13.2%|18.7|
|TRN1|trn1.2xlarge|11.9|5.1%|4.8|