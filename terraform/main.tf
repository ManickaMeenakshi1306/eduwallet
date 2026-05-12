provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "demo" {
  name     = "eduwallet-demo-rg"
  location = "Korea Central"
}