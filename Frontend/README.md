# Odoo Mini-ERP — Shiv Furniture Works

A production-style Mini ERP system built for a hiring hackathon, inspired by Odoo and ERPNext.

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

---

## Tech Stack (Frontend)

* React 19 + Vite
* Tailwind CSS v3
* React Router v6
* Framer Motion
* Lucide React Icons
* localStorage (demo data store; backend integration later)

---

## Core Business Flow

Customer Order → Inventory Check

* Stock Available? → Reserve & Deliver
* Stock Not Available? → Trigger Procurement Engine

Procurement Engine → Purchase Order / Manufacturing Order → Inventory Update → Stock Ledger Entry → Audit Log Entry

---

## Team Responsibilities

### Your Modules
1. **Foundation** — Design system, routing shell, shared components
2. **Dashboard** — KPI cards, recent activity
3. **Products** — Product list, create, detail
4. **Bill of Materials (BoM)** — BoM list, create, detail
5. **Inventory & Audit Logs** — Stock overview, stock ledger, audit logs

### Friend's Modules
1. **Login / Auth** — Role-based access (Admin, Sales, Purchase, Manufacturing, Inventory Manager)
2. **Sales** — SO list, create, detail with stock reservation + delivery logic
3. **Purchase** — PO list, create, detail with receive logic
4. **Manufacturing** — MO list, create, detail with work orders + BoM auto-fetch

---

## Git Branch Strategy

```bash
main            ← stable foundation, merged modules
master          ← your working branch
Asik-frontend   ← friend's working branch
```

### Your Branch
```bash
git push origin master
```

### Friend's Branch
```bash
git push origin Asik-frontend
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

| Module | Owner | Status |
|---|---|---|
| Foundation / Design System | You | ✅ Complete |
| Dashboard | You | ✅ Complete |
| Products | You | ✅ Complete |
| Bill of Materials | You | 🚧 In Progress |
| Inventory & Audit Logs | You | 🚧 In Progress |
| Login / Auth | Friend | 🔄 Pending |
| Sales | Friend | 🔄 Pending |
| Purchase | Friend | 🔄 Pending |
| Manufacturing | Friend | 🔄 Pending |
