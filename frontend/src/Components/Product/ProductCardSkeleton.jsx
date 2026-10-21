// Q3 · Infinite scroll — loading placeholder card.
// Rendered while catalog pages load so the grid keeps its shape.
import { Skeleton } from '@mui/material';

// Placeholder shaped like ProductCard: same photo ratio, border and text rows
export default function ProductCardSkeleton() {
    return (
        <div className="product-card product-skeleton" aria-hidden="true">
            <div className="product-card-media">
                <Skeleton
                    variant="rectangular"
                    animation="wave"
                    sx={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                />
            </div>

            <div className="product-card-info">
                <Skeleton
                    variant="text"
                    animation="wave"
                    width="70%"
                    sx={{ fontSize: '0.95rem' }}
                />
                <Skeleton variant="text" animation="wave" width="35%" sx={{ fontSize: '0.9rem' }} />
                <Skeleton variant="text" animation="wave" width={80} />
            </div>
        </div>
    );
}
