import '../styles/PageHeader.css';

export default function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="page-header">
      <div className="container">
        {eyebrow && <p className="eyebrow eyebrow--light">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}
