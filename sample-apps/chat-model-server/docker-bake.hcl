target "base" {
  target = "base-stage"
  dockerfile = "build/Dockerfile"
  args = {
      REGION = "${REGION}"
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