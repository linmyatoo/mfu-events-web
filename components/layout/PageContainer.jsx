/** Centres page content and renders the optional page heading block. */
export default function PageContainer({ title, subtitle, actions, children }) {
  return (
    <div className="page-container">
      {title ? (
        <div className="page-header">
          <h1 className="page-header__title">{title}</h1>
          {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
          {actions ? <div className="page-header__actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
