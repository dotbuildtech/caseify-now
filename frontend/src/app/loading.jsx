export default function Loading() {
    return (
        <div className="container-luxe py-20">
            <div className="grid gap-10 md:grid-cols-2">
                <div className="aspect-square bg-background-light animate-pulse" />
                <div className="space-y-4">
                    <div className="h-6 w-1/3 bg-background-light animate-pulse" />
                    <div className="h-10 w-3/4 bg-background-light animate-pulse" />
                    <div className="h-8 w-1/4 bg-background-light animate-pulse" />
                    <div className="h-12 w-1/2 bg-background-light animate-pulse" />
                </div>
            </div>
        </div>
    );
}
