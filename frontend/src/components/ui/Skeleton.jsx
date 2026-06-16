export default function Skeleton({ className = '', lines = 1 }) {
    return (
        <div className={`animate-pulse bg-background-light ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="h-4 bg-background-light rounded" />
            ))}
        </div>
    );
}
