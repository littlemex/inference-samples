target "base" {
  target = "base-stage"
  dockerfile = "build/Dockerfile"
  args = {
      REGION = "${REGION}"
      IMAGEPATH = "${IMAGEPATH}"
      INSTANCE_TYPE = "${INSTANCE_TYPE}"
  }
  tags = ["base"]
}

target "trace" {
  target = "trace-stage"
  inherits = ["base"]
  tags = ["trace"]
}

target "model" {
  target = "model-stage"
  inherits = ["base"]
  tags = ["model"]
}