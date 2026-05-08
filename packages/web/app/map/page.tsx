import dynamic from 'next/dynamic';

const MapPage = dynamic(
  () => import('./MapClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted font-medium">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default MapPage;