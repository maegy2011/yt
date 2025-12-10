import { NextRequest, NextResponse } from 'next/server'
import { healthCheck, simpleHealthCheck, readinessCheck, getMetrics } from '@/lib/api/health'
import { middleware } from '@/lib/api/wrapper'

// Simple health check (for load balancers)
export async function GET(request: NextRequest) {
  return simpleHealthCheck(request)
}

// Detailed health check
export async function POST(request: NextRequest) {
  return healthCheck(request)
}

// Readiness check (for Kubernetes/Docker)
export async function PUT(request: NextRequest) {
  return readinessCheck(request)
}

// Metrics endpoint
export async function PATCH(request: NextRequest) {
  return middleware.health(getMetrics)(request)
}