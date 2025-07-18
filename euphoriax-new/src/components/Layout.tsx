// src/components/Layout.tsx

import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import {
  pieChartOutline, 
  walletOutline, 
  arrowUpCircleOutline, 
  planetOutline,
  globeOutline,
  menuOutline,
  notificationsOutline,
} from 'ionicons/icons';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // ===> اصلاح کلیدی در اینجا اعمال شده است <===
  // مسیر آیتم سیاره‌شکل به /packages تغییر کرد تا با دکمه Activate هماهنگ باشد
  const menuItems = [
    { path: '/', icon: pieChartOutline },
    { path: '/exchange', icon: walletOutline },
    { path: '/central-action', icon: arrowUpCircleOutline, isCentral: true },
    { path: '/packages', icon: planetOutline, isSaturn: true },
    { path: '/settings', icon: globeOutline },
  ];

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="appHeader bg-primary text-light">
        <div className="left">
          <a href="#" className="headerButton" onClick={(e) => { e.preventDefault(); setSidebarOpen(true); }}>
            <IonIcon icon={menuOutline} />
          </a>
        </div>
        <div className="pageTitle">
            <img src="assets/img/logo.png" alt="logo" className="logo" />
        </div>
        <div className="right">
            <a href="#" className="headerButton">
              <IonIcon className="icon" icon={notificationsOutline} />
              <span className="badge badge-danger">0</span>
            </a>
            <Link to="/settings" className="headerButton">
                <img src="assets/img/sample/avatar/avatar1.jpg" alt="image" className="imaged w32" />
                <span className="badge badge-danger">0</span>
            </Link>
        </div>
      </div>
      
      <div id="appCapsule">
        <Outlet />
      </div>

      <div className="appBottomMenu">
        {menuItems.map(item => (
          item.isCentral ? (
            <Link key={item.path} to={item.path} className="item">
              <div className="col">
                <div className="action-button">
                  <IonIcon icon={item.icon} />
                </div>
              </div>
            </Link>
          ) : (
            <Link key={item.path} to={item.path} className={`item ${location.pathname === item.path ? 'active' : ''}`}>
              <div className="col">
                <IonIcon 
                  icon={item.icon} 
                  className={item.isSaturn ? 'saturn-icon-static-rotate' : ''} 
                />
              </div>
            </Link>
          )
        ))}
      </div>
    </>
  );
};