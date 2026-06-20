import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  return (
    <div className="h-full bg-bg flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-full ml-60">
        <Header />
        <motion.main
          className="main-content flex-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
