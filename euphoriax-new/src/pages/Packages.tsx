// src/pages/Packages.tsx

import React, { useState } from 'react';
import { PackageCard } from '../components/PackageCard';
import { PackageModal } from '../components/PackageModal';
import { ReportTable } from '../components/ReportTable';
import { Link } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { CardData, ReportItem } from '../types'; // بهبود: ایمپورت نوع‌های داده از فایل مرکزی

// بهبود: نوع‌بندی دقیق آرایه‌ی داده‌ها
const packagesData: CardData[] = [
  { id: 1, group: 1, packageType: 'Classic', price: 10, credit: 12, className: 'card-classic-s1' },
  { id: 2, group: 1, packageType: 'VIP', price: 20, credit: 30, className: 'card-vip-s1' },
  { id: 3, group: 2, packageType: 'Classic', price: 30, credit: 36, className: 'card-classic-s2' },
  { id: 4, group: 2, packageType: 'VIP', price: 60, credit: 90, className: 'card-vip-s2' },
  { id: 5, group: 3, packageType: 'Classic', price: 50, credit: 60, className: 'card-classic-s3' },
  { id: 6, group: 3, packageType: 'VIP', price: 100, credit: 150, className: 'card-vip-s3' },
  { id: 7, group: 4, packageType: 'Classic', price: 100, credit: 120, className: 'card-classic-s4' },
  { id: 8, group: 4, packageType: 'VIP', price: 200, credit: 300, className: 'card-vip-s4' },
  { id: 9, group: 5, packageType: 'Classic', price: 300, credit: 450, className: 'card-classic-s5' },
  { id: 10, group: 5, packageType: 'VIP', price: 600, credit: 1080, className: 'card-vip-s5' },
  { id: 11, group: 6, packageType: 'Classic', price: 500, credit: 750, className: 'card-classic-s6' },
  { id: 12, group: 6, packageType: 'VIP', price: 1000, credit: 1800, className: 'card-vip-s6' },
  { id: 13, group: 7, packageType: 'Classic', price: 1000, credit: 1500, className: 'card-classic-s7' },
  { id: 14, group: 7, packageType: 'VIP', price: 2000, credit: 4000, className: 'card-vip-s7' }
];

const PackagesPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    // بهبود: حذف any از استیت‌ها و جایگزینی با نوع دقیق
    const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
    const [reportItems, setReportItems] = useState<ReportItem[]>([]);

    // بهبود: نوع‌بندی دقیق پارامتر ورودی تابع
    const handleOpenModal = (cardData: CardData) => {
        setSelectedCard(cardData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCard(null);
    };

    const handleAddToReport = (quantity: number) => {
        if (!selectedCard) return; // اطمینان از وجود کارت انتخاب شده

        setReportItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === selectedCard.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === selectedCard.id ? { ...item, quantity: item.quantity + quantity } : item
                );
            } else {
                const newItem: ReportItem = {
                    id: selectedCard.id,
                    name: `${selectedCard.packageType} ${selectedCard.group} Star`,
                    price: selectedCard.price,
                    quantity: quantity,
                };
                return [...prevItems, newItem];
            }
        });
    };

    const rows: CardData[][] = [];
    for (let i = 0; i < packagesData.length; i += 2) {
        rows.push(packagesData.slice(i, i + 2));
    }

    return (
        <>
            <div className="appHeader">
                <div className="left">
                    <Link to="/" className="headerButton goBack">
                        <IonIcon icon={chevronBackOutline} />
                    </Link>
                </div>
                <div className="pageTitle">Buy Packages</div>
                <div className="right"></div>
            </div>

            <div id="appCapsule" className="header-large-title">
                <div className="section mt-2">
                    {rows.map((row, index) => (
                        <div className="row" key={index}>
                            {row.map(card => (
                                <div className="col-6" key={card.id}>
                                    <PackageCard cardData={card} onAddClick={handleOpenModal} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                
                <ReportTable items={reportItems} />
            </div>
            
            <PackageModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onAdd={handleAddToReport}
                cardData={selectedCard}
            />
            {isModalOpen && <div className="modal-backdrop fade show"></div>}
        </>
    );
};

export default PackagesPage;