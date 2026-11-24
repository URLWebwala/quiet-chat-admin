export default function Custom404() {
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="text-center">
        <h1 className="display-1 fw-bold text-dark">404</h1>
        <p className="fs-5 text-muted">The requested page or resource could not be found.</p>
        <a href="/dashboard" className="btn btn-primary rounded-pill px-4">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
