import { Button } from "./ui/button"
import { Calendar, Truck, ChefHat, ClipboardList, Plus, Monitor, Users } from "lucide-react"
import { GlobalHeaderProps } from "../types"

export function GlobalHeader({ currentPage, onNavigate }: GlobalHeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Bakery Management</h1>
        </div>

        <nav className="flex items-center gap-2">
          <Button
            variant={currentPage === "gantt" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("gantt")}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Production Schedule
          </Button>
          <Button
            variant={currentPage === "delivery" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("delivery")}
            className="flex items-center gap-2"
          >
            <Truck className="h-4 w-4" />
            Delivery Tracker
          </Button>
          <Button
            variant={currentPage === "baker" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("baker")}
            className="flex items-center gap-2"
          >
            <ChefHat className="h-4 w-4" />
            Baker View
          </Button>
          <Button
            variant={currentPage === "workstation-kot" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("workstation-kot")}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            Workstation KOT
          </Button>
          <Button
            variant={currentPage === "manager-kot" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("manager-kot")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Manager KOT
          </Button>
          <Button
            variant={currentPage === "orders" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("orders")}
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            Orders
          </Button>
          <Button
            variant={currentPage === "order-form" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("order-form")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </nav>
      </div>
    </header>
  )
}
