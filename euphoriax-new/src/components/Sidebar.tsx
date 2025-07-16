// src/components/Sidebar.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { useAccount } from 'wagmi';
import {
  closeOutline,
  addOutline,
  arrowForwardOutline,
  cardOutline,
  pieChartOutline,
  peopleOutline,
  settingsOutline,
  chatbubbleOutline,
  logOutOutline,
  layersOutline,
  gitNetworkOutline,
  arrowDownOutline,
  mapOutline,
  createOutline,
} from 'ionicons/icons';

// تعریف نوع داده‌های ورودی برای کامپوننت
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// تابع کمکی برای خلاصه‌سازی آدرس کیف پول
const truncateAddress = (address: string) => {
  if (!address) return null;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// تابع برای ایجاد عدد تصادفی ۴ رقمی
const generateRandomSuffix = () => Math.floor(1000 + Math.random() * 9000).toString();
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  // دریافت اطلاعات کیف پول متصل شده از wagmi
  const { address } = useAccount();
  const truncatedAddress = truncateAddress(address || '');

  // استیت برای مدیریت نام کاربری قابل ویرایش با مقدار پیش‌فرض جدید
  const [username, setUsername] = useState(`Titan_${generateRandomSuffix()}`);

  // تمام کدهای JSX که ظاهر کامپوننت را می‌سازند، در بخش بعدی قرار خواهند گرفت
  return (
    <>
      {/* هاله تیره پس‌زمینه که با کلیک روی آن، منو بسته می‌شود */}
      <div 
        className={`modal-backdrop fade ${isOpen ? 'show' : ''}`} 
        style={{ display: isOpen ? 'block' : 'none', zIndex: 1050 }}
        onClick={onClose}
      ></div>

      {/* پنل اصلی سایدبار */}
      <div 
        className={`modal panelbox panelbox-left ${isOpen ? 'show' : ''}`} 
        style={{ display: isOpen ? 'block' : 'none' }} 
        tabIndex={-1} 
        role="dialog"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-body p-0">
              {/* بخش پروفایل */}
              <div className="profileBox pt-2 pb-2">
                <div className="image-wrapper">
                  <img src="assets/img/sample/avatar/avatar1.jpg" alt="image" className="imaged w36" />
                </div>
                <div className="in">
                  <div className="username-edit-wrapper">
                    <input 
                      type="text"
                      className="username-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <IonIcon icon={createOutline} className="edit-icon" />
                  </div>
                  <div className="text-muted">{truncatedAddress || 'Not Connected'}</div>
                </div>
                <a href="#" className="btn btn-link btn-icon sidebar-close" onClick={onClose}>
                  <IonIcon icon={closeOutline}></IonIcon>
                </a>
              </div>
              
              {/* بخش موجودی */}
              <div className="sidebar-balance">
                <div className="listview-title">Balance</div>
                <div className="in">
                  <h1 className="amount">$ 2,562.50</h1>
                </div>
              </div>

              {/* گروه دکمه‌های اقدام سریع */}
              <div className="action-group">
                <a href="#" className="action-button">
                  <div className="in"><div className="iconbox"><IonIcon icon={addOutline}></IonIcon></div>Live Stats</div>
                </a>
                <a href="#" className="action-button">
                  <div className="in"><div className="iconbox"><IonIcon icon={peopleOutline}></IonIcon></div>Team</div>
                </a>
                <Link to="/packages" className="action-button" onClick={onClose}>
                  <div className="in"><div className="iconbox"><IonIcon icon={cardOutline}></IonIcon></div>Activate</div>
                </Link>
                <a href="#" className="action-button">
                  <div className="in"><div className="iconbox"><IonIcon icon={arrowForwardOutline}></IonIcon></div>Send</div>
                </a>
              </div>

              {/* منوی اصلی */}
              <div className="listview-title mt-1">Menu</div>
              <ul className="listview flush transparent no-line image-listview">
                <li>
                  <Link to="/" className="item" onClick={onClose}>
                    <div className="icon-box bg-primary"><IonIcon icon={pieChartOutline}></IonIcon></div>
                    <div className="in">Dashboard</div>
                  </Link>
                </li>
                <li>
                  <Link to="/packages" className="item" onClick={onClose}>
                    <div className="icon-box bg-primary"><IonIcon icon={cardOutline}></IonIcon></div>
                    <div className="in">Packages</div>
                  </Link>
                </li>
                <li>
                  <a href="#" className="item" onClick={onClose}>
                    <div className="icon-box bg-primary"><IonIcon icon={arrowDownOutline}></IonIcon></div>
                    <div className="in">Withdraw</div>
                  </a>
                </li>
                <li>
                  <a href="#" className="item" onClick={onClose}>
                    <div className="icon-box bg-primary"><IonIcon icon={gitNetworkOutline}></IonIcon></div>
                    <div className="in">Network</div>
                  </a>
                </li>
                 <li>
                  <a href="#" className="item" onClick={onClose}>
                    <div className="icon-box bg-primary"><IonIcon icon={layersOutline}></IonIcon></div>
                    <div className="in">Account</div>
                  </a>
                </li>
                <li>
                  <a href="#" className="item" onClick={onClose}>
                    <div className="icon-box bg-primary"><IonIcon icon={mapOutline}></IonIcon></div>
                    <div className="in">Roadmap</div>
                  </a>
                </li>
              </ul>

              {/* سایر لینک‌ها */}
              <div className="listview-title mt-1">Others</div>
              <ul className="listview flush transparent no-line image-listview">
                <li>
                  <Link to="/settings" className="item" onClick={onClose}>
                    <div className="icon-box bg-primary"><IonIcon icon={settingsOutline}></IonIcon></div>
                    <div className="in">Settings</div>
                  </Link>
                </li>
                <li>
                  <a href="#" className="item" onClick={onClose}>
                    <div className="icon-box bg-primary"><IonIcon icon={chatbubbleOutline}></IonIcon></div>
                    <div className="in">Support</div>
                  </a>
                </li>
                <li>
                  <a href="#" className="item" onClick={onClose}>
                    <div className="icon-box bg-primary"><IonIcon icon={logOutOutline}></IonIcon></div>
                    <div className="in">Log out</div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;