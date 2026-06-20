<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
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
>>>>>>> 7d693da2fdace402274f67fd5d1cf5ca5d06e08e
