variable "project_name" {}
variable "db_password" { sensitive = true }
variable "network_name" {}

resource "docker_image" "postgres" {
  name = "postgres:16-alpine"
}

resource "docker_volume" "postgres_data" {
  name = "${var.project_name}-postgres-data"
}

resource "docker_container" "postgres" {
  name  = "${var.project_name}-postgres"
  image = docker_image.postgres.image_id

  env = [
    "POSTGRES_DB=${var.project_name}_db",
    "POSTGRES_USER=${var.project_name}",
    "POSTGRES_PASSWORD=${var.db_password}",
  ]

  ports {
    internal = 5432
    external = 5432
  }

  volumes {
    volume_name    = docker_volume.postgres_data.name
    container_path = "/var/lib/postgresql/data"
  }

  networks_advanced {
    name = var.network_name
  }

  healthcheck {
    test         = ["CMD-SHELL", "pg_isready -U ${var.project_name} -d ${var.project_name}_db"]
    interval     = "10s"
    timeout      = "5s"
    retries      = 5
    start_period = "10s"
  }

  restart = "unless-stopped"
}

output "host" {
  value = "${var.project_name}-postgres"
}

output "connection_string" {
  sensitive = true
  value     = "postgresql://${var.project_name}:${var.db_password}@${var.project_name}-postgres:5432/${var.project_name}_db"
}
