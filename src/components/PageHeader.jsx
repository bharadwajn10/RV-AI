function PageHeader({ title, description }) {
  return (
    <div className="page-header">
      <div className="page-eyebrow">STUDYSPACE</div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  )
}

export default PageHeader
