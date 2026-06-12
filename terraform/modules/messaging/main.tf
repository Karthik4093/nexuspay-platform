variable "project_name" {}
variable "rabbitmq_password" { sensitive = true }
variable "network_name" {}

resource "docker_image" "rabbitmq" {
  name = "rabbitmq:3.12-management-alpine"
}

resource "docker_volume" "rabbitmq_data" {
  name = "${var.project_name}-rabbitmq-data"
}

resource "docker_container" "rabbitmq" {
  name  = "${var.project_name}-rabbitmq"
  image = docker_image.rabbitmq.image_id

  env = [
    "RABBITMQ_DEFAULT_USER=${var.project_name}",
    "RABBITMQ_DEFAULT_PASS=${var.rabbitmq_password}",
    "RABBITMQ_DEFAULT_VHOST=/",
  ]

  ports {
    internal = 5672
    external = 5672
  }

  ports {
    internal = 15672
    external = 15672
  }

  volumes {
    volume_name    = docker_volume.rabbitmq_data.name
    container_path = "/var/lib/rabbitmq"
  }

  networks_advanced {
    name = var.network_name
  }

  healthcheck {
    test     = ["CMD", "rabbitmq-diagnostics", "ping"]
    interval = "15s"
    timeout  = "10s"
    retries  = 5
  }

  restart = "unless-stopped"
}

output "host" {
  value = "${var.project_name}-rabbitmq"
}

output "amqp_url" {
  sensitive = true
  value     = "amqp://${var.project_name}:${var.rabbitmq_password}@${var.project_name}-rabbitmq:5672"
}
