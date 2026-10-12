import './ActionCard.css';

const ActionCard = ({ icon: Icon, title, onClick }) => (
  <button type="button" className="action-card" onClick={onClick}>
    <div className="icon-wrapper"><Icon size={24} strokeWidth={1.5} /></div>
    <span className="card-title">{title}</span>
  </button>
);

export default ActionCard;
