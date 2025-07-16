import { Link, useLocation } from 'react-router-dom'
import { IonIcon } from '@ionic/react';

import { arrowUpOutline, pieChartOutline, planetOutline, pulseOutline, settingsOutline } from 'ionicons/icons';

export const BottomMenu = () => {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <div className="appBottomMenu">
      <Link to="/" className={`item ${isActive('/')}`}>
        <div className="col">
          <IonIcon icon={pieChartOutline} />
        </div>
      </Link>
      {/* <Link to="/coin/btc" className={`item ${isActive('/coin/btc')}`}> */}
      <Link to="/" className={`item ${isActive('/coin/btc')}`}>
        <div className="col">
          <IonIcon icon={pulseOutline} />
        </div>
      </Link>
      <Link to="/exchange" className={`item ${isActive('/exchange')}`}>
        <div className="col">
          <div className="action-button">
            <IonIcon icon={arrowUpOutline} />
          </div>
        </div>
      </Link>
      <Link to="/register" className={`item ${isActive('/register')}`}>
        <div className="col">
          <IonIcon icon={planetOutline} />
        </div>
      </Link>
      {/* <Link to="/explore" className={`item ${isActive('/explore')}`}>
        <div className="col">
          <IonIcon icon={planetOutline} />
        </div>
      </Link> */}
      <Link to="/settings" className={`item ${isActive('/settings')}`}>
        <div className="col">
          <IonIcon icon={settingsOutline} />
        </div>
      </Link>
    </div>
  )
}
