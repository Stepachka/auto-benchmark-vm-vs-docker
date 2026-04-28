# Terraform

Этот каталог содержит минимальную учебную структуру Infrastructure as Code для будущего cloud deployment.

Сейчас Terraform-слой не создаёт реальные cloud-ресурсы. Он нужен, чтобы показать, как проект может быть подготовлен к дальнейшему развитию инфраструктуры.

## Что уже есть

```text
provider.tf    ограничение версии Terraform
variables.tf   переменные project_name и environment
outputs.tf     базовые outputs
```

## Зачем это нужно в проекте

Terraform показывает, что инфраструктура может описываться как код. В будущем сюда можно добавить:

- container registry;
- managed PostgreSQL;
- backend service;
- frontend hosting;
- сеть;
- monitoring;
- Kubernetes или cloud container service.

## Команды

```bash
cd infra/terraform
terraform init -backend=false
terraform fmt
terraform validate
terraform plan
```

## Как Terraform связан с CI/CD

Обычно Terraform-проверки выполняются после сборки приложений и Docker images.

Типовой порядок:

```text
1. build frontend
2. build backend
3. build Docker images
4. terraform fmt -check
5. terraform validate
6. terraform plan
7. terraform apply только вручную или на защищённой ветке
```

Для этой практической работы достаточно показать `fmt`, `validate` и `plan`. Автоматический `apply` не нужен, потому что проект пока не привязан к конкретному cloud provider.

