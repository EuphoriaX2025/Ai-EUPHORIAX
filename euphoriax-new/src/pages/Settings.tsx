import { useState, useEffect } from 'react'
import { IonIcon } from '@ionic/react';
import { useAccount } from 'wagmi';

import {
// cameraOutline, 
personOutline, walletOutline,
shieldCheckmarkOutline,chatbubbleEllipsesOutline,
documentTextOutline,shieldOutline,logOutOutline,
trashOutline
} from 'ionicons/icons';

export const Settings = () => {
  const { address, isConnected } = useAccount()
  
  const [userData] = useState({
    username: 'Dear User',
    avatar: '/assets/img/sample/avatar/avatar1.jpg'
  })

  // Format wallet address for display (truncated version)
  const formatWalletAddress = (address: string | undefined, connected: boolean) => {
    if (!connected || !address) return 'Not connected'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Load user profile data - this would typically come from an API or context
    const loadUserProfile = async () => {
      // Placeholder for actual data fetching
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading user profile...')
      }
    }
    
    loadUserProfile()
  }, [])

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode)
    // Here you would implement the actual theme switching logic
    if (!isDarkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }

  return (
    <>
      <div className="section mt-3 text-center">
        <div className="avatar-section">
          <a href="#">
            <img 
              src={userData.avatar} 
              alt="avatar" 
              className="imaged w100 rounded" 
              id="profile-avatar"
            />
            {/* <span className="button">
              <IonIcon icon={cameraOutline} />
            </span> */}
          </a>
        </div>
        <div className="mt-2" id="profile-info-container">
          <h3 id="profile-username">{userData.username}</h3>
          <span className="text-muted" id="profile-wallet-address">{formatWalletAddress(address, isConnected)}</span>
        </div>
      </div>

      <div className="listview-title mt-1">Theme</div>
      <ul className="listview image-listview flush">
        <li>
          <div className="item">
            <div className="icon-box bg-primary">
              <IonIcon icon={isDarkMode ? "moon" : "sunny"} />
            </div>
            <div className="in">
              <div>Dark Mode</div>
            </div>
            <div className="form-check form-switch">
              <input 
                className="form-check-input dark-mode-switch" 
                type="checkbox" 
                id="darkmodesidebar"
                checked={isDarkMode}
                onChange={handleThemeToggle}
              />
              <label className="form-check-label" htmlFor="darkmodesidebar"></label>
            </div>
          </div>
        </li>
      </ul>

      <div className="listview-title mt-1">Profile</div>
      <ul className="listview image-listview flush">
        <li>
          <a href="#" className="item">
            <div className="icon-box bg-success">
              <IonIcon icon={personOutline} />
            </div>
            <div className="in">
              <div>Profile</div>
              <span className="text-muted">Update your profile</span>
            </div>
          </a>
        </li>
        <li>
          <a href="#" className="item">
            <div className="icon-box bg-warning">
              <IonIcon icon={walletOutline} />
            </div>
            <div className="in">
              <div>Wallet</div>
              <span className="text-muted">Manage your wallets</span>
            </div>
          </a>
        </li>
        <li>
          <a href="#" className="item">
            <div className="icon-box bg-danger">
              <IonIcon icon={shieldCheckmarkOutline} />
            </div>
            <div className="in">
              <div>Security</div>
              <span className="text-muted">Password, PIN, Fingerprint</span>
            </div>
          </a>
        </li>
      </ul>

      <div className="listview-title mt-1">Support</div>
      <ul className="listview image-listview flush">
        <li>
          <a href="#" className="item">
            <div className="icon-box bg-primary">
              <IonIcon icon={chatbubbleEllipsesOutline} />
            </div>
            <div className="in">
              <div>Help & Support</div>
            </div>
          </a>
        </li>
        <li>
          <a href="#" className="item">
            <div className="icon-box bg-secondary">
              <IonIcon icon={documentTextOutline} />
            </div>
            <div className="in">
              <div>Terms of Service</div>
            </div>
          </a>
        </li>
        <li>
          <a href="#" className="item">
            <div className="icon-box bg-info">
              <IonIcon icon={shieldOutline} />
            </div>
            <div className="in">
              <div>Privacy Policy</div>
            </div>
          </a>
        </li>
      </ul>

      <div className="listview-title mt-1">Actions</div>
      <ul className="listview image-listview flush">
        <li>
          <a href="#" className="item">
            <div className="icon-box bg-warning">
              <IonIcon icon={logOutOutline} />
            </div>
            <div className="in">
              <div>Log out</div>
            </div>
          </a>
        </li>
        <li>
          <a href="#" className="item">
            <div className="icon-box bg-danger">
              <IonIcon icon={trashOutline} />
            </div>
            <div className="in">
              <div>Log out all devices</div>
            </div>
          </a>
        </li>
      </ul>
    </>
  )
}