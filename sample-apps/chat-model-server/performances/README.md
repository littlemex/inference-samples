# 計測結果

- Neuron の Batch, Pipeline は使用せず

|コンピュート|インスタンスタイプ|平均レイテンシ(ms)/req|レイテンシ削減割合(CPU比)|
|:--|:--|:--|:--|
|CPU|g4dn.xlarge|233|100%|
|GPU|g4dn.xlarge|62.5|26.8%|
|INF1|inf1.xlarge|30.8|13.2%|
|TRN1|trn1.2xlarge|11.9|5.1%|