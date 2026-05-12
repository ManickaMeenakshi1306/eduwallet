# 1. Resource Group
resource "azurerm_resource_group" "eduwallet_rg" {
  name     = "eduwallet-final-rg"
  location = var.location
}

# 2. Random Suffix for unique naming
resource "random_string" "suffix" {
  length  = 5
  special = false
  upper   = false
}

# 3. Storage Account (Linked to your connection string secret)
resource "azurerm_storage_account" "eduwallet_storage" {
  name                     = "eduwalletstorage${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.eduwallet_rg.name
  location                 = azurerm_resource_group.eduwallet_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# 4. App Service Plan (The server hardware)
resource "azurerm_service_plan" "eduwallet_plan" {
  name                = "eduwallet-plan"
  resource_group_name = azurerm_resource_group.eduwallet_rg.name
  location            = azurerm_resource_group.eduwallet_rg.location
  os_type             = "Linux"
  sku_name            = "B1" # Azure for Students friendly
}

# 5. Linux Web App (The FastAPI Runner)
resource "azurerm_linux_web_app" "eduwallet_app" {
  name                = "eduwallet-app-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.eduwallet_rg.name
  location            = azurerm_resource_group.eduwallet_rg.location
  service_plan_id     = azurerm_service_plan.eduwallet_plan.id

  site_config {
    application_stack {
      python_version = "3.11"
    }
    app_command_line = "uvicorn main:app --host 0.0.0.0 --port 80"
  }

  # Injects your Secrets into the App Environment
  app_settings = {
    "SUPABASE_URL"                    = var.supabase_url
    "SUPABASE_KEY"                    = var.supabase_key
    "GEMINI_API_KEY"                  = var.gemini_api_key
    "AZURE_STORAGE_CONNECTION_STRING" = var.azure_storage_connection_string
    "SCM_DO_BUILD_DURING_DEPLOYMENT"  = "true"
  }
}

# Output the URL so you can find it in the GitHub Logs
output "app_url" {
  value = azurerm_linux_web_app.eduwallet_app.default_hostname
}
