export default function ShopLoading() {
    return (
        <div className="container-luxe py-12 md:py-16">
            <div className="mb-10">
                <div className="h-4 w-24 bg-background-light animate-pulse" />
                <div className="mt-4 h-10 w-72 bg-background-light animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i}>
                        <div className="aspect-[3/4] bg-background-light animate-pulse" />
                        <div className="mt-3 h-4 w-3/4 bg-background-light animate-pulse" />
                        <div className="mt-2 h-3 w-1/3 bg-background-light animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}
