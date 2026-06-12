variable "project_name" {}
variable "network_name" {}

resource "docker_image" "redis" {
  name = "redis:7-alpine"
}

resource "docker_volume" "redis_data" {
  name = "${var.project_name}-redis-data"
}

resource "docker_container" "redis" {
  name    = "${var.project_name}-redis"
  image   = docker_image.redis.image_id
  command = ["redis-server", "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]

  ports {
    internal = 6379
    external = 6379
  }

  volumes {
    volume_name    = docker_volume.redis_data.name
    container_path = "/data"
  }

  networks_advanced {
    name = var.network_name
  }

  healthcheck {
    test     = ["CMD", "redis-cli", "ping"]
    interval = "10s"
    timeout  = "5s"
    retries  = 5
  }

  restart = "unless-stopped"
}

output "host" {
  value = "${var.project_name}-redis"
}
