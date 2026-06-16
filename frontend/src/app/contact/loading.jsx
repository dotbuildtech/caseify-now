export default function ContactLoading() {
    return (
        <div className="container-luxe py-12 md:py-16">
            <div className="grid gap-12 md:grid-cols-2">
                <div>
                    <div className="h-4 w-24 bg-background-light animate-pulse" />
                    <div className="mt-4 h-10 w-72 bg-background-light animate-pulse" />
                    <div className="mt-8 space-y-4">
                        <div className="h-12 w-full bg-background-light animate-pulse" />
                        <div className="h-12 w-full bg-background-light animate-pulse" />
                        <div className="h-12 w-full bg-background-light animate-pulse" />
                        <div className="h-32 w-full bg-background-light animate-pulse" />
                        <div className="h-12 w-40 bg-background-light animate-pulse" />
                    </div>
                </div>
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-28 bg-background-light animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}
