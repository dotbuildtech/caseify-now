export default function TrackLoading() {
    return (
        <div className="container-luxe py-12 md:py-16">
            <div className="mx-auto max-w-lg text-center">
                <div className="mx-auto h-4 w-24 bg-background-light animate-pulse" />
                <div className="mx-auto mt-4 h-10 w-64 bg-background-light animate-pulse" />
                <div className="mx-auto mt-10 h-12 w-full bg-background-light animate-pulse" />
                <div className="mx-auto mt-4 h-12 w-full bg-background-light animate-pulse" />
            </div>
        </div>
    );
}
