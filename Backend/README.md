# Mini ERP – Shiv Furniture Works

A production-style Mini ERP system built for a hiring hackathon.

## Project Overview

This ERP helps a furniture manufacturing company manage:

* Product Management
* Inventory Tracking
* Sales Orders
* Purchase Orders
* Manufacturing
* Bill of Materials (BoM)
* Procurement Automation
* Stock Ledger
* Audit Logs
* Dashboard & Analytics

The system is inspired by ERP solutions like Odoo and ERPNext.

---

## Tech Stack

### Backend

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Prisma ORM
* JWT Authentication
* Refresh Tokens
* RBAC
* Zod Validation
* Swagger
* Winston Logger

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Zustand
* React Query
* Recharts

---

## Core Business Flow

Customer Order

↓

Inventory Check

↓

Stock Available?

* Yes → Reserve & Deliver
* No → Trigger Procurement

↓

Procurement Engine

↓

Purchase Order / Manufacturing Order

↓

Inventory Update

↓

Stock Ledger Entry

↓

Audit Log Entry

---

## Team Responsibilities

### Backend Branch

Responsible for:

* Authentication & Authorization
* Products
* Inventory Engine
* Sales Module
* Purchase Module
* BoM
* Manufacturing
* Procurement Automation
* Stock Ledger
* Audit Logs
* Dashboard APIs

### Frontend Branch

Responsible for:

* Dashboard UI
* Product Management UI
* Inventory UI
* Sales UI
* Purchase UI
* Manufacturing UI
* Charts & Analytics
* API Integration

---

## Git Branch Strategy

```bash
main
backend
frontend
```

### Backend Developer

```bash
git checkout -b backend
```

### Frontend Developer

```bash
git checkout -b frontend
```

---

## Hackathon Goal

Build a professional ERP platform that demonstrates:

* End-to-End Inventory Management
* Automated Procurement
* Manufacturing Workflow
* Stock Traceability
* Business Visibility

Focus on working business flows rather than unnecessary features.

---

## Project Status

Current Phase:

* Architecture & Planning Completed ✅
* Development In Progress 🚀
