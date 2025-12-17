"use client"

import { useState } from "react"
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  AlertCircle,
  Filter,
  Download,
  Bell,
  Lock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"

import { RevenueChart } from "./components/revenue-chart"
import { DemandChart } from "./components/demand-chart"
import { InventoryManagement } from "./components/inventory-management"
import { OrdersManagement } from "./components/orders-management"
import { CustomerManagement } from "./components/customer-management"
import { SubscriptionManagement } from "./components/subscription-management"

const menuItems = [
  { title: "Overview", icon: BarChart3, id: "overview" },
  { title: "Financial", icon: DollarSign, id: "financial" },
  { title: "Inventory", icon: Package, id: "inventory" },
  { title: "Orders", icon: ShoppingCart, id: "orders" },
  { title: "Subscriptions", icon: TrendingUp, id: "subscriptions" },
  { title: "Customers", icon: Users, id: "customers" },
]

export default function DarkStoreDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d")
  const [activeSection, setActiveSection] = useState("overview")

  const getPageInfo = () => {
    switch (activeSection) {
      case "inventory":
        return { title: "Inventory Management", description: "Track stock levels and warehouse operations" }
      case "orders":
        return { title: "Orders", description: "Manage orders and track shipments" }
      case "customers":
        return { title: "Customer Management", description: "Manage your customer database and relationships" }
      case "subscriptions":
        return { title: "Subscription Management", description: "Manage device rental subscriptions and renewals" }
      default:
        return { title: "Store Manager Dashboard", description: "Monitor performance and analytics" }
    }
  }

  const pageInfo = getPageInfo()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b px-6 py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">rentA OS</h2>
                
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={activeSection === item.id}>
                        <a
                          href="#"
                          className="flex items-center space-x-2"
                          onClick={(e) => {
                            e.preventDefault()
                            setActiveSection(item.id)
                          }}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold">{pageInfo.title}</h1>
                <p className="text-sm text-muted-foreground">{pageInfo.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Today</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {activeSection === "inventory" ? (
              <InventoryManagement />
            ) : activeSection === "orders" ? (
              <OrdersManagement />
            ) : activeSection === "customers" ? (
              <CustomerManagement />
            ) : activeSection === "subscriptions" ? (
              <SubscriptionManagement />
            ) : (
              <>
                {/* KPI Cards */}
                <div className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 blur-sm pointer-events-none">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">AED 3,45,231</div>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-success">+12.5%</span> from last week
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">28.4%</div>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-success">+2.1%</span> from last week
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">1,247</div>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-success">+8.2%</span> from yesterday
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-destructive">15</div>
                        <p className="text-xs text-muted-foreground">Items below minimum stock</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center"></div>
                </div>

                {/* Charts Row */}
                <div className="relative">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 blur-sm pointer-events-none">
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue & Profit Trends</CardTitle>
                        <CardDescription>Monthly performance overview</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RevenueChart />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Demand vs Supply</CardTitle>
                        <CardDescription>Category-wise analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DemandChart />
                      </CardContent>
                    </Card>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg px-6 py-4 shadow-lg flex items-center gap-3">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Coming Soon</p>
                        <p className="text-xs text-muted-foreground">Analytics charts under development</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 blur-sm pointer-events-none">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Operational Efficiency</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Order Fulfillment Rate</span>
                          <Badge variant="default">96.8%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Average Delivery Time</span>
                          <Badge variant="secondary">12 min</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Customer Satisfaction</span>
                          <Badge variant="default">4.7/5</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Inventory Turnover</span>
                          <Badge variant="outline">8.2x</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cost Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Procurement Cost</span>
                          <span className="font-medium">AED 2,45,680</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Storage Cost</span>
                          <span className="font-medium">AED 18,450</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Operational Cost</span>
                          <span className="font-medium">AED 32,100</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm font-medium">Total Cost</span>
                          <span className="font-bold">AED 2,96,230</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Market Insights</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Peak Hours</span>
                          <Badge variant="outline">6-8 PM</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Top Category</span>
                          <Badge variant="default">Groceries</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Growth Rate</span>
                          <Badge variant="default">+15.2%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Market Share</span>
                          <Badge variant="secondary">23.4%</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center"></div>
                </div>
              </>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
