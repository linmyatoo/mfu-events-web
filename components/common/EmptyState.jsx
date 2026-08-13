import Icon from './Icon';

export default function EmptyState({ icon = 'search', title, message, action }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={56} className="empty-state__icon" />
      {title ? <p className="empty-state__title">{title}</p> : null}
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  );
}
