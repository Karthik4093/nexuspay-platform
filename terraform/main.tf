terraform {
  required_version = ">= 1.6.0"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# Variables
variable "project_name" {
  default = "nexuspay"
}

variable "db_password" {
  sensitive = true
  default   = "nexuspay_secret"
}

variable "rabbitmq_password" {
  sensitive = true
  default   = "nexuspay_secret"
}

variable "jwt_secret" {
  sensitive = true
  default   = "nexuspay-jwt-secret-minimum-32-chars-long"
}

# Network
resource "docker_network" "nexuspay_net" {
  name = "${var.project_name}-net"
}

# Modules
module "database" {
  source       = "./modules/database"
  project_name = var.project_name
  db_password  = var.db_password
  network_name = docker_network.nexuspay_net.name
}

module "cache" {
  source       = "./modules/cache"
  project_name = var.project_name
  network_name = docker_network.nexuspay_net.name
}

module "messaging" {
  source            = "./modules/messaging"
  project_name      = var.project_name
  rabbitmq_password = var.rabbitmq_password
  network_name      = docker_network.nexuspay_net.name
}

module "monitoring" {
  source       = "./modules/monitoring"
  project_name = var.project_name
  network_name = docker_network.nexuspay_net.name
}

# Outputs
output "postgres_host" {
  value = module.database.host
}

output "redis_host" {
  value = module.cache.host
}

output "rabbitmq_host" {
  value = module.messaging.host
}

output "grafana_url" {
  value = "http://localhost:3001"
}

output "prometheus_url" {
  value = "http://localhost:9090"
}
