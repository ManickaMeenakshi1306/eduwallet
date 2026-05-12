# 1. Required Providers Configuration
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# 2. Resource Group
resource "azurerm_resource_group" "eduwallet_rg" {
  name     = "eduwallet-resources"
  location = "East US"
}

# 3. App Service Plan (The "Server" hardware)
resource "azurerm_service_plan" "eduwallet_plan" {
  name                = "eduwallet-service-plan"
  resource_group_name = azurerm_resource_group.eduwallet_rg.name
  location            = azurerm_resource_group.eduwallet_rg.location
  os_type             = "Linux"
  sku_name            = "B1" # Basic tier (change to F1 for Free if available)
}

# 4. Linux Web App (The FastAPI container/code runner)
resource "azurerm_linux_web_app" "eduwallet_app" {
  name                = "eduwallet-app-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.eduwallet_rg.name
  location            = azurerm_service_plan.eduwallet_plan.location
  service_plan_id     = azurerm_service_plan.eduwallet_plan.id

  site_config {
    always_on = false
    application_stack {
      python_version = "3.11"
    }
  }

  # Injecting your Secrets into the App Service Environment Variables
  app_settings = {
    "SUPABASE_URL"                    = var.supabase_url
    "SUPABASE_KEY"                    = var.supabase_key
    "GEMINI_API_KEY"                  = var.gemini_api_key
    "AZURE_STORAGE_CONNECTION_STRING" = var.azure_storage_connection_string
  }
}

# Random string to ensure global unique name for the web app
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}
