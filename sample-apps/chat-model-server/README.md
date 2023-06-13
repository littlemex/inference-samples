# how to build

```bash
# edit env.hcl.sample
# IMAGEPATH: Please check here. https://github.com/aws/deep-learning-containers/blob/master/available_images.md
cp env.hcl.sample /tmp/env.hcl

cd scripts && ./build.sh && cd -
cd trace && ./trace.sh && cd -
cd scripts && ./build-and-run.sh && sleep 10 && ./curl.sh
```
