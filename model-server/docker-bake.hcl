target "base" {
  target = "base-stage"
  dockerfile = "build/Dockerfile-base"
  tags = ["inf1-base"]
}

target "trace" {
  target = "trace-stage"
  inherits = ["base"]
  tags = ["inf1-trace"]
}

target "model" {
  target = "model-stage"
  inherits = ["base"]
  tags = ["inf1-model"]
}