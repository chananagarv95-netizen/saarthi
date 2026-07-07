import React from 'react';
import * as Icons from 'lucide-react';
import './ActionCard.css';

const ICON_MAP = { Wheat: Icons.Wheat || Icons.Leaf, Heart: Icons.Heart, Plane: Icons.Plane, Car: Icons.Car, FileText: Icons.FileText, GraduationCap: Icons.GraduationCap };

const ActionCard = ({ icon, title, onClick }) => {
  const IconComponent = ICON_MAP[icon] || Icons[icon] || Icons.Circle;
  
  return (
    <div className="action-card" onClick={onClick}>
      <div className="icon-wrapper">
        <IconComponent size={24} strokeWidth={1.5} />
      </div>
      <span className="card-title">{title}</span>
    </div>
  );
};

export default ActionCard;
