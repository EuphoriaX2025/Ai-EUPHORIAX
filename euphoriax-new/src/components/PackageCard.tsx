// src/components/PackageCard.tsx

import React from 'react';
import { IonIcon } from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { CardData } from '../types';

interface PackageCardProps {
  cardData: CardData;
  onAddClick: (cardData: CardData) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ cardData, onAddClick }) => {
  return (
    <div className={`card-block mb-2 ${cardData.className}`}>
      <div className="card-main">
        <div className="card-button">
          <button 
            type="button" 
            className="btn btn-link btn-icon" 
            onClick={() => onAddClick(cardData)}
          >
            <IonIcon icon={addOutline} />
          </button>
        </div>

        <div className="balance">
          <span className="label">CREDIT</span>
          <h1 className="title">${cardData.credit.toLocaleString()}</h1>
        </div>
        <div className="in">
          <div className="card-number">
            <span className="label">PACKAGE</span>{cardData.packageType}
          </div>
          <div className="bottom">
            <div className="card-expiry">
              <span className="label">GROUP</span>{cardData.group} Star
            </div>
            <div className="card-ccv">
              <span className="label">PRICE</span>${cardData.price.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};