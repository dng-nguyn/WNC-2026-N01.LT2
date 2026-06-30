interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function Spinner({ size = 'md', text }: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';

  return (
    <div className={`spinner-container ${sizeClass}`}>
      <div className="spinner" aria-label="Loading" />
      {text && <p className="text-muted">{text}</p>}
    </div>
  );
}
