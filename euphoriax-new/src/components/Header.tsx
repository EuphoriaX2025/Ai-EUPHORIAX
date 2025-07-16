import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IonIcon } from '@ionic/react';

import {
  notificationsOutline,
  chevronBackOutline, menuOutline
} from 'ionicons/icons';

export const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const getPageTitle = () => {
    const path = location.pathname
    switch (path) {
      case '/':
        return { title: '', logo: true }
      case '/cards':
        return { title: 'My Cards', logo: false }
      case '/settings':
        return { title: 'Settings', logo: false }
      case '/exchange':
        return { title: 'Exchange', logo: false }
      case '/transactions':
        return { title: 'Transactions', logo: false }
      default:
        // Handle coin detail pages and other dynamic routes
        if (path.startsWith('/coin/')) {
          const coinId = path.split('/')[2]?.toUpperCase()
          return { title: `${coinId} Details`, logo: false }
        }
        return { title: 'EuphoriaX', logo: false }
    }
  }

  const { title, logo } = getPageTitle()

  return (
    <div className="appHeader bg-primary text-light">
      <div className="left">
        {!logo && (
          <button 
            className="headerButton" 
            style={{ 
              zIndex: 10, 
              background: 'transparent', 
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={() => {
              navigate('/')
            }}
          >
            <IonIcon icon={chevronBackOutline} style={{ fontSize: '24px' }} />
          </button>
        )}
        {logo && (
          <a href="#" className="headerButton" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <IonIcon icon={menuOutline} />
          </a>
        )}
      </div>
      <div className="pageTitle">
        {logo ? (
          <img src="/assets/img/logo.png" alt="logo" className="logo" />
        ) : (
          title
        )}
      </div>
      <div className="right">
        {logo && (
          <>
            <a href="#" className="headerButton">
                            <IonIcon icon={notificationsOutline} />
              <span className="badge badge-danger">4</span>
            </a>
            <Link to="/settings" className="headerButton">
              <img src="/assets/img/sample/avatar/avatar1.jpg" alt="image" className="imaged w32" />
              <span className="badge badge-danger">6</span>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
