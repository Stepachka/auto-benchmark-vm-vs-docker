variable "project_name" {
  description = "Project name used for tagging and naming future infrastructure."
  type        = string
  default     = "devops-benchmark-platform"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

