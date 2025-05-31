"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Home, FileAudio, Settings } from "lucide-react"

export function Navbar() {
  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Meeting Assistant</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/pv-generator"
              className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>PV Generator</span>
            </Link>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
