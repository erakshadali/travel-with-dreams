import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound({ title = 'Page not found', message = 'The page you are looking for has moved or never existed.' }) {
  useDocumentTitle(title);

  return (
    <section className="section not-found">
      <div className="container">
        <Compass aria-hidden="true" />
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="not-found__actions">
          <Link to="/" className="btn btn--primary">
            Back to home
          </Link>
          <Link to="/trips" className="btn btn--outline">
            Browse trips
          </Link>
        </div>
      </div>
    </section>
  );
}
